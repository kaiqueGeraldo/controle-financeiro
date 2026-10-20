package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingCanonicalContractTest {
    @Test void e01ContentHashMatchesPreviouslyApprovedDocumentaryVector() throws Exception {
        byte[] input;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){input=stream.readAllBytes();}
        var payload=DraftValidator.parse(input).payload();
        assertThat(hash(node("contractVersion",1,"sessionId","00000000-0000-4000-8000-000000000801","draftVersion","1","payload",payload)))
                .isEqualTo("d0c76c433005f79c563d63a84c7850658f50ee18dd4c02fdbc3951c7ded95a99");
    }
    @Test void knowledgeAndWideAggregateRangeRemainIndependentWithManyMissingComponents() {
        SummaryAmount unknown=SummaryAmount.empty();for(int i=0;i<10000;i++)unknown=unknown.plus(SummaryAmount.unknown("/existing/"+i));
        assertThat(unknown.json().path("state").asText()).isEqualTo("UNKNOWN");assertThat(unknown.json().path("knownSubtotal").isNull()).isTrue();
        var partial=unknown.plus(SummaryAmount.known(new BigDecimal("0.00"))).json();assertThat(partial.path("state").asText()).isEqualTo("PARTIAL");assertThat(partial.path("knownSubtotal").asText()).isEqualTo("0.00");assertThat(partial.path("missingPaths").size()).isEqualTo(10000);
        var wide=SummaryAmount.known(new BigDecimal("999999999999.99")).plus(SummaryAmount.known(new BigDecimal("999999999999.99"))).json();assertThat(wide.path("state").asText()).isEqualTo("KNOWN");assertThat(wide.path("value").asText()).isEqualTo("1999999999999.98");assertThat(wide.path("outsideIndividualRange").booleanValue()).isTrue();
    }
}
