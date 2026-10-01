package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.habit.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.support.TransactionTemplate;
import javax.sql.DataSource;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Supplier;
import static org.assertj.core.api.Assertions.*;

@ContextConfiguration(initializers = Cf025SchemaInitializer.class)
@Import(Cf025SqlCapture.class)
@TestPropertySource(properties = {"spring.jpa.properties.hibernate.generate_statistics=true",
        "logging.level.org.hibernate.stat=OFF", "logging.level.org.hibernate.engine.internal.StatisticalLoggingSessionEventListener=OFF"})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class Cf025QueryPerformanceIntegrationTest extends PostgresIntegrationTest {
    static final LocalDate DAY = LocalDate.of(2026, 9, 7);
    @Autowired UserRepository users;
    @Autowired AccountRepository accountRepository;
    @Autowired TransactionRepository ledger;
    @Autowired CategoryRepository categories;
    @Autowired GoalRepository goalRepository;
    @Autowired GoalItemRepository items;
    @Autowired HabitRepository habitRepository;
    @Autowired HabitLogRepository logs;
    @Autowired AccountService accounts;
    @Autowired GoalService goals;
    @Autowired HabitService habits;
    @Autowired TransactionService transactions;
    @Autowired DashboardService dashboard;
    @Autowired AnnualSummaryService annual;
    @Autowired EntityManager entities;
    @Autowired EntityManagerFactory factory;
    @Autowired TransactionTemplate tx;
    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;

    record Fixture(User owner, List<UUID> accountIds, List<UUID> habitIds, List<UUID> transactionIds, int size) {}
    record Sample(long nanos, List<Cf025SqlCapture.Query> queries, long entityLoads, long collectionLoads) {
        long selects() { return queries.stream().filter(Cf025SqlCapture.Query::isSelect).count(); }
        long writes() { return queries.size() - selects(); }
    }

    @Test @Order(1) void benchmarkBeforeAndAfterWithColdPersistenceContexts() throws Exception {
        Path output = Path.of("target", "cf025-" + System.getProperty("cf025.phase", "current"));
        Files.createDirectories(output);
        StringBuilder csv = new StringBuilder("route,size,samples,selects,writes,entity_loads,collection_loads,p50_ms,p95_ms\n");
        StringBuilder plans = new StringBuilder();
        for (int size : new int[]{3, 30, 120}) {
            Fixture f = fixture(size);
            // Planner statistics are populated, rather than benchmarking unanalyzed fresh tables.
            jdbc.execute("ANALYZE");
            Map<String, Supplier<?>> routes = new LinkedHashMap<>();
            routes.put("accounts", () -> accounts.listAll(f.owner()));
            routes.put("goals", () -> goals.listAll(f.owner()));
            routes.put("habits", () -> habits.listAll(f.owner()));
            routes.put("statement", () -> transactions.listAllFiltered(f.owner(), 9, 2026, null, null, PageRequest.of(0, 2)));
            routes.put("cash", () -> transactions.getCashSummary(f.owner(), 9, 2026, null, null));
            routes.put("dashboard", () -> dashboard.getMonthlyFlow(f.owner(), 9, 2026));
            routes.put("annual", () -> annual.getSummary(f.owner(), 2026));
            // Rotate every command to force genuine updates on every sample (no dirty-check no-op).
            var accountOrder = new ArrayList<>(f.accountIds());
            var habitOrder = new ArrayList<>(f.habitIds());
            routes.put("reorder_accounts", () -> { Collections.rotate(accountOrder, 1); accounts.reorder(accountOrder, f.owner()); return null; });
            routes.put("reorder_habits", () -> { Collections.rotate(habitOrder, 1); habits.reorder(habitOrder, f.owner()); return null; });
            for (var route : routes.entrySet()) {
                for (int i = 0; i < 3; i++) sample(route.getValue());
                List<Sample> samples = new ArrayList<>();
                for (int i = 0; i < 20; i++) samples.add(sample(route.getValue()));
                long[] times = samples.stream().mapToLong(Sample::nanos).sorted().toArray();
                Sample first = samples.getFirst();
                assertThat(samples).allSatisfy(s -> {
                    assertThat(s.selects()).isEqualTo(first.selects());
                    assertThat(s.writes()).isEqualTo(first.writes());
                });
                csv.append(String.format(Locale.ROOT, "%s,%d,20,%d,%d,%d,%d,%.3f,%.3f%n", route.getKey(), size,
                        first.selects(), first.writes(), first.entityLoads(), first.collectionLoads(), times[9]/1e6, times[18]/1e6));
                plans.append("\n## ").append(route.getKey()).append(" size=").append(size).append('\n');
                try (var connection = dataSource.getConnection()) {
                    connection.setAutoCommit(false);
                    Set<String> explained = new HashSet<>();
                    for (var query : first.queries()) {
                        if (query.isSelect() && explained.add(query.sql())) {
                            plans.append(query.sql()).append('\n').append(query.explain(connection));
                        }
                    }
                    connection.rollback();
                }
                // Publish progress even if a later route fails.
                Files.writeString(output.resolve("metrics.csv"), csv);
                Files.writeString(output.resolve("plans.txt"), plans);
            }
        }
    }

    @Test @Order(2) void listDoesNotFetchCollectionsPerHabit() {
        for (int size : new int[]{3, 30, 120}) {
            Fixture f = fixture(size);
            Sample list = sample(() -> {
                var result = habits.listAll(f.owner());
                assertThat(result).hasSize(size);
                assertThat(result).extracting(h -> h.id()).doesNotHaveDuplicates().containsExactlyElementsOf(f.habitIds());
                assertThat(result).allSatisfy(h -> {
                    assertThat(h.logs()).hasSize(7);
                    assertThat(h.logs()).extracting(l -> l.date()).containsExactlyInAnyOrder(
                            DAY, DAY.plusDays(1), DAY.plusDays(2), DAY.plusDays(3), DAY.plusDays(4), DAY.plusDays(5), DAY.plusDays(6));
                    assertThat(h.logs()).allSatisfy(l -> assertThat(l.status()).isEqualTo(HabitStatus.COMPLETED));
                });
                return result;
            });
            assertThat(list.selects()).as("constant list SQL at size %s", size).isLessThanOrEqualTo(2);
            assertThat(list.collectionLoads()).as("no secondary collection SELECT").isZero();
        }
    }

    @Test @Order(3) void reorderDoesNotFetchCollectionsPerHabit() {
        for (int size : new int[]{3, 30, 120}) {
            Fixture f = fixture(size);
            var order = new ArrayList<>(f.habitIds()); Collections.rotate(order, 1);
            Sample reorder = sample(() -> { habits.reorder(order, f.owner()); return null; });
            assertThat(reorder.selects()).as("one owned, ordered, locked batch").isEqualTo(1);
            assertThat(reorder.writes()).isEqualTo(size);
        }
    }

    @Test @Order(4) void statementPaginationTotalsAndChecklistRemainOwnedAndReconciled() {
        Fixture f = fixture(30);
        fixture(3); // foreign rows exist in the same tables
        var pages = sample(() -> {
            var first = transactions.listAllFiltered(f.owner(), 9, 2026, null, null, PageRequest.of(0, 20));
            var second = transactions.listAllFiltered(f.owner(), 9, 2026, null, null, PageRequest.of(1, 20));
            assertThat(first.getTotalElements()).isEqualTo(30);
            assertThat(second.getTotalElements()).isEqualTo(30);
            assertThat(first.getContent()).hasSize(20);
            assertThat(second.getContent()).hasSize(10);
            var all = new ArrayList<>(first.getContent()); all.addAll(second.getContent());
            assertThat(all).extracting(t -> t.id()).doesNotHaveDuplicates().containsExactlyInAnyOrderElementsOf(f.transactionIds());
            assertThat(all).allSatisfy(t -> {
                assertThat(t.amount()).isEqualByComparingTo("10.00");
                assertThat(t.accountName()).startsWith("CF025 account");
                assertThat(t.categoryName()).isEqualTo("CF025 category");
            });
            var cash = transactions.getCashSummary(f.owner(), 9, 2026, null, null);
            assertThat(cash.observed().entries()).isEqualByComparingTo("300.00");
            assertThat(cash.observed().exits()).isEqualByComparingTo("0.00");
            assertThat(cash.observed().balance()).isEqualByComparingTo("300.00");
            var flow = dashboard.getMonthlyFlow(f.owner(), 9, 2026);
            assertThat(flow.observed().income()).isEqualByComparingTo("300.00");
            var list = goals.listAll(f.owner());
            assertThat(list).hasSize(30);
            assertThat(list).allSatisfy(g -> {
                assertThat(g.items()).hasSize(2);
                assertThat(g.items()).extracting(i -> i.orderIndex()).containsExactly(0, 1);
            });
            return all;
        });
        assertThat(pages.selects()).isLessThan(30); // constant scoped queries, not one query per transaction
    }

    @Test @Order(5) void reorderPreservesDaysAndRejectsInvalidCommandsAtomically() {
        Fixture f = fixture(3), foreign = fixture(3);
        var original = jdbc.queryForList("select id, order_index from habits where user_id=? order by id", f.owner().getId());
        for (List<UUID> invalid : List.of(List.of(f.habitIds().getFirst(), foreign.habitIds().getFirst()),
                List.of(f.habitIds().getFirst(), UUID.randomUUID()))) {
            assertThatThrownBy(() -> habits.reorder(invalid, f.owner()))
                    .isInstanceOf(com.controlefinanceiro.api.service.exception.ResourceNotFoundException.class);
            assertThat(jdbc.queryForList("select id, order_index from habits where user_id=? order by id", f.owner().getId())).isEqualTo(original);
        }
        for (List<UUID> invalid : Arrays.asList(List.of(f.habitIds().getFirst(), f.habitIds().getFirst()),
                Arrays.asList(f.habitIds().getFirst(), null), null)) {
            Sample rejected = sample(() -> {
                assertThatThrownBy(() -> habits.reorder(invalid, f.owner()))
                        .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
                return null;
            });
            assertThat(rejected.queries()).isEmpty();
        }
        assertThat(sample(() -> { habits.reorder(List.of(), f.owner()); return null; }).queries()).isEmpty();
        habits.reorder(f.habitIds().reversed(), f.owner());
        assertThat(habits.listAll(f.owner())).extracting(h -> h.id()).containsExactlyElementsOf(f.habitIds().reversed());
        tx.executeWithoutResult(status -> {
            for (UUID id : f.habitIds()) {
                Habit habit = habitRepository.findById(id).orElseThrow();
                assertThat(habit.getSpecificDays()).containsExactlyInAnyOrder(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
                assertThat(habit.getLogs()).hasSize(7);
                assertThat(habit.getCurrentStreak()).isZero();
                assertThat(habit.getGoal().getCurrentValue()).isEqualByComparingTo("0");
            }
        });
    }

    @ParameterizedTest @ValueSource(booleans = {false, true}) @Order(6)
    void reorderStillBlocksOnRowLockAndRecoversAfterCommitOrRollback(boolean rollback) throws Exception {
        Fixture f = fixture(3);
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var waiterPid = new CompletableFuture<Integer>();
        var firstOrder = new ArrayList<>(f.habitIds()); Collections.rotate(firstOrder, 1);
        var lastOrder = new ArrayList<>(f.habitIds()); Collections.rotate(lastOrder, -1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(() -> tx.executeWithoutResult(status -> {
                habits.reorder(firstOrder, f.owner());
                entities.flush();
                held.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw new IllegalStateException(ex); }
                if (rollback) status.setRollbackOnly();
            }));
            assertThat(held.await(10, TimeUnit.SECONDS)).isTrue();
            Future<?> second = pool.submit(() -> tx.executeWithoutResult(status -> {
                waiterPid.complete(jdbc.queryForObject("select pg_backend_pid()", Integer.class));
                habits.reorder(lastOrder, f.owner());
            }));
            int pid = waiterPid.get(10, TimeUnit.SECONDS);
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
            int blockers;
            do { blockers = jdbc.queryForObject("select cardinality(pg_blocking_pids(?))", Integer.class, pid); }
            while (blockers == 0 && System.nanoTime() < deadline);
            assertThat(blockers).as("actual PostgreSQL row-lock waiter").isPositive();
            assertThat(second.isDone()).isFalse();
            release.countDown();
            first.get(10, TimeUnit.SECONDS); second.get(10, TimeUnit.SECONDS);
            assertThat(habits.listAll(f.owner())).extracting(h -> h.id()).containsExactlyElementsOf(lastOrder);
            assertThat(jdbc.queryForObject("select sum(balance) from accounts where user_id=?", BigDecimal.class, f.owner().getId())).isEqualByComparingTo("30.00");
            assertThat(jdbc.queryForObject("select count(*) from habit_days d join habits h on h.id=d.habit_id where h.user_id=?", Integer.class, f.owner().getId())).isEqualTo(9);
            assertThat(jdbc.queryForObject("select count(*) from habit_logs l join habits h on h.id=l.habit_id where h.user_id=?", Integer.class, f.owner().getId())).isEqualTo(21);
        } finally { release.countDown(); pool.shutdownNow(); }
    }

    Sample sample(Supplier<?> action) {
        var statistics = factory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        List<Cf025SqlCapture.Query> captured = Cf025SqlCapture.start();
        long start = System.nanoTime();
        try {
            // Use the real service boundaries/isolation; no test transaction or retained persistence context.
            // The service proxy includes flush/commit in measured latency for writes.
            action.get();
            return new Sample(System.nanoTime()-start, List.copyOf(captured), statistics.getEntityLoadCount(),
                    statistics.getCollectionFetchCount());
        } finally { Cf025SqlCapture.stop(); }
    }

    Fixture fixture(int size) {
        return tx.execute(status -> {
            User owner = new User(); owner.setNome("CF025 synthetic"); owner.setEmail(UUID.randomUUID()+"@example.invalid"); owner.setSenha("synthetic");
            users.save(owner);
            Category category = new Category(); category.setUser(owner); category.setName("CF025 category"); category.setColor("BLUE"); category.setType(TransactionType.INCOME); categories.save(category);
            var accountIds = new ArrayList<UUID>(); var habitIds = new ArrayList<UUID>(); var transactionIds = new ArrayList<UUID>();
            for (int i = 0; i < size; i++) {
                Account account = new Account(); account.setUser(owner); account.setName("CF025 account " + i); account.setType(AccountType.CHECKING);
                account.setBalance(new BigDecimal("10.00")); account.setOpeningBalance(BigDecimal.ZERO); account.setOpeningDate(DAY); account.setOpeningOrigin(OpeningBalanceOrigin.USER_PROVIDED);
                account.setOpeningRecordedAt(Instant.parse("2026-09-07T12:00:00Z"));
                account.setOrderIndex(i); accountRepository.save(account); accountIds.add(account.getId());
                Transaction t = new Transaction(); t.setUser(owner); t.setAccount(account); t.setCategory(category); t.setDescription("CF025 entry " + i);
                t.setAmount(new BigDecimal("10.00")); t.setType(TransactionType.INCOME); t.setOrigin(TransactionOrigin.USER); t.setPaid(true); t.setDate(DAY);
                t.setCreatedAt(DAY.atStartOfDay()); ledger.save(t); transactionIds.add(t.getId());
                Goal g = new Goal(); g.setUser(owner); g.setTitle("CF025 goal " + i); g.setType(GoalType.NUMERIC); g.setTargetValue(new BigDecimal("100")); g.setDeadline(DAY.plusMonths(1));
                goalRepository.save(g);
                for (int k=0; k<2; k++) { GoalItem item = new GoalItem(); item.setGoal(g); item.setName("CF025 item " + k); item.setEstimatedPrice(new BigDecimal("5.00")); item.setOrderIndex(k); items.save(item); }
                Habit h = new Habit(); h.setUser(owner); h.setName("CF025 habit " + i); h.setIcon("check"); h.setColor("BLUE"); h.setOrderIndex(i); h.setGoal(g);
                h.setSpecificDays(EnumSet.of(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY)); habitRepository.save(h); habitIds.add(h.getId());
                for (int d=0; d<7; d++) { HabitLog l = new HabitLog(); l.setHabit(h); l.setDate(DAY.plusDays(d)); l.setStatus(HabitStatus.COMPLETED); logs.save(l); }
            }
            entities.flush(); entities.clear();
            return new Fixture(owner, List.copyOf(accountIds), List.copyOf(habitIds), List.copyOf(transactionIds), size);
        });
    }
}
