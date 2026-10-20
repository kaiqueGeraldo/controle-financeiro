package com.controlefinanceiro.api.service.onboarding;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static com.controlefinanceiro.api.domain.onboarding.SummaryAmount.*;

/** Authoritative producer for explicit V5 unreconciled flags. It preserves the raw
 * legacy facts and records a lack of proof, never a guessed nominal or source.
 * Runs only under the owner guard; no browser endpoint can write evidence. */
@Component
public class OnboardingReservationRegistry {
    private final JdbcTemplate jdbc;
    public OnboardingReservationRegistry(JdbcTemplate jdbc) {this.jdbc=jdbc;}
    public boolean materialize(UUID owner,OnboardingInventory.Snapshot inventory,JsonNode payload,Instant now) {
        Set<String> existing=new HashSet<>();for(JsonNode r:inventory.table("reservations"))existing.add(r.path("id").asText());
        List<Object[]> inserts=new ArrayList<>();
        for(JsonNode goal:inventory.table("goals")) if(goal.path("type").asText().equals("MONETARY") && !goal.path("allocation_reconciled").asBoolean()) {
            String id=goal.path("id").asText();if(existing.add(id))inserts.add(row(owner,id,node("kind","GOAL","id",id),"/existing/goals/"+id+"/progress",null,null,now));
        }
        Set<String> allocatedInvestments=new HashSet<>();for(JsonNode a:inventory.table("allocations"))if(a.hasNonNull("investment_id"))allocatedInvestments.add(a.path("investment_id").asText());
        for(JsonNode source:inventory.table("investments"))if(source.hasNonNull("goal_id") && !allocatedInvestments.contains(source.path("id").asText())) {
            String id=source.path("id").asText();if(existing.add(id))inserts.add(row(owner,id,node("kind","GOAL","id",source.path("goal_id").asText()),"/existing/investments/"+id+"/reservation",node("kind","INVESTMENT","id",id),OnboardingProjection.baseToken(inventory,payload),now));
        }
        if(inserts.isEmpty())return false;
        jdbc.batchUpdate("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,?,?)",inserts);return true;
    }
    private Object[] row(UUID owner,String id,JsonNode goal,String path,JsonNode source,String token,Instant now) {
        String evidenceId=UUID.nameUUIDFromBytes(("legacy-investment-reservation:"+id).getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
        JsonNode attribution=source==null?node("state","UNBOUNDED","excluded",List.of()):node("state","CONFIRMED","parts",List.of(node("source",source,"amount",unknown(path).json())),"evidenceRefs",List.of(evidenceId));
        JsonNode r=node("reservationId",id,"revision","0","goal",node("state","KNOWN","value",goal),"nominal",unknown(path).json(),"attribution",attribution);
        List<JsonNode> evidence=source==null?List.of():List.of(node("id",evidenceId,"revision","0","basis","DOMAIN_RECORD","reservationId",id,"claim","ASSIGNMENT","sources",List.of(source),"inventoryToken",token,"validatedAt",now.toString()));
        return new Object[]{UUID.fromString(id),owner,r.toString(),JSON.valueToTree(evidence).toString(),java.sql.Timestamp.from(now)};
    }
}
