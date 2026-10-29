package com.controlefinanceiro.api.migration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.config.ScheduledTaskHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
@ContextConfiguration(initializers = EmptyMigrationTestInitializer.class)
class SchedulingBoundaryTest {
    @Autowired ApplicationContext context;

    @Test void disabledJobsRegisterNoScheduledTaskIncludingShedlockWork() {
        assertThat(context.getBeansOfType(ScheduledTaskHolder.class).values().stream()
                .flatMap(holder -> holder.getScheduledTasks().stream()).toList()).isEmpty();
        // Real job services are still present for existing explicit service consumers/tests.
        assertThat(context.getBeansOfType(com.controlefinanceiro.api.service.HabitCronService.class)).hasSize(1);
        assertThat(context.getBeansOfType(com.controlefinanceiro.api.service.InvoiceCronService.class)).hasSize(1);
        assertThat(context.getBeansOfType(com.controlefinanceiro.api.service.MarketDataService.class)).hasSize(1);
        assertThat(context.getBeansOfType(com.controlefinanceiro.api.service.NotificationCronService.class)).hasSize(1);
    }
}
