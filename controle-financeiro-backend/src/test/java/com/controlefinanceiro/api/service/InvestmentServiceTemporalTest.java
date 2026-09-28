package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.investment.InvestTransactionRepository;
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.user.User;
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

class InvestmentServiceTemporalTest {

    @Test
    void explicitInvestmentDatePropagatesToGeneratedBankTransaction() {
        InvestmentRepository investmentRepository = mock(InvestmentRepository.class);
        InvestTransactionRepository investTransactionRepository = mock(InvestTransactionRepository.class);
        AccountRepository accountRepository = mock(AccountRepository.class);
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        InvestmentService service = new InvestmentService();

        User user = new User();
        user.setId(UUID.fromString("50000000-0000-0000-0000-000000000001"));
        Investment investment = new Investment();
        investment.setId(UUID.fromString("50000000-0000-0000-0000-000000000002"));
        investment.setTicker("TEST3");
        investment.setQuantity(BigDecimal.ZERO);
        investment.setAveragePrice(BigDecimal.ZERO);
        investment.setUser(user);
        Account account = new Account();
        account.setId(UUID.fromString("50000000-0000-0000-0000-000000000003"));
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("100.00"));
        account.setUser(user);

        investment.setTotalCost(BigDecimal.ZERO);
        when(investmentRepository.findOwnedForAllocation(investment.getId(), user.getId())).thenReturn(Optional.of(investment));
        when(accountRepository.findOwnedForAllocation(account.getId(), user.getId())).thenReturn(Optional.of(account));
        when(categoryRepository.findByUserIdAndName(any(), any())).thenReturn(Optional.empty());
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        injectDependencies(service, investmentRepository, investTransactionRepository, accountRepository,
                transactionRepository, categoryRepository);
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(
                Instant.parse("2026-09-08T12:15:00Z"), ZoneId.of("America/Sao_Paulo")));

        service.performOperation(new InvestmentOperationDTO(
                investment.getId(),
                InvestTransType.BUY,
                BigDecimal.ONE,
                new BigDecimal("10.00"),
                BigDecimal.ZERO,
                LocalDate.of(2026, 9, 7),
                account.getId()
        ), user);

        ArgumentCaptor<Transaction> captor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactionRepository).save(captor.capture());
        assertThat(captor.getValue().getDate()).isEqualTo(LocalDate.of(2026, 9, 7));
        assertThat(captor.getValue().getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 9, 7, 9, 15));
    }

    private static void injectDependencies(
            InvestmentService service,
            InvestmentRepository investmentRepository,
            InvestTransactionRepository investTransactionRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            CategoryRepository categoryRepository) {
        ReflectionTestUtils.setField(service, "investmentRepository", investmentRepository);
        ReflectionTestUtils.setField(service, "investTransactionRepository", investTransactionRepository);
        ReflectionTestUtils.setField(service, "accountRepository", accountRepository);
        ReflectionTestUtils.setField(service, "transactionRepository", transactionRepository);
        ReflectionTestUtils.setField(service, "goalRepository", mock(GoalRepository.class));
        var allocations = mock(com.controlefinanceiro.api.domain.goal.GoalAllocationRepository.class);
        when(allocations.sumByAccountId(any())).thenReturn(BigDecimal.ZERO);
        ReflectionTestUtils.setField(service, "allocationRepository", allocations);
        ReflectionTestUtils.setField(service, "eventPublisher", mock(ApplicationEventPublisher.class));
        ReflectionTestUtils.setField(service, "categoryRepository", categoryRepository);
    }
}
