package com.controlefinanceiro.api.domain.onboarding;

import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.DraftProblem.*;

/** Incomplete/cross-field answers remain recoverable; these issues are not authorization to finalize. */
final class DraftConsistency {
    private DraftConsistency() {}
    static List<FieldError> issues(JsonNode payload) {
        List<FieldError> result=new ArrayList<>();
        JsonNode sections=payload.get("sections"), context=payload.get("context");
        if(context.has("boundaryAcknowledged") && !context.get("boundaryAcknowledged").asBoolean(false))
            result.add(issue("/context/boundaryAcknowledged","BOUNDARY_UNCONFIRMED"));
        if(context.has("cashOnlyAcknowledged") && !context.get("cashOnlyAcknowledged").asBoolean(false))
            result.add(issue("/context/cashOnlyAcknowledged","CASH_ONLY_UNCONFIRMED"));
        Map<String,String> aliases=new HashMap<>();
        for(String section:List.of("accounts","investments","cards","goals"))
            for(JsonNode item:sections.get(section).get("items"))
                if(item.has("ref")) aliases.put(item.get("tempId").asText(""),identity(item.get("ref"),Map.of()));
        for(String section:List.of("accounts","investments","cards")) {
            var items=sections.get(section).get("items");
            for(int i=0;i<items.size();i++) {
                JsonNode n=items.get(i);String p="/sections/"+section+"/items/"+i;
                if(section.equals("accounts")) {
                    if(n.path("balance").path("state").asText("").equals("UNKNOWN"))
                        result.add(issue(p+"/balance","BALANCE_REQUIRED"));
                    BigDecimal balance=known(n.path("balance"));
                    if(balance!=null && balance.signum()<0 && !n.path("deficitAcknowledged").asBoolean(false)) result.add(issue(p+"/deficitAcknowledged","DEFICIT_UNCONFIRMED"));
                    if(n.path("type").asText("").equals("CASH") && !n.path("distinctCashConfirmed").asBoolean(false)) result.add(issue(p+"/distinctCashConfirmed","DISTINCT_CASH_UNCONFIRMED"));
                } else if(section.equals("investments")) {
                    if(n.path("positionMode").asText("").equals("UNIT") && n.path("quantity").path("state").asText("").equals("UNKNOWN"))
                        result.add(issue(p+"/quantity","QUANTITY_REQUIRED"));
                    if(!context.has("baseDate")) continue;
                    LocalDate base=LocalDate.parse(context.get("baseDate").asText(""));
                    if(n.path("valuation").has("date") && LocalDate.parse(n.path("valuation").get("date").asText("")).isAfter(base)) result.add(issue(p+"/valuation/date","AFTER_BASE_DATE"));
                    if(n.path("acquisitionDate").has("value") && LocalDate.parse(n.path("acquisitionDate").get("value").asText("")).isAfter(base)) result.add(issue(p+"/acquisitionDate/value","AFTER_BASE_DATE"));
                } else if(section.equals("cards") && n.has("opening")) {
                    var opening=n.get("opening");String q=p+"/opening";
                    components(opening,"currentOutstanding","currentPrincipal","currentCharges",q,result);
                    Integer current=competence(opening.path("currentCompetence"));
                    BigDecimal debt=decimal(opening,"currentOutstanding");
                    var future=opening.get("futureInstallments");
                    for(int j=0;j<future.size();j++) {
                        var row=future.get(j);String r=q+"/futureInstallments/"+j;
                        components(row,"amount","principal","charges",r,result);
                        Integer next=competence(row.path("competence"));
                        if(current!=null && next!=null && next<=current) result.add(issue(r+"/competence","CURRENT_INSTALLMENT_DUPLICATED"));
                        if(debt!=null) debt=row.has("amount")?debt.add(decimal(row,"amount")):null;
                    }
                    if(debt!=null && debt.compareTo(new BigDecimal("999999999999.99"))>0) result.add(issue(q,"DECIMAL_RANGE"));
                }
            }
        }
        Set<String> pairs=new HashSet<>();
        var allocations=sections.get("allocations").get("items");
        for(int i=0;i<allocations.size();i++) {
            var row=allocations.get(i);
            pair(row.path("goal"),row.path("source"),aliases,pairs,"/sections/allocations/items/"+i,result);
        }
        if(payload.has("reservationConfirmations")) for(int i=0;i<payload.get("reservationConfirmations").size();i++) {
            var row=payload.get("reservationConfirmations").get(i);
            if(row.has("parts")) for(JsonNode part:row.get("parts"))
                pair(row.path("goal"),part.path("source"),aliases,pairs,"/reservationConfirmations/"+i,result);
        }
        return result;
    }
    private static void pair(JsonNode goal,JsonNode source,Map<String,String> aliases,Set<String> pairs,String p,List<FieldError> result) {
        if(goal.isMissingNode() || source.isMissingNode()) return;
        if(!pairs.add(identity(goal,aliases)+"|"+identity(source,aliases))) result.add(issue(p,"DUPLICATE_REFERENCE"));
    }
    private static String identity(JsonNode ref,Map<String,String> aliases) {
        if(ref.has("tempId")) return aliases.getOrDefault(ref.get("tempId").asText(""),ref.path("kind").asText("")+":"+ref.get("tempId").asText(""));
        return ref.path("kind").asText("")+":"+ref.path("id").asText("");
    }
    private static Integer competence(JsonNode n) {return n.has("year") && n.has("month")?n.get("year").intValue()*12+n.get("month").intValue():null;}
    private static BigDecimal decimal(JsonNode n,String key) {return n.has(key)?new BigDecimal(n.get(key).asText("")):null;}
    private static BigDecimal known(JsonNode fact) {return fact.path("state").asText("").equals("KNOWN")?decimal(fact,"value"):null;}
    private static void components(JsonNode n,String amount,String principal,String charges,String p,List<FieldError> result) {
        BigDecimal a=decimal(n,amount),b=known(n.path(principal)),c=known(n.path(charges));
        if((b==null)!=(c==null) || (a!=null && b!=null && c!=null && a.compareTo(b.add(c))!=0))
            result.add(issue(p,"INVOICE_COMPONENT_MISMATCH"));
    }
}
