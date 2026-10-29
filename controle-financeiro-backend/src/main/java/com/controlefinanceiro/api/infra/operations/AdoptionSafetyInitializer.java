package com.controlefinanceiro.api.infra.operations;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;

import java.util.Map;

/** Runs before refresh: an unsafe override must fail before any schema initializer. */
public final class AdoptionSafetyInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {
    @Override public int getOrder() { return Ordered.LOWEST_PRECEDENCE; }

    @Override public void initialize(ConfigurableApplicationContext context) {
        ConfigurableEnvironment env = context.getEnvironment();
        if (!env.matchesProfiles("adoption")) return;
        require(env, "spring.jpa.hibernate.ddl-auto", "validate");
        require(env, "spring.flyway.enabled", "false");
        require(env, "spring.sql.init.mode", "never");
        if (env.getProperty("spring.jpa.generate-ddl", Boolean.class, false)) {
            throw unsafe("spring.jpa.generate-ddl");
        }
        Map<String, String> jpa = Binder.get(env).bind("spring.jpa.properties", Bindable.mapOf(String.class, String.class))
                .orElse(Map.of());
        if (jpa.containsKey("hibernate.hbm2ddl.auto") && !"validate".equalsIgnoreCase(jpa.get("hibernate.hbm2ddl.auto"))) {
            throw unsafe("spring.jpa.properties.hibernate.hbm2ddl.auto");
        }
        // Even "none" can override hbm2ddl=validate and silently skip schema validation.
        for (String key : java.util.List.of("jakarta.persistence.schema-generation.database.action",
                "javax.persistence.schema-generation.database.action")) {
            if (jpa.containsKey(key) || env.containsProperty(key)) throw unsafe("spring.jpa.properties." + key);
        }
        if (!env.getProperty("app.operations.writers-enabled", Boolean.class, false)
                && env.getProperty("app.operations.jobs-enabled", Boolean.class, false)) {
            throw unsafe("app.operations.jobs-enabled");
        }
    }

    private static void require(ConfigurableEnvironment env, String key, String expected) {
        if (!expected.equalsIgnoreCase(env.getProperty(key, "").trim())) throw unsafe(key);
    }
    private static IllegalStateException unsafe(String key) {
        // Never include externally supplied values, URLs or secrets in diagnostics.
        return new IllegalStateException("Unsafe adoption configuration: " + key);
    }
}
