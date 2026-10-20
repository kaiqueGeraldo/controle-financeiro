package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.onboarding.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@AutoConfigureMockMvc
@ContextConfiguration(initializers=OnboardingSchemaInitializer.class)
abstract class OnboardingApplicationSupport extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;@Autowired JdbcTemplate sql;@Autowired UserRepository users;@Autowired TokenService tokens;
    @Autowired OnboardingDraftService drafts;@Autowired OnboardingApplicationService app;@Autowired PlatformTransactionManager txManager;
    @Autowired FinancialInventoryGuard guard;@Autowired UserService userService;@Autowired CreditCardService cardService;
    @MockitoBean Clock clock;
    User user;String token;
    @BeforeEach void setup() {
        when(clock.instant()).thenReturn(Instant.parse("2026-10-19T15:00:00.123456789Z"));when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        user=new User();user.setNome("CF030 synthetic");user.setEmail(UUID.randomUUID()+"@example.test");user.setSenha("synthetic");user=users.saveAndFlush(user);token=tokens.generateToken(user);
    }
    ObjectNode minimal() {return (ObjectNode)JSON.readTree(DraftValidatorTest.minimal());}
    ObjectNode e01() throws Exception {
        String body;try(var stream=getClass().getResourceAsStream("/onboarding/e01.json")){body=new String(stream.readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);}
        UUID account=account("0.00"),category=UUID.randomUUID();
        sql.update("update accounts set type='CASH',opening_balance=0,opening_origin='SYSTEM_INITIALIZED',opening_date='2026-10-09',opening_recorded_at=now() where id=?",account);
        sql.update("insert into onboarding_default_accounts values(?,?,now())",user.getId(),account);
        sql.update("insert into categories(id,name,type,user_id) values(?,'CF030 synthetic','INCOME',?)",category,user.getId());
        return (ObjectNode)JSON.readTree(body.replace("00000000-0000-4000-8000-000000000901",account.toString()).replace("00000000-0000-4000-8000-000000000902",category.toString()));
    }
    UUID account(String value) {UUID id=UUID.randomUUID();sql.update("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,'Synthetic','CHECKING',?,?,false,0)",id,new BigDecimal(value),user.getId());return id;}
    JsonNode save(ObjectNode write) {return drafts.save(user.getId(),DraftValidator.parse(write.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8))).payload();}
    OnboardingCommand command(UUID operation) {var s=drafts.get(user.getId());return new OnboardingCommand(s.sessionId(),Long.parseLong(s.version()),operation,null,null);}
    OnboardingCommand completeCommand(JsonNode p) {return new OnboardingCommand(UUID.fromString(p.path("sessionId").asText()),Long.parseLong(p.path("draftVersion").asText()),UUID.fromString(p.path("operationId").asText()),p.path("contentHash").asText(),p.path("reviewHash").asText());}
    JsonNode prepare(ObjectNode write) {save(write);return app.prepare(user.getId(),command(UUID.randomUUID()));}
    JsonNode http(String route,JsonNode body,int expected,String auth) throws Exception {
        var response=mvc.perform(post(route).header("Authorization","Bearer "+auth).contentType("application/json").content(body.toString())).andReturn().getResponse();
        assertThat(response.getStatus()).as(response.getContentAsString()).isEqualTo(expected);return JSON.readTree(response.getContentAsString());
    }
    JsonNode request(OnboardingCommand c) {return node("contractVersion",1,"sessionId",c.sessionId().toString(),"expectedVersion",Long.toString(c.expectedVersion()),"operationId",c.operationId().toString(),"contentHash",c.contentHash(),"reviewHash",c.reviewHash(),"confirm",true);}
    void amount(JsonNode summary,String metric,String expected) {assertThat(summary.at("/metrics/"+metric+"/state").asText()).isEqualTo("KNOWN");assertThat(summary.at("/metrics/"+metric+"/value").asText()).isEqualTo(expected);}
    static void assertProblem(Runnable r,int status,String code) {assertThatThrownBy(r::run).isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(status);assertThat(e.code()).isEqualTo(code);});}
    static void await(CountDownLatch latch) {try {if(!latch.await(10,TimeUnit.SECONDS))throw new AssertionError("barrier timed out");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new AssertionError(e);}}
    void awaitBlocked() {long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);while(System.nanoTime()<deadline){if(Boolean.TRUE.equals(sql.queryForObject("select exists(select 1 from pg_stat_activity where datname=current_database() and cardinality(pg_blocking_pids(pid))>0)",Boolean.class)))return;Thread.onSpinWait();}throw new AssertionError("No independently blocked PostgreSQL connection observed");}
}
