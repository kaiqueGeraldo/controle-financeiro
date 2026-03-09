package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.InvoiceChangedEvent;
import com.controlefinanceiro.api.domain.event.InvoicePaymentRequestedEvent;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.planning.*;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.utils.DateUtil;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CreditCardService {

    @Autowired
    private CreditCardRepository cardRepository;
    @Autowired
    private InvoiceRepository invoiceRepository;
    @Autowired
    private CardTransactionRepository cardTransactionRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private MonthlyPlanRepository monthlyPlanRepository;
    @Autowired
    private PlanItemRepository planItemRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    @Autowired
    private EntityManager entityManager;

    public CreditCardResponseDTO createCard(CreateCardDTO data, User user) {
        log.info("Criando cartão '{}' (Final {})", data.name(), data.last4Digits());
        CreditCard card = new CreditCard();
        card.setName(data.name());
        card.setLast4Digits(data.last4Digits());
        card.setLimit(data.limit());
        card.setClosingDay(data.closingDay());
        card.setDueDay(data.dueDay());
        card.setBrand(data.brand());
        card.setColor(data.color());
        card.setUser(user);

        CreditCard saved = cardRepository.save(card);
        return new CreditCardResponseDTO(saved);
    }

    public List<CreditCard> listAll(User user) {
        return cardRepository.findAllByUserIdOrderByOrderIndexAsc(user.getId());
    }

    @Transactional
    public void deleteCard(UUID id, User user) {
        log.warn("SERVICE: Iniciando exclusão do Cartão {} e suas dependências.", id);

        CreditCard card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (!card.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        // 1. Excluir todas as transações de fatura vinculadas aos invoices deste cartão
        entityManager.createQuery(
                "DELETE FROM CardTransaction ct WHERE ct.invoice.id IN (SELECT i.id FROM Invoice i WHERE i.card.id = :cardId)"
        ).setParameter("cardId", id).executeUpdate();

        // 2. Excluir todas as faturas (Invoices) deste cartão
        entityManager.createQuery(
                "DELETE FROM Invoice i WHERE i.card.id = :cardId"
        ).setParameter("cardId", id).executeUpdate();

        // 3. Excluir os itens de planejamento (PlanItem) vinculados a este cartão
        entityManager.createQuery(
                "DELETE FROM PlanItem p WHERE p.card.id = :cardId"
        ).setParameter("cardId", id).executeUpdate();

        // 4. Excluir o cartão base
        cardRepository.delete(card);

        // 5. Atualizar o cache de Dashboards e Resumo Anual
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), java.time.LocalDate.now().getYear()));

        log.info("SERVICE: Cartão {} excluído com sucesso do banco de dados.", id);
    }

    // --- TRANSAÇÕES DE CARTÃO ---

    @Transactional
    public UUID createTransaction(CreateCardTransactionDTO data) {
        log.info("Nova compra no cartão ID {}: {} ({}x)", data.cardId(), data.amount(), data.totalInstallments());

        CreditCard card = cardRepository.findById(data.cardId()).orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        Category category = categoryRepository.findById(data.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));

        int parcelas = (data.totalInstallments() != null && data.totalInstallments() > 1) ? data.totalInstallments() : 1;

        BigDecimal valorParcelaBase = data.amount().divide(BigDecimal.valueOf(parcelas), 2, RoundingMode.DOWN);
        BigDecimal valorTotalBase = valorParcelaBase.multiply(BigDecimal.valueOf(parcelas));
        BigDecimal diferencaCentavos = data.amount().subtract(valorTotalBase);

        CardTransaction primeiraTransacao = null;
        UUID purchaseId = UUID.randomUUID();

        for (int i = 0; i < parcelas; i++) {
            LocalDate dataParcela = data.date().plusMonths(i);
            Invoice invoice = getInvoiceForDate(card, dataParcela);

            while (invoice.getStatus() != InvoiceStatus.OPEN) {
                dataParcela = dataParcela.plusMonths(1);
                invoice = getInvoiceForDate(card, dataParcela);
            }

            CardTransaction transaction = new CardTransaction();
            transaction.setDescription(data.description() + (parcelas > 1 ? " (" + (i + 1) + "/" + parcelas + ")" : ""));

            if (i == 0) {
                transaction.setAmount(valorParcelaBase.add(diferencaCentavos));
            } else {
                transaction.setAmount(valorParcelaBase);
            }

            transaction.setDate(dataParcela);

            LocalTime time = DateUtil.getTimeOrDefault(data.time());
            transaction.setCreatedAt(dataParcela.atTime(time));

            transaction.setCategory(category);
            transaction.setInvoice(invoice);
            transaction.setPurchaseId(purchaseId);

            if (parcelas > 1) {
                transaction.setInstallment(i + 1);
                transaction.setTotalInstallments(parcelas);
            }

            CardTransaction savedTx = cardTransactionRepository.save(transaction);
            if (i == 0) {
                primeiraTransacao = savedTx;
            }

            eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
        }

        int anoInicial = data.date().getYear();
        int anoFinal = data.date().plusMonths(parcelas - 1).getYear();

        for (int ano = anoInicial; ano <= anoFinal; ano++) {
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(card.getUser().getId(), ano));
        }

        log.info("Compra parcelada processada com sucesso.");
        return primeiraTransacao.getId();
    }

    @Transactional
    public CreditCardResponseDTO update(UUID id, UpdateCardDTO data, User user) {
        CreditCard card = cardRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (!card.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (data.name() != null) card.setName(data.name());
        if (data.limit() != null) card.setLimit(data.limit());
        if (data.closingDay() != null) card.setClosingDay(data.closingDay());
        if (data.dueDay() != null) card.setDueDay(data.dueDay());
        if (data.color() != null) card.setColor(data.color());

        CreditCard updatedCard = cardRepository.save(card);
        return new CreditCardResponseDTO(updatedCard);
    }

    @Transactional
    public CardTransaction updateTransaction(UUID transactionId, UpdateCardTransactionDTO data, User user) {
        CardTransaction tx = cardTransactionRepository.findById(transactionId).orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (!tx.getInvoice().getCard().getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (tx.getInvoice().getStatus() != InvoiceStatus.OPEN) {
            throw new BusinessRuleException("Não é possível editar transações de uma fatura que já está fechada ou paga.");
        }

        if (data.description() != null) tx.setDescription(data.description());
        if (data.categoryId() != null) {
            Category cat = categoryRepository.findById(data.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
            tx.setCategory(cat);
        }

        return cardTransactionRepository.save(tx);
    }

    public List<CardSummaryDTO> listAllWithSummary(User user) {
        List<CreditCard> cards = cardRepository.findAllByUserIdOrderByOrderIndexAsc(user.getId());
        if (cards.isEmpty()) return Collections.emptyList();

        List<UUID> cardIds = cards.stream().map(CreditCard::getId).toList();

        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        LocalDate nextMonthDate = today.plusMonths(1);
        int nextMonth = nextMonthDate.getMonthValue();
        int nextYear = nextMonthDate.getYear();

        List<Invoice> existingInvoices = invoiceRepository.findRecentInvoicesForCards(
                cardIds, currentMonth, currentYear, nextMonth, nextYear
        );

        Map<String, Invoice> invoiceMap = existingInvoices.stream()
                .collect(Collectors.toMap(
                        i -> i.getCard().getId().toString() + "-" + i.getMonth() + "-" + i.getYear(),
                        i -> i,
                        (existing, replacement) -> existing
                ));

        List<Invoice> currentInvoices = new ArrayList<>();
        for (CreditCard card : cards) {
            int targetMonth = currentMonth;
            int targetYear = currentYear;

            if (today.getDayOfMonth() >= card.getClosingDay()) {
                targetMonth = nextMonth;
                targetYear = nextYear;
            }

            String key = card.getId().toString() + "-" + targetMonth + "-" + targetYear;
            Invoice invoice = invoiceMap.get(key);

            if (invoice == null) {
                invoice = new Invoice();
                invoice.setCard(card);
                invoice.setMonth(targetMonth);
                invoice.setYear(targetYear);
                invoice.setStatus(InvoiceStatus.OPEN);
                invoice = invoiceRepository.save(invoice);
            }
            currentInvoices.add(invoice);
        }

        List<UUID> invoiceIds = currentInvoices.stream().map(Invoice::getId).toList();
        List<Object[]> sums = cardTransactionRepository.sumAmountsByInvoiceIds(invoiceIds);

        java.util.Map<UUID, BigDecimal> invoiceSums = sums.stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (BigDecimal) row[1]
                ));

        return cards.stream().map(card -> {
            Invoice currentInvoice = currentInvoices.stream()
                    .filter(i -> i.getCard().getId().equals(card.getId()))
                    .findFirst()
                    .orElseThrow();

            BigDecimal invoiceValue = invoiceSums.getOrDefault(currentInvoice.getId(), BigDecimal.ZERO);

            return new CardSummaryDTO(
                    card.getId(),
                    card.getName(),
                    card.getLast4Digits(),
                    card.getLimit(),
                    card.getClosingDay(),
                    card.getDueDay(),
                    card.getColor(),
                    card.getBrand(),
                    invoiceValue
            );
        }).toList();
    }

    public InvoiceDetailsDTO getInvoiceDetails(UUID cardId, Integer month, Integer year, User user) {
        CreditCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (!card.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        Invoice invoice = getOrCreateInvoice(card, month, year);

        List<CardTransaction> rawTransactions = cardTransactionRepository.findByInvoiceIdWithDetails(invoice.getId());

        List<CardTransactionDTO> transactions = rawTransactions.stream()
                .map(t -> new CardTransactionDTO(
                        t.getId(), t.getDescription(), t.getAmount(), t.getDate(),
                        t.getCategory() != null ? t.getCategory().getName() : "Geral",
                        t.getCategory() != null ? t.getCategory().getColor() : null
                )).toList();

        BigDecimal total = cardTransactionRepository.sumAmountByInvoiceId(invoice.getId());

        return new InvoiceDetailsDTO(invoice.getId(), month, year, invoice.getStatus().name(), total, transactions);
    }

    @Transactional
    public void deleteTransaction(UUID transactionId, User user) {
        CardTransaction tx = cardTransactionRepository.findById(transactionId).orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (!tx.getInvoice().getCard().getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        UUID purchaseId = tx.getPurchaseId();

        if (purchaseId != null) {
            List<CardTransaction> installments = cardTransactionRepository.findAllByPurchaseId(purchaseId);

            Set<Invoice> affectedInvoices = installments.stream().map(CardTransaction::getInvoice).collect(Collectors.toSet());

            boolean hasClosedInvoices = affectedInvoices.stream().anyMatch(inv -> inv.getStatus() != InvoiceStatus.OPEN);
            if (hasClosedInvoices) {
                throw new BusinessRuleException("Não é possível excluir esta compra parcelada pois uma ou mais parcelas pertencem a faturas que já foram fechadas ou pagas.");
            }

            cardTransactionRepository.deleteAll(installments);
            cardTransactionRepository.flush();

            for (Invoice invoice : affectedInvoices) {
                eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
            }
        } else {
            Invoice invoice = tx.getInvoice();

            // CORREÇÃO: Verifica a fatura da transação avulsa
            if (invoice.getStatus() != InvoiceStatus.OPEN) {
                throw new BusinessRuleException("Não é possível excluir uma transação de uma fatura que já está fechada ou paga.");
            }

            cardTransactionRepository.delete(tx);
            cardTransactionRepository.flush();
            eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), tx.getDate().getYear()));
        }
    }

    // --- MÉTODOS AUXILIARES ---

    private Invoice getInvoiceForDate(CreditCard card, LocalDate date) {
        int month = date.getMonthValue();
        int year = date.getYear();

        // Se o dia da compra for >= dia do fechamento, joga para a fatura do mês seguinte
        if (date.getDayOfMonth() >= card.getClosingDay()) {
            LocalDate nextMonth = date.plusMonths(1);
            month = nextMonth.getMonthValue();
            year = nextMonth.getYear();
        }

        return getOrCreateInvoice(card, month, year);
    }

    private Invoice getOrCreateInvoice(CreditCard card, int month, int year) {
        return invoiceRepository.findByCardIdAndMonthAndYear(card.getId(), month, year).orElseGet(() -> {
            Invoice newInvoice = new Invoice();
            newInvoice.setCard(card);
            newInvoice.setMonth(month);
            newInvoice.setYear(year);
            newInvoice.setStatus(InvoiceStatus.OPEN);
            return invoiceRepository.save(newInvoice);
        });
    }

    @Transactional
    public void payInvoice(UUID cardId, PayInvoiceDTO data, User user) {
        log.info("SERVICE: Processando regras de cartão para pagamento da fatura.");

        CreditCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (!card.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        eventPublisher.publishEvent(new InvoicePaymentRequestedEvent(
                data.accountId(), data.amount(), data.date(), data.time(), data.description(), card, user
        ));

        Invoice invoice = getOrCreateInvoice(card, data.month(), data.year());

        List<CardTransaction> transactions = cardTransactionRepository.findByInvoiceIdOrderByDateDescCreatedAtDesc(invoice.getId());
        BigDecimal totalFatura = transactions.stream().map(CardTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (data.amount().compareTo(totalFatura) > 0) {
            throw new BusinessRuleException("O valor do pagamento (" + data.amount() + ") excede o saldo da fatura (" + totalFatura + ").");
        }

        if (Boolean.TRUE.equals(data.isPrepayment())) {
            processPrepayment(invoice, data, user);
        } else {
            processInvoiceClosing(invoice, data, totalFatura, user);
        }

        eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), data.date().getYear()));
    }

    private void processPrepayment(Invoice invoice, PayInvoiceDTO data, User user) {
        log.info("Processado como adiantamento de fatura.");
        CardTransaction creditTransaction = new CardTransaction();
        creditTransaction.setDescription("Adiantamento: " + (data.description() != null ? data.description() : ""));
        creditTransaction.setAmount(data.amount().negate());
        creditTransaction.setDate(data.date());
        creditTransaction.setCreatedAt(data.date().atTime(DateUtil.getTimeOrDefault(data.time())));
        creditTransaction.setInvoice(invoice);

        Category catFatura = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.PAGAMENTO_FATURA.getName())
                .orElseThrow(() -> new BusinessRuleException("Categoria de Faturas não encontrada."));
        creditTransaction.setCategory(catFatura);

        cardTransactionRepository.save(creditTransaction);
    }

    private void processInvoiceClosing(Invoice invoice, PayInvoiceDTO data, BigDecimal totalFatura, User user) {
        BigDecimal diferenca = totalFatura.subtract(data.amount());

        if (diferenca.compareTo(BigDecimal.ZERO) > 0) {
            log.info("Pagamento parcial. Rolando saldo devedor de {} para a próxima fatura.", diferenca);
            int nextMonth = invoice.getMonth() == 12 ? 1 : invoice.getMonth() + 1;
            int nextYear = invoice.getMonth() == 12 ? invoice.getYear() + 1 : invoice.getYear();

            Invoice nextInvoice = getOrCreateInvoice(invoice.getCard(), nextMonth, nextYear);

            CardTransaction rolloverTx = new CardTransaction();
            rolloverTx.setDescription("Saldo rotativo da fatura anterior");
            rolloverTx.setAmount(diferenca);
            rolloverTx.setDate(data.date());
            rolloverTx.setCreatedAt(java.time.LocalDateTime.now());
            rolloverTx.setInvoice(nextInvoice);

            Category catFatura = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.PAGAMENTO_FATURA.getName())
                    .orElseThrow(() -> new BusinessRuleException("Categoria de Faturas não encontrada."));
            rolloverTx.setCategory(catFatura);

            cardTransactionRepository.save(rolloverTx);
            eventPublisher.publishEvent(new InvoiceChangedEvent(nextInvoice));
        }

        // Marca a fatura do mês como fechada/paga
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        if (diferenca.compareTo(BigDecimal.ZERO) == 0) {
            log.info("Pagamento integral detectado. Dando baixa no Planejamento mensal.");
            planItemRepository.markAsPaidByCardAndMonth(
                    invoice.getCard().getId(),
                    invoice.getMonth(),
                    invoice.getYear()
            );
        } else {
            log.warn("Pagamento parcial detectado. O item de planejamento permanecerá pendente/guardado.");
        }
    }

    @Transactional
    public void reorder(List<UUID> orderedIds, User user) {
        for (int i = 0; i < orderedIds.size(); i++) {
            CreditCard card = cardRepository.findById(orderedIds.get(i)).orElse(null);
            if (card != null && card.getUser().getId().equals(user.getId())) {
                card.setOrderIndex(i);
                cardRepository.save(card);
            }
        }
    }
}