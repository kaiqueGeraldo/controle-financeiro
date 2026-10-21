package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.JSON;

/** CF031-only browser -> BFF -> real HTTP -> migrated disposable PostgreSQL.
 * No product financial service is mocked; only inherited external mail/quotes. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(initializers=OnboardingSchemaInitializer.class)
@Import(OnboardingFrontendPostgresE2E.TestClocks.class)
class OnboardingFrontendPostgresE2E extends PostgresIntegrationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @Test void interviewPersistsAndAppliesExactlyOnce() throws Exception {
        Path backend=Path.of(System.getProperty("user.dir")).toAbsolutePath();
        Path frontend=backend.resolveSibling("controle-financeiro-frontend");
        Path out=Path.of(System.getProperty("cf031.evidence",backend.resolve("../tasks/evidencias/CF-031/e2e-initial").normalize().toString())).toAbsolutePath();
        Files.createDirectories(out);
        assertThat(Files.exists(out.resolve("playwright.log"))).as("Do not overwrite earlier evidence").isFalse();
        var command=new ArrayList<>(List.of("node","node_modules/@playwright/test/cli.js","test","--config","src/screens/private/onboarding/e2e/playwright.config.ts"));
        String selected=System.getProperty("cf031.project");if(selected!=null)command.addAll(List.of("--project",selected));
        ProcessBuilder runner=new ProcessBuilder(command).directory(frontend.toFile()).redirectErrorStream(true).redirectOutput(out.resolve("playwright.log").toFile());
        runner.environment().put("BACKEND_API_URL","http://127.0.0.1:"+port);
        runner.environment().put("CF031_EVIDENCE",out.toString());runner.environment().put("CF_E2E_NAMESPACE","cf031-"+UUID.randomUUID().toString().substring(0,8));
        runner.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");
        Process process=runner.start();boolean finished=process.waitFor(9,TimeUnit.MINUTES);
        if(!finished){process.descendants().forEach(ProcessHandle::destroyForcibly);process.destroyForcibly();}
        assertThat(finished).as("Browser harness terminates").isTrue();
        assertThat(process.exitValue()).as("Playwright result; see %s",out.resolve("playwright.log")).isZero();
        List<Map<String,Object>> proof=new ArrayList<>();
        try(var files=Files.list(out)) {
            for(Path file:files.filter(p->p.getFileName().toString().endsWith("-checkpoint.json")).toList()) {
                var c=JSON.readTree(Files.readString(file));String email=c.path("email").asText();
                UUID owner=sql.queryForObject("select id from users where email=?",UUID.class,email);
                boolean full=c.path("scenario").asText().equals("full"),draft=Set.of("draft","visual").contains(c.path("scenario").asText());
                int accounts=sql.queryForObject("select count(*) from accounts where user_id=?",Integer.class,owner);
                var sum=sql.queryForObject("select sum(balance) from accounts where user_id=?",java.math.BigDecimal.class,owner);
                int receipts=sql.queryForObject("select count(*) from financial_intent_receipts where user_id=? and kind='ONBOARDING_COMPLETE'",Integer.class,owner);
                int applications=sql.queryForObject("select count(*) from onboarding_application_items where session_id=?",Integer.class,UUID.fromString(c.path("sessionId").asText()));
                int movements=sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner);
                assertThat(accounts).isEqualTo(full?3:1);assertThat(sum).isEqualByComparingTo(full?"1300.00":"0.00");assertThat(receipts).isEqualTo(draft?0:1);assertThat(applications).isEqualTo(full?16:0);
                // E01 creates only one pending forecast, never a settled income/history.
                assertThat(movements).isEqualTo(full?1:0);
                if(full){assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and is_paid=true",Integer.class,owner)).isZero();assertThat(sql.queryForObject("select sum(amount) from goal_allocations where goal_id in(select id from goals where user_id=?)",java.math.BigDecimal.class,owner)).isEqualByComparingTo("550.00");}
                proof.add(Map.of("scenario",c.path("scenario").asText(),"owner",owner.toString(),"accounts",accounts,"accountSum",sum.toPlainString(),"receipts",receipts,"applicationItems",applications,"transactions",movements));
            }
        }
        assertThat(proof).hasSize(selected==null?12:4);Files.writeString(out.resolve("sql-proof.json"),JSON.writeValueAsString(proof));
    }
    @TestConfiguration(proxyBeanMethods=false) static class TestClocks {
        static final Instant AUTH_NOW=Instant.now();
        @Bean @Primary Clock cf031ProductClock(){return Clock.fixed(Instant.parse("2026-10-21T15:00:00Z"),ZoneId.of("America/Sao_Paulo"));}
        @Bean static org.springframework.beans.factory.config.BeanPostProcessor credentialClock(){return new org.springframework.beans.factory.config.BeanPostProcessor(){
            @Override public Object postProcessBeforeInitialization(Object bean,String name){if(bean instanceof com.controlefinanceiro.api.infra.security.TokenService || bean instanceof com.controlefinanceiro.api.service.AuthService)org.springframework.test.util.ReflectionTestUtils.setField(bean,"clock",Clock.fixed(AUTH_NOW,ZoneId.of("America/Sao_Paulo")));return bean;}
        };}
    }
}
