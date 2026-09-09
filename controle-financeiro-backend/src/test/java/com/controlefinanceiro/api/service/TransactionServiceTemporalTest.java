package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransactionServiceTemporalTest {

    @Test
    void providedCivilDateAndWallTimeAreNotOverwrittenByServerClock() {
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        AccountRepository accountRepository = mock(AccountRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
        TransactionService service = new TransactionService();
        Clock clock = Clock.fixed(
                Instant.parse("2026-09-08T15:00:00Z"),
                ZoneId.of("America/Sao_Paulo")
        );

        User user = user();
        Account account = account(user);
        when(accountRepository.findById(account.getId())).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReflectionTestUtils.setField(service, "repository", transactionRepository);
        ReflectionTestUtils.setField(service, "accountRepository", accountRepository);
        ReflectionTestUtils.setField(service, "categoryRepository", categoryRepository);
        ReflectionTestUtils.setField(service, "eventPublisher", eventPublisher);
        ReflectionTestUtils.setField(service, "entityManager", mock(EntityManager.class));
        ReflectionTestUtils.setField(service, "clock", clock);

        service.create(new CreateTransactionDTO(
                "Operação informada",
                new BigDecimal("10.00"),
                LocalDate.of(2026, 9, 7),
                "23:30:45",
                TransactionType.INCOME,
                account.getId(),
                null,
                false
        ), user);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getDate()).isEqualTo(LocalDate.of(2026, 9, 7));
        assertThat(captor.getValue().getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 9, 7, 23, 30, 45));
    }

    private static User user() {
        User user = new User();
        user.setId(UUID.fromString("20000000-0000-0000-0000-000000000001"));
        user.setEmail("temporal@example.test");
        return user;
    }

    private static Account account(User user) {
        Account account = new Account();
        account.setId(UUID.fromString("20000000-0000-0000-0000-000000000002"));
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("100.00"));
        account.setUser(user);
        return account;
    }
}
