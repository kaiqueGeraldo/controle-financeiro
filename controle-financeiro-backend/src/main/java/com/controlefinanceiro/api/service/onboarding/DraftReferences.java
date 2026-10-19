package com.controlefinanceiro.api.service.onboarding;

import com.controlefinanceiro.api.domain.onboarding.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.*;

/** At most one ownership query per resource type, restricted to submitted identities. */
@Component
public class DraftReferences {
    private static final Map<String,String> TABLES=Map.of("ACCOUNT","accounts","INVESTMENT","investments",
            "CARD","credit_cards","GOAL","goals","CATEGORY","categories");
    private final NamedParameterJdbcTemplate jdbc;
    public DraftReferences(NamedParameterJdbcTemplate jdbc) {this.jdbc=jdbc;}
    public List<DraftProblem.FieldError> validate(UUID owner, DraftValidator.Write write) {
        List<DraftProblem.FieldError> issues=new ArrayList<>();
        Map<String,Set<UUID>> byKind=new HashMap<>();
        for(var ref:write.references()) if(ref.id()!=null) byKind.computeIfAbsent(ref.kind(),k->new HashSet<>()).add(ref.id());
        for(var group:byKind.entrySet()) {
            Map<UUID,String> found=new HashMap<>();
            String typeColumn=group.getKey().equals("CARD")?"null::text":"type";
            jdbc.query("select id, "+typeColumn+" from "+TABLES.get(group.getKey())+" where user_id=:owner and id in (:ids)",
                    Map.of("owner",owner,"ids",group.getValue()),rs->{found.put(rs.getObject(1,UUID.class),rs.getString(2));});
            if(found.size()!=group.getValue().size()) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
            if(group.getKey().equals("CATEGORY")) {
                for(var ref:write.references()) if(ref.kind().equals("CATEGORY")) {
                    String rowPath=ref.path().substring(0,ref.path().lastIndexOf('/'));
                    var row=write.payload().at(rowPath);
                    if(row.has("direction") && !row.get("direction").asText().equals(found.get(ref.id())))
                        issues.add(DraftProblem.issue(ref.path(),"CATEGORY_DIRECTION_MISMATCH"));
                }
            }
        }
        // Confirmations reference protected, versioned domain records, never arbitrary browser evidence.
        if(!write.confirmations().isEmpty()) {
            var ids=write.confirmations().stream().map(DraftValidator.Confirmation::id).toList();
            Map<UUID,Long> revisions=new HashMap<>();
            jdbc.query("select id, revision from onboarding_reservation_records where user_id=:owner and id in (:ids)",
                    Map.of("owner",owner,"ids",ids),rs->{revisions.put(rs.getObject(1,UUID.class),rs.getLong(2));});
            for(var confirmation:write.confirmations()) {
                Long actual=revisions.get(confirmation.id());
                if(actual==null) throw new DraftProblem(404,"REFERENCE_NOT_FOUND");
                if(actual!=confirmation.revision()) throw new DraftProblem(409,"SOURCE_CHANGED");
            }
        }
        return issues;
    }
    public String mode(UUID owner) {
        // No identity is inferred from the account name/type. SYSTEM_INITIALIZED is explicit provenance.
        boolean existing=Boolean.TRUE.equals(jdbc.queryForObject("""
            select exists(select 1 from accounts where user_id=:owner and
              (opening_origin is distinct from 'SYSTEM_INITIALIZED' or balance<>0 or opening_balance is distinct from 0
               or opening_recorded_at is null or opening_date is null or is_archived))
            or exists(select 1 from transactions where user_id=:owner)
            or exists(select 1 from investments where user_id=:owner)
            or exists(select 1 from credit_cards where user_id=:owner)
            or exists(select 1 from goals where user_id=:owner)
            or exists(select 1 from monthly_plans where user_id=:owner)
            or exists(select 1 from financial_commands where user_id=:owner)
            or exists(select 1 from financial_intent_receipts where user_id=:owner)
            or exists(select 1 from onboarding_reservation_records where user_id=:owner)
            or exists(select 1 from goal_allocations ga join accounts a on a.id=ga.account_id where a.user_id=:owner)
            """,Map.of("owner",owner),Boolean.class));
        return existing?"COMPLEMENT":"NEW";
    }
}
