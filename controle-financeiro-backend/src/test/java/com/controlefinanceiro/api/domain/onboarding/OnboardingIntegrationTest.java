package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.UserService;
import com.controlefinanceiro.api.service.onboarding.OnboardingDraftService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@org.junit.jupiter.api.extension.ExtendWith(org.springframework.boot.test.system.OutputCaptureExtension.class)
@ContextConfiguration(initializers=OnboardingSchemaInitializer.class)
class OnboardingIntegrationTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc; @Autowired JdbcTemplate sql; @Autowired UserRepository users;
    @Autowired TokenService tokens; @Autowired JsonMapper json; @Autowired UserService userService;
    @Autowired OnboardingDraftService service; @Autowired PlatformTransactionManager transactionManager;
    @MockitoBean Clock clock;
    User a,b;String tokenA,tokenB;
    @BeforeEach void setup() {
        when(clock.instant()).thenReturn(Instant.parse("2026-10-18T15:00:00.123456789Z"));
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        a=user();b=user();tokenA=tokens.generateToken(a);tokenB=tokens.generateToken(b);
    }
    User user() {User u=new User();u.setNome("CF029 synthetic");u.setEmail(UUID.randomUUID()+"@example.test");u.setSenha("synthetic-hash");return users.saveAndFlush(u);}
    JsonNode getSession(String token) throws Exception {
        return json.readTree(mvc.perform(get("/onboarding").header("Authorization","Bearer "+token)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("data");
    }
    JsonNode save(String body,String token,int expected) throws Exception {
        var response=mvc.perform(put("/onboarding/draft").header("Authorization","Bearer "+token).contentType("application/json").content(body))
                .andExpect(status().is(expected)).andReturn().getResponse();
        return json.readTree(response.getContentAsString());
    }
    String write(String version,String action) {return DraftValidatorTest.minimal().replace("\"expectedVersion\":\"0\"","\"expectedVersion\":\""+version+"\"").replace("\"SAVE\"","\""+action+"\"");}
    @Test void firstGetDoesNotWriteThenSaveReloadPauseResumeDiscardKeepIdentity() throws Exception {
        var empty=getSession(tokenA);assertThat(empty.path("status").asText()).isEqualTo("NOT_STARTED");assertThat(empty.path("sessionId").isNull()).isTrue();
        assertThat(sql.queryForObject("select count(*) from onboarding_sessions where user_id=?",Integer.class,a.getId())).isZero();
        var saved=save(write("0","SAVE"),tokenA,200).get("data");assertThat(saved.path("version").asText()).isEqualTo("1");
        assertThat(saved.path("issues").size()).isZero();assertThat(saved.path("updatedAt").asText()).isEqualTo("2026-10-18T15:00:00.123456Z");
        assertThat(getSession(tokens.generateToken(a))).isEqualTo(saved);
        assertThat(save(write("1","PAUSE"),tokenA,200).at("/data/status").asText()).isEqualTo("SKIPPED");
        assertThat(save(write("2","RESUME"),tokenA,200).at("/data/status").asText()).isEqualTo("IN_PROGRESS");
        var discarded=save("{\"contractVersion\":1,\"expectedVersion\":\"3\",\"action\":\"DISCARD\"}",tokenA,200).get("data");
        assertThat(discarded.path("payload").isNull()).isTrue();assertThat(discarded.path("sessionId")).isEqualTo(saved.path("sessionId"));
        assertThat(save(write("0","SAVE"),tokenA,409).at("/error/code").asText()).isEqualTo("VERSION_CONFLICT");
        assertThat(save(write("4","SAVE"),tokenA,200).at("/data/version").asText()).isEqualTo("5");
    }
    @Test void e01DraftLeavesAllFinancialTablesUntouchedAndExactAfterReload() throws Exception {
        String body;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){body=new String(stream.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);}
        UUID account=UUID.randomUUID(),category=UUID.randomUUID();
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived,opening_balance,opening_origin,opening_date,opening_recorded_at) values(?,'Automatic','CASH',0,?,false,0,'SYSTEM_INITIALIZED','2026-10-09',now())",account,a.getId());
        sql.update("insert into categories(id,name,type,user_id) values(?,'Synthetic','INCOME',?)",category,a.getId());
        body=body.replace("00000000-0000-4000-8000-000000000901",account.toString()).replace("00000000-0000-4000-8000-000000000902",category.toString());
        var before=financialSnapshot();var saved=save(body,tokenA,200).get("data");
        assertThat(saved.path("issues").size()).isZero();assertThat(saved.path("mode").asText()).isEqualTo("NEW");
        assertThat(getSession(tokenA).path("payload")).isEqualTo(saved.path("payload"));assertThat(financialSnapshot()).isEqualTo(before);
        assertThat(saved.at("/payload/sections/goals/items/1/deadline").asText()).isEqualTo("2026-09-30");
        assertThat(saved.at("/payload/sections/investments/items/1/valuation/amount").asText()).isEqualTo("1.00");
    }
    Map<String,List<String>> financialSnapshot() {
        Map<String,List<String>> result=new TreeMap<>();
        for(String table:List.of("accounts","investments","goals","goal_allocations","credit_cards","invoices","card_transactions","transactions","financial_commands","financial_intent_receipts"))
            result.put(table,sql.queryForList("select row_to_json(t)::text from "+table+" t order by id",String.class));
        return result;
    }
    @Test void ownOnlyReferencesUniform404AndNoPartialSave() throws Exception {
        UUID foreign=UUID.randomUUID();sql.update("insert into accounts(id,name,type,balance,user_id,is_archived) values(?,'PRIVATE-B','CHECKING',2300,?,false)",foreign,b.getId());
        var root=(ObjectNode)json.readTree(write("0","SAVE"));var section=(ObjectNode)root.at("/payload/sections/accounts");section.put("answer","PROVIDED");
        section.putArray("items").add(json.readTree("{\"tempId\":\""+UUID.randomUUID()+"\",\"action\":\"LINK\",\"ref\":{\"kind\":\"ACCOUNT\",\"id\":\""+foreign+"\"}}"));
        var before=financialSnapshot();var error=save(root.toString(),tokenA,404);
        assertThat(save(root.toString().replace(foreign.toString(),UUID.randomUUID().toString()),tokenA,404)).isEqualTo(error);
        assertThat(error.toString()).doesNotContain("PRIVATE-B",foreign.toString());assertThat(financialSnapshot()).isEqualTo(before);
        assertThat(getSession(tokenA).path("version").asText()).isEqualTo("0");
        var own=save(root.toString(),tokenB,200).get("data");assertThat(own.path("mode").asText()).isEqualTo("COMPLEMENT");
        assertThat(getSession(tokenA).path("payload").isNull()).isTrue();
    }
    @Test void expiredMissingAndMalformedTokenCannotReadOrWriteButNewLoginRecovers() throws Exception {
        var saved=save(write("0","SAVE"),tokenA,200).get("data");
        mvc.perform(get("/onboarding")).andExpect(status().isUnauthorized());
        save(write("1","SAVE"),"invalid",401);
        when(clock.instant()).thenReturn(Instant.parse("2026-10-20T15:00:00Z"));
        assertThat(save(write("1","SAVE"),tokenA,401).at("/error/code").asText()).isEqualTo("UNAUTHENTICATED");
        assertThat(getSession(tokens.generateToken(a))).isEqualTo(saved);
    }
    @Test void invalidRequestPreservesLastConfirmedSnapshotAndDoesNotLogPayload(org.springframework.boot.test.system.CapturedOutput output) throws Exception {
        var saved=save(write("0","SAVE"),tokenA,200).get("data");
        String bad=DraftValidatorTest.account("\"1.005\"").toString().replace("Corrente","PRIVATE-FINANCIAL-PAYLOAD");
        assertThat(save(bad,tokenA,400).at("/error/fieldErrors/0/path").asText()).endsWith("/balance/value");
        assertThat(getSession(tokenA)).isEqualTo(saved);assertThat(output.getAll()).doesNotContain("PRIVATE-FINANCIAL-PAYLOAD",tokenA);
    }
    @Test void bothFirstCreationAndExistingRevisionRaceHaveOneWinner() throws Exception {
        race("0");race("1");assertThat(getSession(tokenA).path("version").asText()).isEqualTo("2");
        assertThat(sql.queryForObject("select count(*) from onboarding_sessions where user_id=?",Integer.class,a.getId())).isEqualTo(1);
    }
    void race(String version) throws Exception {
        CyclicBarrier barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> futures=new ArrayList<>();
            for(int i=0;i<2;i++) {String step=i==0?"ACCOUNTS":"GOALS";
                futures.add(pool.submit(()->{barrier.await(10,TimeUnit.SECONDS);
                    return mvc.perform(put("/onboarding/draft").header("Authorization","Bearer "+tokenA).contentType("application/json")
                            .content(write(version,"SAVE").replace("REVIEW",step))).andReturn().getResponse().getStatus();}));}
            assertThat(List.of(futures.get(0).get(15,TimeUnit.SECONDS),futures.get(1).get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
    }
    @Test void rollbackAndDeletionRespectOwnersAndDrafts() throws Exception {
        var aSaved=save(write("0","SAVE"),tokenA,200).get("data");save(write("0","SAVE"),tokenB,200);
        var tx=new TransactionTemplate(transactionManager);
        assertThatThrownBy(()->tx.executeWithoutResult(s->{service.save(a.getId(),DraftValidatorTest.parse(write("1","PAUSE")));throw new IllegalStateException("synthetic rollback");})).isInstanceOf(IllegalStateException.class);
        assertThat(getSession(tokenA)).isEqualTo(aSaved);
        userService.deleteAccount(a);
        assertThat(sql.queryForObject("select count(*) from onboarding_sessions where user_id=?",Integer.class,a.getId())).isZero();
        assertThat(getSession(tokenB).path("version").asText()).isEqualTo("1");
    }
    @Test void protectedConfirmationIsVersionedAndNeverBecomesEvidenceOnSave() throws Exception {
        UUID record=UUID.randomUUID();
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,7,?,?,now())",record,a.getId(),"{\"state\":\"UNBOUNDED\",\"excluded\":[]}","[]");
        var root=(ObjectNode)json.readTree(write("0","SAVE"));
        ((ObjectNode)root.get("payload")).putArray("reservationConfirmations").add(json.readTree("{\"reservationId\":\""+record+"\",\"expectedRevision\":\"7\",\"action\":\"CLOSE\",\"currentSituationConfirmed\":true}"));
        var saved=save(root.toString(),tokenA,200).get("data");assertThat(getSession(tokenA)).isEqualTo(saved);
        assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,record)).isEqualTo(7);
        assertThat(save(root.toString(),tokenB,404).at("/error/code").asText()).isEqualTo("REFERENCE_NOT_FOUND");
        root.put("expectedVersion","1");sql.update("update onboarding_reservation_records set revision=8 where id=?",record);
        assertThat(save(root.toString(),tokenA,409).at("/error/code").asText()).isEqualTo("SOURCE_CHANGED");
        assertThat(getSession(tokenA)).isEqualTo(saved);
        ((ObjectNode)root.at("/payload/reservationConfirmations/0")).put("independent",true);
        save(root.toString(),tokenA,400);
        userService.deleteAccount(a);
        assertThat(sql.queryForObject("select count(*) from onboarding_reservation_records where id=?",Integer.class,record)).isZero();
    }
    @Test void unknownLegacyAccountIsComplementAndMaxRevisionCannotOverflow() throws Exception {
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived) values(?,'Carteira Física','CASH',0,?,false)",UUID.randomUUID(),a.getId());
        assertThat(getSession(tokenA).path("mode").asText()).isEqualTo("COMPLEMENT");
        save(write("0","SAVE"),tokenA,200);sql.update("update onboarding_sessions set version=? where user_id=?",Long.MAX_VALUE,a.getId());
        save(write(Long.toString(Long.MAX_VALUE),"SAVE"),tokenA,409);
        assertThat(getSession(tokenA).path("version").asText()).isEqualTo("9223372036854775807");
    }
    @Test void pausedDraftRequiresExplicitResumeAndCompletedIsTerminal() throws Exception {
        save(write("0","PAUSE"),tokenA,200);
        assertThat(save(write("1","SAVE"),tokenA,200).at("/data/status").asText()).isEqualTo("SKIPPED");
        assertThat(save(write("2","RESUME"),tokenA,200).at("/data/status").asText()).isEqualTo("IN_PROGRESS");
        sql.update("update onboarding_sessions set status='COMPLETED' where user_id=?",a.getId());
        for(String action:List.of("SAVE","PAUSE","RESUME"))
            assertThat(save(write("3",action),tokenA,409).at("/error/code").asText()).isEqualTo("ALREADY_COMPLETED");
        assertThat(save("{\"contractVersion\":1,\"expectedVersion\":\"3\",\"action\":\"DISCARD\"}",tokenA,409).at("/error/code").asText()).isEqualTo("ALREADY_COMPLETED");
    }
    @Test void contendedOwnerReturnsRecoverableConflictWhileOtherOwnerProgresses() throws Exception {
        var held=new CountDownLatch(1);var release=new CountDownLatch(1);
        try(var pool=Executors.newSingleThreadExecutor()) {
            var holder=pool.submit(()->new TransactionTemplate(transactionManager).executeWithoutResult(tx->{
                sql.queryForObject("select id from users where id=? for update",UUID.class,a.getId());held.countDown();
                try {if(!release.await(15,TimeUnit.SECONDS)) throw new IllegalStateException("fixture release missing");}
                catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException(e);}
            }));
            try {
                assertThat(held.await(5,TimeUnit.SECONDS)).isTrue();
                save(write("0","SAVE"),tokenB,200);
                assertThat(save(write("0","SAVE"),tokenA,409).at("/error/code").asText()).isEqualTo("LOCK_CONFLICT");
                assertThat(getSession(tokenA).path("version").asText()).isEqualTo("0");
            } finally {release.countDown();holder.get(5,TimeUnit.SECONDS);}
        }
    }
}
