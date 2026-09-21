package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.PayInvoiceDTO;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.service.CreditCardService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;

class CF015PaymentRecoveryTest extends PostgresIntegrationTest {
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired CreditCardRepository cards;
    @Autowired InvoiceRepository invoices;
    @Autowired CardTransactionRepository transactions;
    @Autowired CreditCardService service;
    @Autowired JdbcTemplate sql;
    @Autowired CategoryRepository categories;

    @Test void confirmedClosingCannotDebitAgainAfterLostResponse() {
        Fixture f = fixture();
        service.payInvoice(f.card.getId(), f.payment, f.user);
        assertThatThrownBy(() -> service.payInvoice(f.card.getId(), f.payment, f.user))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("paga");
        assertPersistedOnce(f);
    }

    @Test void simultaneousClosingDebitsOnce() throws Exception {
        Fixture f = fixture();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Callable<String> payment = () -> {
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new AssertionError("start gate");
                try { service.payInvoice(f.card.getId(), f.payment, f.user); return "confirmed"; }
                catch (BusinessRuleException rejected) { return rejected.getMessage(); }
            };
            Future<String> first = executor.submit(payment), second = executor.submit(payment);
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); start.countDown();
            assertThat(java.util.List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder("confirmed", "Esta fatura já está paga.");
        }
        assertPersistedOnce(f);
    }

    private void assertPersistedOnce(Fixture f) {
        assertThat(sql.queryForObject("select balance from accounts where id=?", BigDecimal.class, f.account.getId())).isEqualByComparingTo("900");
        assertThat(sql.queryForObject("select count(*) from transactions where account_id=?", Integer.class, f.account.getId())).isEqualTo(1);
        assertThat(sql.queryForObject("select status from invoices where id=?", String.class, f.invoice.getId())).isEqualTo("PAID");
    }
    private Fixture fixture() {
        User user = new User(); user.setNome("Sintético pagamento"); user.setEmail(UUID.randomUUID()+"@example.invalid"); user.setSenha("synthetic"); user = users.save(user);
        Account account = new Account(); account.setUser(user); account.setName("Sintética"); account.setType(AccountType.CHECKING); account.setBalance(new BigDecimal("1000")); account = accounts.save(account);
        CreditCard card = new CreditCard(); card.setUser(user); card.setName("Sintético"); card.setLimit(new BigDecimal("1000")); card.setClosingDay(20); card.setDueDay(28); card = cards.save(card);
        Invoice invoice = new Invoice(); invoice.setCard(card); invoice.setMonth(1); invoice.setYear(2027); invoice.setStatus(InvoiceStatus.CLOSED); invoice = invoices.save(invoice);
        Category category = new Category(); category.setUser(user); category.setName(DefaultCategory.PAGAMENTO_FATURA.getName()); category.setType(TransactionType.EXPENSE); category = categories.save(category);
        CardTransaction tx = new CardTransaction(); tx.setCategory(category); tx.setInvoice(invoice); tx.setDescription("Compra sintética"); tx.setAmount(new BigDecimal("100")); tx.setDate(LocalDate.of(2027,1,10)); tx.setCreatedAt(tx.getDate().atTime(12,0)); transactions.save(tx);
        PayInvoiceDTO payment = new PayInvoiceDTO(account.getId(), new BigDecimal("100"), LocalDate.of(2027,1,28), null, 1, 2027, "Pagamento sintético CF015", false);
        return new Fixture(user, account, card, invoice, payment);
    }
    private record Fixture(User user, Account account, CreditCard card, Invoice invoice, PayInvoiceDTO payment) {}
}
