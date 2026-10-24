package com.controlefinanceiro.api.support;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.util.UUID;
import java.sql.DriverManager;

public final class PostgresTestContainerInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final String INITIALIZED = PostgresTestContainerInitializer.class.getName() + ".initialized";

    private static final String DATABASE_NAME = "cf_test_" + UUID.randomUUID().toString().replace("-", "");
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName(DATABASE_NAME)
            .withUsername("cf_test")
            .withPassword("cf_test");

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        // Specialized initializers call this explicitly, while Spring also
        // inherits it from the base test. Preserve their later schema override.
        if (applicationContext.getBeanFactory().containsSingleton(INITIALIZED)) {
            return;
        }
        startPostgres();
        DisposablePostgresGuard.requireDisposable(POSTGRES.getJdbcUrl(), DATABASE_NAME);

        // Each cached Spring context owns its DDL. Evicting one create-drop
        // context must not remove tables belonging to another live context.
        String schema = "cf_context_" + UUID.randomUUID().toString().replace("-", "");
        try (var connection = DriverManager.getConnection(POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(), POSTGRES.getPassword());
             var statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
        } catch (Exception exception) {
            throw new IllegalStateException("Nao foi possivel isolar o contexto descartavel", exception);
        }

        TestPropertyValues.of(
                "spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                "spring.datasource.username=" + POSTGRES.getUsername(),
                "spring.datasource.password=" + POSTGRES.getPassword(),
                "spring.datasource.hikari.schema=" + schema,
                "spring.jpa.properties.hibernate.default_schema=" + schema
        ).applyTo(applicationContext.getEnvironment());
        applicationContext.getBeanFactory().registerSingleton(INITIALIZED, new Object());
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
