package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.InvoiceChangedEvent;
import com.controlefinanceiro.api.domain.event.InvoicePaymentRequestedEvent;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.planning.*;
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
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.DateTimeException;
import java.time.YearMonth;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CreditCardService {
    @org.springframework.beans.factory.annotation.Autowired private FinancialInventoryGuard inventoryGuard;

    @Autowired private OwnedResourceOrder ownedOrder;
    private static final BigDecimal MONEY_CEILING = new BigDecimal("1000000000000");

    @Autowired
    private CreditCardRepository cardRepository;
    @Autowired
    private InvoiceRepository invoiceRepository;
    @Autowired
    private CardTransactionRepository cardTransactionRepository;
    @Autowired
    private CardPaymentRepository cardPaymentRepository;
    @Autowired
    private CardPaymentAllocationRepository cardPaymentAllocationRepository;
    @Autowired
    private CardRefundRepository cardRefundRepository;
    @Autowired
    private CardOpeningBatchRepository cardOpeningBatchRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private PlanItemRepository planItemRepository;
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private Clock clock;

    @Transactional
    public CreditCardResponseDTO createCard(CreateCardDTO data, User user) {
        inventoryGuard.writer(user.getId());
        if (!validMoney(data.limit(), false)) {
            throw new BusinessRuleException("Limite deve ser positivo, em centavos e ter até 12 dígitos inteiros.");
        }
        log.info("Criando cartão '{}' (Final {})", data.name(), data.last4Digits());
        CreditCard card = new CreditCard();
        card.setReportingKnownFrom(LocalDate.now(clock));
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

    @Transactional
    public void recordOpeningPosition(CardOpeningPosition data, User user) {
        inventoryGuard.writer(user.getId());
        CreditCard card = cardRepository.findOwnedForPayment(data.cardId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));
        if (cardOpeningBatchRepository.existsByCardId(card.getId())
                || cardTransactionRepository.existsByInvoiceCardId(card.getId())) {
            throw new BusinessRuleException("Posição inicial do cartão já registrada.");
        }
        if (data.baseDate() == null || data.currentCompetence() == null || data.futureInstallments() == null
                || !validMoney(data.currentOutstanding(), true)) {
            throw new BusinessRuleException("Posição inicial inválida.");
        }
        BigDecimal openingTotal=data.currentOutstanding();
        for (CardOpeningPosition.FutureInstallment future : data.futureInstallments()) {
            if (future.competence() == null || !future.competence().isAfter(data.currentCompetence())
                    || !validMoney(future.amount(), false)) {
                throw new BusinessRuleException("Parcelas futuras devem ter competência posterior e valor positivo em centavos.");
            }
            openingTotal=openingTotal.add(future.amount());
        }
        if(!validMoney(openingTotal,true))throw new BusinessRuleException("Dívida inicial agregada fora da faixa monetária.");

        Category category = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.PAGAMENTO_FATURA.getName())
                .orElseGet(() -> {
                    Category created = new Category();
                    created.setUser(user);
                    created.setName(DefaultCategory.PAGAMENTO_FATURA.getName());
                    created.setType(TransactionType.EXPENSE);
                    created.setSystemReserved(true);
                    return categoryRepository.save(created);
                });
        CardOpeningBatch batch = new CardOpeningBatch();
        batch.setCard(card);
        batch.setBaseDate(data.baseDate());
        batch.setCreatedAt(clock.instant());
        cardOpeningBatchRepository.save(batch);

        if (data.currentOutstanding().signum() > 0) {
            recordOpeningInstallment(card, batch, category, data.currentCompetence(),
                    data.currentOutstanding(), "Dívida inicial da fatura", data.baseDate());
        }
        for (CardOpeningPosition.FutureInstallment future : data.futureInstallments()) {
            recordOpeningInstallment(card, batch, category, future.competence(), future.amount(),
                    future.description() == null || future.description().isBlank()
                            ? "Parcela futura declarada" : future.description(), data.baseDate());
        }
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), data.baseDate().getYear()));
    }

    private boolean validMoney(BigDecimal amount, boolean allowZero) {
        return amount != null && amount.scale() <= 2 && amount.abs().compareTo(MONEY_CEILING) < 0
                && (allowZero ? amount.signum() >= 0 : amount.signum() > 0);
    }

    private void recordOpeningInstallment(CreditCard card, CardOpeningBatch batch, Category category,
                                          YearMonth competence, BigDecimal amount, String description,
                                          LocalDate baseDate) {
        Invoice invoice = getOrCreateInvoice(card, competence.getMonthValue(), competence.getYear());
        if (!invoice.getClosingDate().isAfter(baseDate)) invoice.setStatus(InvoiceStatus.CLOSED);
        CardTransaction entry = new CardTransaction();
        entry.setInvoice(invoice);
        entry.setCategory(category);
        entry.setDescription(description);
        entry.setAmount(amount);
        entry.setOpeningPrincipal(amount);
        entry.setOpeningCharges(BigDecimal.ZERO);
        entry.setDate(baseDate);
        entry.setCreatedAt(LocalDateTime.now(clock));
        entry.captureTemporal(null, clock.instant(), entry.getCreatedAt());
        entry.setOrigin(CardTransactionOrigin.OPENING);
        entry.setOpeningBatchId(batch.getId());
        cardTransactionRepository.save(entry);
        eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
    }

    public List<CreditCard> listAll(User user) {
        return cardRepository.findAllByUserIdOrderByOrderIndexAsc(user.getId());
    }

    @Transactional
    public void deleteCard(UUID id, User user) {
        inventoryGuard.writer(user.getId());
        log.warn("SERVICE: Iniciando exclusão do Cartão {} e suas dependências.", id);

        CreditCard card = cardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (!card.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Cartão não encontrado");
        }

        if (cardTransactionRepository.existsByInvoiceCardId(id)
                || cardPaymentRepository.existsByInvoiceCardId(id)
                || cardRefundRepository.existsByCardId(id)
                || cardOpeningBatchRepository.existsByCardId(id)) {
            throw new BusinessRuleException("Cartão com histórico financeiro não pode ser excluído; arquive ou estorne as compras.");
        }

        // Faturas vazias não carregam fatos financeiros.
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
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now(clock).getYear()));

        log.info("SERVICE: Cartão {} excluído com sucesso do banco de dados.", id);
    }

    // --- TRANSAÇÕES DE CARTÃO ---

    @Transactional
    public UUID createTransaction(CreateCardTransactionDTO data, User user) {
        inventoryGuard.writer(user.getId());
        log.info("Nova compra no cartão ID {}: {} ({}x)", data.cardId(), data.amount(), data.totalInstallments());
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalTime operationTime = DateUtil.getTimeOrDefault(data.time(), now.toLocalTime());

        CreditCard card = cardRepository.findByIdForUpdate(data.cardId()).orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));
        if (!card.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Cartão não encontrado");
        }

        Category category = categoryRepository.findById(data.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (!category.getUser().getId().equals(card.getUser().getId())) {
            throw new ResourceNotFoundException("Categoria não encontrada");
        }

        int parcelas = data.totalInstallments() == null ? 1 : data.totalInstallments();
        if (!validMoney(data.amount(), false)
                || parcelas < 1 || BigDecimal.valueOf(parcelas).compareTo(data.amount().movePointRight(2)) > 0) {
            throw new BusinessRuleException("Valor deve ser positivo, em centavos, ter até 12 dígitos inteiros e cobrir todas as parcelas.");
        }

        BigDecimal valorParcelaBase = data.amount().divide(BigDecimal.valueOf(parcelas), 2, RoundingMode.DOWN);
        BigDecimal newDebt=cardTransactionRepository.sumOutstandingByCardId(card.getId())
                .add(data.amount().subtract(card.getCreditBalance()).max(BigDecimal.ZERO));
        if(!validMoney(newDebt,true))throw new BusinessRuleException("Dívida agregada fora da faixa monetária.");
        BigDecimal valorTotalBase = valorParcelaBase.multiply(BigDecimal.valueOf(parcelas));
        BigDecimal diferencaCentavos = data.amount().subtract(valorTotalBase);

        CardTransaction primeiraTransacao = null;
        UUID purchaseId = UUID.randomUUID();
        CardCycle firstCycle;
        try {
            firstCycle = CardCycle.forPurchase(data.date(), card.getClosingDay(), card.getDueDay());
            firstCycle.competence().plusMonths(parcelas - 1L);
        } catch (DateTimeException ex) {
            throw new BusinessRuleException("Parcelamento excede o calendário aceito.");
        }
        BigDecimal creditRemaining = card.getCreditBalance();

        for (int i = 0; i < parcelas; i++) {
            YearMonth competence = firstCycle.competence().plusMonths(i);
            Invoice invoice = getOrCreateInvoice(card, competence.getMonthValue(), competence.getYear());
            if (invoice.getStatus() != InvoiceStatus.OPEN) {
                throw new BusinessRuleException("Competência da compra já encerrada.");
            }

            CardTransaction transaction = new CardTransaction();
            transaction.setDescription(data.description() + (parcelas > 1 ? " (" + (i + 1) + "/" + parcelas + ")" : ""));

            if (i == parcelas - 1) {
                transaction.setAmount(valorParcelaBase.add(diferencaCentavos));
            } else {
                transaction.setAmount(valorParcelaBase);
            }

            transaction.setDate(data.date());
            transaction.setOrigin(CardTransactionOrigin.PURCHASE);

            BigDecimal creditApplied = creditRemaining.min(transaction.getAmount());
            transaction.setPaidAmount(creditApplied);
            transaction.setCreditApplied(creditApplied);
            creditRemaining = creditRemaining.subtract(creditApplied);

            transaction.setCreatedAt(data.date().atTime(operationTime));
            transaction.captureTemporal(DateUtil.optionalWallTime(data.time()), now.toInstant(), transaction.getCreatedAt());

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

        card.setCreditBalance(creditRemaining);

        int anoInicial = data.date().getYear();
        int anoFinal = firstCycle.competence().plusMonths(parcelas - 1).getYear();

        for (int ano = anoInicial; ano <= anoFinal; ano++) {
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(card.getUser().getId(), ano));
        }

        log.info("Compra parcelada processada com sucesso.");
        return primeiraTransacao.getId();
    }

    @Transactional
    public CreditCardResponseDTO update(UUID id, UpdateCardDTO data, User user) {
        inventoryGuard.writer(user.getId());
        CreditCard card = cardRepository.findOwnedForPayment(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        if (data.name() != null) card.setName(data.name());
        if (data.limit() != null) {
            if (!validMoney(data.limit(), false)) {
                throw new BusinessRuleException("Limite deve ser positivo, em centavos e ter até 12 dígitos inteiros.");
            }
            card.setLimit(data.limit());
        }
        if (data.closingDay() != null) card.setClosingDay(data.closingDay());
        if (data.dueDay() != null) card.setDueDay(data.dueDay());
        if (data.color() != null) card.setColor(data.color());

        CreditCard updatedCard = cardRepository.save(card);
        return new CreditCardResponseDTO(updatedCard);
    }

    @Transactional
    public CardTransactionDTO updateTransaction(UUID transactionId, UpdateCardTransactionDTO data, User user) {
        inventoryGuard.writer(user.getId());
        CardTransaction tx = cardTransactionRepository.findById(transactionId).orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        if (!tx.getInvoice().getCard().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Transação não encontrada");
        }

        if (tx.getInvoice().getStatus() != InvoiceStatus.OPEN) {
            throw new BusinessRuleException("Não é possível editar transações de uma fatura que já está fechada ou paga.");
        }

        if (data.description() != null) tx.setDescription(data.description());
        if (data.categoryId() != null) {
            Category cat = categoryRepository.findById(data.categoryId()).orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
            if (!cat.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Categoria não encontrada");
            }
            tx.setCategory(cat);
        }

        return new CardTransactionDTO(cardTransactionRepository.save(tx));
    }

    public List<CardSummaryDTO> listAllWithSummary(User user) {
        List<CreditCard> cards = cardRepository.findAllByUserIdOrderByOrderIndexAsc(user.getId());
        if (cards.isEmpty()) return Collections.emptyList();

        List<UUID> cardIds = cards.stream().map(CreditCard::getId).toList();

        LocalDate today = LocalDate.now(clock);
        Map<UUID, List<Object[]>> balancesByCard = cardTransactionRepository
                .outstandingByCardPeriod(cardIds).stream()
                .collect(Collectors.groupingBy(row -> (UUID) row[0]));
        Set<String> rolledPeriods = invoiceRepository.findByCardIdsAndStatus(cardIds, InvoiceStatus.ROLLED)
                .stream().map(i -> i.getCard().getId() + ":" + i.getYear() + ":" + i.getMonth())
                .collect(Collectors.toSet());

        Map<UUID,BigDecimal> principalByCard=new HashMap<>();
        for(Object[] row:cardTransactionRepository.committedByCards(cardIds)) principalByCard.put((UUID)row[0],(BigDecimal)row[1]);
        return cards.stream().map(card -> {
            YearMonth target = CardCycle.forPurchase(today, card.getClosingDay(), card.getDueDay()).competence();
            YearMonth previous = target.equals(YearMonth.of(1, 1)) ? null : target.minusMonths(1);
            boolean carry = previous != null && rolledPeriods.contains(
                    card.getId() + ":" + previous.getYear() + ":" + previous.getMonthValue());
            BigDecimal invoiceValue = BigDecimal.ZERO;
            BigDecimal committed = principalByCard.containsKey(card.getId())?principalByCard.get(card.getId()):BigDecimal.ZERO;
            for (Object[] row : balancesByCard.getOrDefault(card.getId(), List.of())) {
                BigDecimal amount = (BigDecimal) row[4];

                YearMonth competence = YearMonth.of((Integer) row[2], (Integer) row[1]);
                if (competence.equals(target)
                        || (carry && competence.isBefore(target) && row[3] == InvoiceStatus.ROLLED)) {
                    invoiceValue = invoiceValue.add(amount);
                }
            }

            return new CardSummaryDTO(
                    card.getId(),
                    card.getName(),
                    card.getLast4Digits(),
                    card.getLimit(),
                    card.getClosingDay(),
                    card.getDueDay(),
                    card.getColor(),
                    card.getBrand(),
                    invoiceValue,
                    committed,
                    card.getLimit()==null || committed==null?null:card.getLimit().subtract(committed),
                    card.getCreditBalance()
            );
        }).toList();
    }

    @Transactional
    public InvoiceDetailsDTO getInvoiceDetails(UUID cardId, Integer month, Integer year, User user) {
        inventoryGuard.writer(user.getId());
        CreditCard card = cardRepository.findOwnedForPayment(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        Invoice invoice = getOrCreateInvoice(card, month, year);

        List<CardTransaction> rawTransactions = cardTransactionRepository.findByInvoiceIdWithDetails(invoice.getId());

        List<CardTransactionDTO> transactions = rawTransactions.stream()
                .map(CardTransactionDTO::new).toList();

        BigDecimal total = cardTransactionRepository.sumAmountByInvoiceId(invoice.getId());
        BigDecimal ownOutstanding = cardTransactionRepository.sumOutstandingByInvoiceId(invoice.getId());
        BigDecimal payable = cardTransactionRepository.sumOutstandingUpTo(
                cardId, month, year, includeRolled(invoice));

        return new InvoiceDetailsDTO(invoice.getId(), month, year, invoice.getStatus().name(),
                total, payable, payable.subtract(ownOutstanding), invoice.getDueDate(), invoice.getClosingDate(), transactions);
    }

    private boolean includeRolled(Invoice invoice) {
        YearMonth competence = YearMonth.of(invoice.getYear(), invoice.getMonth());
        if (competence.equals(YearMonth.of(1, 1))) return false;
        YearMonth previous = competence.minusMonths(1);
        return invoiceRepository.findByCardIdAndMonthAndYear(
                        invoice.getCard().getId(), previous.getMonthValue(), previous.getYear())
                .filter(prior -> prior.getStatus() == InvoiceStatus.ROLLED).isPresent();
    }

    @Transactional
    public void deleteTransaction(UUID transactionId, User user) {
        inventoryGuard.writer(user.getId());
        refundPurchase(transactionId, null, LocalDate.now(clock), null, user);
    }

    @Transactional
    public void refundPurchase(UUID transactionId, BigDecimal requestedAmount, LocalDate refundDate,
                               UUID operationId, User user) {
        inventoryGuard.writer(user.getId());
        UUID cardId = cardTransactionRepository.findCardIdByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Compra não encontrada"));
        CreditCard card = cardRepository.findOwnedForPayment(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Compra não encontrada"));
        CardTransaction original = cardTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Compra não encontrada"));
        if (original.getPurchaseId() == null || original.getOrigin() != CardTransactionOrigin.PURCHASE) {
            throw new BusinessRuleException("Compra legada sem origem comprovada exige conciliação antes do estorno.");
        }
        UUID purchaseId = original.getPurchaseId();
        List<CardTransaction> installments = cardTransactionRepository.findPurchaseInstallments(purchaseId);
        BigDecimal originalAmount = installments.stream().map(CardTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal alreadyRefunded = cardRefundRepository.sumByPurchase(cardId, purchaseId);
        BigDecimal amount = requestedAmount == null ? originalAmount.subtract(alreadyRefunded) : requestedAmount;
        if (refundDate == null || !validMoney(amount, false)
                || amount.compareTo(originalAmount.subtract(alreadyRefunded)) > 0) {
            throw new BusinessRuleException("Estorno deve ser positivo e não exceder a compra ainda não estornada.");
        }
        if (operationId != null && cardRefundRepository.existsByOperationId(operationId)) {
            throw new BusinessRuleException("Estorno já registrado.");
        }
        if (operationId == null && cardRefundRepository
                .existsByCardIdAndPurchaseIdAndAmountAndRefundDateAndOperationIdIsNull(
                        cardId, purchaseId, amount, refundDate)) {
            throw new BusinessRuleException("Estorno já registrado.");
        }

        BigDecimal remainder = amount;
        Set<Invoice> affectedInvoices = new HashSet<>();
        for (CardTransaction installment : installments) {
            BigDecimal owed = installment.getAmount().subtract(installment.getPaidAmount())
                    .subtract(installment.getRefundedAmount());
            BigDecimal reduction = owed.min(remainder);
            if (reduction.signum() > 0) {
                installment.setRefundedAmount(installment.getRefundedAmount().add(reduction));
                affectedInvoices.add(installment.getInvoice());
                remainder = remainder.subtract(reduction);
            }
            if (remainder.signum() == 0) break;
        }
        BigDecimal newCredit=card.getCreditBalance().add(remainder);
        if(!validMoney(newCredit,true))throw new BusinessRuleException("Crédito agregado fora da faixa monetária.");
        card.setCreditBalance(newCredit);
        CardRefund refund = new CardRefund();
        refund.setCard(card);
        refund.setPurchaseId(purchaseId);
        refund.setCategory(original.getCategory());
        refund.setOperationId(operationId);
        refund.setAmount(amount);
        refund.setCreditCreated(remainder);
        refund.setRefundDate(refundDate);
        refund.setCreatedAt(clock.instant());
        cardRefundRepository.save(refund);
        cardTransactionRepository.flush();

        for (Invoice invoice : affectedInvoices) {
            if (invoice.getStatus() == InvoiceStatus.ROLLED || invoice.getStatus() == InvoiceStatus.CLOSED) {
                if (cardTransactionRepository.sumOutstandingByInvoiceId(invoice.getId()).signum() == 0) {
                    invoice.setStatus(InvoiceStatus.PAID);
                }
            }
            eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
            publishNextInvoiceChange(invoice);
        }
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), original.getDate().getYear()));
        if (refundDate.getYear() != original.getDate().getYear()) {
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), refundDate.getYear()));
        }
    }

    // --- MÉTODOS AUXILIARES ---

    private Invoice getOrCreateInvoice(CreditCard card, int month, int year) {
        return invoiceRepository.findByCardIdAndMonthAndYear(card.getId(), month, year).orElseGet(() -> {
            Invoice newInvoice = new Invoice();
            newInvoice.setCard(card);
            newInvoice.setMonth(month);
            newInvoice.setYear(year);
            newInvoice.setStatus(InvoiceStatus.OPEN);
            CardCycle cycle;
            try {
                cycle = CardCycle.forCompetence(YearMonth.of(year, month), card.getClosingDay(), card.getDueDay());
            } catch (DateTimeException ex) {
                throw new BusinessRuleException("Fatura excede o calendário aceito.");
            }
            newInvoice.setClosingDate(cycle.closingDate());
            newInvoice.setDueDate(cycle.dueDate());
            return invoiceRepository.save(newInvoice);
        });
    }

    @Transactional
    public PaymentReceiptDTO payInvoice(UUID cardId, PayInvoiceDTO data, User user) {
        log.info("SERVICE: Processando regras de cartão para pagamento da fatura.");
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalTime operationTime = DateUtil.getTimeOrDefault(data.time(), now.toLocalTime());

        if (!validMoney(data.amount(), false)) {
            throw new BusinessRuleException("Pagamento deve ser positivo e expresso em centavos.");
        }
        // Serialize only the same intent, including accidental cross-card reuse of its key.
        if(data.operationId()!=null) entityManager.createNativeQuery(
                "select 1 from pg_advisory_xact_lock(hashtextextended(cast(?1 as text), 0))")
                .setParameter(1,"invoice-payment:"+data.operationId()).getSingleResult();
        inventoryGuard.writer(user.getId());
        CreditCard card = cardRepository.findOwnedForPayment(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado"));

        String fingerprint=paymentFingerprint(cardId,data);
        if(data.operationId()!=null) {
            var previous=cardPaymentRepository.findByOperationId(data.operationId());
            if(previous.isPresent()) {
                CardPayment receipt=previous.get();
                if(!fingerprint.equals(receipt.getRequestFingerprint()))
                    throw new com.controlefinanceiro.api.service.exception.OperationConflictException("Identificação de pagamento já utilizada com outro conteúdo ou conteúdo histórico desconhecido.");
                return new PaymentReceiptDTO(receipt);
            }
        }

        Invoice invoice = getOrCreateInvoice(card, data.month(), data.year());
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Esta fatura já está paga.");
        }

        boolean prepayment = Boolean.TRUE.equals(data.isPrepayment());
        if (data.operationId() == null && cardPaymentRepository
                .existsByInvoiceIdAndAccountIdAndPaymentDateAndAmountAndPrepaymentAndOperationIdIsNull(
                        invoice.getId(), data.accountId(), data.date(), data.amount(), prepayment)) {
            throw new BusinessRuleException("Pagamento já registrado. Use um identificador de operação para outro pagamento igual.");
        }
        boolean includeRolled = includeRolled(invoice);
        if (cardTransactionRepository.countLegacyAdjustmentsUpTo(
                cardId, data.month(), data.year(), includeRolled) > 0) {
            throw new BusinessRuleException("Fatura legada com ajustes sem conciliação; pagamento bloqueado.");
        }

        List<CardTransaction> outstanding = cardTransactionRepository.findOutstandingUpTo(
                cardId, data.month(), data.year(), includeRolled);
        BigDecimal payable = outstanding.stream()
                .map(tx -> tx.getAmount().subtract(tx.getPaidAmount()).subtract(tx.getRefundedAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (data.amount().compareTo(payable) > 0) {
            throw new BusinessRuleException("O pagamento excede o saldo devido de " + payable + ".");
        }

        CardPayment payment = new CardPayment();
        payment.setInvoice(invoice);
        payment.setAccountId(data.accountId());
        payment.setOperationId(data.operationId());
        payment.setRequestFingerprint(fingerprint);
        payment.setPrepayment(prepayment);
        payment.setAmount(data.amount());
        payment.setPaymentDate(data.date());
        payment.setCreatedAt(now.toInstant());
        cardPaymentRepository.save(payment);
        eventPublisher.publishEvent(new InvoicePaymentRequestedEvent(
                data.accountId(), data.amount(), data.date(), operationTime, data.description(), card, user,
                DateUtil.optionalWallTime(data.time()), now.toInstant(), payment));

        BigDecimal remaining = data.amount();
        Set<Invoice> affected = new HashSet<>();
        for (CardTransaction tx : outstanding) {
            if (remaining.signum() == 0) break;
            BigDecimal allocated = tx.getAmount().subtract(tx.getPaidAmount())
                    .subtract(tx.getRefundedAmount()).min(remaining);
            tx.setPaidAmount(tx.getPaidAmount().add(allocated));
            CardPaymentAllocation allocation = new CardPaymentAllocation();
            allocation.setPaymentId(payment.getId());
            allocation.setCardTransactionId(tx.getId());
            allocation.setAmount(allocated);
            cardPaymentAllocationRepository.save(allocation);
            affected.add(tx.getInvoice());
            remaining = remaining.subtract(allocated);
        }
        cardTransactionRepository.flush();

        for (Invoice source : affected) {
            if (!source.getId().equals(invoice.getId())
                    && cardTransactionRepository.sumOutstandingByInvoiceId(source.getId()).signum() == 0
                    && source.getStatus() == InvoiceStatus.ROLLED) {
                source.setStatus(InvoiceStatus.PAID);
                planItemRepository.markAsPaidByCardAndMonth(cardId, source.getMonth(), source.getYear());
                eventPublisher.publishEvent(new InvoiceChangedEvent(source));
            }
        }

        BigDecimal currentRemaining = cardTransactionRepository.sumOutstandingUpTo(
                cardId, invoice.getMonth(), invoice.getYear(), includeRolled);
        if (!prepayment) {
            invoice.setStatus(currentRemaining.signum() == 0 ? InvoiceStatus.PAID : InvoiceStatus.ROLLED);
            if (invoice.getStatus() == InvoiceStatus.PAID) {
                planItemRepository.markAsPaidByCardAndMonth(cardId, invoice.getMonth(), invoice.getYear());
            } else {
                YearMonth next = YearMonth.of(invoice.getYear(), invoice.getMonth()).plusMonths(1);
                getOrCreateInvoice(card, next.getMonthValue(), next.getYear());
            }
        } else if (invoice.getStatus() == InvoiceStatus.CLOSED && currentRemaining.signum() == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            planItemRepository.markAsPaidByCardAndMonth(cardId, invoice.getMonth(), invoice.getYear());
        }
        invoiceRepository.save(invoice);
        eventPublisher.publishEvent(new InvoiceChangedEvent(invoice));
        publishNextInvoiceChange(invoice);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), data.date().getYear()));
        return new PaymentReceiptDTO(payment);
    }

    @Transactional(readOnly=true)
    public PaymentReceiptDTO paymentReceipt(UUID cardId,UUID operationId,User user) {
        return cardPaymentRepository.findByOperationIdAndInvoiceCardIdAndInvoiceCardUserId(operationId,cardId,user.getId())
                .map(PaymentReceiptDTO::new).orElseThrow(()->new ResourceNotFoundException("Pagamento ainda não localizado."));
    }

    private static String paymentFingerprint(UUID cardId,PayInvoiceDTO data) {
        // Length-prefixed fields distinguish nulls and delimiter characters in descriptions.
        StringBuilder canonical=new StringBuilder();
        for(Object field:Arrays.asList(cardId,data.accountId(),data.amount().stripTrailingZeros().toPlainString(),
                data.date(),DateUtil.optionalWallTime(data.time()),data.month(),data.year(),data.isPrepayment(),data.description())) {
            if(field==null)canonical.append("-:");
            else {String value=field.toString();canonical.append(value.length()).append(':').append(value);}
        }
        try{return HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(canonical.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException impossible){throw new IllegalStateException(impossible);}
    }

    private void publishNextInvoiceChange(Invoice invoice) {
        YearMonth competence = YearMonth.of(invoice.getYear(), invoice.getMonth());
        if (competence.equals(YearMonth.of(9999, 12))) return;
        YearMonth next = competence.plusMonths(1);
        invoiceRepository.findByCardIdAndMonthAndYear(invoice.getCard().getId(), next.getMonthValue(), next.getYear())
                .ifPresent(found -> eventPublisher.publishEvent(new InvoiceChangedEvent(found)));
    }

    @Transactional
    public void reorder(List<UUID> orderedIds, User user) {
        inventoryGuard.writer(user.getId());
        ownedOrder.reorder(orderedIds, CreditCard.class, "r.user.id", user.getId(), null, null,
                "Cartão não encontrado", CreditCard::getId, CreditCard::setOrderIndex);
    }
}
