package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import java.util.UUID;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

@TestPropertySource(properties={"onboarding.snapshot.max-bytes=1024","onboarding.snapshot.max-relations=1"})
class OnboardingCapacityHttpTest extends OnboardingApplicationSupport {
    @Test void capacityFailureThroughHttpLeavesDraftAndNoPreparationOrFinancialEffect() throws Exception {
        account("1000.00");save(minimal());var command=command(UUID.randomUUID());
        var result=http("/onboarding/prepare",node("contractVersion",1,"sessionId",command.sessionId().toString(),"expectedVersion","1","operationId",command.operationId().toString()),503,token);
        assertThat(result.at("/error/code").asText()).isEqualTo("SUMMARY_CAPACITY_EXCEEDED");assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(drafts.get(user.getId()).pendingIntent()).isNull();
        assertThat(sql.queryForObject("select count(*) from onboarding_preparations where user_id=?",Integer.class,user.getId())).isZero();assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
    }
}
