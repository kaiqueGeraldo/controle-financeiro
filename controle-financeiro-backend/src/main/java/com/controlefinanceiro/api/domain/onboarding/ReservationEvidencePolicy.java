package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

/** Protected storage is not a substitute for validating the evidence contract.
 * Malformed domain records stop application; stale, structurally valid evidence
 * is handled conservatively as UNBOUNDED by the reconciliation projection. */
public final class ReservationEvidencePolicy {
    private ReservationEvidencePolicy() {}
    public static void validate(JsonNode r) {
        require(r.isObject() && r.has("reservationId") && r.has("revision") && r.has("goal") && r.has("nominal") && r.has("attribution"));
        OnboardingCommand.uuid(r.path("reservationId"),"/existing/reservations/id");
        revision(r.path("revision"));amount(r.path("nominal"),false);
        JsonNode goal=r.path("goal");require(Set.of("KNOWN","UNKNOWN").contains(goal.path("state").asText()));
        if(goal.path("state").asText().equals("KNOWN"))ref(goal.path("value"),"GOAL");
        JsonNode a=r.path("attribution");String state=a.path("state").asText();
        require(Set.of("CONFIRMED","CANDIDATES","UNBOUNDED","CLOSED").contains(state));
        if(state.equals("UNBOUNDED")) {
            require(a.path("excluded").isArray());for(JsonNode e:a.path("excluded")){ref(e.path("source"),"ACCOUNT INVESTMENT");evidenceRefs(e.path("evidenceRefs"));}return;
        }
        evidenceRefs(a.path("evidenceRefs"));
        if(state.equals("CLOSED")){require(r.at("/nominal/state").asText().equals("KNOWN") && decimal(r.at("/nominal/value")).signum()==0);return;}
        JsonNode parts=a.path(state.equals("CONFIRMED")?"parts":"sources");require(parts.isArray()&&!parts.isEmpty());Set<String> seen=new HashSet<>();
        SummaryAmount sum=SummaryAmount.empty();
        for(JsonNode p:parts) {
            JsonNode source=state.equals("CONFIRMED")?p.path("source"):p;ref(source,"ACCOUNT INVESTMENT");require(seen.add(canonical(source).toString()));
            if(state.equals("CONFIRMED")) {
                JsonNode n=p.path("amount");amount(n,true);String knowledge=n.path("state").asText();
                SummaryAmount part=knowledge.equals("KNOWN")?SummaryAmount.known(decimal(n.get("value"))):knowledge.equals("PARTIAL")?
                        new SummaryAmount(decimal(n.get("knownSubtotal")),true,List.of("/part"),2):SummaryAmount.unknown("/part");sum=sum.plus(part);
            }
        }
        if(state.equals("CONFIRMED")) {
            JsonNode nominal=r.path("nominal");require(sum.json().path("state").equals(nominal.path("state")));
            if(sum.hasKnown())require(sum.subtotal().compareTo(decimal(nominal.get("knownSubtotal")))==0);
        }
    }
    private static void amount(JsonNode n,boolean individual) {
        require(n.isObject() && n.propertyNames().containsAll(Set.of("state","value","knownSubtotal","outsideIndividualRange","missingPaths")));
        String state=n.path("state").asText();require(Set.of("KNOWN","UNKNOWN","PARTIAL").contains(state));
        require(n.path("missingPaths").isArray());
        if(state.equals("KNOWN")) {decimalField(n.get("value"));require(n.path("value").equals(n.path("knownSubtotal")) && n.path("missingPaths").isEmpty());}
        else {require(n.path("value").isNull()&&!n.path("missingPaths").isEmpty());if(state.equals("PARTIAL"))decimalField(n.get("knownSubtotal"));else require(n.path("knownSubtotal").isNull()&&n.path("outsideIndividualRange").isNull());}
        if(!state.equals("UNKNOWN")) {
            BigDecimal value=decimal(n.get("knownSubtotal"));boolean outside=value.compareTo(SummaryAmount.MONEY_MAX)>0;
            require(n.path("outsideIndividualRange").isBoolean()&&n.path("outsideIndividualRange").booleanValue()==outside);
            if(individual)require(!outside && (!state.equals("KNOWN") || value.signum()>0));
        }
    }
    private static void decimalField(JsonNode n) {require(n!=null&&n.isTextual()&&n.asText().matches("(0|[1-9][0-9]*)\\.[0-9]{2}"));}
    private static void ref(JsonNode ref,String kinds) {
        require(ref.isObject()&&Arrays.asList(kinds.split(" ")).contains(ref.path("kind").asText())&&ref.has("id")!=ref.has("tempId"));
        OnboardingCommand.uuid(ref.get(ref.has("id")?"id":"tempId"),"/existing/reservations/ref");
    }
    private static void revision(JsonNode n) {require(n.isTextual()&&n.asText().matches("0|[1-9][0-9]{0,18}"));try{Long.parseLong(n.asText());}catch(NumberFormatException e){require(false);}}
    private static void evidenceRefs(JsonNode n) {require(n.isArray()&&!n.isEmpty());Set<String> seen=new HashSet<>();for(JsonNode id:n){OnboardingCommand.uuid(id,"/existing/evidence/id");require(seen.add(id.asText()));}}
    private static void require(boolean valid) {if(!valid)throw new DraftProblem(409,"SOURCE_CHANGED");}
}
