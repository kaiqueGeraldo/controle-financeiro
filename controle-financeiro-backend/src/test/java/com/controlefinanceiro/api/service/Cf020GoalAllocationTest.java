package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalAllocationRepository;
import com.controlefinanceiro.api.domain.goal.GoalHistoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.goal.GoalType;
import com.controlefinanceiro.api.domain.goal.dto.GoalDepositDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class Cf020GoalAllocationTest {
    @Test
    void allocatingAccountMoneyDoesNotDebitTheAccountOrCreateExpense() {
        User user = new User();
        user.setId(UUID.randomUUID());
        Account account = new Account();
        account.setId(UUID.randomUUID());
        account.setType(AccountType.CHECKING);
        account.setName("Conta sintética");
        account.setBalance(new BigDecimal("1000.00"));
        account.setUser(user);
        Goal goal = new Goal();
        goal.setId(UUID.randomUUID());
        goal.setType(GoalType.MONETARY);
        goal.setTitle("Meta sintética");
        goal.setCurrentValue(BigDecimal.ZERO);
        goal.setUser(user);

        GoalRepository goals = mock(GoalRepository.class);
        AccountRepository accounts = mock(AccountRepository.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        TransactionRepository transactions = mock(TransactionRepository.class);
        GoalService service = new GoalService();
        org.springframework.test.util.ReflectionTestUtils.setField(service,"inventoryGuard",org.mockito.Mockito.mock(FinancialInventoryGuard.class));
        ReflectionTestUtils.setField(service, "repository", goals);
        ReflectionTestUtils.setField(service, "accountRepository", accounts);
        ReflectionTestUtils.setField(service, "categoryRepository", categories);
        ReflectionTestUtils.setField(service, "transactionRepository", transactions);
        ReflectionTestUtils.setField(service, "historyRepository", mock(GoalHistoryRepository.class));
        ReflectionTestUtils.setField(service, "eventPublisher", mock(ApplicationEventPublisher.class));
        ReflectionTestUtils.setField(service, "clock", Clock.fixed(Instant.parse("2026-09-28T12:00:00Z"), ZoneId.of("America/Sao_Paulo")));
        when(goals.findById(goal.getId())).thenReturn(Optional.of(goal));
        when(accounts.findOwnedForAllocation(account.getId(), user.getId())).thenReturn(Optional.of(account));
        GoalAllocationRepository allocations = mock(GoalAllocationRepository.class);
        ReflectionTestUtils.setField(service, "allocationRepository", allocations);
        when(allocations.sumByAccountId(account.getId())).thenReturn(BigDecimal.ZERO);
        when(categories.findByUserIdAndName(any(), any())).thenReturn(Optional.of(new Category()));

        service.addValue(goal.getId(), new GoalDepositDTO(account.getId(), new BigDecimal("300.00"), null, null, null), user);

        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(goal.getCurrentValue()).isEqualByComparingTo("300.00");
        org.mockito.Mockito.verifyNoInteractions(transactions);
    }
}
