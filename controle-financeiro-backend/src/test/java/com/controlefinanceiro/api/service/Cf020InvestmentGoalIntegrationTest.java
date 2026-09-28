package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.goal.GoalAllocation;
import com.controlefinanceiro.api.domain.goal.GoalAllocationRepository;
import com.controlefinanceiro.api.domain.goal.GoalHistoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.goal.GoalType;
import com.controlefinanceiro.api.domain.goal.dto.CreateGoalDTO;
import com.controlefinanceiro.api.domain.goal.dto.CreateGoalItemDTO;
import com.controlefinanceiro.api.domain.goal.dto.GoalDepositDTO;
import com.controlefinanceiro.api.domain.goal.dto.PurchaseGoalItemDTO;
import com.controlefinanceiro.api.domain.goal.dto.SetGoalAllocationDTO;
import com.controlefinanceiro.api.domain.goal.dto.MoveGoalAllocationDTO;
import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.investment.InvestTransactionRepository;
import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.investment.dto.UpdateBalanceDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class Cf020InvestmentGoalIntegrationTest extends PostgresIntegrationTest {
    private static final LocalDate DAY = LocalDate.of(2026, 9, 7);

    @Autowired GoalService goals;
    @Autowired InvestmentService investments;
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired GoalRepository goalRepository;
    @Autowired GoalAllocationRepository allocations;
    @Autowired GoalHistoryRepository history;
    @Autowired InvestmentRepository investmentRepository;
    @Autowired InvestTransactionRepository operations;
    @Autowired TransactionRepository transactions;
    @Autowired CategoryRepository categories;
    @Autowired EntityManager em;
    @Autowired TransactionTemplate transactionTemplate;

    @Test
    void twoGoalsShareOneAccountWithoutCreatingWealthOrExpense() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID first = goal(owner, GoalType.MONETARY);
        UUID second = goal(owner, GoalType.MONETARY);

        goals.addValue(first, deposit(account, "300.00"), owner);
        goals.addValue(second, deposit(account, "700.00"), owner);
        assertThatThrownBy(() -> goals.addValue(first, deposit(account, "0.01"), owner))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("insuficiente");
        em.flush();
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
        assertThat(allocations.sumByAccountId(account.getId())).isEqualByComparingTo("1000.00");
        assertThat(transactions.sumByTypeAndYear(owner.getId(), TransactionType.EXPENSE, DAY.getYear()))
                .isEqualByComparingTo("0.00");

        UUID historyId = history.findByGoalIdOrderByDateDesc(first).getFirst().getId();
        goals.deleteHistory(historyId, null, owner);
        assertThatThrownBy(() -> goals.deleteHistory(historyId, null, owner))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(allocations.sumByAccountId(account.getId())).isEqualByComparingTo("700.00");
        goals.delete(second, null, owner);
        em.flush();
        assertThat(allocations.sumByAccountId(account.getId())).isEqualByComparingTo("0.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    void purchaseConsumesRealCashAndItsReservationButDeletingChecklistDoesNotRefund() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID goalId = goal(owner, GoalType.MONETARY);
        category(owner, DefaultCategory.METAS.getName(), TransactionType.EXPENSE);
        goals.addValue(goalId, deposit(account, "300.00"), owner);
        GoalAllocation allocation = allocations.findAllByGoalId(goalId).getFirst();
        UUID itemId = goals.addItem(goalId, new CreateGoalItemDTO("Item sintético", null, money("120.00")), owner).id();

        goals.purchaseItem(itemId, new PurchaseGoalItemDTO(money("120.00"), account.getId(), null, null, allocation.getId()), owner);
        em.flush();
        assertThat(account.getBalance()).isEqualByComparingTo("880.00");
        assertThat(allocation.getAmount()).isEqualByComparingTo("180.00");
        assertThat(goalRepository.findById(goalId).orElseThrow().getCurrentValue()).isEqualByComparingTo("180.00");
        assertThat(account.getBalance().subtract(allocations.sumByAccountId(account.getId())))
                .isEqualByComparingTo("700.00");

        goals.deleteItem(itemId, owner);
        goals.delete(goalId, null, owner);
        em.flush();
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("880.00");
        assertThat(transactions.sumByTypeAndYear(owner.getId(), TransactionType.EXPENSE, DAY.getYear()))
                .isEqualByComparingTo("120.00");
        var purchase = transactions.findAll().stream()
                .filter(t -> t.getUser().getId().equals(owner.getId()))
                .findFirst().orElseThrow();
        assertThat(purchase.getOrigin()).isEqualTo(TransactionOrigin.GOAL_PURCHASE);
        assertThat(purchase.getGoalItemId()).isEqualTo(itemId);
    }

    @Test
    void explicitChecklistRefundCreditsOnceAndDoesNotRecreateReservation() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID goalId = goal(owner, GoalType.MONETARY);
        category(owner, DefaultCategory.METAS.getName(), TransactionType.EXPENSE);
        goals.addValue(goalId, deposit(account, "300.00"), owner);
        GoalAllocation allocation = allocations.findAllByGoalId(goalId).getFirst();
        UUID itemId = goals.addItem(goalId, new CreateGoalItemDTO("Compra reembolsável", null, money("120.00")), owner).id();
        goals.purchaseItem(itemId, new PurchaseGoalItemDTO(money("120.00"), account.getId(), null, null, allocation.getId()), owner);

        goals.refundItem(itemId, owner);
        assertThatThrownBy(() -> goals.refundItem(itemId, owner))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("estornada");
        em.flush();
        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(allocation.getAmount()).isEqualByComparingTo("180.00");
        assertThat(transactions.sumByTypeAndYear(owner.getId(), TransactionType.EXPENSE, DAY.getYear()))
                .isEqualByComparingTo("0.00");
        assertThat(transactions.findAll().stream().filter(t -> t.getUser().getId().equals(owner.getId()))).hasSize(2);
    }

    @Test
    void costAndValuationRemainSeparateAcrossBuyPartialSaleAndDividend() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        category(owner, DefaultCategory.APORTE_INVESTIMENTO.getName(), TransactionType.EXPENSE);
        category(owner, DefaultCategory.RESGATE_INVESTIMENTO.getName(), TransactionType.INCOME);
        UUID assetId = investments.create(new CreateInvestmentDTO("SINT3", "Sintético", InvestType.STOCK, null), owner).id();
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalValue()).isNull();

        investments.performOperation(operation(assetId, account, InvestTransType.BUY, "10", "20.00", "2.00"), owner);
        assertThat(account.getBalance()).isEqualByComparingTo("798.00");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalCost()).isEqualByComparingTo("202.00");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalValue()).isNull();
        investments.updateBalance(new UpdateBalanceDTO(assetId, money("250.00")), owner);
        investments.performOperation(operation(assetId, account, InvestTransType.SELL, "4", "25.00", "1.00"), owner);
        em.flush();
        var asset = investmentRepository.findById(assetId).orElseThrow();
        assertThat(asset.getQuantity()).isEqualByComparingTo("6");
        assertThat(asset.getTotalCost()).isEqualByComparingTo("121.20");
        assertThat(asset.getTotalValue()).isEqualByComparingTo("150.00");
        assertThat(account.getBalance()).isEqualByComparingTo("897.00");
        assertThat(operations.findHistory(assetId).stream().filter(t -> t.getType() == InvestTransType.SELL).findFirst().orElseThrow()
                .getRealizedResult()).isEqualByComparingTo("18.20");

        investments.performOperation(operation(assetId, account, InvestTransType.DIVIDEND, "1", "10.00", "1.00"), owner);
        assertThat(account.getBalance()).isEqualByComparingTo("906.00");
        assertThat(asset.getTotalCost()).isEqualByComparingTo("121.20");
        assertThat(asset.getQuantity()).isEqualByComparingTo("6");
    }

    @Test
    void fixedIncomePartialRedemptionRemovesProportionalCostWithoutRecordingAllProceedsAsIncome() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        category(owner, DefaultCategory.RESGATE_INVESTIMENTO.getName(), TransactionType.INCOME);
        UUID assetId = investments.create(new CreateInvestmentDTO("CDB", "Renda fixa", InvestType.FIXED_INCOME,
                null, money("1000.00"), money("1000.00"), money("1100.00"), DAY, "USER_PROVIDED"), owner).id();

        investments.performOperation(operation(assetId, account, InvestTransType.SELL, "200", "1.10", "0.00"), owner);

        var position = investmentRepository.findById(assetId).orElseThrow();
        var redemption = operations.findHistory(assetId).getFirst();
        assertThat(account.getBalance()).isEqualByComparingTo("1220.00");
        assertThat(position.getQuantity()).isEqualByComparingTo("800.00");
        assertThat(position.getTotalCost()).isEqualByComparingTo("800.00");
        assertThat(position.getTotalValue()).isEqualByComparingTo("880.00");
        assertThat(redemption.getCostDelta()).isEqualByComparingTo("200.00");
        assertThat(redemption.getRealizedResult()).isEqualByComparingTo("20.00");
        assertThat(redemption.getBankTransaction().getOrigin()).isEqualTo(TransactionOrigin.INVESTMENT_SELL);
    }

    @Test
    void initialNumericProgressAndInvestmentAllocationHaveNoPastCashTransaction() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID numeric = goals.create(new CreateGoalDTO("Livros", money("10.00"), DAY.plusYears(2),
                null, null, null, GoalType.NUMERIC, false, money("3.00")), owner).id();
        assertThat(goalRepository.findById(numeric).orElseThrow().getCurrentValue()).isEqualByComparingTo("3.00");
        UUID monetary = goal(owner, GoalType.MONETARY);
        UUID assetId = investments.create(new CreateInvestmentDTO("FIX1", "Abertura", InvestType.FIXED_INCOME,
                null, money("10.00"), money("400.00"), money("500.00"), DAY, "USER_PROVIDED"), owner).id();
        goals.addValue(monetary, new GoalDepositDTO(null, money("200.00"), null, null, null, assetId), owner);
        assertThat(allocations.sumByInvestmentId(assetId)).isEqualByComparingTo("200.00");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalValue()).isEqualByComparingTo("500.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
        assertThat(transactions.findAll().stream().filter(t -> t.getUser().getId().equals(owner.getId()))).isEmpty();
    }

    @Test
    void sourceOwnershipAndUnknownValuationDenyAllocationWithoutMutatingAccounts() {
        User owner = owner();
        User intruder = owner();
        Account account = account(owner, "1000.00");
        UUID foreignGoal = goal(intruder, GoalType.MONETARY);
        assertThatThrownBy(() -> goals.addValue(foreignGoal, deposit(account, "1.00"), intruder))
                .isInstanceOf(ResourceNotFoundException.class);
        UUID ownGoal = goal(owner, GoalType.MONETARY);
        UUID assetId = investments.create(new CreateInvestmentDTO("UNKNOWN", "Sem cotação", InvestType.STOCK,
                null, money("10.00"), money("400.00"), null, null, null), owner).id();
        assertThatThrownBy(() -> goals.addValue(ownGoal,
                new GoalDepositDTO(null, money("1.00"), null, null, null, assetId), owner))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("indisponível");
        assertThat(allocations.sumByAccountId(account.getId())).isEqualByComparingTo("0.00");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    void fractionalPriceRoundsGrossOnceAndLastSaleRemovesResidualCost() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        category(owner, DefaultCategory.APORTE_INVESTIMENTO.getName(), TransactionType.EXPENSE);
        category(owner, DefaultCategory.RESGATE_INVESTIMENTO.getName(), TransactionType.INCOME);
        UUID assetId = investments.create(new CreateInvestmentDTO("ROUND", "Centavos", InvestType.STOCK, null), owner).id();
        investments.performOperation(operation(assetId, account, InvestTransType.BUY, "1", "1.005", "0.00"), owner);
        assertThat(account.getBalance()).isEqualByComparingTo("998.99");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalCost()).isEqualByComparingTo("1.01");
        assertThat(operations.findHistory(assetId).getFirst().getTotalValue()).isEqualByComparingTo("1.01");

        UUID thirds = investments.create(new CreateInvestmentDTO("THIRDS", "Terços", InvestType.STOCK,
                null, new BigDecimal("3"), money("1.00"), money("3.00"), DAY, "USER_PROVIDED"), owner).id();
        for (int n = 0; n < 3; n++) {
            investments.performOperation(operation(thirds, account, InvestTransType.SELL, "1", "1.00", "0.00"), owner);
        }
        assertThat(operations.findHistory(thirds).stream().filter(t -> t.getType() == InvestTransType.SELL)
                .map(t -> t.getCostDelta())).containsExactlyInAnyOrder(money("0.33"), money("0.34"), money("0.33"));
        assertThat(investmentRepository.findById(thirds).orElseThrow().getTotalCost()).isEqualByComparingTo("0.00");
        assertThat(investmentRepository.findById(thirds).orElseThrow().getQuantity()).isEqualByComparingTo("0.00");
        assertThat(transactions.findAll().stream().filter(t -> t.getOrigin() == TransactionOrigin.INVESTMENT_BUY))
                .hasSize(1);
    }

    @Test
    void valuationDropKeepsReservationButPreventsAdditionalAllocation() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID goalId = goal(owner, GoalType.MONETARY);
        UUID assetId = investments.create(new CreateInvestmentDTO("DROP", "Queda", InvestType.STOCK,
                null, money("10.00"), money("400.00"), money("500.00"), DAY, "USER_PROVIDED"), owner).id();
        goals.addValue(goalId, new GoalDepositDTO(null, money("200.00"), null, null, null, assetId), owner);

        investments.updateBalance(new UpdateBalanceDTO(assetId, money("150.00")), owner);
        assertThat(allocations.sumByInvestmentId(assetId)).isEqualByComparingTo("200.00");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalValue()).isEqualByComparingTo("150.00");
        assertThatThrownBy(() -> goals.addValue(goalId,
                new GoalDepositDTO(null, money("0.01"), null, null, null, assetId), owner))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("insuficiente");
        assertThatThrownBy(() -> investments.performOperation(
                operation(assetId, account, InvestTransType.SELL, "1", "15.00", "0.00"), owner))
                .isInstanceOf(BusinessRuleException.class).hasMessageContaining("destinação");
        assertThat(accounts.findById(account.getId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
    }

    @Test
    void partialReleaseAndAtomicMoveChangeSourcesWithoutMovingMoney() {
        User owner = owner();
        Account account = account(owner, "1000.00");
        UUID goalId = goal(owner, GoalType.MONETARY);
        UUID assetId = investments.create(new CreateInvestmentDTO("MOVE", "Fonte dois", InvestType.FIXED_INCOME,
                null, money("10.00"), money("400.00"), money("500.00"), DAY, "USER_PROVIDED"), owner).id();
        goals.addValue(goalId, deposit(account, "300.00"), owner);
        UUID sourceId = allocations.findAllByGoalId(goalId).getFirst().getId();

        goals.setAllocation(goalId, new SetGoalAllocationDTO(account.getId(), null, money("200.00")), owner);
        assertThat(goals.listAllocations(goalId, owner).getFirst().sourceFree()).isEqualByComparingTo("800.00");
        goals.moveAllocation(goalId, new MoveGoalAllocationDTO(sourceId, null, assetId, money("50.00")), owner);
        em.flush();
        assertThat(allocations.sumByAccountId(account.getId())).isEqualByComparingTo("150.00");
        assertThat(allocations.sumByInvestmentId(assetId)).isEqualByComparingTo("50.00");
        assertThat(goalRepository.findById(goalId).orElseThrow().getCurrentValue()).isEqualByComparingTo("200.00");
        assertThat(account.getBalance()).isEqualByComparingTo("1000.00");
        assertThat(investmentRepository.findById(assetId).orElseThrow().getTotalValue()).isEqualByComparingTo("500.00");

        investments.updateBalance(new UpdateBalanceDTO(assetId, money("20.00")), owner);
        var assetAllocation = goals.listAllocations(goalId, owner).stream()
                .filter(a -> assetId.equals(a.investmentId())).findFirst().orElseThrow();
        assertThat(assetAllocation.sourceDeficit()).isEqualByComparingTo("30.00");
        assertThat(assetAllocation.sourceFree()).isEqualByComparingTo("0.00");
        assertThat(transactions.findAll().stream().filter(t -> t.getUser().getId().equals(owner.getId()))).isEmpty();
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void simultaneousGoalsCannotBothReserveTheSameAccountCapacity() throws Exception {
        record Fixture(User owner, UUID accountId, UUID firstGoal, UUID secondGoal) {}
        Fixture fixture = transactionTemplate.execute(status -> {
            User owner = owner();
            Account account = account(owner, "1000.00");
            return new Fixture(owner, account.getId(), goal(owner, GoalType.MONETARY), goal(owner, GoalType.MONETARY));
        });
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> reserveAfterGate(fixture.owner(), fixture.accountId(), fixture.firstGoal(), ready, start));
            var second = executor.submit(() -> reserveAfterGate(fixture.owner(), fixture.accountId(), fixture.secondGoal(), ready, start));
            assertThat(ready.await(15, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        }
        assertThat(allocations.sumByAccountId(fixture.accountId())).isEqualByComparingTo("600.00");
        assertThat(accounts.findById(fixture.accountId()).orElseThrow().getBalance()).isEqualByComparingTo("1000.00");
    }

    private boolean reserveAfterGate(User owner, UUID accountId, UUID goalId,
                                     CountDownLatch ready, CountDownLatch start)
            throws InterruptedException {
        ready.countDown();
        if (!start.await(20, TimeUnit.SECONDS)) throw new AssertionError("Portão não abriu");
        try {
            goals.addValue(goalId, new GoalDepositDTO(accountId, money("600.00"), null, null, null), owner);
            return true;
        } catch (BusinessRuleException expected) {
            return false;
        }
    }

    private User owner() {
        User user = new User();
        user.setNome("Usuário sintético");
        user.setEmail(UUID.randomUUID() + "@example.test");
        user.setSenha("synthetic-hash");
        return users.save(user);
    }

    private Account account(User owner, String balance) {
        Account account = new Account();
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(money(balance));
        account.setUser(owner);
        return accounts.save(account);
    }

    private UUID goal(User owner, GoalType type) {
        return goals.create(new CreateGoalDTO("Meta sintética", money("300.00"), DAY.plusYears(2),
                null, null, null, type, false), owner).id();
    }

    private void category(User owner, String name, TransactionType type) {
        Category category = new Category();
        category.setName(name);
        category.setColor("#123456");
        category.setType(type);
        category.setUser(owner);
        categories.save(category);
    }

    private GoalDepositDTO deposit(Account account, String amount) {
        return new GoalDepositDTO(account.getId(), money(amount), null, null, null);
    }

    private InvestmentOperationDTO operation(UUID assetId, Account account, InvestTransType type,
                                             String quantity, String price, String fees) {
        return new InvestmentOperationDTO(assetId, type, new BigDecimal(quantity), money(price), money(fees), DAY, account.getId());
    }

    private static BigDecimal money(String value) { return new BigDecimal(value); }
}
