package com.controlefinanceiro.api.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.module.SimpleModule;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Configuration(proxyBeanMethods = false)
public class TemporalConfig {

    public static final String DEFAULT_PRODUCT_ZONE = "America/Sao_Paulo";

    @Bean
    public ZoneId productZoneId(
            @Value("${app.temporal.product-zone:" + DEFAULT_PRODUCT_ZONE + "}") String configuredZone) {
        return ZoneId.of(configuredZone);
    }

    @Bean
    public Clock productClock(ZoneId productZoneId) {
        return Clock.system(productZoneId);
    }

    @Bean
    public JacksonModule strictTemporalJacksonModule() {
        SimpleModule module = new SimpleModule("strict-product-temporal-contract");
        module.addDeserializer(LocalDate.class, new StrictLocalDateDeserializer());
        return module;
    }
}
