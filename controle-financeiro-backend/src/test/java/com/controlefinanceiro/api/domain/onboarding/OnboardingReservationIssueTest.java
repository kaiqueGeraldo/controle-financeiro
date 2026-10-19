package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** RC029-01 directed cases; select reservation* to avoid counting inherited controls twice. */
class OnboardingReservationIssueTest extends OnboardingIndependentReviewTest {
    @MockitoSpyBean NamedParameterJdbcTemplate referenceQueries;
    static final String ALLOCATION_GOAL="/sections/allocations/items/0/goal";

    ObjectNode draft() {return DraftValidatorTest.account("\"100\"");}
    ArrayNode items(ObjectNode root,String section) {
        var node=(ObjectNode)root.at("/payload/sections/"+section);
        node.put("answer","PROVIDED");return (ArrayNode)node.get("items");
    }
    ObjectNode ref(String key,UUID id) {
        var node=json.createObjectNode();node.put("kind","GOAL").put(key,id.toString());return node;
    }
    UUID persistedGoal(String type,UUID owner) {
        UUID id=UUID.randomUUID();
        sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,version) values(?,'Synthetic',?,12,4,'2026-12-31',?,0)",id,type,owner);
        return id;
    }
    ObjectNode goal(ObjectNode root,String style,String type) {
        if(style.equals("DIRECT")) return ref("id",persistedGoal(type,a.getId()));
        UUID temp=UUID.randomUUID();var item=json.createObjectNode();item.put("tempId",temp.toString());
        if(style.equals("ALIAS")) {
            item.put("action","LINK");item.set("ref",ref("id",persistedGoal(type,a.getId())));
        } else {
            item.put("action","CREATE").put("title","Leitura").put("type",type).put("target","12").put("deadline","2026-12-31");
            if(type.equals("NUMERIC")) item.put("unit","livros").put("initialProgress","4");
        }
        items(root,"goals").add(item);return ref("tempId",temp);
    }
    ObjectNode allocation(ObjectNode root,ObjectNode goal) {
        var row=json.createObjectNode();row.put("tempId",UUID.randomUUID().toString()).put("amount","10.00");
        row.set("goal",goal);
        row.set("source",json.readTree("{\"kind\":\"ACCOUNT\",\"tempId\":\"00000000-0000-4000-8000-000000000001\"}"));
        items(root,"allocations").add(row);return row;
    }
    List<String> mismatchPaths(JsonNode session) {
        List<String> paths=new ArrayList<>();
        for(var issue:session.path("issues")) if(issue.path("code").asText().equals("GOAL_TYPE_MISMATCH")) {
            assertThat(issue.properties()).hasSize(3);
            assertThat(issue.path("message").asText()).isEqualTo("Revise este campo.");
            paths.add(issue.path("path").asText());
        }
        return paths;
    }
    void durableAndUnchanged(JsonNode saved,Map<String,List<String>> before) throws Exception {
        assertThat(storedPayload()).isEqualTo(saved.get("payload"));
        // Separate JDBC read and new HTTP request, after the save transaction has committed.
        var storedIssues=json.readTree(sql.queryForObject("select issues from onboarding_sessions where user_id=?",String.class,a.getId()));
        assertThat(storedIssues).isEqualTo(saved.get("issues"));
        assertThat(getSession(tokens.generateToken(a))).isEqualTo(saved);
        assertThat(allDomainTables()).isEqualTo(before);
    }

    @ParameterizedTest @CsvSource({"CREATE,NUMERIC","CREATE,MONETARY","ALIAS,NUMERIC","ALIAS,MONETARY","DIRECT,NUMERIC","DIRECT,MONETARY"})
    void reservationGoalTypeUsesCreateAliasAndOwnedId(String style,String type) throws Exception {
        var root=draft();allocation(root,goal(root,style,type));
        var expected=DraftValidatorTest.parse(root.toString()).payload().deepCopy();var before=allDomainTables();
        var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(saved.get("payload")).isEqualTo(expected);
        assertThat(saved.path("version").asText()).isEqualTo("1");
        assertThat(mismatchPaths(saved)).containsExactlyElementsOf(type.equals("NUMERIC")?List.of(ALLOCATION_GOAL):List.of());
        durableAndUnchanged(saved,before);
    }

    @Test void reservationLifecycleAndChangingTypeKeepOnlyCurrentIssues() throws Exception {
        var root=draft();allocation(root,goal(root,"CREATE","NUMERIC"));var before=allDomainTables();
        for(int i=0;i<4;i++) {
            root.put("expectedVersion",Integer.toString(i)).put("action",List.of("SAVE","PAUSE","SAVE","RESUME").get(i));
            var saved=save(root.toString(),tokenA,200).get("data");
            assertThat(mismatchPaths(saved)).containsExactly(ALLOCATION_GOAL);
            assertThat(saved.path("status").asText()).isEqualTo(i==1 || i==2?"SKIPPED":"IN_PROGRESS");
            durableAndUnchanged(saved,before);
        }
        var item=(ObjectNode)root.at("/payload/sections/goals/items/0");
        item.put("type","MONETARY");item.remove("unit");item.remove("initialProgress");
        root.put("expectedVersion","4").put("action","SAVE");
        var fixed=save(root.toString(),tokenA,200).get("data");assertThat(fixed.path("issues").isEmpty()).isTrue();
        durableAndUnchanged(fixed,before);
        item.put("type","NUMERIC").put("unit","livros").put("initialProgress","4");root.put("expectedVersion","5");
        assertThat(mismatchPaths(save(root.toString(),tokenA,200).get("data"))).containsExactly(ALLOCATION_GOAL);
        items(root,"allocations").removeAll();((ObjectNode)root.at("/payload/sections/allocations")).put("answer","NONE");root.put("expectedVersion","6");
        var removed=save(root.toString(),tokenA,200).get("data");assertThat(removed.path("issues").isEmpty()).isTrue();durableAndUnchanged(removed,before);
    }

    @Test void reservationChangingReferenceClearsMismatchAndDiscardClearsSnapshot() throws Exception {
        var root=draft();var row=allocation(root,goal(root,"ALIAS","NUMERIC"));
        var monetary=goal(root,"DIRECT","MONETARY");var before=allDomainTables();
        assertThat(mismatchPaths(save(root.toString(),tokenA,200).get("data"))).containsExactly(ALLOCATION_GOAL);
        row.set("goal",monetary);root.put("expectedVersion","1");
        var fixed=save(root.toString(),tokenA,200).get("data");assertThat(fixed.path("issues").isEmpty()).isTrue();durableAndUnchanged(fixed,before);
        var discarded=save(command("2","DISCARD"),tokenA,200).get("data");
        assertThat(discarded.path("payload").isNull()).isTrue();assertThat(discarded.path("issues").isEmpty()).isTrue();assertThat(allDomainTables()).isEqualTo(before);
    }

    @Test void reservationMixedItemsComposeWithPendingDuplicateAndBoundaryIssues() throws Exception {
        var root=draft();allocation(root,goal(root,"CREATE","MONETARY"));
        var numeric=goal(root,"ALIAS","NUMERIC");allocation(root,numeric);allocation(root,numeric.deepCopy());
        allocation(root,ref("tempId",UUID.randomUUID()));
        var incomplete=goal(root,"CREATE","MONETARY");
        ((ObjectNode)root.at("/payload/sections/goals/items/2")).remove("title");
        allocation(root,incomplete).remove("goal");
        ((ObjectNode)root.at("/payload/context")).put("boundaryAcknowledged",false);
        var before=allDomainTables();var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(mismatchPaths(saved)).containsExactly("/sections/allocations/items/1/goal","/sections/allocations/items/2/goal");
        Map<String,String> other=new HashMap<>();for(var issue:saved.path("issues")) if(!issue.path("code").asText().equals("GOAL_TYPE_MISMATCH")) other.put(issue.path("path").asText(),issue.path("code").asText());
        assertThat(other).containsEntry("/sections/allocations/items/2","DUPLICATE_REFERENCE")
                .containsEntry("/sections/allocations/items/3/goal","REFERENCE_PENDING")
                .containsEntry("/sections/goals/items/2/title","REQUIRED")
                .containsEntry("/sections/allocations/items/4/goal","REQUIRED")
                .containsEntry("/context/boundaryAcknowledged","BOUNDARY_UNCONFIRMED");
        durableAndUnchanged(saved,before);
    }

    @ParameterizedTest @CsvSource({"CREATE,NUMERIC","CREATE,MONETARY","ALIAS,NUMERIC","ALIAS,MONETARY","DIRECT,NUMERIC","DIRECT,MONETARY"})
    void reservationAssignChecksSameGoalWithoutChangingProtectedRecord(String style,String type) throws Exception {
        var root=draft();var goal=goal(root,style,type);UUID record=UUID.randomUUID();
        sql.update("insert into onboarding_reservation_records values(?,?,7,'{}','[]',now())",record,a.getId());
        var assign=json.createObjectNode().put("reservationId",record.toString()).put("expectedRevision","7").put("action","ASSIGN").put("currentSituationConfirmed",true);
        assign.set("goal",goal);
        assign.putArray("parts").add(json.readTree("{\"source\":{\"kind\":\"ACCOUNT\",\"tempId\":\"00000000-0000-4000-8000-000000000001\"},\"amount\":\"10.00\"}"));
        ((ObjectNode)root.get("payload")).putArray("reservationConfirmations").add(assign);
        var before=allDomainTables();var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(mismatchPaths(saved)).containsExactlyElementsOf(type.equals("NUMERIC")?List.of("/reservationConfirmations/0/goal"):List.of());durableAndUnchanged(saved,before);
        assign.put("action","CLOSE");assign.remove("goal");assign.remove("parts");root.put("expectedVersion","1");
        var closed=save(root.toString(),tokenA,200).get("data");assertThat(closed.path("issues").isEmpty()).isTrue();durableAndUnchanged(closed,before);
    }

    @Test void reservationForeignAndMissingGoalsStayUniform404WithoutOverwriting() throws Exception {
        var root=draft();var row=allocation(root,goal(root,"CREATE","NUMERIC"));
        var saved=save(root.toString(),tokenA,200).get("data");
        var foreign=ref("id",persistedGoal("NUMERIC",b.getId()));var before=allDomainTables();root.put("expectedVersion","1");row.set("goal",foreign);
        var rejected=save(root.toString(),tokenA,404);row.set("goal",ref("id",UUID.randomUUID()));
        assertThat(save(root.toString(),tokenA,404)).isEqualTo(rejected);
        assertThat(rejected.at("/error/code").asText()).isEqualTo("REFERENCE_NOT_FOUND");durableAndUnchanged(saved,before);
    }

    @Test void reservationMalformedGoalIsStructuralErrorAndKeepsConfirmedDraft() throws Exception {
        var root=draft();var row=allocation(root,goal(root,"CREATE","NUMERIC"));var before=allDomainTables();
        var saved=save(root.toString(),tokenA,200).get("data");root.put("expectedVersion","1");
        ((ObjectNode)row.get("goal")).put("id",UUID.randomUUID().toString());
        assertThat(save(root.toString(),tokenA,400).at("/error/fieldErrors/0/code").asText()).isEqualTo("REFERENCE_INVALID");
        durableAndUnchanged(saved,before);
    }

    @Test void reservationGoalQueriesAreBatchedAndGetRecoversSavedEvaluation() throws Exception {
        var root=draft();
        for(int i=0;i<50;i++) {var g=goal(root,"ALIAS",i%2==0?"NUMERIC":"MONETARY");allocation(root,g);}
        clearInvocations(referenceQueries);var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(mismatchPaths(saved)).hasSize(25);
        assertThat(goalQueryCount()).isEqualTo(1);
        // External domain changes do not rewrite a saved draft's evaluation on GET.
        UUID firstId=UUID.fromString(root.at("/payload/sections/goals/items/0/ref/id").asText());
        sql.update("update goals set type='MONETARY' where id=?",firstId);clearInvocations(referenceQueries);
        assertThat(getSession(tokenA)).isEqualTo(saved);assertThat(goalQueryCount()).isZero();
        root.put("expectedVersion","1");clearInvocations(referenceQueries);
        var updated=save(root.toString(),tokenA,200).get("data");assertThat(mismatchPaths(updated)).hasSize(24);
        assertThat(mismatchPaths(updated)).doesNotContain(ALLOCATION_GOAL);assertThat(goalQueryCount()).isEqualTo(1);
        var one=draft();allocation(one,ref("id",firstId));one.put("expectedVersion","2");clearInvocations(referenceQueries);
        assertThat(save(one.toString(),tokenA,200).at("/data/issues").isEmpty()).isTrue();assertThat(goalQueryCount()).isEqualTo(1);
    }
    long goalQueryCount() {
        // Count the Map entry point; its SqlParameterSource delegate is the same query.
        return mockingDetails(referenceQueries).getInvocations().stream()
                .filter(i->i.getMethod().getName().equals("query") && i.getArgument(0) instanceof String s
                        && i.getArgument(1) instanceof Map<?,?> && s.startsWith("select id, type from goals ")).count();
    }
}
