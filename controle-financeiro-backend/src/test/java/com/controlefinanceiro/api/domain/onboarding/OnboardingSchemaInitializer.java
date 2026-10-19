package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import java.sql.DriverManager;
import java.util.UUID;

public final class OnboardingSchemaInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
    @Override public void initialize(ConfigurableApplicationContext context) {
        new PostgresTestContainerInitializer().initialize(context);
        var env=context.getEnvironment();String schema="cf029_"+UUID.randomUUID().toString().replace("-","");
        try(var connection=DriverManager.getConnection(env.getRequiredProperty("spring.datasource.url"),
                env.getRequiredProperty("spring.datasource.username"),env.getRequiredProperty("spring.datasource.password"));var statement=connection.createStatement()) {
            statement.execute("create schema "+schema);
        } catch(Exception e){throw new IllegalStateException("Disposable CF029 schema unavailable",e);}
        TestPropertyValues.of("spring.flyway.enabled=true","spring.flyway.schemas="+schema,"spring.flyway.default-schema="+schema,
                "spring.datasource.hikari.schema="+schema,"spring.jpa.hibernate.ddl-auto=validate","spring.jpa.properties.hibernate.default_schema="+schema).applyTo(env);
    }
}
