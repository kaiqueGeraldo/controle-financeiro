package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.databind.node.ArrayNode;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class OnboardingIndependentContractTest {
    @Test void twoMaximumAccountsDoNotAcquireAnIndividualAggregateCeiling() {
        var root=DraftValidatorTest.account("\"999999999999.99\"");
        var items=(ArrayNode)root.at("/payload/sections/accounts/items");
        var second=(ObjectNode)items.get(0).deepCopy();second.put("tempId",UUID.randomUUID().toString());items.add(second);
        var result=DraftValidatorTest.parse(root.toString());
        assertThat(result.issues()).isEmpty();
        assertThat(result.payload().at("/sections/accounts/items/0/balance/value").asText()).isEqualTo("999999999999.99");
        assertThat(result.payload().at("/sections/accounts/items/1/balance/value").asText()).isEqualTo("999999999999.99");
    }
    @Test void knownWithoutValueIsIncompleteWhileExplicitNullIsInvalid() {
        var root=DraftValidatorTest.account("\"0\"");
        var balance=(ObjectNode)root.at("/payload/sections/accounts/items/0/balance");balance.remove("value");
        var result=DraftValidatorTest.parse(root.toString());
        assertThat(result.issues()).extracting(DraftProblem.FieldError::path).contains("/sections/accounts/items/0/balance/value");
        assertThat(result.payload().at("/sections/accounts/items/0/balance").has("value")).isFalse();
        balance.putNull("value");
        assertThatThrownBy(()->DraftValidatorTest.parse(root.toString())).isInstanceOfSatisfying(DraftProblem.class,e->assertThat(e.status()).isEqualTo(400));
    }
    @Test void totalAtMinimumQuantityNeverBecomesAnInputPrice() throws Exception {
        ObjectNode root;
        try(var input=getClass().getResourceAsStream("/onboarding/e01.json")){root=(ObjectNode)DraftValidatorTest.JSON.readTree(input);}
        ((ObjectNode)root.at("/payload/sections/investments/items/1/quantity")).put("value","0.00000001");
        ((ObjectNode)root.at("/payload/sections/investments/items/1/valuation")).put("amount","999999999999.99");
        var result=DraftValidatorTest.parse(root.toString());
        assertThat(result.issues()).isEmpty();
        assertThat(result.payload().at("/sections/investments/items/1/valuation/amount").asText()).isEqualTo("999999999999.99");
        assertThat(result.payload().at("/sections/investments/items/1/quantity/value").asText()).isEqualTo("0.00000001");
        assertThat(result.payload().at("/sections/investments/items/1/valuation").has("price")).isFalse();
    }
}
