package com.controlefinanceiro.api;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;

/** Existing CF007 harness boundary, isolated data and actual Flyway schema. */
@ActiveProfiles("test")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@ContextConfiguration(initializers=EmptyMigrationTestInitializer.class)
@Import(FrontendClosureBrowserTest.FixedClock.class)
class FrontendClosureBrowserTest {
    @TestConfiguration static class FixedClock {
        @Bean @Primary Clock reviewBrowserClock() {return Clock.fixed(Instant.parse("2027-01-15T12:00:00.123456Z"),ZoneId.of("America/Sao_Paulo"));}
        @Bean static org.springframework.beans.factory.config.BeanPostProcessor reviewCredentialsClock() {
            return new org.springframework.beans.factory.config.BeanPostProcessor() {
                @Override public Object postProcessBeforeInitialization(Object bean,String name) {
                    if(bean instanceof com.controlefinanceiro.api.infra.security.TokenService || bean instanceof com.controlefinanceiro.api.service.AuthService)
                        org.springframework.test.util.ReflectionTestUtils.setField(bean,"clock",Clock.fixed(Instant.parse("2027-01-15T12:00:00Z"),ZoneId.of("America/Sao_Paulo")));
                    return bean;
                }
            };
        }
    }
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @MockitoBean EmailService email;
    @MockitoBean MarketDataService quotes;
    @Test void browserBffSpringPostgresAndReload() throws Exception {
        assertThat(sql.queryForObject("select count(*) from flyway_schema_history where version='11' and success",Integer.class)).isOne();
        Path front=Path.of(System.getProperty("user.dir")).toAbsolutePath().resolveSibling("controle-financeiro-frontend");
        Path evidence=front.resolveSibling("tasks/evidencias/fechamento-CF-010-CF-015/browser")
                .resolve(System.getProperty("review.evidence", "."));
        Files.createDirectories(evidence);
        String namespace="closure-"+UUID.randomUUID().toString().substring(0,8);
        List<String> command=new ArrayList<>(List.of("node","node_modules/@playwright/test/cli.js","test","--config","tests/e2e/playwright.frontend-closure.config.ts"));
        String grep=System.getProperty("review.grep");
        if(grep!=null){command.add("--grep");command.add(grep);}
        ProcessBuilder pb=new ProcessBuilder(command).directory(front.toFile()).redirectErrorStream(true).redirectOutput(evidence.resolve("playwright.log").toFile());
        pb.environment().put("BACKEND_API_URL","http://127.0.0.1:"+port);
        pb.environment().put("CF_E2E_AUTH_NOW","2027-01-15T12:00:00Z");
        pb.environment().put("CF_TEST_FIXED_NOW","2027-01-15T12:00:00Z");
        pb.environment().put("CF_E2E_NAMESPACE",namespace);
        pb.environment().put("CF_REVIEW_EVIDENCE",evidence.toString());
        pb.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");
                Path mailbox=front.resolve("tests/artifacts/closure-mailbox");
        Files.createDirectories(mailbox);
        org.mockito.Mockito.doAnswer(invocation -> {
            String subject=invocation.getArgument(1);
            if(subject.startsWith("Recuperação")) {
                String to=invocation.getArgument(0);
                if(!to.endsWith("@example.invalid")) throw new IllegalStateException("synthetic mail only");
                String body=invocation.getArgument(3);
                var matcher=java.util.regex.Pattern.compile(">([A-Za-z0-9]{6})</div>").matcher(body);
                if(!matcher.find()) throw new IllegalStateException("Missing recovery code in fake email");
                Files.writeString(mailbox.resolve(to+".txt"),matcher.group(1));
            }
            return null;
        }).when(email).sendTemplatedEmail(org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString(),org.mockito.ArgumentMatchers.anyString());
        pb.environment().put("CF_MAILBOX",mailbox.toString());
        pb.environment().put("CF015_VISUAL_DIR",evidence.resolve("visual").toString());
        Process p=pb.start();
        boolean finished=p.waitFor(15,TimeUnit.MINUTES);
        if(!finished){p.descendants().forEach(ProcessHandle::destroyForcibly);p.destroyForcibly();}
        StringBuilder persisted=new StringBuilder("Namespace: "+namespace+"\nFlyway versions: "+sql.queryForList("select version from flyway_schema_history order by installed_rank",String.class)+"\n");
        for(String query:List.of(
                "select a.name,a.balance,a.opening_balance,a.is_archived from accounts a join users u on u.id=a.user_id where u.email like ? order by a.name",
                "select t.description,t.amount,t.date,t.type,t.origin,t.status,t.settlement_of_id,t.reversal_of_id from transactions t join users u on u.id=t.user_id where u.email like ? order by t.description,t.origin",
                "select c.name,i.month,i.year,i.status,ct.amount,ct.paid_amount,ct.refunded_amount from card_transactions ct join invoices i on i.id=ct.invoice_id join credit_cards c on c.id=i.card_id join users u on u.id=c.user_id where u.email like ? order by c.name,i.year,i.month",
                "select g.title,g.current_value,a.amount from goals g left join goal_allocations a on a.goal_id=g.id join users u on u.id=g.user_id where u.email like ?",
                "select i.name,i.quantity,i.total_cost,i.valuation_amount from investments i join users u on u.id=i.user_id where u.email like ?",
                "select c.original_id,c.cash_delta,c.realized_delta,c.returned_fees,c.reason,c.recorded_at from investment_corrections c join investments i on i.id=c.investment_id join users u on u.id=i.user_id where u.email like ?",
                "select r.transaction_id,r.cost_delta,r.realized_result from investment_cost_revisions r join investment_corrections c on c.id=r.correction_id join investments i on i.id=c.investment_id join users u on u.id=i.user_id where u.email like ?")){
            persisted.append(query).append('\n').append(sql.queryForList(query,"%"+namespace+"%")).append('\n');
        }
        Files.writeString(evidence.resolve("persisted.txt"),persisted);
        assertThat(finished).as("bounded browser run").isTrue();
        assertThat(p.exitValue()).as("See browser/playwright.log; expected red findings remain red").isZero();
    }
}
