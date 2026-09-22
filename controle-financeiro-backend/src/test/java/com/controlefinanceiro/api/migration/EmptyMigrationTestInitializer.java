package com.controlefinanceiro.api.migration;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

public final class EmptyMigrationTestInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    static final String SCHEMA = Cf017PostgresSupport.createSchema("cf017_empty");

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        TestPropertyValues.of(
                "spring.datasource.url=" + Cf017PostgresSupport.schemaJdbcUrl(SCHEMA),
                "spring.datasource.username=" + Cf017PostgresSupport.username(),
                "spring.datasource.password=" + Cf017PostgresSupport.password(),
                "spring.flyway.enabled=true",
                "spring.flyway.default-schema=" + SCHEMA,
                "spring.flyway.schemas=" + SCHEMA,
                "spring.flyway.create-schemas=false",
                "spring.flyway.baseline-on-migrate=false",
                "spring.jpa.hibernate.ddl-auto=validate"
        ).applyTo(applicationContext.getEnvironment());
    }
}
