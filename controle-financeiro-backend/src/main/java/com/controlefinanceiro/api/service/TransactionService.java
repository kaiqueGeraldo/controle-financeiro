package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.transaction.dto.UpdateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.utils.DateUtil;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class TransactionService {

    @Autowired
    private TransactionRepository repository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    @Autowired
    private EntityManager entityManager;

    @Transactional
    public TransactionResponseDTO create(CreateTransactionDTO data, User user) {
        log.info("Criando transação: Tipo={}, Valor={}, ContaID={}", data.type(), data.amount(), data.accountId());

        Account account = accountRepository.findById(data.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            log.error("Violação de segurança: Usuário {} tentou usar conta {} de outro usuário", user.getId(), account.getId());
            throw new BusinessRuleException("A conta informada não pertence ao usuário.");
        }

        if (account.isArchived()) {
            throw new BusinessRuleException("Não é possível lançar ou editar transações numa conta arquivada.");
        }

        Category category = null;
        if (data.categoryId() != null) {
            category = categoryRepository.findById(data.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        }

        Transaction transaction = new Transaction();
        transaction.setDescription(data.description());
        transaction.setAmount(data.amount());
        transaction.setDate(data.date());

        LocalTime time = DateUtil.getTimeOrDefault(data.time());
        transaction.setCreatedAt(data.date().atTime(time));

        transaction.setType(data.type());
        transaction.setPaid(data.isPaid() != null ? data.isPaid() : true);
        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setUser(user);

        if (transaction.isPaid()) {
            applyTransactionBalance(transaction, account);
            log.info("Saldo atualizado na conta {}. Novo saldo: {}", account.getId(), account.getBalance());
        }

        Transaction saved = repository.save(transaction);

        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(
                user.getId(),
                saved.getDate().getYear()
        ));

        log.info("Transação salva com sucesso: ID {}", saved.getId());
        return new TransactionResponseDTO(saved);
    }

    @Transactional
    public TransactionResponseDTO update(UUID id, UpdateTransactionDTO data, User user) {
        log.info("Atualizando transação ID {}", id);

        Transaction transaction = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (transaction.isSystemManaged()) {
            throw new BusinessRuleException("Esta transação é gerenciada automaticamente pelo sistema (Metas/Investimentos/Faturas) e não pode ser editada ou excluída manualmente pelo extrato.");
        }

        if (transaction.getAccount().isArchived()) {
            throw new BusinessRuleException("Não é possível editar transações de uma conta arquivada. O histórico está congelado.");
        }

        if (transaction.isPaid()) {
            reverseTransactionBalance(transaction, transaction.getAccount());
        }

        updateTransactionData(transaction, data);

        if (transaction.isPaid()) {
            applyTransactionBalance(transaction, transaction.getAccount());
        }

        Transaction updatedTransaction = repository.save(transaction);

        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(
                user.getId(),
                updatedTransaction.getDate().getYear()
        ));

        return new TransactionResponseDTO(updatedTransaction);
    }

    @Transactional
    public void delete(UUID id, User user) {
        log.info("Solicitação de exclusão da transação ID {}", id);

        Transaction transaction = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (transaction.isSystemManaged()) {
            throw new BusinessRuleException("Esta transação é gerenciada automaticamente pelo sistema (Metas/Investimentos/Faturas) e não pode ser editada ou excluída manualmente pelo extrato.");
        }

        if (transaction.isPaid()) {
            log.info("Revertendo impacto financeiro da transação {} na conta {}", id, transaction.getAccount().getId());
            reverseTransactionBalance(transaction, transaction.getAccount());
        }

        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(
                user.getId(),
                transaction.getDate().getYear()
        ));

        repository.delete(transaction);
    }

    public Page<TransactionResponseDTO> listAll(User user, Pageable pageable) {
        return repository.findAllByUserIdWithDetails(user.getId(), pageable)
                .map(TransactionResponseDTO::new);
    }

    public Page<TransactionResponseDTO> listAllFiltered(
            User user, Integer month, Integer year,
            TransactionType type, UUID accountId, Pageable pageable) {

        LocalDate startDate;
        LocalDate endDate;

        if (month != null && year != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        } else {
            startDate = LocalDate.now().withDayOfMonth(1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }

        return repository.findFilteredByUserId(user.getId(), startDate, endDate, type, accountId, pageable)
                .map(TransactionResponseDTO::new);
    }

    // --- Métodos Auxiliares ---

    private void applyTransactionBalance(Transaction transaction, Account account) {
        if (transaction.getType() == TransactionType.INCOME) {
            account.credit(transaction.getAmount());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            account.debit(transaction.getAmount());
        }
        accountRepository.save(account);
    }

    private void reverseTransactionBalance(Transaction transaction, Account account) {
        if (transaction.getType() == TransactionType.INCOME) {
            account.debit(transaction.getAmount());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            account.credit(transaction.getAmount());
        }
        accountRepository.save(account);
    }

    private void updateTransactionData(Transaction t, UpdateTransactionDTO data) {
        if (data.description() != null) t.setDescription(data.description());
        if (data.amount() != null) t.setAmount(data.amount());
        if (data.date() != null || data.time() != null) {
            LocalDate newDate = data.date() != null ? data.date() : t.getDate();
            LocalTime newTime;
            if (data.time() != null && !data.time().isBlank()) {
                newTime = LocalTime.parse(data.time());
            } else {
                newTime = t.getCreatedAt().toLocalTime();
            }
            t.setDate(newDate);
            t.setCreatedAt(newDate.atTime(newTime));
        }
        if (data.date() != null) t.setDate(data.date());
        if (data.type() != null) t.setType(data.type());
        if (data.isPaid() != null) t.setPaid(data.isPaid());

        if (data.categoryId() != null) {
            Category novaCategoria = categoryRepository.findById(data.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
            t.setCategory(novaCategoria);
        }

        if (data.accountId() != null) {
            Account novaConta = accountRepository.findById(data.accountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta destino não encontrada"));

            if (novaConta.isArchived()) {
                throw new BusinessRuleException("Não é possível transferir a transação para uma conta arquivada.");
            }

            t.setAccount(novaConta);
        }
    }

    public byte[] exportToExcel(User user) {
        log.info("Gerando Excel em lotes para o usuário {}", user.getEmail());

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); // Mantém apenas 100 linhas em memória
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            SXSSFSheet sheet = workbook.createSheet("Extrato Financeiro");
            sheet.trackAllColumnsForAutoSizing();

            // --- 1. CRIANDO OS ESTILOS VISUAIS ---
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle currencyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            currencyStyle.setDataFormat(format.getFormat("R$ #,##0.00"));

            CellStyle incomeStyle = workbook.createCellStyle();
            Font incomeFont = workbook.createFont();
            incomeFont.setColor(IndexedColors.GREEN.getIndex());
            incomeFont.setBold(true);
            incomeStyle.setFont(incomeFont);

            CellStyle expenseStyle = workbook.createCellStyle();
            Font expenseFont = workbook.createFont();
            expenseFont.setColor(IndexedColors.RED.getIndex());
            expenseFont.setBold(true);
            expenseStyle.setFont(expenseFont);

            // --- 2. BUSCANDO TOTAIS DIRETAMENTE NO BANCO ---
            List<Object[]> totals = repository.sumTotalAmountByType(user.getId());
            BigDecimal totalIncome = BigDecimal.ZERO;
            BigDecimal totalExpense = BigDecimal.ZERO;

            for (Object[] row : totals) {
                String type = row[0].toString();
                BigDecimal sum = row[1] != null ? BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO;
                if ("INCOME".equals(type)) totalIncome = sum;
                else if ("EXPENSE".equals(type)) totalExpense = sum;
            }
            BigDecimal balance = totalIncome.subtract(totalExpense);

            // --- 3. DESENHANDO O CABEÇALHO E RESUMO ---
            Row rowTitle = sheet.createRow(0);
            Cell cellTitle = rowTitle.createCell(0);
            cellTitle.setCellValue("Relatório Financeiro - Controle Financeiro");
            cellTitle.setCellStyle(titleStyle);

            Row rInc = sheet.createRow(2);
            rInc.createCell(0).setCellValue("Total de Entradas:");
            Cell cInc = rInc.createCell(1);
            cInc.setCellValue(totalIncome.doubleValue());
            cInc.setCellStyle(currencyStyle);

            Row rExp = sheet.createRow(3);
            rExp.createCell(0).setCellValue("Total de Saídas:");
            Cell cExp = rExp.createCell(1);
            cExp.setCellValue(totalExpense.doubleValue());
            cExp.setCellStyle(currencyStyle);

            Row rBal = sheet.createRow(4);
            rBal.createCell(0).setCellValue("Saldo Geral:");
            Cell cBal = rBal.createCell(1);
            cBal.setCellValue(balance.doubleValue());
            cBal.setCellStyle(currencyStyle);

            // --- 4. CABEÇALHO DA TABELA ---
            int rowIdx = 7;
            Row header = sheet.createRow(rowIdx++);
            String[] columns = {"Data", "Hora", "Descrição", "Categoria", "Conta", "Tipo", "Valor", "Status"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // --- 5. PROCESSAMENTO DE DADOS EM CHUNKS ---
            int pageNumber = 0;
            int pageSize = 500;
            Page<Transaction> pageData;

            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

            do {
                pageData = repository.findAllByUserIdWithDetails(
                        user.getId(),
                        org.springframework.data.domain.PageRequest.of(pageNumber, pageSize,
                                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "date", "createdAt"))
                );

                for (Transaction t : pageData.getContent()) {
                    TransactionResponseDTO dto = new TransactionResponseDTO(t);
                    Row row = sheet.createRow(rowIdx++);

                    row.createCell(0).setCellValue(dto.date() != null ? dto.date().format(dateFmt) : "");
                    row.createCell(1).setCellValue(dto.createdAt() != null ? dto.createdAt().format(timeFmt) : "");
                    row.createCell(2).setCellValue(dto.description());
                    row.createCell(3).setCellValue(dto.categoryName() != null ? dto.categoryName() : "Geral");
                    row.createCell(4).setCellValue(dto.accountName() != null ? dto.accountName() : "-");

                    Cell typeCell = row.createCell(5);
                    boolean isIncome = dto.type() == TransactionType.INCOME;
                    typeCell.setCellValue(isIncome ? "Receita" : "Despesa");
                    typeCell.setCellStyle(isIncome ? incomeStyle : expenseStyle);

                    Cell valCell = row.createCell(6);
                    valCell.setCellValue(dto.amount().doubleValue());
                    valCell.setCellStyle(currencyStyle);

                    row.createCell(7).setCellValue(dto.isPaid() ? "Pago" : "Pendente");
                }

                pageNumber++;
                entityManager.clear();
            } while (pageData.hasNext());

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Erro ao gerar Excel", e);
            throw new BusinessRuleException("Falha ao gerar arquivo Excel");
        }
    }
}