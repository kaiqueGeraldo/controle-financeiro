package com.controlefinanceiro.api.service.listener;

import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CacheInvalidationListener {

    @EventListener
    @CacheEvict(value = "annualSummary", key = "#event.userId() + '-' + #event.year()")
    public void onFinancialDataChanged(UserFinancialDataChangedEvent event) {
        log.debug("Invalidação de cache executada para o usuário {} no ano {}", event.userId(), event.year());
    }
}