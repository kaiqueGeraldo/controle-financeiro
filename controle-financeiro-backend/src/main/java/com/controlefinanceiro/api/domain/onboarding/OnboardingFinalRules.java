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
            Map<String,String> overrides=new HashMap<>();List<JsonNode> lines=new ArrayList<>();lines.add(opening);
            opening.path("futureInstallments").forEach(lines::add);
            for(JsonNode line:lines) {
                JsonNode c=line.has("currentCompetence")?line.path("currentCompetence"):line.path("competence");
                if(!c.has("year") || !c.has("month"))continue;
                try {
                    if(CardCycle.forCompetence(YearMonth.of(c.path("year").intValue(),c.path("month").intValue()),card.path("closingDay").intValue(),card.path("dueDay").intValue()).dueDate().getYear()>9999)result.add(DraftProblem.issue(path,"DATE_INVALID"));
                }catch(java.time.DateTimeException | IllegalArgumentException e){result.add(DraftProblem.issue(path,"DATE_INVALID"));}
                String key=c.toString(),override=line.path("dueDateOverride").asText(null);
                if(override!=null && overrides.putIfAbsent(key,override)!=null && !overrides.get(key).equals(override))result.add(DraftProblem.issue(path,"INVOICE_COMPONENT_MISMATCH"));
            }
        }
        return result;
    }
}
