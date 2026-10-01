package com.controlefinanceiro.api.service.listener;

import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.event.UserFinancialDataDeletedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CacheInvalidationListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "annualSummary", key = "#event.userId() + '-' + #event.year()")
    public void onFinancialDataChanged(UserFinancialDataChangedEvent event) {
        log.debug("Invalidação de cache executada para o usuário {} no ano {}", event.userId(), event.year());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @CacheEvict(value = "annualSummary", allEntries = true)
    public void onFinancialDataDeleted(UserFinancialDataDeletedEvent event) {
        // Preserve existing full eviction on account removal, now only after a successful commit.
        log.debug("Cache financeiro invalidado após exclusão do usuário {}",event.userId());
    }
}
