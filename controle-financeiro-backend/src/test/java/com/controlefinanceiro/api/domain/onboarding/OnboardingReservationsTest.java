package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.service.onboarding.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static com.controlefinanceiro.api.domain.onboarding.SummaryAmount.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingReservationsTest extends OnboardingApplicationSupport {
    @Autowired OnboardingInventory inventories;
    JsonNode reservation(UUID id,String amount,JsonNode attribution,JsonNode goal) {
        return node("reservationId",id.toString(),"revision","0","goal",goal==null?node("state","UNKNOWN"):node("state","KNOWN","value",goal),
                "nominal",amount==null?unknown("/legacy/nominal").json():known(new BigDecimal(amount)).json(),"attribution",attribution);
    }
    JsonNode ref(UUID id) {return node("kind","ACCOUNT","id",id.toString());}
    void seed(JsonNode r,List<JsonNode> evidence) {
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,?,now())",UUID.fromString(r.path("reservationId").asText()),user.getId(),r.toString(),JSON.valueToTree(evidence).toString());
    }
    void section(ObjectNode write,String name,List<JsonNode> items) {((ObjectNode)write.at("/payload/sections/"+name)).put("answer",items.isEmpty()?"NONE":"PROVIDED").set("items",JSON.valueToTree(items));}
    JsonNode goal(UUID temp) {return node("tempId",temp.toString(),"action","CREATE","title","Synthetic reserve","type","MONETARY","target","600.00","deadline","2026-09-30");}
    JsonNode allocation(UUID goal,JsonNode source,String value) {return node("tempId",UUID.randomUUID().toString(),"goal",node("kind","GOAL","tempId",goal.toString()),"source",source,"amount",value);}
    String baseToken(ObjectNode write) {return new TransactionTemplate(txManager).execute(s->{guard.snapshot(user.getId());return OnboardingProjection.baseToken(inventories.load(user.getId()),write.path("payload"));});}
    JsonNode proof(UUID id,UUID reservation,String claim,List<JsonNode> sources,String token) {return node("id",id.toString(),"revision","0","basis","CURRENT_DECLARATION","reservationId",reservation.toString(),"claim",claim,"sources",sources,"inventoryToken",token,"validatedAt","2026-10-19T14:00:00Z");}
    @Test void e23UnboundedNominalIsKnownOnceAndEverySourceIsBlockedWithoutChangingWealth() {
        account("1000.00");account("500.00");account("100.00");UUID r=UUID.randomUUID();seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        var p=prepare(minimal());var s=p.path("summary");amount(s,"reservedAccounts","400.00");amount(s,"netWorth","1600.00");
        assertThat(s.at("/metrics/freeAccountCash/state").asText()).isEqualTo("UNKNOWN");
        for(JsonNode source:s.path("bySource")){assertThat(source.at("/reserved/state").asText()).isEqualTo("UNKNOWN");assertThat(source.at("/free/value").isNull()).isTrue();}
        for(JsonNode d:s.at("/reservationReview/decisions")){assertThat(d.path("blockingReservationIds")).contains(JSON.valueToTree(r.toString()));assertThat(d.path("state").asText()).isEqualTo("BLOCKED");}
        assertThat(app.complete(user.getId(),completeCommand(p)).path("summary")).isEqualTo(s);
    }
    @Test void e28NewIdAndCashDoNotMakeAnIndependentSource() {
        account("1000.00");UUID r=UUID.randomUUID(),source=UUID.randomUUID(),g=UUID.randomUUID();seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        ObjectNode write=minimal();section(write,"accounts",List.of(node("tempId",source.toString(),"action","CREATE","name","New source","type","CHECKING","balance",fact(new BigDecimal("100.00"),2),"deficitAcknowledged",false,"distinctCashConfirmed",false)));
        section(write,"goals",List.of(goal(g)));section(write,"allocations",List.of(allocation(g,node("kind","ACCOUNT","tempId",source.toString()),"10.00")));
        save(write);assertThatThrownBy(()->app.prepare(user.getId(),command(UUID.randomUUID()))).isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("SOURCE_RESERVATION_UNRECONCILED");});
        assertThat(sql.queryForObject("select count(*) from accounts where user_id=?",Integer.class,user.getId())).isEqualTo(1);
        section(write,"allocations",List.of());write.put("expectedVersion","1");save(write);var p=app.prepare(user.getId(),command(UUID.randomUUID()));amount(p.path("summary"),"reservedAccounts","400.00");
    }
    @Test void e32ExclusionNeedsCurrentEvidenceAndAllowsIndependent100GivingKnown500() {
        account("1000.00");account("500.00");UUID c=account("200.00"),r=UUID.randomUUID(),ev=UUID.randomUUID(),g=UUID.randomUUID();ObjectNode write=minimal();section(write,"goals",List.of(goal(g)));section(write,"allocations",List.of(allocation(g,ref(c),"100.00")));
        String token=baseToken(write);seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of(node("source",ref(c),"evidenceRefs",List.of(ev.toString())))),null),List.of(proof(ev,r,"EXCLUSION",List.of(ref(c)),token)));
        var p=prepare(write);amount(p.path("summary"),"reservedAccounts","500.00");amount(p.path("summary"),"netWorth","1700.00");
        JsonNode receipt=app.complete(user.getId(),completeCommand(p));assertThat(receipt.path("summary")).isEqualTo(p.path("summary"));
        assertThat(sql.queryForObject("select sum(a.amount) from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("100.00");
    }
    @Test void candidatesBecomeUnboundedWhenDraftAddsSourceOutsideCertifiedUniverse() {
        UUID a=account("1000.00"),r=UUID.randomUUID(),ev=UUID.randomUUID(),newSource=UUID.randomUUID();ObjectNode write=minimal();
        seed(reservation(r,"400.00",node("state","CANDIDATES","sources",List.of(ref(a)),"evidenceRefs",List.of(ev.toString())),null),List.of(proof(ev,r,"EXHAUSTIVE_CANDIDATES",List.of(ref(a)),baseToken(write))));
        section(write,"accounts",List.of(node("tempId",newSource.toString(),"action","CREATE","name","New","type","CHECKING","balance",fact(new BigDecimal("200.00"),2),"deficitAcknowledged",false,"distinctCashConfirmed",false)));
        var p=prepare(write);for(JsonNode d:p.at("/summary/reservationReview/decisions"))assertThat(d.path("blockingReservationIds").size()).isEqualTo(1);
        amount(p.path("summary"),"reservedAccounts","400.00");
    }
    @Test void e34RemovingCloseKeepsKnown400AndOriginalReservation() {
        account("1000.00");UUID r=UUID.randomUUID();seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        ObjectNode write=minimal();((ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node("reservationId",r.toString(),"expectedRevision","0","action","CLOSE","currentSituationConfirmed",true))));save(write);
        ((ObjectNode)write.path("payload")).remove("reservationConfirmations");write.put("expectedVersion","1");save(write);var p=app.prepare(user.getId(),command(UUID.randomUUID()));amount(p.path("summary"),"reservedAccounts","400.00");
        app.complete(user.getId(),completeCommand(p));assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,r)).isZero();
    }
    @Test void closingOneOfTwoReservationsPreservesOtherBlockAndAuditsCurrentDeclaration() {
        account("1000.00");UUID one=UUID.randomUUID(),two=UUID.randomUUID();seed(reservation(one,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());seed(reservation(two,null,node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        ObjectNode write=minimal();((ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node("reservationId",one.toString(),"expectedRevision","0","action","CLOSE","currentSituationConfirmed",true))));
        var p=prepare(write);var decision=p.at("/summary/reservationReview/decisions/0");assertThat(decision.path("blockingReservationIds")).isEqualTo(JSON.valueToTree(List.of(two.toString())));
        var receipt=app.complete(user.getId(),completeCommand(p));assertThat(receipt.path("summary")).isEqualTo(p.path("summary"));
        assertThat(sql.queryForObject("select count(*) from onboarding_reservation_history where user_id=?",Integer.class,user.getId())).isEqualTo(1);
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,user.getId())).isZero();
    }
    @Test void assignPreservesRealDeficitWithoutAuthorizingAnotherReservation() {
        UUID a=account("100.00"),r=UUID.randomUUID(),g=UUID.randomUUID();seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        ObjectNode write=minimal();section(write,"goals",List.of(goal(g)));((ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node("reservationId",r.toString(),"expectedRevision","0","action","ASSIGN","currentSituationConfirmed",true,"goal",node("kind","GOAL","tempId",g.toString()),"parts",List.of(node("source",ref(a),"amount","400.00"))))));
        var p=prepare(write);amount(p.path("summary"),"reservedAccounts","400.00");assertThat(p.at("/summary/bySource/0/free/value").asText()).isEqualTo("-300.00");assertThat(p.at("/summary/bySource/0/newAllocationCapacity/value").asText()).isEqualTo("0.00");
        app.complete(user.getId(),completeCommand(p));assertThat(sql.queryForObject("select amount from goal_allocations where reservation_id=?",BigDecimal.class,r)).isEqualByComparingTo("400.00");
    }
    @Test void mixedSourceTypesKeepNominalFromBeingDuplicatedAsTwoKnownTotals() {
        account("100.00");UUID r=UUID.randomUUID();seed(reservation(r,"400.00",node("state","UNBOUNDED","excluded",List.of()),null),List.of());
        ObjectNode write=minimal();section(write,"investments",List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Monetary","type","FIXED_INCOME","positionMode","MONETARY","quantity",node("state","NOT_APPLICABLE"),"cost",node("state","UNKNOWN"),"valuation",node("state","KNOWN","basis","TOTAL","amount","500.00","date","2026-10-09","source","USER_DECLARED"),"acquisitionDate",node("state","UNKNOWN"),"historicalSource",node("state","UNKNOWN"))));
        var p=prepare(write);assertThat(p.at("/summary/metrics/reservedAccounts/state").asText()).isEqualTo("UNKNOWN");assertThat(p.at("/summary/metrics/reservedInvestments/state").asText()).isEqualTo("UNKNOWN");amount(p.path("summary"),"netWorth","600.00");
    }
    @Test void confirmedPartialAmountPreservesKnownSubtotalAndBlocksOnlyIdentifiedSource() {
        UUID a=account("1000.00"),b=account("500.00"),r=UUID.randomUUID(),ev=UUID.randomUUID(),g=UUID.randomUUID();ObjectNode write=minimal();
        sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,version) values(?,'Partial legacy','MONETARY',600,0,'2026-09-30',?,true,0)",g,user.getId());
        JsonNode partial=node("state","PARTIAL","value",null,"knownSubtotal","300.00","outsideIndividualRange",false,"missingPaths",List.of("/legacy/rest"));
        JsonNode record=node("reservationId",r.toString(),"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",g.toString())),"nominal",partial,
                "attribution",node("state","CONFIRMED","parts",List.of(node("source",ref(a),"amount",partial)),"evidenceRefs",List.of(ev.toString())));
        seed(record,List.of(proof(ev,r,"ASSIGNMENT",List.of(ref(a)),baseToken(write))));
        var p=prepare(write);assertThat(p.at("/summary/metrics/reservedAccounts/state").asText()).isEqualTo("PARTIAL");assertThat(p.at("/summary/metrics/reservedAccounts/knownSubtotal").asText()).isEqualTo("300.00");
        assertThat(p.at("/summary/byGoal/0/progress/state").asText()).isEqualTo("PARTIAL");assertThat(p.at("/summary/byGoal/0/progress/knownSubtotal").asText()).isEqualTo("300.00");
        for(JsonNode source:p.at("/summary/bySource"))if(source.at("/ref/id").asText().equals(a.toString())){
            assertThat(source.at("/reserved/state").asText()).isEqualTo("PARTIAL");assertThat(source.at("/reserved/knownSubtotal").asText()).isEqualTo("300.00");assertThat(source.at("/free/state").asText()).isEqualTo("UNKNOWN");
        }
        assertThat(p.at("/summary/metrics/freeAccountCash/state").asText()).isEqualTo("PARTIAL");assertThat(p.at("/summary/metrics/freeAccountCash/knownSubtotal").asText()).isEqualTo("500.00");
        app.complete(user.getId(),completeCommand(p));
    }
}
