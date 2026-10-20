package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.CreateCardTransactionDTO;
import com.controlefinanceiro.api.domain.card.dto.PayInvoiceDTO;
import com.controlefinanceiro.api.domain.card.dto.CardOpeningPosition;
import com.controlefinanceiro.api.domain.card.dto.UpdateCardTransactionDTO;
import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.*;

import static org.mockito.Mockito.*;
import static org.mockito.AdditionalAnswers.delegatesTo;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class Cf019CardIntegrationTest extends PostgresIntegrationTest {
    @Autowired CreditCardService service;
    @Autowired UserRepository users;
    @Autowired CreditCardRepository cards;
    @Autowired CategoryRepository categories;
    @Autowired JdbcTemplate sql;
    @Autowired AccountRepository accounts;
    @Autowired InvoiceRepository invoices;
    @Autowired TransactionRepository bankTransactions;
    @Autowired CardTransactionRepository cardTransactions;
    @Autowired TransactionTemplate transactionTemplate;
    @Autowired FinancialInventoryGuard inventoryGuard;

    @Test
    void finalInstallmentGetsTheRemainderAndEachInstallmentHasOneSuccessiveCompetence() {
        Fixture fixture = fixture(20, 28);
        service.createTransaction(purchase(fixture, "100.00", LocalDate.of(2026, 9, 19), 3), fixture.owner());

        List<Installment> rows = installments(fixture.card().getId());
        assertThat(rows).containsExactly(
                new Installment(1, new BigDecimal("33.33"), 9, 2026),
                new Installment(2, new BigDecimal("33.33"), 10, 2026),
                new Installment(3, new BigDecimal("33.34"), 11, 2026));
        assertThat(rows.stream().map(Installment::amount).reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("100.00");
    }

    @Test
    void purchaseOnEffectiveClosingDayMovesToNextCycleAcrossLeapFebruary() {
        Fixture fixture = fixture(31, 10);
        service.createTransaction(purchase(fixture, "1.00", LocalDate.of(2024, 2, 28), 1), fixture.owner());
        service.createTransaction(purchase(fixture, "2.00", LocalDate.of(2024, 2, 29), 1), fixture.owner());
        service.createTransaction(purchase(fixture, "3.00", LocalDate.of(2024, 3, 1), 1), fixture.owner());

        assertThat(sql.queryForList("""
                select ct.amount, i.month, i.year, i.closing_date, i.due_date
                from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? order by ct.amount
                """, fixture.card().getId()).stream().map(row -> new CycleRow(
                (BigDecimal) row.get("amount"), (Integer) row.get("month"),
                (Integer) row.get("year"), ((java.sql.Date) row.get("closing_date")).toLocalDate(),
                ((java.sql.Date) row.get("due_date")).toLocalDate())))
                .containsExactly(
                        new CycleRow(new BigDecimal("1.00"), 2, 2024,
                                LocalDate.of(2024, 2, 29), LocalDate.of(2024, 3, 10)),
                        new CycleRow(new BigDecimal("2.00"), 3, 2024,
                                LocalDate.of(2024, 3, 31), LocalDate.of(2024, 4, 10)),
                        new CycleRow(new BigDecimal("3.00"), 3, 2024,
                                LocalDate.of(2024, 3, 31), LocalDate.of(2024, 4, 10)));
    }

    @Test
    void nominalDay31ClampsInShortMonthWithoutDriftingTheFollowingInstallment() {
        Fixture fixture = fixture(20, 31);
        service.createTransaction(purchase(fixture, "0.03", LocalDate.of(2027, 1, 19), 3), fixture.owner());

        assertThat(sql.queryForList("""
                select ct.amount, i.month, i.year, i.closing_date, i.due_date
                from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? order by ct.installment
                """, fixture.card().getId()).stream().map(row -> new CycleRow(
                (BigDecimal) row.get("amount"), (Integer) row.get("month"),
                (Integer) row.get("year"), ((java.sql.Date) row.get("closing_date")).toLocalDate(),
                ((java.sql.Date) row.get("due_date")).toLocalDate())))
                .containsExactly(
                        new CycleRow(new BigDecimal("0.01"), 1, 2027,
                                LocalDate.of(2027, 1, 20), LocalDate.of(2027, 1, 31)),
                        new CycleRow(new BigDecimal("0.01"), 2, 2027,
                                LocalDate.of(2027, 2, 20), LocalDate.of(2027, 2, 28)),
                        new CycleRow(new BigDecimal("0.01"), 3, 2027,
                                LocalDate.of(2027, 3, 20), LocalDate.of(2027, 3, 31)));
        assertThatThrownBy(() -> service.createTransaction(
                purchase(fixture, "0.01", LocalDate.of(2027, 1, 19), 2), fixture.owner()))
                .hasMessageContaining("cobrir todas as parcelas");
        assertThatThrownBy(() -> service.createTransaction(
                purchase(fixture, "1.005", LocalDate.of(2027, 1, 19), 1), fixture.owner()))
                .hasMessageContaining("centavos");
        assertThatThrownBy(() -> service.createTransaction(
                purchase(fixture, "1000000000000.00", LocalDate.of(2027, 1, 19), 1), fixture.owner()))
                .hasMessageContaining("centavos");
    }

    @Test
    void legacyPaidInvoiceDoesNotBecomeOutstandingDebtAndUnknownClosingIsNotInvented() {
        Fixture fixture = fixture(20, 28);
        service.createTransaction(purchase(fixture, "70.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        Invoice invoice = invoices.findByCardIdAndMonthAndYear(fixture.card().getId(), 9, 2026).orElseThrow();
        sql.update("update card_transactions set origin='LEGACY_UNKNOWN' where invoice_id=?", invoice.getId());
        sql.update("update invoices set status='PAID', closing_date=null, due_date=null where id=?", invoice.getId());

        assertThat(service.listAllWithSummary(fixture.owner()).getFirst().committedLimit())
                .isEqualByComparingTo("0.00");
        assertThat(service.getInvoiceDetails(fixture.card().getId(), 9, 2026, fixture.owner()).payableAmount())
                .isEqualByComparingTo("0.00");
        assertThat(service.getInvoiceDetails(fixture.card().getId(), 9, 2026, fixture.owner())
                .transactions().getFirst().remainingAmount()).isNull();
        assertThat(sql.queryForObject("select paid_amount from card_transactions where invoice_id=?",
                BigDecimal.class, invoice.getId())).isEqualByComparingTo("0.00");
    }

    @Test
    void purchaseAndCategoryMutationRejectOtherOwnerWithoutChangingDebt() {
        Fixture owner = fixture(20, 28);
        Fixture other = fixture(20, 28);
        UUID purchase = service.createTransaction(
                purchase(owner, "25.00", LocalDate.of(2026, 9, 19), 1), owner.owner());

        assertThatThrownBy(() -> service.createTransaction(
                new CreateCardTransactionDTO("Outra categoria", new BigDecimal("10.00"),
                        LocalDate.of(2026, 9, 19), "12:00", other.category().getId(),
                        owner.card().getId(), 1), owner.owner()))
                .hasMessageContaining("Categoria não encontrada");
        assertThatThrownBy(() -> service.updateTransaction(purchase,
                new UpdateCardTransactionDTO(null, other.category().getId()), owner.owner()))
                .hasMessageContaining("Categoria não encontrada");
        Account foreignAccount = account(other.owner());
        assertThatThrownBy(() -> service.payInvoice(owner.card().getId(),
                payment(foreignAccount, "10.00", false), owner.owner()))
                .hasMessageContaining("Conta de origem não encontrada");
        assertThatThrownBy(() -> service.payInvoice(owner.card().getId(),
                payment(foreignAccount, "10.00", false), other.owner()))
                .hasMessageContaining("Cartão não encontrado");
        assertThat(outstanding(owner.card().getId())).isEqualByComparingTo("25.00");
        assertThat(sql.queryForObject("select category_id from card_transactions where id=?",
                UUID.class, purchase)).isEqualTo(owner.category().getId());
    }

    @Test
    void partialThenFullPaymentSettlesTheSameDebtOnceWithoutCreatingExpense() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.createTransaction(purchase(fixture, "200.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        Invoice invoice = invoices.findByCardIdAndMonthAndYear(fixture.card().getId(), 9, 2026).orElseThrow();

        PayInvoiceDTO partial = payment(account, "80.00", false);
        service.payInvoice(fixture.card().getId(), partial, fixture.owner());
        assertThat(sql.queryForObject("select status from invoices where id=?", String.class, invoice.getId()))
                .isEqualTo("ROLLED");
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("120.00");
        assertThat(sql.queryForObject("select count(*) from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=?",
                Integer.class, fixture.card().getId())).isOne();
        assertThat(plannedAmount(fixture, 10)).isEqualByComparingTo("120.00");
        assertThatThrownBy(() -> service.payInvoice(fixture.card().getId(), partial, fixture.owner()))
                .hasMessageContaining("registrado");

        service.payInvoice(fixture.card().getId(), payment(account, "120.00", false), fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("0.00");
        assertThat(plannedAmount(fixture, 10)).isEqualByComparingTo("0.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("800.00");
        assertThat(bankTransactions.sumByTypeAndYear(fixture.owner().getId(), TransactionType.EXPENSE, 2026))
                .isEqualByComparingTo("0.00");
    }

    @Test
    void prepaymentAndFinalPaymentDoNotCreateNegativeCardPurchases() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.createTransaction(purchase(fixture, "200.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        service.payInvoice(fixture.card().getId(), payment(account, "50.00", true), fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("150.00");
        assertThat(sql.queryForObject("select count(*) from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=? and ct.amount<0",
                Integer.class, fixture.card().getId())).isZero();
        service.payInvoice(fixture.card().getId(), payment(account, "150.00", false), fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("0.00");
    }

    @Test
    void refundReducesUnpaidPrincipalThenCreatesCardCreditForThePaidPart() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        UUID transactionId = service.createTransaction(
                purchase(fixture, "120.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        service.payInvoice(fixture.card().getId(), payment(account, "100.00", false), fixture.owner());

        service.deleteTransaction(transactionId, fixture.owner());

        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("0.00");
        assertThat(cards.findById(fixture.card().getId()).orElseThrow().getCreditBalance())
                .isEqualByComparingTo("100.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance())
                .isEqualByComparingTo("900.00");
        assertThat(sql.queryForObject("select count(*) from card_refunds where card_id=?",
                Integer.class, fixture.card().getId())).isOne();
        assertThatThrownBy(() -> service.deleteTransaction(transactionId, fixture.owner()))
                .hasMessageContaining("não exceder");

        service.createTransaction(purchase(fixture, "60.00", LocalDate.of(2026, 10, 19), 1), fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("0.00");
        assertThat(cards.findById(fixture.card().getId()).orElseThrow().getCreditBalance())
                .isEqualByComparingTo("40.00");
    }

    @Test
    void partialRefundOfInstallmentsReducesLastOutstandingPrincipalFirst() {
        Fixture fixture = fixture(20, 28);
        UUID transactionId = service.createTransaction(
                purchase(fixture, "90.00", LocalDate.of(2026, 9, 19), 3), fixture.owner());

        service.refundPurchase(transactionId, new BigDecimal("40.00"),
                LocalDate.of(2026, 9, 28), UUID.randomUUID(), fixture.owner());

        assertThat(sql.queryForList("""
                select ct.refunded_amount from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? order by ct.installment
                """, BigDecimal.class, fixture.card().getId()))
                .containsExactly(new BigDecimal("0.00"), new BigDecimal("10.00"), new BigDecimal("30.00"));
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("50.00");
        assertThat(service.listAllWithSummary(fixture.owner()).getFirst().availableLimit())
                .isEqualByComparingTo("950.00");
        assertThat(cards.findById(fixture.card().getId()).orElseThrow().getCreditBalance())
                .isEqualByComparingTo("0.00");
    }

    @Test
    void openingDebtCountsCurrentInstallmentOnceAndNeverCreatesPaidHistory() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.recordOpeningPosition(new CardOpeningPosition(
                fixture.card().getId(), LocalDate.of(2026, 9, 7), YearMonth.of(2026, 9),
                new BigDecimal("200.00"), List.of(
                        new CardOpeningPosition.FutureInstallment(YearMonth.of(2026, 10), new BigDecimal("50.00"), "Futura 1"),
                        new CardOpeningPosition.FutureInstallment(YearMonth.of(2026, 11), new BigDecimal("50.00"), "Futura 2"),
                        new CardOpeningPosition.FutureInstallment(YearMonth.of(2026, 12), new BigDecimal("50.00"), "Futura 3"))), fixture.owner());

        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("350.00");
        assertThat(sql.queryForObject("""
                select count(*) from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? and ct.origin='OPENING' and ct.paid_amount=0 and ct.installment is null
                """, Integer.class, fixture.card().getId())).isEqualTo(4);
        assertThat(sql.queryForObject("select count(*) from card_opening_batches where card_id=?",
                Integer.class, fixture.card().getId())).isOne();
        assertThat(service.listAllWithSummary(fixture.owner()).getFirst().availableLimit())
                .isEqualByComparingTo("650.00");
        assertThatThrownBy(() -> service.recordOpeningPosition(new CardOpeningPosition(
                fixture.card().getId(), LocalDate.of(2026, 9, 7), YearMonth.of(2026, 9),
                new BigDecimal("200.00"), List.of()), fixture.owner()))
                .hasMessageContaining("já registrada");

        service.payInvoice(fixture.card().getId(), payment(account, "200.00", false), fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("150.00");
        assertThat(service.listAllWithSummary(fixture.owner()).getFirst().availableLimit())
                .isEqualByComparingTo("850.00");
        assertThat(bankTransactions.sumByTypeAndYear(fixture.owner().getId(), TransactionType.EXPENSE, 2026))
                .isEqualByComparingTo("0.00");
    }

    @Test
    void nextInvoiceIncludesRolledBalanceOnlyAfterThePreviousOneWasRolled() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.createTransaction(purchase(fixture, "200.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        service.createTransaction(purchase(fixture, "50.00", LocalDate.of(2026, 10, 19), 1), fixture.owner());
        assertThat(plannedAmount(fixture, 10)).isEqualByComparingTo("50.00");

        service.payInvoice(fixture.card().getId(), payment(account, "80.00", false), fixture.owner());
        assertThat(plannedAmount(fixture, 10)).isEqualByComparingTo("170.00");
        var details = service.getInvoiceDetails(fixture.card().getId(), 10, 2026, fixture.owner());
        assertThat(details.totalAmount()).isEqualByComparingTo("50.00");
        assertThat(details.carriedAmount()).isEqualByComparingTo("120.00");
        assertThat(details.payableAmount()).isEqualByComparingTo("170.00");

        PayInvoiceDTO settleOctober = new PayInvoiceDTO(account.getId(), new BigDecimal("170.00"),
                LocalDate.of(2026, 10, 28), "10:00", 10, 2026, "CF019 outubro", false);
        service.payInvoice(fixture.card().getId(), settleOctober, fixture.owner());
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("0.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("750.00");
    }

    @Test
    void paymentRollsBackDebitAndAllocationsWhenTheLastWriteFails() {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.createTransaction(purchase(fixture, "100.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        String cardId = fixture.card().getId().toString();
        sql.execute("""
                create function cf019_reject_allocation() returns trigger language plpgsql as $$
                begin
                  if exists (select 1 from card_transactions ct join invoices i on i.id=ct.invoice_id
                             where ct.id=new.card_transaction_id and i.card_id='%s'::uuid) then
                    raise exception 'CF019 synthetic allocation failure';
                  end if;
                  return new;
                end; $$
                """.formatted(cardId));
        sql.execute("create trigger cf019_fail_alloc before insert on card_payment_allocations "
                + "for each row execute function cf019_reject_allocation()");
        try {
            assertThatThrownBy(() -> service.payInvoice(fixture.card().getId(),
                    payment(account, "100.00", false), fixture.owner()))
                    .hasMessageContaining("CF019 synthetic allocation failure");
            assertThat(accounts.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("100.00");
            assertThat(sql.queryForObject("select count(*) from card_payments cp join invoices i on i.id=cp.invoice_id where i.card_id=?",
                    Integer.class, fixture.card().getId())).isZero();
            assertThat(sql.queryForObject("select count(*) from transactions where account_id=?",
                    Integer.class, account.getId())).isZero();
        } finally {
            sql.execute("drop trigger cf019_fail_alloc on card_payment_allocations");
            sql.execute("drop function cf019_reject_allocation()");
        }
    }

    @Test
    void simultaneousPartialRetryWithTheSameOperationIdDebitsOnce() throws Exception {
        Fixture fixture = fixture(20, 28);
        Account account = account(fixture.owner());
        service.createTransaction(purchase(fixture, "200.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        PayInvoiceDTO request = new PayInvoiceDTO(account.getId(), new BigDecimal("100.00"),
                LocalDate.of(2026, 9, 28), "10:00", 9, 2026, "retry", false, UUID.randomUUID());
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Callable<String> call = () -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("start gate");
                try {
                    service.payInvoice(fixture.card().getId(), request, fixture.owner());
                    return "confirmed";
                } catch (com.controlefinanceiro.api.service.exception.BusinessRuleException rejected) {
                    return rejected.getMessage();
                }
            };
            Future<String> first = executor.submit(call);
            Future<String> second = executor.submit(call);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
                    .containsExactly("confirmed", "confirmed");
        }
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance())
                .isEqualByComparingTo("900.00");
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("100.00");
    }

    @Test
    void closingCronRetriesAfterRollbackAndNeverClosesOrNotifiesTwice() {
        Fixture fixture = fixture(20, 28);
        service.createTransaction(purchase(fixture, "100.00", LocalDate.of(2026, 9, 19), 1), fixture.owner());
        Invoice invoice = invoices.findByStatusWithCardAndUser(InvoiceStatus.OPEN).stream()
                .filter(candidate -> candidate.getCard().getId().equals(fixture.card().getId()))
                .findFirst().orElseThrow();
        InvoiceRepository limited = mock(InvoiceRepository.class, delegatesTo(invoices));
        doReturn(List.of(invoice)).when(limited).findByStatusWithCardAndUser(InvoiceStatus.OPEN);
        InvoiceCronService cron = new InvoiceCronService();
        ReflectionTestUtils.setField(cron, "invoiceRepository", limited);
        ReflectionTestUtils.setField(cron, "cardRepository", cards);
        ReflectionTestUtils.setField(cron, "transactionRepository", cardTransactions);
        ReflectionTestUtils.setField(cron, "transactionTemplate", transactionTemplate);
        ReflectionTestUtils.setField(cron, "inventoryGuard", inventoryGuard);
        ReflectionTestUtils.setField(cron, "emailService", emailService);
        ReflectionTestUtils.setField(cron, "clock", Clock.fixed(
                Instant.parse("2026-09-20T03:05:00Z"), ZoneId.of("America/Sao_Paulo")));

        sql.execute("""
                create function cf019_reject_close() returns trigger language plpgsql as $$
                begin
                  if new.id='%s'::uuid and new.status='CLOSED' then
                    raise exception 'CF019 synthetic close failure';
                  end if;
                  return new;
                end; $$
                """.formatted(invoice.getId()));
        sql.execute("create trigger cf019_fail_close before update on invoices "
                + "for each row execute function cf019_reject_close()");
        try {
            cron.processInvoiceClosing();
            assertThat(invoices.findById(invoice.getId()).orElseThrow().getStatus()).isEqualTo(InvoiceStatus.OPEN);
            verify(emailService, never()).sendTemplatedEmail(any(), any(), any(), any());
        } finally {
            sql.execute("drop trigger cf019_fail_close on invoices");
            sql.execute("drop function cf019_reject_close()");
        }
        cron.processInvoiceClosing();
        cron.processInvoiceClosing();
        assertThat(invoices.findById(invoice.getId()).orElseThrow().getStatus()).isEqualTo(InvoiceStatus.CLOSED);
        verify(emailService, times(1)).sendTemplatedEmail(any(), any(), any(), any());
        assertThat(sql.queryForObject("select count(*) from card_transactions where invoice_id=?",
                Integer.class, invoice.getId())).isOne();
    }

    @Test
    void differentIntentsAllowEqualPaymentsAndRetryValidatesTheWholeCommand() {
        Fixture fixture=fixture(20,28);Account account=account(fixture.owner());
        service.createTransaction(purchase(fixture,"300.00",LocalDate.of(2026,9,19),1),fixture.owner());
        UUID firstKey=UUID.randomUUID();
        PayInvoiceDTO first=new PayInvoiceDTO(account.getId(),new BigDecimal("100.00"),LocalDate.of(2026,9,28),"10:00",9,2026,"Pagamento",true,firstKey);
        var receipt=service.payInvoice(fixture.card().getId(),first,fixture.owner());
        var second=service.payInvoice(fixture.card().getId(),new PayInvoiceDTO(first.accountId(),first.amount(),first.date(),first.time(),first.month(),first.year(),first.description(),first.isPrepayment(),UUID.randomUUID()),fixture.owner());
        assertThat(second.id()).isNotEqualTo(receipt.id());
        assertThat(service.payInvoice(fixture.card().getId(),first,fixture.owner()).id()).isEqualTo(receipt.id());
        assertThat(service.paymentReceipt(fixture.card().getId(),firstKey,fixture.owner()).id()).isEqualTo(receipt.id());
        for(PayInvoiceDTO changed:List.of(
                new PayInvoiceDTO(first.accountId(),new BigDecimal("99.00"),first.date(),first.time(),9,2026,"Pagamento",true,firstKey),
                new PayInvoiceDTO(first.accountId(),first.amount(),first.date(),"10:01",9,2026,"Pagamento",true,firstKey),
                new PayInvoiceDTO(first.accountId(),first.amount(),first.date(),first.time(),9,2026,"Outro motivo",true,firstKey),
                new PayInvoiceDTO(first.accountId(),first.amount(),first.date(),first.time(),9,2026,"Pagamento",false,firstKey))) {
            assertThatThrownBy(()->service.payInvoice(fixture.card().getId(),changed,fixture.owner()))
                    .isInstanceOf(com.controlefinanceiro.api.service.exception.OperationConflictException.class);
        }
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("800.00");
        assertThat(outstanding(fixture.card().getId())).isEqualByComparingTo("100.00");
        assertThat(sql.queryForObject("select count(*) from card_payments where account_id=?",Integer.class,account.getId())).isEqualTo(2);
        var other=fixture(20,28);
        assertThatThrownBy(()->service.paymentReceipt(fixture.card().getId(),firstKey,other.owner())).isInstanceOf(com.controlefinanceiro.api.service.exception.ResourceNotFoundException.class);
    }

    private BigDecimal plannedAmount(Fixture fixture, int month) {
        return sql.queryForObject("""
                select p.amount from plan_items p join monthly_plans m on m.id=p.plan_id
                where m.user_id=? and m.month=? and m.year=2026 and p.card_id=?
                """, BigDecimal.class, fixture.owner().getId(), month, fixture.card().getId());
    }

    private BigDecimal outstanding(UUID cardId) {
        return sql.queryForObject("""
                select coalesce(sum(ct.amount-ct.paid_amount-ct.refunded_amount),0)
                from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? and ct.amount>0
                """, BigDecimal.class, cardId);
    }

    private Account account(User owner) {
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta CF019");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("1000.00"));
        return accounts.save(account);
    }

    private PayInvoiceDTO payment(Account account, String amount, boolean prepayment) {
        return new PayInvoiceDTO(account.getId(), new BigDecimal(amount),
                LocalDate.of(2026, 9, 28), "10:00", 9, 2026, "CF019", prepayment);
    }

    private List<Installment> installments(UUID cardId) {
        return sql.query("""
                select ct.installment, ct.amount, i.month, i.year
                from card_transactions ct join invoices i on i.id=ct.invoice_id
                where i.card_id=? order by ct.installment
                """, (rs, row) -> new Installment(rs.getInt(1), rs.getBigDecimal(2),
                rs.getInt(3), rs.getInt(4)), cardId);
    }

    private CreateCardTransactionDTO purchase(Fixture fixture, String amount, LocalDate date, int installments) {
        return new CreateCardTransactionDTO("Compra sintética", new BigDecimal(amount), date,
                "12:00", fixture.category().getId(), fixture.card().getId(), installments);
    }

    private Fixture fixture(int closingDay, int dueDay) {
        User owner = new User();
        owner.setNome("CF019 sintético");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        CreditCard card = new CreditCard();
        card.setUser(owner);
        card.setName("Cartão sintético");
        card.setLimit(new BigDecimal("1000.00"));
        card.setClosingDay(closingDay);
        card.setDueDay(dueDay);
        card = cards.save(card);
        Category category = new Category();
        category.setUser(owner);
        category.setName("Compras CF019");
        category.setType(TransactionType.EXPENSE);
        category = categories.save(category);
        Category paymentCategory = new Category();
        paymentCategory.setUser(owner);
        paymentCategory.setName(DefaultCategory.PAGAMENTO_FATURA.getName());
        paymentCategory.setType(TransactionType.EXPENSE);
        categories.save(paymentCategory);
        return new Fixture(owner, card, category);
    }

    private record Fixture(User owner, CreditCard card, Category category) {}
    private record Installment(int number, BigDecimal amount, int month, int year) {}
    private record CycleRow(BigDecimal amount, int month, int year, LocalDate closing, LocalDate due) {}
}
