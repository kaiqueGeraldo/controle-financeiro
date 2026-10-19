package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import static org.assertj.core.api.Assertions.*;

class DraftValidatorTest {
    static final JsonMapper JSON=new JsonMapper();
    static String minimal() {return """
        {"contractVersion":1,"expectedVersion":"0","action":"SAVE","payload":{
        "context":{"currency":"BRL","baseDate":"2026-10-09","boundaryAcknowledged":true,"cashOnlyAcknowledged":true},
        "currentStep":"REVIEW","sections":{"accounts":{"answer":"NONE","items":[]},
        "cards":{"answer":"NONE","items":[]},"investments":{"answer":"NONE","items":[]},
        "goals":{"answer":"NONE","items":[]},"allocations":{"answer":"NONE","items":[]},"forecasts":{"answer":"NONE","items":[]}}}}
        """;}
    static DraftValidator.Write parse(String text) {return DraftValidator.parse(text.getBytes(StandardCharsets.UTF_8));}
    static ObjectNode account(String value) {
        ObjectNode root=(ObjectNode)JSON.readTree(minimal());
        ObjectNode section=(ObjectNode)root.at("/payload/sections/accounts");section.put("answer","PROVIDED");
        section.putArray("items").add(JSON.readTree("""
            {"tempId":"00000000-0000-4000-8000-000000000001","action":"CREATE","name":" Corrente ",
            "type":"CHECKING","balance":{"state":"KNOWN","value":%s},"deficitAcknowledged":true,"distinctCashConfirmed":false}
            """.formatted(value)));
        return root;
    }
    @Test void e02HasNoIssuesAndE01RetainsOriginalNumbersAndExpiredDeadline() throws Exception {
        assertThat(parse(minimal()).issues()).isEmpty();
        try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")) {
            var write=DraftValidator.parse(stream.readAllBytes());assertThat(write.issues()).isEmpty();
            assertThat(write.payload().at("/sections/goals/items/1/deadline").asText()).isEqualTo("2026-09-30");
            assertThat(write.payload().at("/sections/investments/items/1/valuation/amount").asText()).isEqualTo("1.00");
        }
    }
    @ParameterizedTest @ValueSource(strings={"\"0\"","\"1.2\"","\"-0.01\"","\"999999999999.99\"","\"-999999999999.99\""})
    void exactValidMoney(String money) {
        var write=parse(account(money).toString());assertThat(write.issues()).isEmpty();
        assertThat(write.payload().at("/sections/accounts/items/0/name").asText()).isEqualTo("Corrente");
        assertThat(write.payload().at("/sections/accounts/items/0/balance/value").isTextual()).isTrue();
    }
    @ParameterizedTest @ValueSource(strings={"1.2","null","true","\"1.005\"","\"1000000000000\"","\"1e2\"","\"01\"","\"-0\"","\"-0.00\"","\"+1\"","\"1,20\"","\" 1\"","{}","[]"})
    void rejectsMalformedMoneyWithoutEchoingValue(String money) {
        assertThatThrownBy(()->parse(account(money).toString())).isInstanceOfSatisfying(DraftProblem.class,e->{
            assertThat(e.status()).isEqualTo(400);assertThat(e.fields().getFirst().path()).endsWith("/balance/value");
        });
    }
    @ParameterizedTest @ValueSource(strings={"2027-02-29","1900-02-29","0000-01-01","2026-9-01","2026-01-01T00:00:00Z"})
    void rejectsInvalidCivilDates(String date) {assertThatThrownBy(()->parse(minimal().replace("2026-10-09",date))).isInstanceOf(DraftProblem.class);}
    @ParameterizedTest @ValueSource(strings={"2000-02-29","0001-01-01","9999-12-31"})
    void preservesValidCivilDates(String date) {assertThat(parse(minimal().replace("2026-10-09",date)).payload().at("/context/baseDate").asText()).isEqualTo(date);}
    @Test void absentLeavesAreIssuesAndUnknownNeverBecomesZero() {
        var root=account("\"0\"");var item=(ObjectNode)root.at("/payload/sections/accounts/items/0");item.remove("name");
        item.set("balance",JSON.readTree("{\"state\":\"UNKNOWN\"}"));
        var write=parse(root.toString());assertThat(write.issues()).extracting(DraftProblem.FieldError::path).contains("/sections/accounts/items/0/name");
        assertThat(write.payload().at("/sections/accounts/items/0/balance").has("value")).isFalse();
        item.set("balance",JSON.readTree("{\"state\":\"UNKNOWN\",\"value\":\"0\"}"));
        assertThatThrownBy(()->parse(root.toString())).isInstanceOf(DraftProblem.class);
    }
    @Test void closedSchemaDuplicateKeysAndTrailingJsonAreRejected() {
        for(String text:new String[]{minimal().replace("\"contractVersion\":1","\"contractVersion\":1,\"contractVersion\":1"),
                minimal()+" {}",minimal().replace("\"action\":\"SAVE\"","\"action\":\"SAVE\",\"owner\":\"private\""),
                minimal().replace("\"boundaryAcknowledged\":true","\"boundaryAcknowledged\":\"true\"")})
            assertThatThrownBy(()->parse(text)).isInstanceOf(DraftProblem.class);
    }
    @Test void bodyAndItemLimitsAreEnforcedWithoutTruncation() {
        assertThatThrownBy(()->DraftValidator.parse(new byte[262145])).isInstanceOfSatisfying(DraftProblem.class,e->assertThat(e.status()).isEqualTo(413));
        var root=account("\"1\"");var items=(tools.jackson.databind.node.ArrayNode)root.at("/payload/sections/accounts/items");
        var original=items.get(0).deepCopy();for(int i=1;i<51;i++){ObjectNode copy=(ObjectNode)original.deepCopy();copy.put("tempId",java.util.UUID.randomUUID().toString());items.add(copy);}
        assertThatThrownBy(()->parse(root.toString())).isInstanceOfSatisfying(DraftProblem.class,e->assertThat(e.fields().getFirst().code()).isEqualTo("ITEM_LIMIT"));
        items.remove(50);assertThat(parse(root.toString()).issues()).isEmpty();
    }
    @ParameterizedTest @ValueSource(strings={"\"01\"","1","\"9223372036854775808\"","\"-1\""})
    void invalidRevision(String revision) {assertThatThrownBy(()->parse(minimal().replace("\"expectedVersion\":\"0\"","\"expectedVersion\":"+revision))).isInstanceOf(DraftProblem.class);}
    @Test void maxRevisionIsExactAndDiscardOmitsPayload() {
        assertThat(parse(minimal().replace("\"expectedVersion\":\"0\"","\"expectedVersion\":\"9223372036854775807\"")).expectedVersion()).isEqualTo(Long.MAX_VALUE);
        assertThat(parse("{\"contractVersion\":1,\"expectedVersion\":\"1\",\"action\":\"DISCARD\"}").payload()).isNull();
        assertThatThrownBy(()->parse(minimal().replace("SAVE","DISCARD"))).isInstanceOf(DraftProblem.class);
    }
    @Test void danglingTemporaryReferenceSurvivesWithIssue() {
        var root=(ObjectNode)JSON.readTree(minimal());var section=(ObjectNode)root.at("/payload/sections/allocations");section.put("answer","PROVIDED");
        section.putArray("items").add(JSON.readTree("""
            {"tempId":"00000000-0000-4000-8000-000000000001",
             "goal":{"kind":"GOAL","tempId":"00000000-0000-4000-8000-000000000002"},
             "source":{"kind":"ACCOUNT","tempId":"00000000-0000-4000-8000-000000000003"},"amount":"300"}
            """));
        var write=parse(root.toString());assertThat(write.issues()).filteredOn(e->e.code().equals("REFERENCE_PENDING")).hasSize(2);
        assertThat(write.payload().at("/sections/allocations/items/0/amount").asText()).isEqualTo("300.00");
    }
    @Test void incompleteLeavesInEverySectionRemainSavable() {
        var root=(ObjectNode)JSON.readTree(minimal());
        for(String section:java.util.List.of("accounts","cards","investments","goals","allocations","forecasts")) {
            var node=(ObjectNode)root.at("/payload/sections/"+section);node.put("answer","UNANSWERED");
            var item=node.putArray("items").addObject();item.put("tempId",java.util.UUID.randomUUID().toString());
            if(java.util.Set.of("accounts","cards","investments","goals").contains(section)) item.put("action","CREATE");
            if(section.equals("investments")) item.put("positionMode","UNIT");
            if(section.equals("goals")) item.put("type","NUMERIC");
        }
        assertThat(parse(root.toString()).issues().size()).isGreaterThan(20);
    }
    @Test void unknownQuantityAndPriceExtremesNeverPassThroughFloatingPoint() throws Exception {
        ObjectNode root;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){root=(ObjectNode)JSON.readTree(stream);}
        var quantity=(ObjectNode)root.at("/payload/sections/investments/items/1/quantity");quantity.put("value","999999999999.99999999");
        var result=parse(root.toString());assertThat(result.payload().at("/sections/investments/items/1/quantity/value").asText()).isEqualTo("999999999999.99999999");
        quantity.put("value","1000000000000.00000000");assertThatThrownBy(()->parse(root.toString())).isInstanceOf(DraftProblem.class);
    }
    @Test void inconsistentInvoiceIsRetainedAsIssueNotSilentlyCorrected() throws Exception {
        ObjectNode root;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){root=(ObjectNode)JSON.readTree(stream);}
        ((ObjectNode)root.at("/payload/sections/cards/items/0/opening/currentPrincipal")).put("value","195");
        var write=parse(root.toString());assertThat(write.issues()).extracting(DraftProblem.FieldError::code).contains("INVOICE_COMPONENT_MISMATCH");
        assertThat(write.payload().at("/sections/cards/items/0/opening/currentPrincipal/value").asText()).isEqualTo("195.00");
    }
    @Test void incompleteKnowledgeAndUnconfirmedBoundariesAreExplicitIssues() throws Exception {
        ObjectNode root;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){root=(ObjectNode)JSON.readTree(stream);}
        ((ObjectNode)root.at("/payload/context")).put("boundaryAcknowledged",false).put("cashOnlyAcknowledged",false);
        ((ObjectNode)root.at("/payload/sections/accounts/items/0")).set("balance",JSON.readTree("{\"state\":\"UNKNOWN\"}"));
        ((ObjectNode)root.at("/payload/sections/investments/items/1")).set("quantity",JSON.readTree("{\"state\":\"UNKNOWN\"}"));
        var result=parse(root.toString());
        assertThat(result.issues()).extracting(DraftProblem.FieldError::code)
                .contains("BOUNDARY_UNCONFIRMED","CASH_ONLY_UNCONFIRMED","BALANCE_REQUIRED","QUANTITY_REQUIRED");
        assertThat(result.payload().at("/sections/investments/items/1/quantity").has("value")).isFalse();
    }
}
