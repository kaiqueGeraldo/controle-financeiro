package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.card.CardCycle;
import tools.jackson.databind.JsonNode;
import java.time.YearMonth;
import java.util.*;

/** Final-only rules supplement the persisted draft assessment without changing GET. */
public final class OnboardingFinalRules {
    private OnboardingFinalRules() {}
    public static List<DraftProblem.FieldError> issues(JsonNode payload) {
        List<DraftProblem.FieldError> result=new ArrayList<>();JsonNode cards=payload.at("/sections/cards/items");
        for(int i=0;i<cards.size();i++) {
            JsonNode card=cards.get(i),opening=card.path("opening");if(opening.isMissingNode())continue;
            String path="/sections/cards/items/"+i+"/opening";
            if(!opening.path("creditNotNettedAcknowledged").asBoolean())result.add(DraftProblem.issue(path+"/creditNotNettedAcknowledged","BOUNDARY_UNCONFIRMED"));
            if(!card.path("action").asText().equals("CREATE") || !card.has("closingDay") || !card.has("dueDay"))continue;
            result.addAll(openingIssues(opening,card.path("closingDay").intValue(),card.path("dueDay").intValue(),path));
        }
        return result;
    }

    public static List<DraftProblem.FieldError> openingIssues(JsonNode opening,int closingDay,int dueDay,String path) {
        List<DraftProblem.FieldError> result=new ArrayList<>();
        Map<String,String> overrides=new HashMap<>();List<JsonNode> lines=new ArrayList<>();lines.add(opening);
        opening.path("futureInstallments").forEach(lines::add);
        for(JsonNode line:lines) {
            JsonNode c=line.has("currentCompetence")?line.path("currentCompetence"):line.path("competence");
            if(!c.has("year") || !c.has("month"))continue;
            try { openingCycle(YearMonth.of(c.path("year").intValue(),c.path("month").intValue()),closingDay,dueDay,path); }
            catch(DraftProblem e){result.addAll(e.fields());}
            String key=c.toString(),override=line.path("dueDateOverride").asText(null);
            if(override!=null && overrides.putIfAbsent(key,override)!=null && !overrides.get(key).equals(override))result.add(DraftProblem.issue(path,"INVOICE_COMPONENT_MISMATCH"));
        }
        return result;
    }

    /** Opening civil dates have the public range, not LocalDate's wider internal range. */
    public static CardCycle openingCycle(YearMonth month,int closingDay,int dueDay,String path) {
        try {
            CardCycle cycle=CardCycle.forCompetence(month,closingDay,dueDay);
            if(cycle.closingDate().getYear()<1 || cycle.closingDate().getYear()>9999
                    || cycle.dueDate().getYear()<1 || cycle.dueDate().getYear()>9999)throw new IllegalArgumentException("Civil date range");
            return cycle;
        }catch(java.time.DateTimeException | IllegalArgumentException e) {
            throw new DraftProblem(400,"BUSINESS_RULE",List.of(DraftProblem.issue(path,"DATE_INVALID")));
        }
    }
}
