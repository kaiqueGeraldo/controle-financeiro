package com.controlefinanceiro.api;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;

/** Diagnostic only: persisted SQL fixture precedes browser observation. No financial commands. */
@ActiveProfiles("test")
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@ContextConfiguration(initializers=EmptyMigrationTestInitializer.class)
@Import(Rvr24VisualBrowserTest.FixedClock.class)
class Cf014HistoryDiagnosticTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @MockitoBean EmailService email;
    @MockitoBean MarketDataService quotes;
    static UUID id(int n) { return UUID.fromString("cf014000-0000-4000-8000-"+String.format("%012d",n)); }
    @Test void persistedHistoryObservation() throws Exception {
        Path front=Path.of(System.getProperty("user.dir")).toAbsolutePath().resolveSibling("controle-financeiro-frontend");
        Path evidence=front.resolveSibling("tasks/evidencias/investigacao-CF014-historico-invisivel")
                .resolve(System.getProperty("diagnostic.run","run-01"));
        Files.createDirectories(evidence);
        sql.update("insert into users(id,nome,email,senha,dark_mode,privacy_mode) values (?,?,?,?,true,false)",
                id(1),"Pessoa Sintética CF014","cf014-diagnostic@example.invalid",new BCryptPasswordEncoder().encode("Cf014-Synthetic-2026"));
        for(int asset=0;asset<3;asset++) {
            int count=asset==0?8:asset==1?1:0;
            sql.update("insert into investments(id,ticker,name,type,quantity,average_price,current_price,user_id,version,total_cost,valuation_amount,valuation_date,valuation_source) values (?,?,?,'OTHER',?,10,10,?,0,?,?,date '2027-01-15','USER_PROVIDED')",
                    id(10+asset),asset==0?"RF15":asset==1?"CURTO":"VAZIO","Fixture persistida CF014 "+asset,count,id(1),count*10,count*10);
            for(int row=0;row<count;row++) {
                LocalDate date=LocalDate.of(2027,1,8+row);
                sql.update("insert into invest_transactions(id,type,date,quantity,price,total_value,fees,investment_id,operation_date,date_origin,cost_delta) values (?,'BUY',?::date,1,10,10,0,?,?,'USER_INPUT',10)",
                        id(100+asset*20+row),date.toString(),id(10+asset),date);
            }
        }
        String query="select i.ticker,i.user_id,t.id,t.operation_date,t.quantity,t.price,t.total_value from invest_transactions t join investments i on i.id=t.investment_id order by i.ticker,t.operation_date desc,t.id desc";
        var before=sql.queryForList(query);
        assertThat(before).hasSize(9);
        assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Integer.class,id(10))).isEqualTo(8);
        assertThat(sql.queryForObject("select count(*) from transactions",Integer.class)).isZero();
        Files.writeString(evidence.resolve("fixture-before.txt"),before.toString());
        List<String> command=new ArrayList<>(List.of("node","node_modules/@playwright/test/cli.js","test","--config","tests/e2e/playwright.cf014-history.config.ts"));
        String grep=System.getProperty("diagnostic.grep");
        if(grep!=null){command.add("--grep");command.add(grep);}
        ProcessBuilder pb=new ProcessBuilder(command)
                .directory(front.toFile()).redirectErrorStream(true).redirectOutput(evidence.resolve("playwright.log").toFile());
        pb.environment().put("BACKEND_API_URL","http://127.0.0.1:"+port);
        pb.environment().put("CF_E2E_AUTH_NOW","2027-01-15T12:00:00Z");
        pb.environment().put("CF_REVIEW_EVIDENCE",evidence.toString());
        pb.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");
        Process process=pb.start();
        boolean finished=process.waitFor(8,TimeUnit.MINUTES);
        if(!finished){process.descendants().forEach(ProcessHandle::destroyForcibly);process.destroyForcibly();}
        var after=sql.queryForList(query);
        Files.writeString(evidence.resolve("fixture-after.txt"),after.toString());
        assertThat(after).isEqualTo(before);
        assertThat(sql.queryForObject("select count(*) from transactions",Integer.class)).isZero();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts",Integer.class)).isZero();
        assertThat(finished).as("bounded diagnostic").isTrue();
        assertThat(process.exitValue()).as("See diagnostic playwright.log").isZero();
    }
}
