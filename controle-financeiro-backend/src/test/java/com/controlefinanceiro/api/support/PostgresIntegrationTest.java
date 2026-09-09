package com.controlefinanceiro.api.support;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@ActiveProfiles("test")
@SpringBootTest
@ContextConfiguration(initializers = PostgresTestContainerInitializer.class)
public abstract class PostgresIntegrationTest {

    @MockitoBean
    protected EmailService emailService;

    @MockitoBean
    protected MarketDataService marketDataService;
}
