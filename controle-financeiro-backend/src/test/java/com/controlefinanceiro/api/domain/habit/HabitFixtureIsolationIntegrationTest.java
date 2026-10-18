package com.controlefinanceiro.api.domain.habit;

import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.aop.framework.Advised;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/** Both orders and repeated preparation, using the real scheduler cases and worker commits. */
@TestMethodOrder(MethodOrderer.MethodName.class)
class HabitFixtureIsolationIntegrationTest extends HabitIntegrityIntegrationTest {
    @Test void aVolumeThenCallback() throws Exception { observe(true); }
    @Test void bCallbackAfterVolume() throws Exception { observe(false); }
    @Test void cRepeatedCallbackBeforeVolume() throws Exception { observe(false); }
    @Test void dVolumeAfterCallback() throws Exception { observe(true); }

    private void observe(boolean volume) throws Exception {
        int before = sql.queryForObject("select count(*) from habits", Integer.class);
        System.out.println("CF022 fixture before=" + before + " schema="
                + sql.queryForObject("select current_schema()", String.class) + " volume=" + volume);
        assertThat(before).as("No eligible fixtures inherited from another method").isZero();
        AtomicInteger reads = new AtomicInteger();
        MethodInterceptor observer = call -> {
            if (call.getMethod().getName().equals("findForUpdate")) reads.incrementAndGet();
            return call.proceed();
        };
        ((Advised) habits).addAdvice(0, observer);
        try {
            if (volume) keysetCronTraversesMoreThanOnePageAndRetryKeepsUniqueDays();
            else independentRegisteredSchedulerCallbackUsesProductTriggerAndDatabaseLock();
            int expected = volume ? 501 : 1;
            assertThat(reads.get()).isEqualTo(expected * 2);
            assertThat(sql.queryForObject("select count(*) from habits", Integer.class)).isEqualTo(expected);
            assertThat(sql.queryForObject("select count(*) from habit_logs where status='FAILED'", Integer.class)).isEqualTo(expected);
            assertThat(sql.queryForObject("select count(*) from goal_history", Integer.class)).isZero();
            System.out.println("CF022 fixture after=" + expected + " lockedReads=" + reads.get());
        } finally { ((Advised) habits).removeAdvice(observer); }
    }
}
