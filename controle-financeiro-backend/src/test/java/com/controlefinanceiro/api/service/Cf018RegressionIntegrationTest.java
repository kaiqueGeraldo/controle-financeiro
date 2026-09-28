package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.account.OpeningBalanceOrigin;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionStatus;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransferDirection;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.SettleTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.transaction.dto.UpdateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

class Cf018RegressionIntegrationTest extends PostgresIntegrationTest {

    private static final LocalDate OPENING_DATE = LocalDate.of(2026, 9, 7);

    @Autowired AccountService accountService;
    @Autowired TransactionService transactionService;
    @Autowired UserRepository userRepository;
    @Autowired AccountRepository accountRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired TransactionRepository transactionRepository;
    @Autowired TransactionTemplate transactionTemplate;
    @Autowired EntityManager entityManager;
    @Autowired JdbcTemplate sql;

    @Test
    void positiveZeroAndNegativeOpeningArePositionsNotPeriodIncome() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("opening@example.test"));

            var positive = accountService.create(account("Positiva", "1000.00", OPENING_DATE), owner);
            var zero = accountService.create(account("Zero", "0.00", OPENING_DATE), owner);
            var negative = accountService.create(account("Negativa", "-200.00", OPENING_DATE), owner);
            entityManager.flush();

            assertThat(List.of(positive, zero, negative))
                    .extracting("openingBalance", "openingDate", "openingOrigin")
                    .containsExactly(
                            tuple(new BigDecimal("1000.00"), OPENING_DATE, OpeningBalanceOrigin.USER_PROVIDED),
                            tuple(new BigDecimal("0.00"), OPENING_DATE, OpeningBalanceOrigin.USER_PROVIDED),
                            tuple(new BigDecimal("-200.00"), OPENING_DATE, OpeningBalanceOrigin.USER_PROVIDED)
                    );
            assertThat(positive.openingRecordedAt()).isNotNull();
            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("800.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            assertThat(transactionsFor(owner)).isEmpty();
            rollback.setRollbackOnly();
        });
    }

    @Test
    void pendingTransactionDoesNotEnterRealizedAggregatesOrBalance() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("forecast@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));

            transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);
            entityManager.flush();

            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void archivedAccountRemainsInTheFinancialPosition() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("archive@example.test"));
            Account account = accountRepository.save(account(owner, "100.00"));

            accountService.delete(account.getId(), owner);
            entityManager.flush();

            assertThat(accountService.listAll(owner)).isEmpty();
            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("100.00");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void transactionRejectsCategoryOwnedByAnotherUserWithoutChangingBalance() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("owner@example.test"));
            User other = userRepository.save(user("other@example.test"));
            Account account = accountRepository.save(account(owner, "100.00"));
            Category foreignCategory = categoryRepository.save(category(other, TransactionType.EXPENSE));

            assertThatThrownBy(() -> transactionService.create(new CreateTransactionDTO(
                    "Categoria alheia", new BigDecimal("10.00"), OPENING_DATE,
                    "11:00", TransactionType.EXPENSE, account.getId(), foreignCategory.getId(), true
            ), owner)).isInstanceOf(ResourceNotFoundException.class)
                    .hasMessage("Categoria não encontrada");

            entityManager.flush();
            entityManager.clear();
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("100.00");
            assertThat(transactionsFor(owner)).isEmpty();
            rollback.setRollbackOnly();
        });
    }

    @Test
    void openingOriginIsExcludedEvenIfAnExplicitImportedOpeningEntryExists() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("origin-filter@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            Transaction importedOpening = transaction(
                    owner, account, TransactionType.INCOME, "1000.00", true, TransactionOrigin.ACCOUNT_OPENING
            );
            transactionRepository.saveAndFlush(importedOpening);

            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            UpdateTransactionDTO edit = new UpdateTransactionDTO();
            edit.setAmount(new BigDecimal("900.00"));
            assertThatThrownBy(() -> transactionService.update(importedOpening.getId(), edit, owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("posição");
            assertThatThrownBy(() -> transactionService.delete(importedOpening.getId(), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("posição");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void everyFinancialAggregateExcludesPendingAndOpeningAndNetsReversal() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("all-aggregates@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            transactionService.create(new CreateTransactionDTO(
                    "Receita realizada", new BigDecimal("100.00"), OPENING_DATE,
                    "09:00", TransactionType.INCOME, account.getId(), null, true
            ), owner);
            transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);
            transactionRepository.saveAndFlush(transaction(
                    owner, account, TransactionType.INCOME, "1000.00", true, TransactionOrigin.ACCOUNT_OPENING
            ));
            TransactionResponseDTO expense = transactionService.create(new CreateTransactionDTO(
                    "Despesa estornada", new BigDecimal("40.00"), OPENING_DATE,
                    "11:00", TransactionType.EXPENSE, account.getId(), null, true
            ), owner);
            transactionService.delete(expense.id(), owner);

            LocalDate monthStart = OPENING_DATE.withDayOfMonth(1);
            LocalDate monthEnd = OPENING_DATE.withDayOfMonth(OPENING_DATE.lengthOfMonth());
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("100.00");
            assertThat(amountFor(
                    transactionRepository.sumAmountByDateAndType(owner.getId(), monthStart),
                    1, 2, TransactionType.INCOME)).isEqualByComparingTo("100.00");
            assertThat(amountFor(
                    transactionRepository.sumAmountByMonthAndType(owner.getId(), monthStart),
                    2, 3, TransactionType.INCOME)).isEqualByComparingTo("100.00");
            assertThat(amountFor(
                    transactionRepository.sumTotalAmountByType(owner.getId()),
                    0, 1, TransactionType.INCOME)).isEqualByComparingTo("100.00");
            assertThat(amountFor(
                    transactionRepository.sumAmountByTypeAndDateBetween(owner.getId(), monthStart, monthEnd),
                    0, 1, TransactionType.INCOME)).isEqualByComparingTo("100.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.EXPENSE, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void settledTransferCreatesLinkedLegsAndFeeWithoutCreatingIncome() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("transfer@example.test"));
            Account source = accountRepository.save(account("Origem", AccountType.CHECKING, owner, "1000.00"));
            Account destination = accountRepository.save(account("Destino", AccountType.CHECKING, owner, "50.00"));

            TransactionResponseDTO response = transactionService.create(
                    transfer(source, destination, "200.00", "2.00", true), owner
            );
            entityManager.flush();
            entityManager.clear();

            assertThat(accountRepository.findById(source.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("798.00");
            assertThat(accountRepository.findById(destination.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("250.00");
            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("1048.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.EXPENSE, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("2.00");

            List<Transaction> operation = transactionRepository.findOperationForUpdate(response.operationId());
            assertThat(operation).hasSize(3);
            assertThat(operation.stream().filter(t -> t.getOrigin() == TransactionOrigin.TRANSFER))
                    .extracting(Transaction::getTransferDirection, Transaction::getAmount)
                    .containsExactlyInAnyOrder(
                            tuple(TransferDirection.OUTBOUND, new BigDecimal("200.00")),
                            tuple(TransferDirection.INBOUND, new BigDecimal("200.00"))
                    );
            assertThat(operation.stream().filter(t -> t.getOrigin() == TransactionOrigin.TRANSFER_FEE))
                    .extracting(Transaction::getAmount)
                    .containsExactly(new BigDecimal("2.00"));
            rollback.setRollbackOnly();
        });
    }

    @Test
    void pendingTransferHasTwoPendingLegsAndCanBeDeletedWithoutBalanceEffect() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("pending-transfer@example.test"));
            Account source = accountRepository.save(account("Origem", AccountType.CHECKING, owner, "1000.00"));
            Account destination = accountRepository.save(account("Destino", AccountType.CHECKING, owner, "50.00"));

            TransactionResponseDTO response = transactionService.create(
                    transfer(source, destination, "200.00", "0.00", false), owner
            );
            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("1050.00");
            assertThat(transactionRepository.findOperationForUpdate(response.operationId()))
                    .extracting(Transaction::getStatus)
                    .containsExactly(TransactionStatus.PENDING, TransactionStatus.PENDING);

            transactionService.delete(response.id(), owner);
            assertThat(transactionRepository.findOperationForUpdate(response.operationId())).isEmpty();
            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("1050.00");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void settledTransferReversalRestoresBothAccountsAndFeeExactlyOnce() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("transfer-reversal@example.test"));
            Account source = accountRepository.save(account("Origem", AccountType.CHECKING, owner, "1000.00"));
            Account destination = accountRepository.save(account("Destino", AccountType.CHECKING, owner, "50.00"));
            TransactionResponseDTO transfer = transactionService.create(
                    transfer(source, destination, "200.00", "2.00", true), owner
            );

            transactionService.delete(transfer.id(), owner);
            entityManager.flush();
            entityManager.clear();

            assertThat(accountRepository.findById(source.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(accountRepository.findById(destination.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("50.00");
            List<Transaction> originals = transactionRepository.findOperationForUpdate(transfer.operationId());
            assertThat(originals).hasSize(3).allMatch(t -> t.getStatus() == TransactionStatus.REVERSED);
            assertThat(originals).allMatch(t -> transactionRepository.existsByReversalOfId(t.getId()));
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.EXPENSE, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            assertThatThrownBy(() -> transactionService.delete(transfer.id(), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("já foi estornada");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void settlingAndEditingAUserTransactionChangesBalanceExactlyOnce() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("settlement@example.test"));
            Account first = accountRepository.save(account("Primeira", AccountType.CHECKING, owner, "1000.00"));
            Account second = accountRepository.save(account("Segunda", AccountType.CHECKING, owner, "50.00"));
            TransactionResponseDTO pending = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, first.getId(), null, false
            ), owner);

            UpdateTransactionDTO settle = new UpdateTransactionDTO();
            settle.setPaid(true);
            transactionService.update(pending.id(), settle, owner);
            transactionService.update(pending.id(), settle, owner);

            UpdateTransactionDTO moveAndEdit = new UpdateTransactionDTO();
            moveAndEdit.setAccountId(second.getId());
            moveAndEdit.setAmount(new BigDecimal("200.00"));
            moveAndEdit.setDescription("Receita liquidada editada");
            TransactionResponseDTO corrected = transactionService.update(pending.id(), moveAndEdit, owner);
            entityManager.flush();
            entityManager.clear();

            assertThat(accountRepository.findById(first.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(accountRepository.findById(second.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("250.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("200.00");
            assertThat(transactionRepository.findById(pending.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.REVERSED);
            assertThat(transactionRepository.existsByReversalOfId(pending.id())).isTrue();
            assertThat(corrected.id()).isNotEqualTo(pending.id());
            assertThat(corrected.origin()).isEqualTo(TransactionOrigin.CORRECTION);
            assertThat(corrected.correctionOfId()).isEqualTo(pending.id());
            assertThat(transactionsFor(owner)).hasSize(3);
            rollback.setRollbackOnly();
        });
    }

    @Test
    void partialSettlementsPreserveForecastAndOnlyRealizedPartsReachBalanceAndAggregates() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("partial-settlement@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            TransactionResponseDTO forecast = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);

            TransactionResponseDTO first = transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("100.00"), OPENING_DATE.plusDays(1), "09:30"
                    ), owner
            );

            assertThat(first.origin()).isEqualTo(TransactionOrigin.SETTLEMENT);
            assertThat(first.status()).isEqualTo(TransactionStatus.SETTLED);
            assertThat(first.settlementOfId()).isEqualTo(forecast.id());
            assertThat(first.dueDate()).isEqualTo(OPENING_DATE);
            assertThat(transactionRepository.findById(forecast.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.PARTIALLY_SETTLED);
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1100.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("100.00");

            transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("150.00"), OPENING_DATE.plusDays(2), "11:00"
                    ), owner
            );

            Transaction completedForecast = transactionRepository.findById(forecast.id()).orElseThrow();
            assertThat(completedForecast.getStatus()).isEqualTo(TransactionStatus.FULFILLED);
            assertThat(completedForecast.getSettledAt()).isNotNull();
            assertThat(completedForecast.getAmount()).isEqualByComparingTo("250.00");
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1250.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("250.00");
            assertThatThrownBy(() -> transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("0.01"), OPENING_DATE.plusDays(3), "12:00"
                    ), owner
            )).isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("previsão pendente");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void reversingPartialSettlementReactivatesForecastWithoutErasingEitherFact() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("partial-reversal@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            TransactionResponseDTO forecast = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);
            TransactionResponseDTO settlement = transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("100.00"), OPENING_DATE.plusDays(1), "09:30"
                    ), owner
            );

            transactionService.delete(settlement.id(), owner);
            entityManager.flush();
            entityManager.clear();

            assertThat(transactionRepository.findById(forecast.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.PENDING);
            assertThat(transactionRepository.findById(settlement.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.REVERSED);
            assertThat(transactionRepository.existsByReversalOfId(settlement.id())).isTrue();
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            assertThat(transactionsFor(owner)).hasSize(3);
            transactionService.delete(forecast.id(), owner);
            assertThat(transactionRepository.findById(forecast.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.CANCELLED);
            assertThatThrownBy(() -> transactionService.delete(settlement.id(), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("já foi estornada");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void deletingPartiallySettledForecastCancelsOnlyTheRemainingIntent() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("partial-cancellation@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            TransactionResponseDTO forecast = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);
            TransactionResponseDTO settlement = transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("100.00"), OPENING_DATE.plusDays(1), "09:30"
                    ), owner
            );

            transactionService.delete(forecast.id(), owner);

            assertThat(transactionRepository.findById(forecast.id()).orElseThrow().getStatus())
                    .isEqualTo(TransactionStatus.CANCELLED);
            assertThat(transactionRepository.findById(settlement.id())).isPresent();
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1100.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("100.00");
            assertThatThrownBy(() -> transactionService.settle(
                    forecast.id(), new SettleTransactionDTO(
                            new BigDecimal("150.00"), OPENING_DATE.plusDays(2), "11:00"
                    ), owner
            )).isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("previsão pendente");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void settlementUsesEffectiveDateAndPreservesForecastDueDateAcrossYears() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("cross-year-settlement@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            LocalDate dueDate = LocalDate.of(2026, 12, 31);
            LocalDate settlementDate = LocalDate.of(2027, 1, 2);
            TransactionResponseDTO forecast = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("250.00"), dueDate,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);

            UpdateTransactionDTO settle = new UpdateTransactionDTO();
            settle.setDate(settlementDate);
            settle.setPaid(true);
            TransactionResponseDTO settled = transactionService.update(forecast.id(), settle, owner);

            assertThat(settled.date()).isEqualTo(settlementDate);
            assertThat(settled.dueDate()).isEqualTo(dueDate);
            assertThat(settled.settledAt()).isNotNull();
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, 2026)).isEqualByComparingTo("0.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, 2027)).isEqualByComparingTo("250.00");
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1250.00");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void settledCorrectionCompensatesTheOriginalPeriodAndMovesOnlyTheCorrectedFact() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("cross-year-correction@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            LocalDate originalDate = LocalDate.of(2026, 12, 31);
            LocalDate correctedDate = LocalDate.of(2027, 1, 2);
            TransactionResponseDTO original = transactionService.create(new CreateTransactionDTO(
                    "Receita cadastrada no período errado", new BigDecimal("100.00"), originalDate,
                    "10:00", TransactionType.INCOME, account.getId(), null, true
            ), owner);

            UpdateTransactionDTO correction = new UpdateTransactionDTO();
            correction.setDate(correctedDate);
            correction.setAmount(new BigDecimal("120.00"));
            TransactionResponseDTO corrected = transactionService.update(original.id(), correction, owner);

            assertThat(corrected.origin()).isEqualTo(TransactionOrigin.CORRECTION);
            assertThat(corrected.date()).isEqualTo(correctedDate);
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, 2026)).isEqualByComparingTo("0.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.INCOME, 2027)).isEqualByComparingTo("120.00");
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1120.00");
            assertThat(transactionsFor(owner).stream()
                    .filter(t -> t.getOrigin() == TransactionOrigin.REVERSAL)
                    .map(Transaction::getDate))
                    .containsExactly(originalDate);
            rollback.setRollbackOnly();
        });
    }

    @Test
    void deletingSettledTransactionCreatesOneReversalWhileDeletingPendingRemovesOnlyIntent() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("reversal@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            TransactionResponseDTO settled = transactionService.create(new CreateTransactionDTO(
                    "Despesa realizada", new BigDecimal("100.00"), OPENING_DATE,
                    "10:00", TransactionType.EXPENSE, account.getId(), null, true
            ), owner);
            TransactionResponseDTO pending = transactionService.create(new CreateTransactionDTO(
                    "Despesa prevista", new BigDecimal("60.00"), OPENING_DATE,
                    "11:00", TransactionType.EXPENSE, account.getId(), null, false
            ), owner);

            transactionService.delete(pending.id(), owner);
            transactionService.delete(settled.id(), owner);
            entityManager.flush();
            entityManager.clear();

            Transaction original = transactionRepository.findById(settled.id()).orElseThrow();
            assertThat(original.getStatus()).isEqualTo(TransactionStatus.REVERSED);
            assertThat(transactionRepository.existsByReversalOfId(original.getId())).isTrue();
            assertThat(transactionRepository.findById(pending.id())).isEmpty();
            assertThat(accountRepository.findById(account.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(transactionRepository.sumByTypeAndYear(
                    owner.getId(), TransactionType.EXPENSE, OPENING_DATE.getYear()))
                    .isEqualByComparingTo("0.00");
            assertThatThrownBy(() -> transactionService.delete(settled.id(), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("já foi estornada");
            rollback.setRollbackOnly();
        });
    }

    @Test
    void transferRejectsSameForeignAndArchivedAccountsBeforeAnyWrite() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("transfer-owner@example.test"));
            User other = userRepository.save(user("transfer-other@example.test"));
            Account source = accountRepository.save(account("Origem", AccountType.CHECKING, owner, "1000.00"));
            Account foreign = accountRepository.save(account("Alheia", AccountType.CHECKING, other, "42.17"));
            Account archived = accountRepository.save(account("Arquivada", AccountType.CHECKING, owner, "50.00"));
            archived.setArchived(true);
            accountRepository.save(archived);

            assertThatThrownBy(() -> transactionService.create(
                    transfer(source, source, "10.00", "0.00", true), owner))
                    .isInstanceOf(BusinessRuleException.class);
            assertThatThrownBy(() -> transactionService.create(
                    transfer(source, foreign, "10.00", "0.00", true), owner))
                    .isInstanceOf(ResourceNotFoundException.class);
            assertThatThrownBy(() -> transactionService.create(
                    transfer(source, archived, "10.00", "0.00", true), owner))
                    .isInstanceOf(BusinessRuleException.class);

            assertThat(accountRepository.findById(source.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("1000.00");
            assertThat(accountRepository.findById(foreign.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("42.17");
            assertThat(transactionsFor(owner)).isEmpty();
            rollback.setRollbackOnly();
        });
    }

    @Test
    void managedTransactionCannotBeEditedOrDeletedFromExtract() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("managed@example.test"));
            Account account = accountRepository.save(account(owner, "100.00"));
            Transaction managed = transaction(owner, account, TransactionType.EXPENSE, "10.00", false, TransactionOrigin.UNKNOWN);
            managed.setSystemManaged(true);
            transactionRepository.saveAndFlush(managed);

            UpdateTransactionDTO edit = new UpdateTransactionDTO();
            edit.setDescription("Tentativa de edição");
            assertThatThrownBy(() -> transactionService.update(managed.getId(), edit, owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("gerenciada automaticamente");
            assertThatThrownBy(() -> transactionService.delete(managed.getId(), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("gerenciada automaticamente");
            assertThat(transactionRepository.findById(managed.getId())).isPresent();
            rollback.setRollbackOnly();
        });
    }

    @Test
    void monetaryScaleViolationsFailBeforeAnyWrite() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("money-contract@example.test"));
            Account source = accountRepository.save(account("Origem", AccountType.CHECKING, owner, "100.00"));
            Account destination = accountRepository.save(account("Destino", AccountType.CHECKING, owner, "0.00"));

            assertThatThrownBy(() -> accountService.create(
                    account("Inválida", "1.005", OPENING_DATE), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("duas casas");
            assertThatThrownBy(() -> transactionService.create(new CreateTransactionDTO(
                    "Inválida", new BigDecimal("1.005"), OPENING_DATE,
                    "10:00", TransactionType.EXPENSE, source.getId(), null, true
            ), owner)).isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("duas casas");
            assertThatThrownBy(() -> transactionService.create(
                    transfer(source, destination, "10.00", "-0.01", true), owner))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("não pode ser negativa");

            assertThat(accountRepository.sumTotalBalanceByUserId(owner.getId()))
                    .isEqualByComparingTo("100.00");
            assertThat(transactionsFor(owner)).isEmpty();
            rollback.setRollbackOnly();
        });
    }

    @Test
    void realizedBankDebitMayGoNegativeButCashExpenseCannotExceedBalance() {
        transactionTemplate.executeWithoutResult(rollback -> {
            User owner = userRepository.save(user("negative-balance@example.test"));
            Account checking = accountRepository.save(account("Conta bancária", AccountType.CHECKING, owner, "50.00"));
            Account cash = accountRepository.save(account("Carteira", AccountType.CASH, owner, "50.00"));

            transactionService.create(new CreateTransactionDTO(
                    "Débito bancário ocorrido", new BigDecimal("80.00"), OPENING_DATE,
                    "10:00", TransactionType.EXPENSE, checking.getId(), null, true
            ), owner);
            assertThatThrownBy(() -> transactionService.create(new CreateTransactionDTO(
                    "Gasto voluntário em dinheiro", new BigDecimal("80.00"), OPENING_DATE,
                    "11:00", TransactionType.EXPENSE, cash.getId(), null, true
            ), owner)).isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Saldo insuficiente");

            assertThat(accountRepository.findById(checking.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("-30.00");
            assertThat(accountRepository.findById(cash.getId()).orElseThrow().getBalance())
                    .isEqualByComparingTo("50.00");
            assertThat(transactionsFor(owner)).hasSize(1);
            rollback.setRollbackOnly();
        });
    }

    @Test
    void failureOnSecondTransferLegRollsBackBothBalancesAndEveryEntryInPostgres() {
        TransferFixture fixture = transactionTemplate.execute(status -> {
            User owner = userRepository.save(user("rollback-transfer@example.test"));
            Account source = accountRepository.save(account("Origem rollback", AccountType.CHECKING, owner, "1000.00"));
            Account destination = accountRepository.save(account("Destino rollback", AccountType.CHECKING, owner, "50.00"));
            entityManager.flush();
            return new TransferFixture(owner, source.getId(), destination.getId());
        });
        assertThat(fixture).isNotNull();

        sql.execute("""
                CREATE OR REPLACE FUNCTION cf018_reject_inbound_leg() RETURNS trigger
                LANGUAGE plpgsql AS $$
                BEGIN
                    IF NEW.transfer_direction = 'INBOUND' THEN
                        RAISE EXCEPTION 'CF018 forced second leg failure';
                    END IF;
                    RETURN NEW;
                END;
                $$
                """);
        sql.execute("""
                CREATE TRIGGER cf018_reject_inbound_leg
                BEFORE INSERT ON transactions
                FOR EACH ROW EXECUTE FUNCTION cf018_reject_inbound_leg()
                """);
        try {
            Account source = accountRepository.findById(fixture.sourceId()).orElseThrow();
            Account destination = accountRepository.findById(fixture.destinationId()).orElseThrow();
            assertThatThrownBy(() -> transactionService.create(
                    transfer(source, destination, "200.00", "2.00", true), fixture.owner()))
                    .isInstanceOf(RuntimeException.class)
                    .hasStackTraceContaining("CF018 forced second leg failure");
        } finally {
            sql.execute("DROP TRIGGER IF EXISTS cf018_reject_inbound_leg ON transactions");
            sql.execute("DROP FUNCTION IF EXISTS cf018_reject_inbound_leg()");
        }

        assertThat(accountRepository.findById(fixture.sourceId()).orElseThrow().getBalance())
                .isEqualByComparingTo("1000.00");
        assertThat(accountRepository.findById(fixture.destinationId()).orElseThrow().getBalance())
                .isEqualByComparingTo("50.00");
        assertThat(transactionRepository.findAllByUserIdWithDetails(
                fixture.owner().getId(), org.springframework.data.domain.Pageable.unpaged())).isEmpty();
    }

    @Test
    void updateRejectsForeignAccountAndCategoryAndRollsBackOriginalBalance() {
        OwnershipFixture fixture = transactionTemplate.execute(status -> {
            User owner = userRepository.save(user("update-owner@example.test"));
            User other = userRepository.save(user("update-other@example.test"));
            Account owned = accountRepository.save(account("Própria", AccountType.CHECKING, owner, "100.00"));
            Account foreign = accountRepository.save(account("Alheia", AccountType.CHECKING, other, "42.17"));
            Category foreignCategory = categoryRepository.save(category(other, TransactionType.EXPENSE));
            TransactionResponseDTO created = transactionService.create(new CreateTransactionDTO(
                    "Despesa própria", new BigDecimal("10.00"), OPENING_DATE,
                    "10:00", TransactionType.EXPENSE, owned.getId(), null, true
            ), owner);
            return new OwnershipFixture(owner, created.id(), owned.getId(), foreign.getId(), foreignCategory.getId());
        });
        assertThat(fixture).isNotNull();

        UpdateTransactionDTO moveToForeignAccount = new UpdateTransactionDTO();
        moveToForeignAccount.setAccountId(fixture.foreignAccountId());
        assertThatThrownBy(() -> transactionService.update(
                fixture.transactionId(), moveToForeignAccount, fixture.owner()))
                .isInstanceOf(ResourceNotFoundException.class);

        UpdateTransactionDTO useForeignCategory = new UpdateTransactionDTO();
        useForeignCategory.setCategoryId(fixture.foreignCategoryId());
        assertThatThrownBy(() -> transactionService.update(
                fixture.transactionId(), useForeignCategory, fixture.owner()))
                .isInstanceOf(ResourceNotFoundException.class);

        assertThat(accountRepository.findById(fixture.ownedAccountId()).orElseThrow().getBalance())
                .isEqualByComparingTo("90.00");
        assertThat(accountRepository.findById(fixture.foreignAccountId()).orElseThrow().getBalance())
                .isEqualByComparingTo("42.17");
        Transaction preserved = transactionRepository.findById(fixture.transactionId()).orElseThrow();
        assertThat(preserved.getAccount().getId()).isEqualTo(fixture.ownedAccountId());
        assertThat(preserved.getCategory()).isNull();
    }

    @Test
    void concurrentCashTransfersSerializeAndDoNotLoseAccountUpdates() throws Exception {
        ConcurrentTransferFixture fixture = transactionTemplate.execute(status -> {
            User owner = userRepository.save(user("concurrent-transfer@example.test"));
            Account source = accountRepository.save(account("Carteira", AccountType.CASH, owner, "1000.00"));
            Account firstDestination = accountRepository.save(account("Destino A", AccountType.CHECKING, owner, "0.00"));
            Account secondDestination = accountRepository.save(account("Destino B", AccountType.CHECKING, owner, "0.00"));
            entityManager.flush();
            return new ConcurrentTransferFixture(owner, source, firstDestination, secondDestination);
        });
        assertThat(fixture).isNotNull();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> concurrentTransfer(
                    fixture.owner(), fixture.source(), fixture.firstDestination(), ready, start));
            var second = executor.submit(() -> concurrentTransfer(
                    fixture.owner(), fixture.source(), fixture.secondDestination(), ready, start));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            long successes = List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS))
                    .stream()
                    .filter(Boolean::booleanValue)
                    .count();
            assertThat(successes).isOne();
        }

        BigDecimal sourceBalance = accountRepository.findById(fixture.source().getId()).orElseThrow().getBalance();
        BigDecimal firstBalance = accountRepository.findById(fixture.firstDestination().getId()).orElseThrow().getBalance();
        BigDecimal secondBalance = accountRepository.findById(fixture.secondDestination().getId()).orElseThrow().getBalance();
        assertThat(sourceBalance).isEqualByComparingTo("300.00");
        assertThat(firstBalance.add(secondBalance)).isEqualByComparingTo("700.00");
        assertThat(sourceBalance.add(firstBalance).add(secondBalance)).isEqualByComparingTo("1000.00");
        assertThat(transactionsFor(fixture.owner())).hasSize(2);
    }

    @Test
    void concurrentPartialSettlementsSerializeAndCannotExceedForecast() throws Exception {
        PartialSettlementFixture fixture = transactionTemplate.execute(status -> {
            User owner = userRepository.save(user("concurrent-settlement@example.test"));
            Account account = accountRepository.save(account(owner, "1000.00"));
            TransactionResponseDTO forecast = transactionService.create(new CreateTransactionDTO(
                    "Receita prevista", new BigDecimal("300.00"), OPENING_DATE,
                    "10:00", TransactionType.INCOME, account.getId(), null, false
            ), owner);
            return new PartialSettlementFixture(owner, forecast.id(), account.getId());
        });
        assertThat(fixture).isNotNull();

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> concurrentSettlement(fixture, ready, start));
            var second = executor.submit(() -> concurrentSettlement(fixture, ready, start));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();

            long successes = List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS))
                    .stream()
                    .filter(Boolean::booleanValue)
                    .count();
            assertThat(successes).isOne();
        }

        assertThat(accountRepository.findById(fixture.accountId()).orElseThrow().getBalance())
                .isEqualByComparingTo("1200.00");
        assertThat(transactionRepository.sumActiveSettlements(fixture.forecastId()))
                .isEqualByComparingTo("200.00");
        assertThat(transactionRepository.findById(fixture.forecastId()).orElseThrow().getStatus())
                .isEqualTo(TransactionStatus.PARTIALLY_SETTLED);
    }

    private boolean concurrentTransfer(
            User owner,
            Account source,
            Account destination,
            CountDownLatch ready,
            CountDownLatch start
    ) throws InterruptedException {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Barreira concorrente não foi liberada");
        }
        try {
            transactionService.create(transfer(source, destination, "700.00", "0.00", true), owner);
            return true;
        } catch (BusinessRuleException expectedInsufficientCash) {
            return false;
        }
    }

    private boolean concurrentSettlement(
            PartialSettlementFixture fixture,
            CountDownLatch ready,
            CountDownLatch start
    ) throws InterruptedException {
        ready.countDown();
        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Barreira concorrente não foi liberada");
        }
        try {
            transactionService.settle(
                    fixture.forecastId(),
                    new SettleTransactionDTO(new BigDecimal("200.00"), OPENING_DATE.plusDays(1), "09:30"),
                    fixture.owner()
            );
            return true;
        } catch (BusinessRuleException expectedExcessSettlement) {
            return false;
        }
    }

    private static CreateAccountDTO account(String name, String openingBalance, LocalDate openingDate) {
        return new CreateAccountDTO(
                name, AccountType.CHECKING, new BigDecimal(openingBalance), "#123456", openingDate
        );
    }

    private List<Transaction> transactionsFor(User owner) {
        return transactionRepository.findAllByUserIdWithDetails(
                owner.getId(), org.springframework.data.domain.Pageable.unpaged()).getContent();
    }

    private static BigDecimal amountFor(
            List<Object[]> rows,
            int typeIndex,
            int amountIndex,
            TransactionType type
    ) {
        return rows.stream()
                .filter(row -> row[typeIndex].toString().equals(type.name()))
                .map(row -> new BigDecimal(row[amountIndex].toString()))
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    private static Account account(User owner, String balance) {
        return account("Conta sintética", AccountType.CHECKING, owner, balance);
    }

    private static Account account(String name, AccountType type, User owner, String balance) {
        Account account = new Account();
        account.setName(name);
        account.setType(type);
        account.setBalance(new BigDecimal(balance));
        account.setUser(owner);
        return account;
    }

    private static CreateTransactionDTO transfer(
            Account source,
            Account destination,
            String amount,
            String fee,
            boolean paid
    ) {
        return new CreateTransactionDTO(
                "Transferência sintética", new BigDecimal(amount), OPENING_DATE, "12:00",
                TransactionType.TRANSFER, source.getId(), null, paid,
                destination.getId(), new BigDecimal(fee)
        );
    }

    private static Transaction transaction(
            User owner,
            Account account,
            TransactionType type,
            String amount,
            boolean paid,
            TransactionOrigin origin
    ) {
        LocalDateTime createdAt = OPENING_DATE.atTime(10, 0);
        Transaction transaction = new Transaction();
        transaction.setDescription("Transação sintética");
        transaction.setAmount(new BigDecimal(amount));
        transaction.setDate(OPENING_DATE);
        transaction.setCreatedAt(createdAt);
        transaction.captureTemporal(null, createdAt.toInstant(ZoneOffset.UTC), createdAt);
        transaction.setType(type);
        transaction.setPaid(paid);
        transaction.setOrigin(origin);
        transaction.setAccount(account);
        transaction.setUser(owner);
        return transaction;
    }

    private static Category category(User owner, TransactionType type) {
        Category category = new Category();
        category.setName("Categoria sintética");
        category.setColor("#654321");
        category.setType(type);
        category.setUser(owner);
        return category;
    }

    private static User user(String email) {
        User user = new User();
        user.setNome("Usuário sintético");
        user.setEmail(email);
        user.setSenha("synthetic-hash-never-authenticated");
        return user;
    }

    private record TransferFixture(User owner, UUID sourceId, UUID destinationId) {
    }

    private record OwnershipFixture(
            User owner,
            UUID transactionId,
            UUID ownedAccountId,
            UUID foreignAccountId,
            UUID foreignCategoryId
    ) {
    }

    private record ConcurrentTransferFixture(
            User owner,
            Account source,
            Account firstDestination,
            Account secondDestination
    ) {
    }

    private record PartialSettlementFixture(User owner, UUID forecastId, UUID accountId) {
    }
}
