package com.controlefinanceiro.api.domain.habit;

import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.habit.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.core.LockConfiguration;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.flywaydb.core.Flyway;
import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@ContextConfiguration(initializers = HabitSchemaInitializer.class)
class HabitIntegrityIntegrationTest extends PostgresIntegrationTest {
    @Autowired HabitService service;
    @Autowired HabitCronService cron;
    @Autowired HabitRepository habits;
    @Autowired HabitLogRepository logs;
    @Autowired GoalRepository goals;
    @Autowired GoalHistoryRepository history;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired TransactionTemplate tx;
    @Autowired LockProvider lockProvider;
    @Autowired GoalService goalService;
    @Autowired DataSource dataSource;
    @MockitoBean Clock clock;
    User user;

    @BeforeEach void setup() {
        at("2027-01-04T03:05:00Z");
        user = new User();
        user.setNome("CF022 sintético");
        user.setEmail(UUID.randomUUID() + "@example.invalid");
        user.setSenha("synthetic");
        users.save(user);
        releaseCronLock();
    }

    @Test void creationKeepsWeeklyConfiguration() {
        var result = service.create(new CreateHabitDTO("Semanal", null, "check", "BLUE",
                HabitFrequency.WEEKLY_GOAL, 2, null), user);
        assertThat(result.frequency()).isEqualTo(HabitFrequency.WEEKLY_GOAL);
        assertThat(result.weeklyGoal()).isEqualTo(2);
    }

