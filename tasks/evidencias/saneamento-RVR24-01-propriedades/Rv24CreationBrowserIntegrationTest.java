package com.controlefinanceiro.api;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
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
@ContextConfiguration(initializers=PostgresTestContainerInitializer.class)
@Import(Rv24CreationBrowserIntegrationTest.FixedClock.class)
class Rv24CreationBrowserIntegrationTest {
    @TestConfiguration static class FixedClock {
        @Bean ReceiptFaultControl receiptFaultControl(JdbcTemplate sql) { return new ReceiptFaultControl(sql); }
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
    /** Test-only boundary for a real PostgreSQL failure after financial writes, before their commit. */
    @org.springframework.web.bind.annotation.RestController
    static class ReceiptFaultControl {
        private final JdbcTemplate sql;
        ReceiptFaultControl(JdbcTemplate sql) { this.sql=sql; }
        // Read-only test endpoint, only in the isolated backend test copy.
        @org.springframework.web.bind.annotation.GetMapping("/rv24-probe/state")
        Map<String,Object> state(@org.springframework.security.core.annotation.AuthenticationPrincipal com.controlefinanceiro.api.domain.user.User user) {
            return Map.of(
                "accounts",sql.queryForList("select balance from accounts where user_id=? and name like 'rv24-%'",user.getId()),
                "operations",sql.queryForList("select it.total_value,it.quantity,it.fees from invest_transactions it join investments i on i.id=it.investment_id where i.user_id=?",user.getId()),
                "bank",sql.queryForList("select amount,origin from transactions where user_id=? and origin='INVESTMENT_BUY'",user.getId()),
                "receipts",sql.queryForList("select id,(result_json::jsonb->>'totalValue')::numeric as gross from financial_intent_receipts where user_id=?",user.getId()));
        }
        record Fault(boolean enabled) {}
        @org.springframework.web.bind.annotation.PostMapping("/rv24-probe/fault")
        org.springframework.http.ResponseEntity<Void> fault(@org.springframework.security.core.annotation.AuthenticationPrincipal com.controlefinanceiro.api.domain.user.User user,
                @org.springframework.web.bind.annotation.RequestBody Fault fault) {
            sql.execute("create table if not exists rv24_fault_owners(user_id uuid primary key)");
            sql.execute("create or replace function rv24_receipt_fault() returns trigger language plpgsql as $$ begin if exists (select 1 from rv24_fault_owners where user_id=new.user_id) then raise exception 'RV24 receipt failure before commit'; end if; return new; end $$");
            sql.execute("drop trigger if exists rv24_receipt_fault on financial_intent_receipts");
            sql.execute("create trigger rv24_receipt_fault before insert on financial_intent_receipts for each row execute function rv24_receipt_fault()");
            if(fault.enabled()) sql.update("insert into rv24_fault_owners(user_id) values (?) on conflict do nothing",user.getId());
            else sql.update("delete from rv24_fault_owners where user_id=?",user.getId());
            return org.springframework.http.ResponseEntity.noContent().build();
        }
    }
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @MockitoBean EmailService email;
    @MockitoBean MarketDataService quotes;
    @Test void browserBffSpringPostgresAndReload() throws Exception {
        Path front=Path.of(System.getProperty("user.dir")).toAbsolutePath().resolveSibling("controle-financeiro-frontend");
        Path evidence=front.resolveSibling("tasks/evidencias/RV24-01/"+System.getProperty("rv24.run","browser-final"));
        assertThat(Files.exists(evidence)).as("use a fresh evidence run name").isFalse();
        Files.createDirectories(evidence);
        String namespace="rv24-"+UUID.randomUUID().toString().substring(0,8);
        String grep=System.getProperty("review.grep");
        String config="R03".equals(grep)?"tests/e2e/playwright.milestone-review.config.ts":"tests/e2e/playwright.rv24.config.ts";
        List<String> command=new ArrayList<>(List.of("node","node_modules/@playwright/test/cli.js","test","--config",config));
        if(grep!=null){command.add("--grep");command.add(grep);}
        ProcessBuilder pb=new ProcessBuilder(command).directory(front.toFile()).redirectErrorStream(true).redirectOutput(evidence.resolve("playwright.log").toFile());
        pb.environment().put("BACKEND_API_URL","http://127.0.0.1:"+port);
        pb.environment().put("CF_E2E_AUTH_NOW","2027-01-15T12:00:00Z");
        pb.environment().put("CF_TEST_FIXED_NOW","2027-01-15T12:00:00Z");
        pb.environment().put("CF_E2E_NAMESPACE",namespace);
        pb.environment().put("CF_REVIEW_EVIDENCE",evidence.toString());
        pb.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");
        Process p=pb.start();
        boolean finished=p.waitFor(15,TimeUnit.MINUTES);
        if(!finished){p.descendants().forEach(ProcessHandle::destroyForcibly);p.destroyForcibly();}
        StringBuilder persisted=new StringBuilder("Namespace: "+namespace+"\nFlyway versions: "+sql.queryForList("select version from flyway_schema_history order by installed_rank",String.class)+"\n");
        for(String query:List.of(
                "select a.name,a.balance,a.opening_balance,a.is_archived from accounts a join users u on u.id=a.user_id where u.email like ? order by a.name",
                "select t.description,t.amount,t.date,t.type,t.origin,t.status,t.settlement_of_id,t.reversal_of_id from transactions t join users u on u.id=t.user_id where u.email like ? order by t.description,t.origin",
                "select c.name,i.month,i.year,i.status,ct.amount,ct.paid_amount,ct.refunded_amount from card_transactions ct join invoices i on i.id=ct.invoice_id join credit_cards c on c.id=i.card_id join users u on u.id=c.user_id where u.email like ? order by c.name,i.year,i.month",
                "select g.title,g.current_value,a.amount from goals g left join goal_allocations a on a.goal_id=g.id join users u on u.id=g.user_id where u.email like ?",
                "select i.name,i.quantity,i.total_cost,i.valuation_amount from investments i join users u on u.id=i.user_id where u.email like ?")){
            persisted.append(query).append('\n').append(sql.queryForList(query,"%"+namespace+"%")).append('\n');
        }
        Files.writeString(evidence.resolve("persisted.txt"),persisted);
        assertThat(finished).as("bounded browser run").isTrue();
        assertThat(p.exitValue()).as("See the unique evidence run's playwright.log").isZero();
        var persistedAccounts=sql.queryForList("select a.name,a.balance from accounts a join users u on u.id=a.user_id where a.name like ? order by a.name",namespace+"-%");
        if("R03".equals(grep)) {
            assertThat(persistedAccounts).hasSize(4);
            for(var a:persistedAccounts) assertThat((java.math.BigDecimal)a.get("balance")).isEqualByComparingTo("900");
            assertThat(sql.queryForObject("select count(*) from card_payments p join accounts a on a.id=p.account_id where a.name like ?",Integer.class,namespace+"-%")).isEqualTo(4);
            Files.writeString(evidence.resolve("postgres-oracles.txt"),persistedAccounts+"\nFour payments and exact post-reload checks in original R03 journeys. RVA-03 remains open.\n");
            return;
        }
        assertThat(persistedAccounts).hasSize(1);
        assertThat((java.math.BigDecimal)persistedAccounts.get(0).get("balance")).isEqualByComparingTo("800");
        var counts=sql.queryForList("select r.id,(r.result_json::jsonb->>'totalValue')::numeric as gross from financial_intent_receipts r join users u on u.id=r.user_id where u.email like ?","%"+namespace+"%");
        assertThat(counts).hasSize(1);
        assertThat((java.math.BigDecimal)counts.get(0).get("gross")).isEqualByComparingTo("200");
        assertThat(sql.queryForObject("select count(*) from invest_transactions it join investments i on i.id=it.investment_id where i.name like ?",Integer.class,namespace+"-%")).isEqualTo(1);
        Files.writeString(evidence.resolve("postgres-oracles.txt"),persistedAccounts+"\n"+counts+"\nOne investment operation, one receipt, balance800 after recovery/reload.\n");
    }
}
