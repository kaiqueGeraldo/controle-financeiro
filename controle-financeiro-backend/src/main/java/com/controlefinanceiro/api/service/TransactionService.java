package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.card.CardRefundRepository;
import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionStatus;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransferDirection;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.SettleTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.transaction.dto.CashSummaryDTO;
import com.controlefinanceiro.api.domain.transaction.dto.UpdateTransactionDTO;
import com.controlefinanceiro.api.domain.temporal.TimeOrigin;
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
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
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
    @Autowired
    private Clock clock;
    @Autowired
    private DashboardService dashboardService;
    @Autowired private CardTransactionRepository cardTransactionRepository;
    @Autowired private CardRefundRepository cardRefundRepository;

    @Transactional
    public TransactionResponseDTO create(CreateTransactionDTO data, User user) {
        log.info("Criando transação: Tipo={}, Valor={}, ContaID={}", data.type(), data.amount(), data.accountId());

        validatePositiveMoney(data.amount(), "valor");
        if (data.type() == TransactionType.TRANSFER) {
            return createTransfer(data, user);
        }
        if (data.destinationAccountId() != null || positiveOrZero(data.fee()).signum() != 0) {
            throw new BusinessRuleException("Conta destino e taxa são exclusivas de transferências.");
        }

        Account account = accountRepository.findByIdAndUserId(data.accountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        requireActive(account);
        Category category = findOwnedCategory(data.categoryId(), user, data.type());
        ZonedDateTime now = ZonedDateTime.now(clock);
        Transaction transaction = newTransaction(
                data.description(), data.amount(), data.date(), data.time(), data.type(),
                data.isPaid() == null || data.isPaid(), account, category, user, now
        );
        transaction.setOrigin(TransactionOrigin.USER);

        if (transaction.isPaid()) {
            applyTransactionBalance(transaction, account);
            log.info("Saldo atualizado na conta {}. Novo saldo: {}", account.getId(), account.getBalance());
        }

        Transaction saved = repository.saveAndFlush(transaction);
        publishChanged(user.getId(), saved.getDate().getYear());

        log.info("Transação salva com sucesso: ID {}", saved.getId());
        return new TransactionResponseDTO(saved);
    }

    @Transactional
    public TransactionResponseDTO update(UUID id, UpdateTransactionDTO data, User user) {
        log.info("Atualizando transação ID {}", id);

        Transaction transaction = repository.findOwnedForUpdate(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (transaction.isSystemManaged()) {
            throw new BusinessRuleException("Esta transação é gerenciada automaticamente pelo sistema (Metas/Investimentos/Faturas) e não pode ser editada ou excluída manualmente pelo extrato.");
        }

        if (transaction.getOrigin() == TransactionOrigin.ACCOUNT_OPENING) {
            throw new BusinessRuleException("Abertura de conta é posição e não pode ser editada como transação.");
        }

        if (transaction.getStatus() == TransactionStatus.REVERSED
                || transaction.getStatus() == TransactionStatus.PARTIALLY_SETTLED
                || transaction.getStatus() == TransactionStatus.FULFILLED
                || transaction.getStatus() == TransactionStatus.CANCELLED
                || transaction.getOrigin() == TransactionOrigin.REVERSAL
                || transaction.getSettlementOfId() != null
                || transaction.getOperationId() != null) {
            throw new BusinessRuleException("Transações estornadas, parcialmente baixadas ou vinculadas devem ser corrigidas pelo fluxo da operação original.");
        }

        if (transaction.getAccount().isArchived()) {
            throw new BusinessRuleException("Não é possível editar transações de uma conta arquivada. O histórico está congelado.");
        }

        if (data.amount() != null) {
            validatePositiveMoney(data.amount(), "valor");
        }
        if (!hasRequestedChange(transaction, data)) {
            return new TransactionResponseDTO(transaction);
        }
        if (transaction.getStatus() == TransactionStatus.SETTLED) {
            return correctSettledTransaction(transaction, data, user);
        }

        int previousYear = transaction.getDate().getYear();
        updateTransactionData(transaction, data, user);

        if (transaction.isRealized()) {
            applyTransactionBalance(transaction, transaction.getAccount());
        }

        Transaction updatedTransaction = repository.saveAndFlush(transaction);
        publishChanged(user.getId(), previousYear, updatedTransaction.getDate().getYear());

        return new TransactionResponseDTO(updatedTransaction);
    }

    @Transactional
    public TransactionResponseDTO settle(UUID id, SettleTransactionDTO data, User user) {
        validatePositiveMoney(data.amount(), "valor da baixa");
        Transaction forecast = repository.findOwnedForUpdate(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Previsão não encontrada"));

        if (forecast.isSystemManaged()
                || forecast.getOperationId() != null
                || forecast.getSettlementOfId() != null
                || forecast.getType() == TransactionType.TRANSFER
                || (forecast.getOrigin() != null
                    && forecast.getOrigin() != TransactionOrigin.USER
                    && forecast.getOrigin() != TransactionOrigin.CORRECTION
                    && forecast.getOrigin() != TransactionOrigin.UNKNOWN)) {
            throw new BusinessRuleException("Esta transação não aceita baixa manual.");
        }
        if (forecast.getStatus() != TransactionStatus.PENDING
                && forecast.getStatus() != TransactionStatus.PARTIALLY_SETTLED) {
            throw new BusinessRuleException("Somente uma previsão pendente pode receber baixa.");
        }
        requireActive(forecast.getAccount());

        BigDecimal alreadySettled = repository.sumActiveSettlements(forecast.getId());
        BigDecimal remaining = forecast.getAmount().subtract(alreadySettled);
        if (data.amount().compareTo(remaining) > 0) {
            throw new BusinessRuleException("O valor da baixa excede o saldo pendente da previsão.");
        }

        ZonedDateTime now = ZonedDateTime.now(clock);
        Transaction settlement = newTransaction(
                limitedDescription("Baixa - " + forecast.getDescription()),
                data.amount(), data.date(), data.time(), forecast.getType(), true,
                forecast.getAccount(), forecast.getCategory(), user, now
        );
        settlement.setOrigin(TransactionOrigin.SETTLEMENT);
        settlement.setSettlementOfId(forecast.getId());
        settlement.setDueDate(forecast.getDueDate() != null ? forecast.getDueDate() : forecast.getDate());

        applyTransactionBalance(settlement, forecast.getAccount());
        forecast.markForecastSettlement(alreadySettled.add(data.amount()));
        forecast.setSettledAt(forecast.getStatus() == TransactionStatus.FULFILLED ? now.toInstant() : null);
        repository.saveAll(List.of(forecast, settlement));
        repository.flush();
        publishChanged(user.getId(), forecast.getDate().getYear(), settlement.getDate().getYear());
        return new TransactionResponseDTO(settlement);
    }

    @Transactional
    public void delete(UUID id, User user) {
        log.info("Solicitação de exclusão da transação ID {}", id);

        Transaction candidate = repository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        // Transferências adquirem todas as linhas da operação em ordem estável;
        // não bloqueie uma ponta isolada antes disso para evitar ordem inversa.
        if (candidate.getOperationId() != null) {
            reverseOrDeleteTransfer(candidate.getOperationId(), user);
            return;
        }

        Transaction transaction = repository.findOwnedForUpdate(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (transaction.isSystemManaged()) {
            throw new BusinessRuleException("Esta transação é gerenciada automaticamente pelo sistema (Metas/Investimentos/Faturas) e não pode ser editada ou excluída manualmente pelo extrato.");
        }

        if (transaction.getOrigin() == TransactionOrigin.ACCOUNT_OPENING) {
            throw new BusinessRuleException("Abertura de conta é posição e não pode ser excluída como transação.");
        }

        if (transaction.getSettlementOfId() != null) {
            reverseSettlement(transaction, user);
            return;
        }

        if (transaction.getStatus() == TransactionStatus.PENDING) {
            if (repository.existsBySettlementOfId(transaction.getId())) {
                transaction.cancelForecast();
                repository.saveAndFlush(transaction);
            } else {
                repository.delete(transaction);
                repository.flush();
            }
            publishChanged(user.getId(), transaction.getDate().getYear());
            return;
        }
        if (transaction.getStatus() == TransactionStatus.PARTIALLY_SETTLED) {
            transaction.cancelForecast();
            repository.saveAndFlush(transaction);
            publishChanged(user.getId(), transaction.getDate().getYear());
            return;
        }
        if (transaction.getStatus() == TransactionStatus.FULFILLED
                || transaction.getStatus() == TransactionStatus.CANCELLED) {
            throw new BusinessRuleException("A previsão possui histórico de baixas e não pode ser excluída; estorne cada baixa quando necessário.");
        }
        reverseSettledTransaction(transaction, user);
    }

    public Page<TransactionResponseDTO> listAll(User user, Pageable pageable) {
        return repository.findAllByUserIdWithDetails(user.getId(), unsortedPage(pageable))
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
            startDate = LocalDate.now(clock).withDayOfMonth(1);
            endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        }

        return repository.findFilteredByUserId(user.getId(), startDate, endDate, type, accountId, unsortedPage(pageable))
                .map(TransactionResponseDTO::new);
    }

    private Pageable unsortedPage(Pageable pageable) {
        return pageable.isPaged() ? org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()) : Pageable.unpaged();
    }

    // --- Métodos Auxiliares ---

    private void applyTransactionBalance(Transaction transaction, Account account) {
        if (transaction.getType() == TransactionType.INCOME) {
            account.credit(transaction.getAmount());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            account.debit(transaction.getAmount());
        } else {
            throw new BusinessRuleException("Transferências exigem origem e destino vinculados.");
        }
        accountRepository.save(account);
    }

    private void reverseTransactionBalance(Transaction transaction, Account account) {
        if (transaction.getType() == TransactionType.INCOME) {
            account.debit(transaction.getAmount());
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            account.credit(transaction.getAmount());
        } else {
            throw new BusinessRuleException("Transferências exigem reversão das duas pontas.");
        }
        accountRepository.save(account);
    }

    private boolean hasRequestedChange(Transaction transaction, UpdateTransactionDTO data) {
        if (data.description() != null && !Objects.equals(data.description(), transaction.getDescription())) {
            return true;
        }
        if (data.amount() != null && data.amount().compareTo(transaction.getAmount()) != 0) {
            return true;
        }
        if (data.date() != null && !data.date().equals(transaction.getDate())) {
            return true;
        }
        if (data.hasTime()) {
            LocalTime requestedTime = DateUtil.optionalWallTime(data.time());
            TimeOrigin requestedOrigin = requestedTime == null ? TimeOrigin.NOT_PROVIDED : TimeOrigin.USER_INPUT;
            if (!Objects.equals(requestedTime, transaction.getTime())
                    || requestedOrigin != transaction.getTimeOrigin()) {
                return true;
            }
        }
        if (data.type() != null && data.type() != transaction.getType()) {
            return true;
        }
        if (data.accountId() != null && !data.accountId().equals(transaction.getAccount().getId())) {
            return true;
        }
        if (data.categoryId() != null
                && (transaction.getCategory() == null
                    || !data.categoryId().equals(transaction.getCategory().getId()))) {
            return true;
        }
        return data.isPaid() != null && data.isPaid() != transaction.isPaid();
    }

    private TransactionResponseDTO correctSettledTransaction(
            Transaction original,
            UpdateTransactionDTO data,
            User user
    ) {
        if (repository.existsByReversalOfId(original.getId())) {
            throw new BusinessRuleException("Esta transação já possui correção ou estorno.");
        }

        ZonedDateTime now = ZonedDateTime.now(clock);
        Transaction corrected = new Transaction();
        corrected.setDescription(original.getDescription());
        corrected.setAmount(original.getAmount());
        corrected.setDate(original.getDate());
        corrected.setCreatedAt(original.getCreatedAt());
        corrected.captureCorrectionTemporal(original, now.toInstant(), original.getCreatedAt());
        corrected.setType(original.getType());
        corrected.setPaid(true);
        corrected.setSettledAt(now.toInstant());
        corrected.setAccount(original.getAccount());
        corrected.setCategory(original.getCategory());
        corrected.setUser(user);
        corrected.setDueDate(original.getDueDate());
        corrected.setOrigin(TransactionOrigin.CORRECTION);
        corrected.setCorrectionOfId(original.getId());
        updateTransactionData(corrected, data, user);

        reverseTransactionBalance(original, original.getAccount());
        original.markReversed();
        Transaction reversal = reversalOf(original, original.getDate(), now);
        if (corrected.isRealized()) {
            applyTransactionBalance(corrected, corrected.getAccount());
        }

        repository.saveAll(List.of(original, reversal, corrected));
        repository.flush();
        publishChanged(
                user.getId(), original.getDate().getYear(), reversal.getDate().getYear(), corrected.getDate().getYear()
        );
        return new TransactionResponseDTO(corrected);
    }

    private void updateTransactionData(Transaction t, UpdateTransactionDTO data, User user) {
        TransactionStatus previousStatus = t.getStatus();
        LocalDate previousDate = t.getDate();
        if (data.description() != null) t.setDescription(data.description());
        if (data.amount() != null) {
            validatePositiveMoney(data.amount(), "valor");
            t.setAmount(data.amount());
        }
        if (data.date() != null || data.hasTime()) {
            t.preserveLegacyValue(t.getCreatedAt());
            if (data.hasTime()) t.changeInformedTime(DateUtil.optionalWallTime(data.time()));
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
        if (data.type() == TransactionType.TRANSFER) {
            throw new BusinessRuleException("Uma edição comum não cria transferência entre contas.");
        }
        if (data.type() != null) t.setType(data.type());
        if (data.isPaid() != null) {
            t.setPaid(data.isPaid());
            if (data.isPaid() && previousStatus == TransactionStatus.PENDING) {
                t.setSettledAt(ZonedDateTime.now(clock).toInstant());
            } else if (!data.isPaid()) {
                t.setSettledAt(null);
            }
        }

        if (t.getStatus() == TransactionStatus.PENDING) {
            t.setDueDate(t.getDate());
        } else if (previousStatus == TransactionStatus.PENDING && t.getDueDate() == null) {
            t.setDueDate(previousDate);
        }

        if (data.categoryId() != null) {
            Category novaCategoria = findOwnedCategory(data.categoryId(), user, t.getType());
            t.setCategory(novaCategoria);
        }

        if (data.accountId() != null) {
            Account novaConta = accountRepository.findByIdAndUserId(data.accountId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta destino não encontrada"));
            requireActive(novaConta);
            t.setAccount(novaConta);
        }

        if (t.getCategory() != null && t.getCategory().getType() != t.getType()) {
            throw new BusinessRuleException("A categoria não corresponde ao tipo da transação.");
        }
    }

    private TransactionResponseDTO createTransfer(CreateTransactionDTO data, User user) {
        UUID destinationId = data.destinationAccountId();
        if (destinationId == null) {
            throw new BusinessRuleException("A conta destino é obrigatória para uma transferência.");
        }
        if (data.accountId().equals(destinationId)) {
            throw new BusinessRuleException("Origem e destino da transferência devem ser diferentes.");
        }
        if (data.categoryId() != null) {
            throw new BusinessRuleException("Transferência não pode ser classificada como receita ou despesa.");
        }

        BigDecimal fee = positiveOrZero(data.fee());
        validateNonNegativeMoney(fee, "taxa");

        List<UUID> orderedIds = new ArrayList<>(List.of(data.accountId(), destinationId));
        orderedIds.sort(Comparator.naturalOrder());
        List<Account> lockedAccounts = accountRepository.findAllByIdForTransfer(orderedIds, user.getId());
        if (lockedAccounts.size() != 2) {
            throw new ResourceNotFoundException("Conta de origem ou destino não encontrada");
        }

        Account source = lockedAccounts.stream()
                .filter(account -> account.getId().equals(data.accountId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Conta de origem não encontrada"));
        Account destination = lockedAccounts.stream()
                .filter(account -> account.getId().equals(destinationId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Conta destino não encontrada"));

        if (!source.getUser().getId().equals(user.getId())
                || !destination.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Conta de origem ou destino não encontrada");
        }
        requireActive(source);
        requireActive(destination);

        boolean settled = data.isPaid() == null || data.isPaid();
        UUID operationId = UUID.randomUUID();
        ZonedDateTime now = ZonedDateTime.now(clock);

        Transaction outbound = newTransaction(
                data.description(), data.amount(), data.date(), data.time(), TransactionType.TRANSFER,
                settled, source, null, user, now
        );
        outbound.setOrigin(TransactionOrigin.TRANSFER);
        outbound.setOperationId(operationId);
        outbound.setTransferDirection(TransferDirection.OUTBOUND);
        outbound.setCounterpartyAccountId(destination.getId());

        Transaction inbound = newTransaction(
                data.description(), data.amount(), data.date(), data.time(), TransactionType.TRANSFER,
                settled, destination, null, user, now
        );
        inbound.setOrigin(TransactionOrigin.TRANSFER);
        inbound.setOperationId(operationId);
        inbound.setTransferDirection(TransferDirection.INBOUND);
        inbound.setCounterpartyAccountId(source.getId());

        List<Transaction> entries = new ArrayList<>(List.of(outbound, inbound));
        if (fee.signum() > 0) {
            Transaction feeEntry = newTransaction(
                    limitedDescription("Taxa - " + data.description()), fee, data.date(), data.time(),
                    TransactionType.EXPENSE, settled, source, null, user, now
            );
            feeEntry.setOrigin(TransactionOrigin.TRANSFER_FEE);
            feeEntry.setOperationId(operationId);
            entries.add(feeEntry);
        }

        if (settled) {
            source.debit(data.amount());
            if (fee.signum() > 0) {
                source.debit(fee);
            }
            destination.credit(data.amount());
            accountRepository.saveAll(List.of(source, destination));
        }

        repository.saveAll(entries);
        repository.flush();
        publishChanged(user.getId(), data.date().getYear());
        return new TransactionResponseDTO(outbound);
    }

    private void reverseSettledTransaction(Transaction original, User user) {
        if (original.getStatus() != TransactionStatus.SETTLED
                || repository.existsByReversalOfId(original.getId())) {
            throw new BusinessRuleException("Esta transação já foi estornada ou não está liquidada.");
        }

        log.info("Estornando impacto financeiro da transação {} na conta {}",
                original.getId(), original.getAccount().getId());
        reverseTransactionBalance(original, original.getAccount());
        original.markReversed();

        ZonedDateTime now = ZonedDateTime.now(clock);
        Transaction reversal = reversalOf(original, now);
        repository.saveAll(List.of(original, reversal));
        repository.flush();
        publishChanged(user.getId(), original.getDate().getYear(), reversal.getDate().getYear());
    }

    private void reverseSettlement(Transaction settlement, User user) {
        Transaction forecast = repository.findOwnedForUpdate(settlement.getSettlementOfId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Previsão da baixa não encontrada"));
        reverseSettledTransaction(settlement, user);

        if (forecast.getStatus() != TransactionStatus.CANCELLED) {
            BigDecimal activeSettlements = repository.sumActiveSettlements(forecast.getId());
            forecast.markForecastSettlement(activeSettlements);
            forecast.setSettledAt(null);
            repository.saveAndFlush(forecast);
        }
        publishChanged(user.getId(), forecast.getDate().getYear());
    }

    private void reverseOrDeleteTransfer(UUID operationId, User user) {
        List<Transaction> operation = repository.findOperationForUpdate(operationId);
        if (operation.isEmpty() || operation.stream().anyMatch(t -> !t.getUser().getId().equals(user.getId()))) {
            throw new ResourceNotFoundException("Transferência não encontrada");
        }
        if (operation.stream().anyMatch(Transaction::isSystemManaged)) {
            throw new BusinessRuleException("A operação é gerenciada por outro fluxo do sistema.");
        }

        boolean allPending = operation.stream().allMatch(t -> t.getStatus() == TransactionStatus.PENDING);
        if (allPending) {
            int[] years = operation.stream().mapToInt(t -> t.getDate().getYear()).toArray();
            repository.deleteAll(operation);
            repository.flush();
            publishChanged(user.getId(), years);
            return;
        }
        if (operation.stream().anyMatch(t -> t.getStatus() != TransactionStatus.SETTLED)) {
            throw new BusinessRuleException("Esta transferência já foi estornada ou possui estado inconsistente.");
        }

        Transaction outbound = singleTransferLeg(operation, TransferDirection.OUTBOUND);
        Transaction inbound = singleTransferLeg(operation, TransferDirection.INBOUND);
        if (outbound.getAmount().compareTo(inbound.getAmount()) != 0) {
            throw new BusinessRuleException("As pontas da transferência não conciliam.");
        }

        Account source = outbound.getAccount();
        Account destination = inbound.getAccount();
        source.credit(outbound.getAmount());
        destination.debit(inbound.getAmount());
        operation.stream()
                .filter(t -> t.getOrigin() == TransactionOrigin.TRANSFER_FEE)
                .forEach(t -> source.credit(t.getAmount()));
        accountRepository.saveAll(List.of(source, destination));

        ZonedDateTime now = ZonedDateTime.now(clock);
        List<Transaction> reversals = new ArrayList<>();
        for (Transaction entry : operation) {
            if (repository.existsByReversalOfId(entry.getId())) {
                throw new BusinessRuleException("Esta transferência já possui estorno.");
            }
            entry.markReversed();
            reversals.add(reversalOf(entry, now));
        }
        repository.saveAll(operation);
        repository.saveAll(reversals);
        repository.flush();

        int[] years = java.util.stream.Stream.concat(operation.stream(), reversals.stream())
                .mapToInt(t -> t.getDate().getYear())
                .toArray();
        publishChanged(user.getId(), years);
    }

    private Transaction singleTransferLeg(List<Transaction> operation, TransferDirection direction) {
        List<Transaction> matches = operation.stream()
                .filter(t -> t.getOrigin() == TransactionOrigin.TRANSFER)
                .filter(t -> t.getTransferDirection() == direction)
                .toList();
        if (matches.size() != 1) {
            throw new BusinessRuleException("A transferência não possui exatamente duas pontas conciliáveis.");
        }
        return matches.getFirst();
    }

    private Transaction reversalOf(Transaction original, ZonedDateTime now) {
        return reversalOf(original, now.toLocalDate(), now);
    }

    private Transaction reversalOf(Transaction original, LocalDate effectiveDate, ZonedDateTime now) {
        Transaction reversal = newTransaction(
                limitedDescription("Estorno - " + original.getDescription()), original.getAmount(),
                effectiveDate, null, original.getType(), true,
                original.getAccount(), original.getCategory(), original.getUser(), now
        );
        reversal.setOrigin(TransactionOrigin.REVERSAL);
        reversal.setReversalOfId(original.getId());
        reversal.setSystemManaged(true);
        return reversal;
    }

    private Transaction newTransaction(
            String description,
            BigDecimal amount,
            LocalDate date,
            String informedTime,
            TransactionType type,
            boolean paid,
            Account account,
            Category category,
            User user,
            ZonedDateTime now
    ) {
        Transaction transaction = new Transaction();
        transaction.setDescription(description);
        transaction.setAmount(amount);
        transaction.setDate(date);
        LocalTime time = DateUtil.getTimeOrDefault(informedTime, now.toLocalTime());
        transaction.setCreatedAt(date.atTime(time));
        transaction.captureTemporal(DateUtil.optionalWallTime(informedTime), now.toInstant(), transaction.getCreatedAt());
        transaction.setType(type);
        transaction.setPaid(paid);
        transaction.setDueDate(paid ? null : date);
        transaction.setSettledAt(paid ? now.toInstant() : null);
        transaction.setAccount(account);
        transaction.setCategory(category);
        transaction.setUser(user);
        return transaction;
    }

    private Category findOwnedCategory(UUID categoryId, User user, TransactionType type) {
        if (categoryId == null) {
            return null;
        }
        Category category = categoryRepository.findByIdAndUserId(categoryId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (category.getType() != type) {
            throw new BusinessRuleException("A categoria não corresponde ao tipo da transação.");
        }
        return category;
    }

    private void requireActive(Account account) {
        if (account.isArchived()) {
            throw new BusinessRuleException("Não é possível movimentar uma conta arquivada.");
        }
    }

    private void validatePositiveMoney(BigDecimal value, String field) {
        if (value == null || value.signum() <= 0) {
            throw new BusinessRuleException("O " + field + " deve ser maior que zero.");
        }
        validateMoneyScaleAndLimit(value, field);
    }

    private void validateNonNegativeMoney(BigDecimal value, String field) {
        if (value == null || value.signum() < 0) {
            throw new BusinessRuleException("A " + field + " não pode ser negativa.");
        }
        validateMoneyScaleAndLimit(value, field);
    }

    private void validateMoneyScaleAndLimit(BigDecimal value, String field) {
        try {
            value.setScale(2, java.math.RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new BusinessRuleException("O " + field + " deve ter no máximo duas casas decimais.");
        }
        if (value.abs().compareTo(new BigDecimal("999999999999.99")) > 0) {
            throw new BusinessRuleException("O " + field + " excede o limite monetário.");
        }
    }

    private BigDecimal positiveOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String limitedDescription(String value) {
        return value.length() <= 255 ? value : value.substring(0, 255);
    }

    private void publishChanged(UUID userId, int... years) {
        java.util.Arrays.stream(years)
                .distinct()
                .forEach(year -> eventPublisher.publishEvent(new UserFinancialDataChangedEvent(userId, year)));
    }

    public byte[] exportToExcel(User user) {
        return exportToExcel(user, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public CashSummaryDTO getCashSummary(User user, Integer month, Integer year,
                                         TransactionType type, UUID accountId) {
        if (month == null || year == null) {
            throw new BusinessRuleException("Mês e ano são obrigatórios para o resumo do extrato.");
        }
        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        BigDecimal entries = BigDecimal.ZERO;
        BigDecimal exits = BigDecimal.ZERO;
        for (Object[] row : repository.sumCashByPeriod(user.getId(), firstDay, lastDay, type, accountId)) {
            BigDecimal amount = exactDecimal(row[2]);
            boolean incoming = row[0].toString().equals(TransactionType.INCOME.name())
                    || row[0].toString().equals(TransactionType.TRANSFER.name())
                    && row[1] != null && row[1].toString().equals(TransferDirection.INBOUND.name());
            BigDecimal cashDelta = incoming ? amount : amount.negate();
            if (cashDelta.signum() >= 0) entries = entries.add(cashDelta);
            else exits = exits.subtract(cashDelta);
        }
        return new CashSummaryDTO(entries, exits, entries.subtract(exits));
    }

    public byte[] exportToExcel(User user, Integer month, Integer year,
                                TransactionType type, UUID accountId) {
        log.info("Gerando Excel em lotes para o usuário {}", user.getEmail());

        if ((month == null) != (year == null)) {
            throw new BusinessRuleException("Mês e ano devem ser informados juntos.");
        }
        LocalDate startDate = month == null ? LocalDate.of(1, 1, 1) : LocalDate.of(year, month, 1);
        LocalDate endDate = month == null ? LocalDate.of(9999, 12, 31)
                : startDate.withDayOfMonth(startDate.lengthOfMonth());

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
            DashboardService.PeriodTotals totals = dashboardService.getPeriodTotals(
                    user, startDate, endDate, type, accountId);
            BigDecimal totalIncome = totals.income();
            BigDecimal totalExpense = totals.expense();
            BigDecimal balance = totals.investmentResult() == null ? null
                    : totalIncome.subtract(totalExpense).add(totals.investmentResult());

            // --- 3. DESENHANDO O CABEÇALHO E RESUMO ---
            Row rowTitle = sheet.createRow(0);
            Cell cellTitle = rowTitle.createCell(0);
            cellTitle.setCellValue("Relatório Financeiro - Controle Financeiro");
            cellTitle.setCellStyle(titleStyle);
            Row scope = sheet.createRow(1);
            scope.createCell(0).setCellValue("Resultado gerencial: " + startDate + " a " + endDate
                    + "; tipo=" + (type == null ? "todos" : type)
                    + "; conta=" + (accountId == null ? "todas" : accountId)
                    + ". Origens desconhecidas exigem reconciliação.");

            Row rInc = sheet.createRow(2);
            rInc.createCell(0).setCellValue("Receitas realizadas:");
            Cell cInc = rInc.createCell(1);
            cInc.setCellValue(totalIncome.doubleValue());
            cInc.setCellStyle(currencyStyle);

            Row rExp = sheet.createRow(3);
            rExp.createCell(0).setCellValue("Consumo e encargos (inclui cartão):");
            Cell cExp = rExp.createCell(1);
            cExp.setCellValue(totalExpense.doubleValue());
            cExp.setCellStyle(currencyStyle);

            Row rBal = sheet.createRow(4);
            rBal.createCell(0).setCellValue("Resultado gerencial (não saldo bancário):");
            Cell cBal = rBal.createCell(1);
            if (balance == null) cBal.setCellValue("Indisponível: custo de venda desconhecido");
            else cBal.setCellValue(balance.doubleValue());
            cBal.setCellStyle(currencyStyle);
            Row rCard = sheet.createRow(5);
            rCard.createCell(0).setCellValue("Deste total, consumo líquido no cartão:");
            Cell cCard = rCard.createCell(1);
            cCard.setCellValue(totals.cardConsumption().doubleValue());
            cCard.setCellStyle(currencyStyle);
            Row rInvestment = sheet.createRow(6);
            rInvestment.createCell(0).setCellValue("Resultado realizado de investimentos:");
            Cell cInvestment = rInvestment.createCell(1);
            if (totals.investmentResult() == null) cInvestment.setCellValue("Indisponível: custo de venda desconhecido");
            else cInvestment.setCellValue(totals.investmentResult().doubleValue());
            cInvestment.setCellStyle(currencyStyle);

            // --- 4. CABEÇALHO DA TABELA ---
            int rowIdx = 7;
            Row header = sheet.createRow(rowIdx++);
            String[] columns = {"Data", "Hora", "Descrição", "Categoria", "Conta", "Tipo", "Valor movimento", "Status", "Origem", "Receita no resultado", "Despesa no resultado"};
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
                pageData = month == null && type == null && accountId == null
                        ? repository.findAllByUserIdWithDetails(user.getId(),
                                org.springframework.data.domain.PageRequest.of(pageNumber, pageSize))
                        : repository.findFilteredByUserId(user.getId(), startDate, endDate,
                                type, accountId, org.springframework.data.domain.PageRequest.of(pageNumber, pageSize));

                // Consulta em lote: o estorno herda a classificação gerencial da origem.
                Map<UUID, Transaction> originals = new HashMap<>();
                List<UUID> reversalIds = pageData.getContent().stream()
                        .filter(t -> t.getOrigin() == TransactionOrigin.REVERSAL && t.getReversalOfId() != null)
                        .map(Transaction::getReversalOfId).distinct().toList();
                if (!reversalIds.isEmpty()) {
                    for (Transaction original : repository.findAllById(reversalIds)) {
                        if (original.getUser().getId().equals(user.getId())) originals.put(original.getId(), original);
                    }
                }

                for (Transaction t : pageData.getContent()) {
                    TransactionResponseDTO dto = new TransactionResponseDTO(t);
                    Row row = sheet.createRow(rowIdx++);

                    row.createCell(0).setCellValue(dto.date() != null ? dto.date().format(dateFmt) : "");
                    row.createCell(1).setCellValue(dto.time() != null ? dto.time().format(timeFmt) : "—");
                    row.createCell(2).setCellValue(dto.description());
                    row.createCell(3).setCellValue(dto.categoryName() != null ? dto.categoryName() : "Geral");
                    row.createCell(4).setCellValue(dto.accountName() != null ? dto.accountName() : "-");

                    Cell typeCell = row.createCell(5);
                    boolean isIncome = dto.type() == TransactionType.INCOME;
                    typeCell.setCellValue(t.getType() == TransactionType.TRANSFER ? "Transferência"
                            : isIncome ? "Receita" : "Despesa");
                    if (t.getType() != TransactionType.TRANSFER)
                        typeCell.setCellStyle(isIncome ? incomeStyle : expenseStyle);

                    Cell valCell = row.createCell(6);
                    valCell.setCellValue(dto.amount().doubleValue());
                    valCell.setCellStyle(currencyStyle);

                    row.createCell(7).setCellValue(t.getStatus().name());
                    row.createCell(8).setCellValue(t.getOrigin() == null ? "UNKNOWN" : t.getOrigin().name());
                    Transaction original = t.getOrigin() == TransactionOrigin.REVERSAL
                            ? originals.get(t.getReversalOfId()) : null;
                    TransactionOrigin effectiveOrigin = t.getOrigin() == TransactionOrigin.REVERSAL
                            ? original == null ? null : original.getOrigin() : t.getOrigin();
                    if (t.isRealized() && t.getType() != TransactionType.TRANSFER
                            && (t.getOrigin() != TransactionOrigin.REVERSAL || original != null)
                            && effectiveOrigin != TransactionOrigin.ACCOUNT_OPENING
                            && effectiveOrigin != TransactionOrigin.INVOICE_PAYMENT
                            && effectiveOrigin != TransactionOrigin.INVESTMENT_BUY
                            && effectiveOrigin != TransactionOrigin.INVESTMENT_SELL) {
                        BigDecimal reportAmount = t.getOrigin() == TransactionOrigin.REVERSAL
                                ? t.getAmount().negate() : t.getAmount();
                        Cell effect = row.createCell(t.getType() == TransactionType.INCOME ? 9 : 10);
                        effect.setCellValue(reportAmount.doubleValue());
                        effect.setCellStyle(currencyStyle);
                    }
                }

                pageNumber++;
                entityManager.clear();
            } while (pageData.hasNext());

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            if (accountId == null && type != TransactionType.INCOME) {
                SXSSFSheet cardSheet = workbook.createSheet("Consumo cartão");
                Row cardHeader = cardSheet.createRow(0);
                String[] cardColumns = {"Data da compra/estorno", "Natureza", "Descrição", "Valor no consumo"};
                for (int i = 0; i < cardColumns.length; i++) {
                    Cell cell = cardHeader.createCell(i);
                    cell.setCellValue(cardColumns[i]);
                    cell.setCellStyle(headerStyle);
                }
                int cardRow = 1;
                int cardPage = 0;
                org.springframework.data.domain.Page<com.controlefinanceiro.api.domain.card.CardTransaction> purchases;
                do {
                    purchases = cardTransactionRepository.findReportPurchases(user.getId(), startDate, endDate,
                            org.springframework.data.domain.PageRequest.of(cardPage++, pageSize));
                    for (var purchase : purchases) {
                        Row row = cardSheet.createRow(cardRow++);
                        row.createCell(0).setCellValue(purchase.getDate().format(dateFmt));
                        row.createCell(1).setCellValue("Compra");
                        row.createCell(2).setCellValue(purchase.getDescription());
                        Cell amount = row.createCell(3);
                        amount.setCellValue(purchase.getAmount().doubleValue());
                        amount.setCellStyle(currencyStyle);
                    }
                    entityManager.clear();
                } while (purchases.hasNext());
                int refundPage = 0;
                org.springframework.data.domain.Page<com.controlefinanceiro.api.domain.card.CardRefund> refunds;
                do {
                    refunds = cardRefundRepository.findReportRefunds(user.getId(), startDate, endDate,
                            org.springframework.data.domain.PageRequest.of(refundPage++, pageSize));
                    for (var refund : refunds) {
                        Row row = cardSheet.createRow(cardRow++);
                        row.createCell(0).setCellValue(refund.getRefundDate().format(dateFmt));
                        row.createCell(1).setCellValue("Estorno");
                        row.createCell(2).setCellValue("Estorno de compra " + refund.getPurchaseId());
                        Cell amount = row.createCell(3);
                        amount.setCellValue(refund.getAmount().negate().doubleValue());
                        amount.setCellStyle(currencyStyle);
                    }
                    entityManager.clear();
                } while (refunds.hasNext());
                for (int i = 0; i < cardColumns.length; i++) cardSheet.setColumnWidth(i, i == 2 ? 12000 : 6000);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Erro ao gerar Excel", e);
            throw new BusinessRuleException("Falha ao gerar arquivo Excel");
        }
    }

    private BigDecimal exactDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        return new BigDecimal(value.toString());
    }
}