    @Test void retroactiveUncheckAfterRenameReversesItsExactContribution() {
        Goal goal = goal();
        Habit habit = habit("Leitura", HabitFrequency.DAILY, goal);
        toggle(habit, "2027-01-01");
        assertValue(goal, "11");
        service.update(habit.getId(), new UpdateHabitDTO("Outro nome", null, null, null, null, null, null), user);
        toggle(habit, "2027-01-01");
        assertValue(goal, "10");
        assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).isEmpty();
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-01")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.PENDING);
    }

    @Test void equalNamesAndDaysAreIndependentContributions() {
        Goal goal = goal();
        Habit first = habit("Mesmo nome", HabitFrequency.DAILY, goal);
        Habit second = habit("Mesmo nome", HabitFrequency.DAILY, goal);
        toggle(first, "2027-01-04");
        toggle(second, "2027-01-04");
        assertValue(goal, "12");
        toggle(first, "2027-01-04");
        assertValue(goal, "11");
        assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).hasSize(1);
    }

    @Test void twoMissedDaysBreakDailyStreakEvenWhenMarkedRetroactively() {
        Habit habit = habit("Intervalos", HabitFrequency.DAILY, null);
        toggle(habit, "2027-01-01");
        toggle(habit, "2027-01-04");
        assertStreak(habit, 1, 1);
        toggle(habit, "2027-01-03");
        assertStreak(habit, 3, 3);
        toggle(habit, "2027-01-03");
        assertStreak(habit, 1, 1);
    }

    @Test void weeklyCronAcrossNewYearIsIdempotentAfterLockExpires() {
        Habit habit = habit("Semana ano novo", HabitFrequency.WEEKLY_GOAL, null);
        toggle(habit, "2026-12-28");
        toggle(habit, "2027-01-03");
        cron.processDailyHabits();
        assertStreak(habit, 1, 1);
        releaseCronLock();
        cron.processDailyHabits();
        assertStreak(habit, 1, 1);
        assertThat(logs.findAllByHabitIdAndDateBetween(habit.getId(), LocalDate.parse("2026-12-28"),
                LocalDate.parse("2027-01-03"))).hasSize(2);
    }

    @Test void weeklyWindowUsesProductMidnightInsteadOfJvmCalendar() {
        at("2027-01-04T02:59:59Z");
        Habit habit = habit("Fronteira", HabitFrequency.WEEKLY_GOAL, null);
        toggle(habit, "2026-12-28");
        toggle(habit, "2027-01-03");
        cron.processDailyHabits();
        assertStreak(habit, 0, 0);
        at("2027-01-04T03:05:00Z");
        releaseCronLock();
        cron.processDailyHabits();
        assertStreak(habit, 1, 1);
    }

    @Test void futureDateAndForeignOrMonetaryGoalsHaveNoEffects() {
        Habit habit = habit("Sem futuro", HabitFrequency.DAILY, null);
        assertThatThrownBy(() -> toggle(habit, "2027-01-05")).isInstanceOf(BusinessRuleException.class);
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-05"))).isEmpty();
        Goal monetary = goal();
        monetary.setType(GoalType.MONETARY);
        goals.save(monetary);
        assertThatThrownBy(() -> service.create(new CreateHabitDTO("Dinheiro", null, "check", "BLUE",
                HabitFrequency.DAILY, null, monetary.getId()), user)).isInstanceOf(BusinessRuleException.class);
        Goal foreign = goal();
        User other = new User();
        other.setNome("Outro"); other.setEmail(UUID.randomUUID()+"@example.invalid"); other.setSenha("synthetic");
        users.save(other); foreign.setUser(other); goals.save(foreign);
        assertThatThrownBy(() -> service.create(new CreateHabitDTO("Alheio", null, "check", "BLUE",
                HabitFrequency.DAILY, null, foreign.getId()), user))
                .isInstanceOf(com.controlefinanceiro.api.service.exception.ResourceNotFoundException.class)
                .hasMessage("Meta não encontrada");
        assertValue(monetary, "10"); assertValue(foreign, "10");
    }

    @Test void dailyForgivenessAndSecondAbsenceAreStableAcrossRetries() {
        at("2027-01-01T03:05:00Z");
        Habit habit = habit("Perdão", HabitFrequency.DAILY, null);
        toggle(habit, "2027-01-01");
        at("2027-01-03T03:05:00Z"); cron.processDailyHabits();
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-02")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.SKIPPED);
        assertStreak(habit, 1, 1);
        releaseCronLock(); cron.processDailyHabits(); assertStreak(habit, 1, 1);
        at("2027-01-04T03:05:00Z"); releaseCronLock(); cron.processDailyHabits();
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-03")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.FAILED);
        assertStreak(habit, 0, 1);
        toggle(habit, "2027-01-02");
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-03")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.SKIPPED);
        assertStreak(habit, 2, 2);
    }

    @Test void weeklyCorrectionRecalculatesClosedWeekAndDoesNotDuplicateGoalProgress() {
        Goal goal = goal(); Habit habit = habit("Correção semanal", HabitFrequency.WEEKLY_GOAL, goal);
        toggle(habit, "2026-12-28"); toggle(habit, "2027-01-03");
        assertStreak(habit, 1, 1); assertValue(goal, "12");
        cron.processDailyHabits(); releaseCronLock(); cron.processDailyHabits(); assertValue(goal, "12");
        toggle(habit, "2027-01-03"); assertStreak(habit, 0, 0); assertValue(goal, "11");
        at("2027-01-11T03:05:00Z"); releaseCronLock(); cron.processDailyHabits();
        assertStreak(habit, 0, 0);
    }

    @Test void persistedHistoryUsesClockAndUncheckRemovesOnlyOwnedEffect() {
        Goal goal = goal(); Habit habit = habit("Identidade", HabitFrequency.DAILY, goal);
        toggle(habit, "2027-01-01");
        var effect = history.findByGoalIdOrderByDateDesc(goal.getId()).getFirst();
        assertThat(effect.getDate()).isEqualTo(LocalDateTime.parse("2027-01-04T00:05:00"));
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-01")))
                .get().extracting(HabitLog::getGoalHistoryId).isEqualTo(effect.getId());
        GoalHistory unrelated = new GoalHistory(); unrelated.setGoal(goal); unrelated.setAmount(new BigDecimal("10"));
        unrelated.setDate(LocalDateTime.parse("2027-01-04T00:05:00")); unrelated.setNote(effect.getNote()); history.save(unrelated);
        toggle(habit, "2027-01-01"); assertValue(goal, "10");
        assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).extracting(GoalHistory::getId)
                .containsExactly(unrelated.getId());
    }

    @Test void legacyContributionWithoutIdentityIsNotGuessedOrBackfilled() {
        Goal goal = goal(); Habit habit = habit("Legado", HabitFrequency.DAILY, goal);
        HabitLog entry = new HabitLog(); entry.setHabit(habit); entry.setDate(LocalDate.parse("2027-01-01"));
        entry.setStatus(HabitStatus.COMPLETED); logs.save(entry);
        assertThatThrownBy(() -> toggle(habit, "2027-01-01")).isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("reconciliação");
        assertValue(goal, "10");
        assertThat(logs.findByHabitIdAndDate(habit.getId(), entry.getDate())).get()
                .extracting(HabitLog::getStatus).isEqualTo(HabitStatus.COMPLETED);
    }

    @Test void deletingGoalClearsLinksAndKeepsCalendarWithoutDoubleUndo() {
        Goal goal = goal(); Habit habit = habit("Meta excluída", HabitFrequency.DAILY, goal);
        toggle(habit, "2027-01-04");
        goalService.delete(goal.getId(), null, user);
        assertThat(sql.queryForObject("select goal_id from habits where id=?", UUID.class, habit.getId())).isNull();
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-04")))
                .get().extracting(HabitLog::getGoalHistoryId).isNull();
        toggle(habit, "2027-01-04");
        assertStreak(habit, 0, 0);
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-04")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.PENDING);
    }

    @Test void schedulerExpressionAndDatabaseLockExcludeAnotherNode() throws Exception {
        var scheduled = HabitCronService.class.getMethod("processDailyHabits").getAnnotation(Scheduled.class);
        assertThat(scheduled.zone()).isEqualTo("${app.temporal.product-zone}");
        var next = CronExpression.parse(scheduled.cron()).next(ZonedDateTime.parse("2027-01-03T23:59:59-03:00[America/Sao_Paulo]"));
        assertThat(next).isEqualTo(ZonedDateTime.parse("2027-01-04T00:05:00-03:00[America/Sao_Paulo]"));
        Habit habit = habit("Lock de outro nó", HabitFrequency.DAILY, null);
        var lock = lockProvider.lock(new LockConfiguration(Instant.now(), "processDailyHabitsLock",
                Duration.ofMinutes(1), Duration.ZERO)).orElseThrow();
        try {
            cron.processDailyHabits();
            assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-03"))).isEmpty();
        } finally { lock.unlock(); }
        cron.processDailyHabits();
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-03"))).isPresent();
    }

    @Test void failureRollsBackOneHabitButCommitsOthersAndRetryIsStable() {
        Habit invalid = habit("Inválido legado", HabitFrequency.WEEKLY_GOAL, null);
        sql.update("update habits set weekly_goal=0 where id=?", invalid.getId());
        Habit valid = habit("Válido", HabitFrequency.WEEKLY_GOAL, null);
        toggle(valid, "2026-12-28"); toggle(valid, "2027-01-03");
        try {
            assertThatThrownBy(cron::processDailyHabits).isInstanceOf(IllegalStateException.class).hasMessageContaining("1 hábito");
            assertStreak(valid, 1, 1); assertStreak(invalid, 0, 0);
        } finally { sql.update("update habits set weekly_goal=2 where id=?", invalid.getId()); }
        releaseCronLock(); cron.processDailyHabits(); assertStreak(valid, 1, 1);
    }

    @Test void simultaneousToggleActionsSerializeAndPreserveOneDayAndZeroNetProgress() throws Exception {
        Goal goal = goal(); Habit habit = habit("Concorrência toggle", HabitFrequency.DAILY, goal);
        concurrent(habit, () -> toggle(habit, "2027-01-04"), () -> toggle(habit, "2027-01-04"));
        assertValue(goal, "10"); assertStreak(habit, 0, 0);
        assertThat(logs.findAllByHabitIdAndDateBetween(habit.getId(), LocalDate.parse("2027-01-04"), LocalDate.parse("2027-01-04")))
                .singleElement().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.PENDING);
        assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).isEmpty();
    }

    @Test void cronAndToggleSerializeOnTheSameHabitRow() throws Exception {
        Habit habit = habit("Concorrência cron", HabitFrequency.DAILY, null);
        concurrent(habit, () -> toggle(habit, "2027-01-03"), cron::processDailyHabits);
        assertStreak(habit, 1, 1);
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-03")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.COMPLETED);
    }

    @Test void changingLinkedGoalKeepsOriginalContributionIdentityForUndo() {
        Goal original = goal(); Goal replacement = goal(); Habit habit = habit("Troca", HabitFrequency.DAILY, original);
        toggle(habit, "2027-01-04");
        service.update(habit.getId(), new UpdateHabitDTO(null, null, null, null, null, null, replacement.getId()), user);
        toggle(habit, "2027-01-04"); assertValue(original, "10"); assertValue(replacement, "10");
        toggle(habit, "2027-01-04"); assertValue(original, "10"); assertValue(replacement, "11");
    }

    @Test void historyUndoThroughGoalDoesNotSubtractAgainThroughHabit() {
        Goal goal = goal(); Habit habit = habit("Desfazer pela meta", HabitFrequency.DAILY, goal);
        toggle(habit, "2027-01-04");
        goalService.deleteHistory(history.findByGoalIdOrderByDateDesc(goal.getId()).getFirst().getId(), null, user);
        assertValue(goal, "10"); toggle(habit, "2027-01-04"); assertValue(goal, "10");
    }

    @Test void differentHabitsSharingOneGoalSerializeNumericProgress() throws Exception {
        Goal goal = goal(); Habit firstHabit = habit("Primeiro", HabitFrequency.DAILY, goal);
        Habit secondHabit = habit("Segundo", HabitFrequency.DAILY, goal);
        var locked = new CountDownLatch(1); var release = new CountDownLatch(1);
        var firstPid = new AtomicInteger(); var secondPid = new AtomicInteger();
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> tx.executeWithoutResult(status -> {
                firstPid.set(sql.queryForObject("select pg_backend_pid()", Integer.class));
                sql.queryForObject("select id from goals where id=? for update", UUID.class, goal.getId());
                locked.countDown();
                try { if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Goal barrier timeout"); }
                catch (InterruptedException exception) { Thread.currentThread().interrupt(); throw new IllegalStateException(exception); }
                toggle(firstHabit, "2027-01-04");
            }));
            if (!locked.await(10, TimeUnit.SECONDS)) { first.get(1, TimeUnit.SECONDS); fail("Goal lock not observed"); }
            var second = pool.submit(() -> tx.executeWithoutResult(status -> {
                secondPid.set(sql.queryForObject("select pg_backend_pid()", Integer.class)); toggle(secondHabit, "2027-01-04");
            }));
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(8); boolean blocked = false;
            while (System.nanoTime() < deadline) {
                if (secondPid.get() != 0 && Boolean.TRUE.equals(sql.queryForObject(
                        "select cardinality(pg_blocking_pids(?)) > 0", Boolean.class, secondPid.get()))) { blocked = true; break; }
                Thread.sleep(20);
            }
            release.countDown(); assertThat(blocked).isTrue(); assertThat(firstPid.get()).isNotEqualTo(secondPid.get());
            first.get(15, TimeUnit.SECONDS); second.get(15, TimeUnit.SECONDS);
        } finally { release.countDown(); }
        assertValue(goal, "12"); assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).hasSize(2);
    }

    @Test void keysetCronTraversesMoreThanOnePageAndRetryKeepsUniqueDays() {
        sql.update("""
                insert into habits(id,name,icon,color,current_streak,highest_streak,frequency,user_id)
                select md5(? || n)::uuid,'Sintético','check','BLUE',0,0,'DAILY',?
                from generate_series(1,501) n
                """, user.getId().toString(), user.getId());
        cron.processDailyHabits(); releaseCronLock(); cron.processDailyHabits();
        assertThat(sql.queryForObject("""
                select count(*) from habit_logs l join habits h on h.id=l.habit_id
                where h.user_id=? and l.log_date='2027-01-03' and l.status='FAILED'
                """, Integer.class, user.getId())).isEqualTo(501);
    }

    @Test void v11UpgradePreservesLegacyCalendarAndDoesNotInventGoalIdentity() {
        String schema = "cf022_" + UUID.randomUUID().toString().replace("-", "");
        Flyway before = Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).target("11").load();
        assertThat(before.migrate().migrationsExecuted).isEqualTo(11);
        sql.update("insert into " + schema + ".users(id,nome,email,senha,dark_mode,privacy_mode) values (?,'Sintético','legacy@example.invalid','synthetic',true,false)", user.getId());
        UUID habit = UUID.randomUUID(); UUID entry = UUID.randomUUID();
        sql.update("insert into " + schema + ".habits(id,name,icon,color,current_streak,highest_streak,frequency,user_id) values (?,'Legado','check','BLUE',3,7,'DAILY',?)", habit, user.getId());
        sql.update("insert into " + schema + ".habit_logs(id,habit_id,log_date,status) values (?,?,'2026-12-31','COMPLETED')", entry, habit);
        var after = Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).load();
        assertThat(after.migrate().migrationsExecuted).isOne();
        assertThat(after.migrate().migrationsExecuted).isZero(); after.validate();
        assertThat(sql.queryForObject("select status from " + schema + ".habit_logs where id=?", String.class, entry)).isEqualTo("COMPLETED");
        assertThat(sql.queryForObject("select goal_history_id from " + schema + ".habit_logs where id=?", UUID.class, entry)).isNull();
        assertThat(sql.queryForObject("select goal_effect_managed from " + schema + ".habit_logs where id=?", Boolean.class, entry)).isFalse();
        assertThat(sql.queryForObject("select current_streak from " + schema + ".habits where id=?", Integer.class, habit)).isEqualTo(3);
        assertThat(sql.queryForObject("select highest_streak from " + schema + ".habits where id=?", Integer.class, habit)).isEqualTo(7);
        assertThat(sql.queryForObject("select streak_as_of from " + schema + ".habits where id=?", LocalDate.class, habit)).isNull();
    }

    @Test void failedLogInsertRollsBackHistoryProgressAndStreak() {
        Goal goal = goal(); Habit habit = habit("Rollback de marcação", HabitFrequency.DAILY, goal);
        String function = "cf022_reject_" + UUID.randomUUID().toString().replace("-", "");
        sql.execute("create function " + function + "() returns trigger language plpgsql as $$ begin "
                + "if new.habit_id='" + habit.getId() + "'::uuid then raise exception 'CF022 synthetic habit failure'; end if; return new; end $$");
        sql.execute("create trigger " + function + " before insert on habit_logs for each row execute function " + function + "()");
        try {
            assertThatThrownBy(() -> toggle(habit, "2027-01-04")).hasMessageContaining("CF022 synthetic habit failure");
            assertValue(goal, "10"); assertStreak(habit, 0, 0);
            assertThat(history.findByGoalIdOrderByDateDesc(goal.getId())).isEmpty();
            assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-04"))).isEmpty();
        } finally { sql.execute("drop trigger " + function + " on habit_logs"); sql.execute("drop function " + function + "()"); }
        toggle(habit, "2027-01-04"); assertValue(goal, "11"); assertStreak(habit, 1, 1);
    }

    @Test void olderOperationWaitingAcrossMidnightCannotHideNewerCalendarDay() throws Exception {
        Habit habit = habit("Operações fora de ordem", HabitFrequency.DAILY, null);
        toggle(habit, "2027-01-04");
        var captured = new CountDownLatch(1); var release = new CountDownLatch(1);
        var firstThread = new AtomicReference<Thread>(); var intercepted = new AtomicBoolean();
        MethodInterceptor barrier = call -> {
            if (call.getMethod().getName().equals("findForUpdate") && call.getArguments()[0].equals(habit.getId())
                    && Thread.currentThread() == firstThread.get() && intercepted.compareAndSet(false, true)) {
                captured.countDown();
                if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Midnight barrier timeout");
            }
            return call.proceed();
        };
        ((Advised) habits).addAdvice(0, barrier);
        try (var pool = Executors.newSingleThreadExecutor()) {
            var older = pool.submit(() -> { firstThread.set(Thread.currentThread()); toggle(habit, "2027-01-04"); });
            if (!captured.await(10, TimeUnit.SECONDS)) { older.get(1, TimeUnit.SECONDS); fail("Old operation did not capture its day"); }
            at("2027-01-05T03:05:00Z"); toggle(habit, "2027-01-05");
            release.countDown(); older.get(15, TimeUnit.SECONDS);
        } finally { release.countDown(); ((Advised) habits).removeAdvice(barrier); }
        assertStreak(habit, 1, 1);
        assertThat(logs.findByHabitIdAndDate(habit.getId(), LocalDate.parse("2027-01-05")))
                .get().extracting(HabitLog::getStatus).isEqualTo(HabitStatus.COMPLETED);
    }

    private void concurrent(Habit habit, Runnable firstAction, Runnable secondAction) throws Exception {
        var locked = new CountDownLatch(1); var release = new CountDownLatch(1);
        var firstThread = new AtomicReference<Thread>(); var held = new AtomicBoolean();
        var firstPid = new AtomicInteger(); var secondPid = new AtomicInteger();
        MethodInterceptor barrier = call -> {
            Object result = call.proceed();
            if (call.getMethod().getName().equals("findForUpdate") && call.getArguments()[0].equals(habit.getId())
                    && Thread.currentThread() == firstThread.get() && held.compareAndSet(false, true)) {
                locked.countDown();
                if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Lock barrier timeout");
            }
            return result;
        };
        ((Advised) habits).addAdvice(0, barrier);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var first = pool.submit(() -> tx.executeWithoutResult(status -> {
                firstThread.set(Thread.currentThread()); firstPid.set(sql.queryForObject("select pg_backend_pid()", Integer.class));
                firstAction.run();
            }));
            if (!locked.await(10, TimeUnit.SECONDS)) { first.get(1, TimeUnit.SECONDS); fail("First lock not observed"); }
            var second = pool.submit(() -> tx.executeWithoutResult(status -> {
                secondPid.set(sql.queryForObject("select pg_backend_pid()", Integer.class)); secondAction.run();
            }));
            long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(8); boolean blocked = false;
            while (System.nanoTime() < deadline) {
                if (secondPid.get() != 0 && Boolean.TRUE.equals(sql.queryForObject(
                        "select cardinality(pg_blocking_pids(?)) > 0", Boolean.class, secondPid.get()))) { blocked = true; break; }
                Thread.sleep(20);
            }
            release.countDown();
            assertThat(blocked).as("PostgreSQL reports real lock contention").isTrue();
            assertThat(firstPid.get()).isNotEqualTo(secondPid.get());
            first.get(15, TimeUnit.SECONDS); second.get(15, TimeUnit.SECONDS);
        } finally { release.countDown(); ((Advised) habits).removeAdvice(barrier); }
    }

    private void at(String instant) {
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        when(clock.instant()).thenReturn(Instant.parse(instant));
    }

    private void releaseCronLock() {
        sql.update("update shedlock set lock_until = (current_timestamp AT TIME ZONE 'UTC') - interval '1 second' where name = 'processDailyHabitsLock'");
    }

    private Goal goal() {
        Goal goal = new Goal(); goal.setTitle("Meta numérica sintética"); goal.setType(GoalType.NUMERIC);
        goal.setTargetValue(new BigDecimal("100")); goal.setCurrentValue(new BigDecimal("10"));
        goal.setDeadline(LocalDate.parse("2028-01-01")); goal.setUser(user);
        return goals.save(goal);
    }

    private Habit habit(String name, HabitFrequency frequency, Goal goal) {
        Habit habit = new Habit(); habit.setName(name); habit.setIcon("check"); habit.setColor("BLUE");
        habit.setUser(user); habit.setFrequency(frequency); habit.setWeeklyGoal(frequency == HabitFrequency.WEEKLY_GOAL ? 2 : null);
        habit.setGoal(goal); return habits.save(habit);
    }

    private void toggle(Habit habit, String day) {
        service.toggleHabit(habit.getId(), new ToggleHabitDTO(LocalDate.parse(day)), user);
    }

    private void assertValue(Goal goal, String expected) {
        assertThat(goals.findById(goal.getId()).orElseThrow().getCurrentValue()).isEqualByComparingTo(expected);
    }

    private void assertStreak(Habit habit, int current, int highest) {
        var result = habits.findById(habit.getId()).orElseThrow();
        assertThat(result.getCurrentStreak()).isEqualTo(current);
        assertThat(result.getHighestStreak()).isEqualTo(highest);
    }
}
