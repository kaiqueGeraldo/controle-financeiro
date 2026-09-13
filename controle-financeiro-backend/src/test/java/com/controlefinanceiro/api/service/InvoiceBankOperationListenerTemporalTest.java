package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.card.CreditCard;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.event.InvoicePaymentRequestedEvent;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.listener.InvoiceBankOperationListener;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InvoiceBankOperationListenerTemporalTest {

    @Test
    void internalOperationTimeKeepsSubsecondPrecisionWithoutStringRoundTrip() {
        AccountRepository accountRepository = mock(AccountRepository.class);
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        InvoiceBankOperationListener listener = new InvoiceBankOperationListener();

        User user = new User();
        user.setId(UUID.fromString("70000000-0000-0000-0000-000000000001"));

        Account account = new Account();
        account.setId(UUID.fromString("70000000-0000-0000-0000-000000000002"));
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("100.00"));
        account.setUser(user);

        CreditCard card = new CreditCard();
        card.setName("Cartão sintético");
        card.setUser(user);

        LocalDate operationDate = LocalDate.of(2026, 9, 7);
        LocalTime operationTime = LocalTime.of(23, 30, 45, 123_456_000);
        InvoicePaymentRequestedEvent event = new InvoicePaymentRequestedEvent(
                account.getId(),
                new BigDecimal("10.00"),
                operationDate,
                operationTime,
                null,
                card,
                user, null, java.time.Instant.parse("2026-09-08T03:10:00Z")
        );

        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));
        when(categoryRepository.findByUserIdAndName(any(), any())).thenReturn(Optional.empty());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ReflectionTestUtils.setField(listener, "accountRepository", accountRepository);
        ReflectionTestUtils.setField(listener, "transactionRepository", transactionRepository);
        ReflectionTestUtils.setField(listener, "categoryRepository", categoryRepository);

        listener.onInvoicePaymentRequested(event);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getDate()).isEqualTo(operationDate);
        assertThat(captor.getValue().getTime()).isNull();
        assertThat(captor.getValue().getTimeOrigin()).isEqualTo(com.controlefinanceiro.api.domain.temporal.TimeOrigin.NOT_PROVIDED);
        assertThat(captor.getValue().getRecordedAt()).isEqualTo(java.time.Instant.parse("2026-09-08T03:10:00Z"));
        assertThat(captor.getValue().getCreatedAt()).isEqualTo(
                LocalDateTime.of(operationDate, operationTime)
        );
    }
}
