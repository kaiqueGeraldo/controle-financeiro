package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.flywaydb.core.Flyway;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/** Independent review probes. Inherits the candidate's eleven integration controls explicitly. */
class OnboardingIndependentReviewTest extends OnboardingIntegrationTest {
    Map<String,List<String>> allDomainTables() {
        Map<String,List<String>> snapshot=new TreeMap<>();
        for(String table:sql.queryForList("select tablename from pg_tables where schemaname=current_schema()",String.class)) {
            if(Set.of("users","onboarding_sessions","flyway_schema_history").contains(table)) continue;
            snapshot.put(table,sql.queryForList("select row_to_json(t)::text from \""+table+"\" t order by row_to_json(t)::text",String.class));
        }
        return snapshot;
    }
    JsonNode storedPayload() {
        return json.readTree(sql.queryForObject("select payload from onboarding_sessions where user_id=?",String.class,a.getId()));
    }
    String command(String version,String action) {
        return action.equals("DISCARD")?"{\"contractVersion\":1,\"expectedVersion\":\""+version+"\",\"action\":\"DISCARD\"}":write(version,action);
    }
    @Test void everyLifecycleActionPreservesAllDomainTablesAndReplacementIsDurable() throws Exception {
        var before=allDomainTables();
        String first=DraftValidatorTest.account("\"999999999999.99\"").toString();
        var saved=save(first,tokenA,200).get("data");
        assertThat(storedPayload()).isEqualTo(saved.get("payload"));
        assertThat(storedPayload().at("/sections/accounts/items/0/balance/value").asText()).isEqualTo("999999999999.99");
        assertThat(allDomainTables()).isEqualTo(before);
        for(int i=1;i<=3;i++) {
            String action=List.of("PAUSE","RESUME","SAVE").get(i-1);
            var result=save(write(Integer.toString(i),action),tokenA,200).get("data");
            assertThat(storedPayload()).isEqualTo(result.get("payload"));
            assertThat(storedPayload().at("/sections/accounts/items").size()).isZero();
            assertThat(result.get("completedReceipt").isNull()).isTrue();
            assertThat(allDomainTables()).isEqualTo(before);
        }
        save(command("4","DISCARD"),tokenA,200);
        assertThat(sql.queryForObject("select payload from onboarding_sessions where user_id=?",String.class,a.getId())).isNull();
        assertThat(sql.queryForObject("select version from onboarding_sessions where user_id=?",Long.class,a.getId())).isEqualTo(5);
        assertThat(allDomainTables()).isEqualTo(before);
    }
    @ParameterizedTest @CsvSource({"SAVE,DISCARD","DISCARD,SAVE","PAUSE,SAVE","RESUME,SAVE"})
    void conflictingActionsReallyWaitOnIndependentConnections(String winner,String loser) throws Exception {
        save(write("0","SAVE"),tokenA,200);
        var locked=new CountDownLatch(1);var release=new CountDownLatch(1);var pid=new java.util.concurrent.atomic.AtomicInteger();
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=pool.submit(()->new TransactionTemplate(transactionManager).execute(tx->{
                pid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                var result=service.save(a.getId(),DraftValidatorTest.parse(command("1",winner)));
                locked.countDown();await(release);return result;
            }));
            Future<Integer> second=null;
            try {
                assertThat(locked.await(5,TimeUnit.SECONDS)).isTrue();
                second=pool.submit(()->mvc.perform(put("/onboarding/draft").header("Authorization","Bearer "+tokenA)
                        .contentType("application/json").content(command("1",loser))).andReturn().getResponse().getStatus());
                awaitBlockedBy(pid.get());
            } finally {release.countDown();}
            var result=first.get(10,TimeUnit.SECONDS);
            assertThat(second.get(10,TimeUnit.SECONDS)).isEqualTo(409);
            assertThat(getSession(tokenA).path("version").asText()).isEqualTo("2");
            assertThat(getSession(tokenA).path("status").asText()).isEqualTo(result.status());
            if(winner.equals("DISCARD")) assertThat(getSession(tokenA).path("payload").isNull()).isTrue();
            else assertThat(storedPayload()).isEqualTo(result.payload());
            assertThat(save(command("1",loser),tokenA,409).at("/error/code").asText()).isEqualTo("VERSION_CONFLICT");
            save(write("2","RESUME"),tokenA,200);
        }
    }
    void awaitBlockedBy(int pid) {
        long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(4);
        while(System.nanoTime()<deadline) {
            Boolean blocked=sql.queryForObject("select exists(select 1 from pg_stat_activity where ? = any(pg_blocking_pids(pid)))",Boolean.class,pid);
            if(Boolean.TRUE.equals(blocked)) return;
            Thread.onSpinWait();
        }
        fail("No independently connected waiter observed in pg_blocking_pids");
    }
    static void await(CountDownLatch latch) {
        try {if(!latch.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("review coordination timed out");}
        catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException(e);}
    }
    @Test void accountDeletionRollbackRestoresDraftAndProtectedRecords() throws Exception {
        save(write("0","SAVE"),tokenA,200);save(write("0","SAVE"),tokenB,200);
        UUID record=UUID.randomUUID();
        sql.update("insert into onboarding_reservation_records values(?,?,7,'{}','[]',now())",record,a.getId());
        var saved=getSession(tokenA);
        assertThat(saved.path("mode").asText()).isEqualTo("COMPLEMENT");
        var before=allDomainTables();
        assertThatThrownBy(()->new TransactionTemplate(transactionManager).executeWithoutResult(tx->{
            userService.deleteAccount(a);
            assertThat(sql.queryForObject("select count(*) from onboarding_sessions where user_id=?",Integer.class,a.getId())).isZero();
            throw new IllegalStateException("review rollback after all deletions");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(getSession(tokenA)).isEqualTo(saved);
        assertThat(getSession(tokenB).path("version").asText()).isEqualTo("1");
        assertThat(allDomainTables()).isEqualTo(before);
    }
    @ParameterizedTest @CsvSource({"true","false"})
    void deletionAndSaveShareOwnerLock(boolean deleteFirst) throws Exception {
        save(write("0","SAVE"),tokenA,200);save(write("0","SAVE"),tokenB,200);
        var locked=new CountDownLatch(1);var release=new CountDownLatch(1);var pid=new java.util.concurrent.atomic.AtomicInteger();
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=pool.submit(()->new TransactionTemplate(transactionManager).executeWithoutResult(tx->{
                pid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                if(deleteFirst) userService.deleteAccount(a);else service.save(a.getId(),DraftValidatorTest.parse(write("1","SAVE")));
                locked.countDown();await(release);
            }));
            Future<Integer> second=null;
            try {
                assertThat(locked.await(5,TimeUnit.SECONDS)).isTrue();
                second=pool.submit(()->{
                    try {
                        if(deleteFirst) service.save(a.getId(),DraftValidatorTest.parse(write("1","SAVE")));else userService.deleteAccount(a);
                        return 200;
                    } catch(DraftProblem e){return e.status();}
                });
                awaitBlockedBy(pid.get());
            } finally {release.countDown();}
            first.get(10,TimeUnit.SECONDS);
            assertThat(second.get(10,TimeUnit.SECONDS)).isEqualTo(deleteFirst?401:200);
        }
        assertThat(sql.queryForObject("select count(*) from onboarding_sessions where user_id=?",Integer.class,a.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from users where id=?",Integer.class,a.getId())).isZero();
        assertThat(getSession(tokenB).path("version").asText()).isEqualTo("1");
    }
    @Test void ownArchivedLinkRemainsDraftButDeletedReferenceRejectsWithoutOverwriting() throws Exception {
        UUID account=UUID.randomUUID();
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived) values(?,'archived','CHECKING',20,?,true)",account,a.getId());
        ObjectNode root=(ObjectNode)json.readTree(write("0","SAVE"));
        ObjectNode section=(ObjectNode)root.at("/payload/sections/accounts");section.put("answer","PROVIDED");
        section.putArray("items").add(json.readTree("{\"tempId\":\""+UUID.randomUUID()+"\",\"action\":\"LINK\",\"ref\":{\"kind\":\"ACCOUNT\",\"id\":\""+account+"\"}}"));
        var saved=save(root.toString(),tokenA,200).get("data");
        sql.update("update accounts set balance=30 where id=?",account);
        assertThat(getSession(tokenA).get("payload")).isEqualTo(saved.get("payload"));
        sql.update("delete from accounts where id=?",account);
        root.put("expectedVersion","1");save(root.toString(),tokenA,404);
        assertThat(storedPayload()).isEqualTo(saved.get("payload"));
        assertThat(getSession(tokenA).path("version").asText()).isEqualTo("1");
    }
    @Test void flywayRepeatAppliesNothingAndValidates() {
        String schema=sql.queryForObject("select current_schema()",String.class);
        var flyway=Flyway.configure().dataSource(sql.getDataSource()).schemas(schema).defaultSchema(schema).load();
        flyway.validate();assertThat(flyway.migrate().migrationsExecuted).isZero();
    }
    @Test void numericGoalAllocationIsPersistibleButMustCarryAnIssue() throws Exception {
        ObjectNode root=DraftValidatorTest.account("\"100\"");
        ObjectNode goals=(ObjectNode)root.at("/payload/sections/goals");goals.put("answer","PROVIDED");
        goals.putArray("items").add(json.readTree("""
            {"tempId":"00000000-0000-4000-8000-000000000002","action":"CREATE","title":"Livros",
             "type":"NUMERIC","target":"12","unit":"livros","initialProgress":"4","deadline":"2026-12-31"}
            """));
        ObjectNode allocations=(ObjectNode)root.at("/payload/sections/allocations");allocations.put("answer","PROVIDED");
        allocations.putArray("items").add(json.readTree("""
            {"tempId":"00000000-0000-4000-8000-000000000003",
             "goal":{"kind":"GOAL","tempId":"00000000-0000-4000-8000-000000000002"},
             "source":{"kind":"ACCOUNT","tempId":"00000000-0000-4000-8000-000000000001"},"amount":"10"}
            """));
        var before=allDomainTables();
        var saved=save(root.toString(),tokenA,200).get("data");
        assertThat(storedPayload()).isEqualTo(saved.get("payload"));
        assertThat(storedPayload().at("/sections/allocations/items/0/amount").asText()).isEqualTo("10.00");
        assertThat(allDomainTables()).isEqualTo(before);
        // SPEC-001 §§2/3: cross-field inconsistencies are issues; reserves target monetary goals.
        assertThat(getSession(tokenA).get("issues").isEmpty())
                .as("Allocation to a NUMERIC goal must not be presented as a draft without inconsistencies").isFalse();
    }
}
