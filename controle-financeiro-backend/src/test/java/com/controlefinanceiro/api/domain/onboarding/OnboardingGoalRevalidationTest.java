package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import tools.jackson.databind.node.ObjectNode;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Select revalidation*; inherited fixtures and controls are not counted again. */
class OnboardingGoalRevalidationTest extends OnboardingReservationIssueTest {
    @Test void revalidationMixedKindsHaveLiteralPathsAndPreserveEntirePayload() throws Exception {
        var root=draft();
        ((ObjectNode)root.at("/payload/sections/accounts/items/0")).put("name","Corrente");
        ((ObjectNode)root.at("/payload/sections/accounts/items/0/balance")).put("value","100.00");
        var monetary=goal(root,"DIRECT","MONETARY");
        var created=goal(root,"CREATE","NUMERIC");
        ((ObjectNode)root.at("/payload/sections/goals/items/0")).put("target","12.00000000").put("initialProgress","4.00000000");
        var alias=goal(root,"ALIAS","NUMERIC");
        allocation(root,monetary);allocation(root,created);
        var confirmations=((ObjectNode)root.get("payload")).putArray("reservationConfirmations");
        for(var ref:List.of(alias,monetary)) {
            UUID record=UUID.randomUUID();
            sql.update("insert into onboarding_reservation_records values(?,?,7,'{}','[]',now())",record,a.getId());
            var row=confirmations.addObject().put("reservationId",record.toString()).put("expectedRevision","7")
                    .put("action","ASSIGN").put("currentSituationConfirmed",true);
            row.set("goal",ref);
            var part=row.putArray("parts").addObject().put("amount","10.00");
            part.set("source",root.at("/payload/sections/allocations/items/0/source").deepCopy());
        }
        ((ObjectNode)root.at("/payload/context")).put("boundaryAcknowledged",false);
        // Inputs are already canonical; expected snapshot never calls the product validator.
        var expectedPayload=root.get("payload").deepCopy();
        var before=allDomainTables();
        var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(saved.get("payload")).isEqualTo(expectedPayload);
        assertThat(mismatchPaths(saved)).containsExactly("/sections/allocations/items/1/goal","/reservationConfirmations/0/goal");
        List<String> codes=new ArrayList<>();for(var issue:saved.get("issues")) codes.add(issue.path("code").asText());
        assertThat(codes).contains("BOUNDARY_UNCONFIRMED","DUPLICATE_REFERENCE");
        assertThat(saved.path("version").asText()).isEqualTo("1");
        durableAndUnchanged(saved,before);
    }

    @Test void revalidationBatchObservesBothOverloadsAndAllBoundIds() throws Exception {
        int version=0;
        for(int count:List.of(1,50)) {
            var root=draft();root.put("expectedVersion",Integer.toString(version++));
            Set<UUID> ids=new HashSet<>();
            for(int i=0;i<count;i++) {
                UUID id=persistedGoal(i%2==0?"NUMERIC":"MONETARY",a.getId());ids.add(id);
                allocation(root,ref("id",id));
            }
            var before=allDomainTables();clearInvocations(referenceQueries);
            var saved=save(root.toString(),tokenA,200).get("data");
            var calls=mockingDetails(referenceQueries).getInvocations().stream()
                    .filter(i->i.getMethod().getName().equals("query") && i.getArgument(0) instanceof String s
                            && s.toLowerCase(Locale.ROOT).matches("(?s).*\\bfrom\\s+goals\\b.*")).toList();
            var entries=calls.stream().filter(i->i.getArgument(1) instanceof Map<?,?>).toList();
            var delegates=calls.stream().filter(i->i.getArgument(1) instanceof SqlParameterSource).toList();
            assertThat(entries).hasSize(1);assertThat(delegates).hasSize(1);assertThat(calls).hasSize(2);
            SqlParameterSource parameters=delegates.getFirst().getArgument(1);
            assertThat(parameters.getValue("owner")).isEqualTo(a.getId());
            assertThat(new HashSet<>((Collection<?>)parameters.getValue("ids"))).isEqualTo(ids);
            List<String> expected=new ArrayList<>();for(int i=0;i<count;i+=2) expected.add("/sections/allocations/items/"+i+"/goal");
            assertThat(mismatchPaths(saved)).containsExactlyElementsOf(expected);
            System.out.println("RC029_BATCH goals="+count+" mapCalls="+entries.size()+" delegateCalls="+delegates.size()+" boundIds="+ids.size());
            clearInvocations(referenceQueries);durableAndUnchanged(saved,before);
            assertThat(goalQueryCount()).isZero();
        }
    }

    @Test void revalidationGetAfterDeletedGoalRetainsLastEvaluationAndNextSaveRejects() throws Exception {
        var root=draft();var target=goal(root,"DIRECT","NUMERIC");allocation(root,target);
        var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(mismatchPaths(saved)).containsExactly(ALLOCATION_GOAL);
        sql.update("delete from goals where id=?",UUID.fromString(target.path("id").asText()));
        // Keep another real fact so mode remains COMPLEMENT independently of the deleted goal.
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived) values(?,'Synthetic','CHECKING',1,?,false)",UUID.randomUUID(),a.getId());
        var before=allDomainTables();
        assertThat(getSession(tokenA)).isEqualTo(saved);
        root.put("expectedVersion","1");
        assertThat(save(root.toString(),tokenA,404).at("/error/code").asText()).isEqualTo("REFERENCE_NOT_FOUND");
        durableAndUnchanged(saved,before);
    }
}
