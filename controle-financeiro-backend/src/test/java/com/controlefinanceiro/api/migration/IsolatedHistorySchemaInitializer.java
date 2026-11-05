package com.controlefinanceiro.api.migration;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

/** A history observer requires an empty schema owned by its Spring context. */
public class IsolatedHistorySchemaInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override
    public void initialize(ConfigurableApplicationContext context) {
        String schema=Cf017PostgresSupport.createSchema("cf014_history");
        TestPropertyValues.of(
                "spring.datasource.url="+Cf017PostgresSupport.schemaJdbcUrl(schema),
                "spring.datasource.username="+Cf017PostgresSupport.username(),
                "spring.datasource.password="+Cf017PostgresSupport.password(),
                "spring.flyway.enabled=true",
                "spring.flyway.default-schema="+schema,
                "spring.flyway.schemas="+schema,
                "spring.flyway.create-schemas=false",
                "spring.flyway.baseline-on-migrate=false",
                "spring.jpa.hibernate.ddl-auto=validate"
        ).applyTo(context.getEnvironment());
    }
}
