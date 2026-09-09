package com.controlefinanceiro.api.support;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.UUID;

public final class PostgresTestContainerInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String DATABASE_NAME = "cf_test_" + UUID.randomUUID().toString().replace("-", "");
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName(DATABASE_NAME)
            .withUsername("cf_test")
            .withPassword("cf_test");

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        startPostgres();
        DisposablePostgresGuard.requireDisposable(POSTGRES.getJdbcUrl(), DATABASE_NAME);

        TestPropertyValues.of(
                "spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                "spring.datasource.username=" + POSTGRES.getUsername(),
                "spring.datasource.password=" + POSTGRES.getPassword()
        ).applyTo(applicationContext.getEnvironment());
    }

    private static synchronized void startPostgres() {
        if (POSTGRES.isRunning()) {
            return;
        }

        try {
            POSTGRES.start();
        } catch (RuntimeException exception) {
            throw new IllegalStateException(
                    "PostgreSQL descartavel indisponivel. Inicie um runtime Docker compativel "
                            + "ou execute a verificacao no CI; nenhum banco externo sera usado como fallback.",
                    exception
            );
        }
    }
}
