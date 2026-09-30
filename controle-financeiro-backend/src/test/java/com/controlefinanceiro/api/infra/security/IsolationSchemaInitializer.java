package com.controlefinanceiro.api.infra.security;

import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import java.sql.DriverManager;
import java.util.UUID;

public final class IsolationSchemaInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    private static final String SCHEMA = "cf023_" + UUID.randomUUID().toString().replace("-", "");
    @Override public void initialize(ConfigurableApplicationContext context) {
        new PostgresTestContainerInitializer().initialize(context);
        var env = context.getEnvironment();
        try (var connection = DriverManager.getConnection(env.getRequiredProperty("spring.datasource.url"),
                env.getRequiredProperty("spring.datasource.username"), env.getRequiredProperty("spring.datasource.password"));
             var statement = connection.createStatement()) {
            statement.execute("create schema if not exists " + SCHEMA);
        } catch (Exception exception) { throw new IllegalStateException("Schema CF-023 indisponível", exception); }
        TestPropertyValues.of("spring.flyway.enabled=true", "spring.flyway.schemas=" + SCHEMA,
                "spring.flyway.default-schema=" + SCHEMA, "spring.datasource.hikari.schema=" + SCHEMA,
                "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.properties.hibernate.default_schema=" + SCHEMA).applyTo(env);
    }
}
