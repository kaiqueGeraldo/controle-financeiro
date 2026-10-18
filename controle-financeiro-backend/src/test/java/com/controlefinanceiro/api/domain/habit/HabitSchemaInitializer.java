package com.controlefinanceiro.api.domain.habit;

import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.sql.DriverManager;
import java.util.UUID;

/** Schema isolation from legacy create-drop consumers on the shared disposable container. */
public final class HabitSchemaInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override public void initialize(ConfigurableApplicationContext context) {
        // A fresh context must never reconnect to the previous method's worker commits.
        String schema = "cf022_" + UUID.randomUUID().toString().replace("-", "");
        new PostgresTestContainerInitializer().initialize(context);
        var environment = context.getEnvironment();
        try (var connection = DriverManager.getConnection(environment.getRequiredProperty("spring.datasource.url"),
                environment.getRequiredProperty("spring.datasource.username"), environment.getRequiredProperty("spring.datasource.password"));
             var statement = connection.createStatement()) {
            statement.execute("create schema " + schema);
        } catch (Exception exception) { throw new IllegalStateException("Não foi possível isolar o schema CF-022", exception); }
        TestPropertyValues.of("spring.flyway.enabled=true", "spring.flyway.schemas=" + schema,
                "spring.flyway.default-schema=" + schema, "spring.datasource.hikari.schema=" + schema,
                "spring.jpa.hibernate.ddl-auto=validate", "spring.jpa.properties.hibernate.default_schema=" + schema)
                .applyTo(environment);
    }
}
