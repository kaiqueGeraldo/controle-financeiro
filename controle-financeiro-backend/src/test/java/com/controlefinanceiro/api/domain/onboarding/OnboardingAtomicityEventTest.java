package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.context.event.EventListener;
import java.math.BigDecimal;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@Import(OnboardingAtomicityEventTest.FailureConfiguration.class)
class OnboardingAtomicityEventTest extends OnboardingApplicationSupport {
    @TestConfiguration(proxyBeanMethods=false)
    static class FailureConfiguration {
        @Bean FailureListener failureListener(){return new FailureListener();}
    }
    static class FailureListener {
        volatile UUID failOwner;
        @EventListener public void onChange(UserFinancialDataChangedEvent event) {
            if(event.userId().equals(failOwner))throw new IllegalStateException("synthetic failure after receipt and terminal writes");
        }
    }
    @Autowired FailureListener failure;
    @Test void applicationFailureAfterReceiptAndTerminalWritesRollsBackEntireCommitAndCache() throws Exception {
        var p=prepare(e01());var c=completeCommand(p);failure.failOwner=user.getId();
        try{assertThatThrownBy(()->app.complete(user.getId(),c)).isInstanceOf(IllegalStateException.class);}
        finally{failure.failOwner=null;}
        assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(app.recover(user.getId(),c.operationId()).path("state").asText()).isEqualTo("PREPARED");
    }
}
