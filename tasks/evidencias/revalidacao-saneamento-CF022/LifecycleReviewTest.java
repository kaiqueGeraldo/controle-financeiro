package com.controlefinanceiro.api.domain.habit;

import com.zaxxer.hikari.HikariDataSource;
import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.*;
import org.springframework.aop.framework.Advised;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Observation only: inherited four cases and their assertions run unchanged. */
class LifecycleReviewTest extends HabitFixtureIsolationIntegrationTest {
    @Autowired ConfigurableApplicationContext application;
    private static ConfigurableApplicationContext previousContext;
    private static HikariDataSource previousPool;
    private static ThreadPoolTaskScheduler previousScheduler;
    private static final Set<String> schemas = new HashSet<>();
    private MethodInterceptor advice;
    private String schema;
    private final Set<String> observedThreads = java.util.concurrent.ConcurrentHashMap.newKeySet();

    private static void assertPreviousClosed() {
        if (previousContext == null) return;
        assertThat(previousContext.isActive()).as("Previous Spring context closed").isFalse();
        assertThat(previousPool.isClosed()).as("Previous pool closed").isTrue();
        assertThat(previousScheduler.getScheduledThreadPoolExecutor().isTerminated())
                .as("Previous scheduler executor terminated").isTrue();
        System.out.println("REVIEW previous context/pool/scheduler closed");
    }

    @BeforeEach void observeContext() throws Exception {
        assertPreviousClosed();
        assertThat(dataSource).isInstanceOf(HikariDataSource.class);
        assertThat(dispatcher).isInstanceOf(ThreadPoolTaskScheduler.class);
        schema=sql.queryForObject("select current_schema()",String.class);
        assertThat(schemas.add(schema)).as("Unique schema per method").isTrue();
        try(var connection=dataSource.getConnection()) {
            assertThat(connection.getSchema()).isEqualTo(schema);
            System.out.println("REVIEW schema="+schema+" connectionSchema="+connection.getSchema());
        }
        advice=call->{
            if(call.getMethod().getName().equals("findForUpdate")) {
                assertThat(sql.queryForObject("select current_schema()",String.class)).isEqualTo(schema);
                observedThreads.add(Thread.currentThread().getName());
            }
            return call.proceed();
        };
        ((Advised)habits).addAdvice(0,advice);
    }

    @AfterEach void rememberResources() {
        if(advice!=null)((Advised)habits).removeAdvice(advice);
        System.out.println("REVIEW worker schemas confirmed; threads="+observedThreads);
        previousContext=application;
        previousPool=(HikariDataSource)dataSource;
        previousScheduler=(ThreadPoolTaskScheduler)dispatcher;
    }

    @AfterAll static void lastResourcesClosed() { assertPreviousClosed(); }
}
