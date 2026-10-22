package com.controlefinanceiro.api.cf032;

import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
import com.sun.net.httpserver.HttpServer;
import org.apache.poi.ss.usermodel.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.*;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import tools.jackson.databind.json.JsonMapper;

import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.DriverManager;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Only test code: real HTTP/auth/domain/ORM/Flyway/PostgreSQL. Observations are
 * read-only except for the explicitly named, isolated legacy fixture endpoint. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(initializers=FinancialJourneyPostgresE2E.Schema.class)
@Import(FinancialJourneyPostgresE2E.Clocks.class)
class FinancialJourneyPostgresE2E extends PostgresIntegrationTest {
    private static final JsonMapper JSON=JsonMapper.builder().build();
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    Path evidence;
    String namespace;
    TimeZone startupZone;

    @org.junit.jupiter.api.AfterEach void restoreRuntimeZone(){if(startupZone!=null)TimeZone.setDefault(startupZone);}

    @Test void independentFinancialJourneys() throws Exception {
        // Application startup explicitly sets the JVM default to São Paulo.
        // Set the effective test JVM zone after startup, as in the accepted
        // temporal probes; the product Clock remains explicitly São Paulo.
        startupZone=TimeZone.getDefault();TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        Path runtime=Path.of(required("CF032_RUNTIME")).toAbsolutePath();
        evidence=Path.of(required("CF032_EVIDENCE")).toAbsolutePath();
        namespace="cf032-"+UUID.randomUUID().toString().substring(0,8);
        Files.createDirectories(evidence);
        assertThat(Files.exists(evidence.resolve("playwright.log"))).isFalse();
        var env=new LinkedHashMap<String,Object>();
        env.put("springPort",port);env.put("startupJvmZone",startupZone.getID());env.put("jvmZone",TimeZone.getDefault().getID());
        env.put("productInstant","2026-10-22T09:00:00Z");env.put("namespace",namespace);
        env.put("database",sql.queryForMap("select current_database() database,current_schema() schema,current_setting('TimeZone') timezone"));
        env.put("migrations",sql.queryForList("select version,description,checksum,success from flyway_schema_history where version is not null order by installed_rank"));
        env.put("ddl","validate");env.put("externalDoubles",List.of("EmailService","MarketDataService"));
        env.put("runtime",runtime.toString());env.put("head",System.getenv("CF032_HEAD"));
        assertThat(sql.queryForObject("select count(*) from flyway_schema_history where success and version is not null",Integer.class)).isEqualTo(16);
        assertThat(sql.queryForObject("select current_schema()",String.class)).startsWith("cf032_");
        Files.writeString(evidence.resolve("environment.json"),JSON.writeValueAsString(env));

        var observer=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        observer.createContext("/",exchange->{
            try {
                var params=new HashMap<String,String>();
                String query=exchange.getRequestURI().getRawQuery();
                if(query!=null)for(String part:query.split("&")){var p=part.split("=",2);params.put(p[0],URLDecoder.decode(p.length==2?p[1]:"",StandardCharsets.UTF_8));}
                Object result;
                if(exchange.getRequestURI().getPath().equals("/xlsx"))result=workbook(params.get("file"));
                else {
                    String email=params.get("email");
                    if(email==null||!email.contains(namespace)||!email.endsWith("@example.invalid"))throw new IllegalArgumentException("Owner outside this execution");
                    UUID owner=sql.queryForObject("select id from users where email=?",UUID.class,email);
                    if(exchange.getRequestURI().getPath().equals("/legacy"))legacy(owner);
                    else if(!exchange.getRequestURI().getPath().equals("/snapshot"))throw new IllegalArgumentException("Unknown observer path");
                    result=snapshot(owner);
                    String name=params.get("name");
                    if(name!=null){if(!name.matches("[a-zA-Z0-9_-]+"))throw new IllegalArgumentException("Invalid evidence name");Files.writeString(evidence.resolve(name+"-sql.json"),JSON.writeValueAsString(result),StandardOpenOption.CREATE_NEW);}
                }
                byte[] bytes=JSON.writeValueAsBytes(result);exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);
            } catch(Exception problem){byte[] bytes=JSON.writeValueAsBytes(Map.of("error",problem.getClass().getSimpleName(),"message",String.valueOf(problem.getMessage())));exchange.sendResponseHeaders(500,bytes.length);exchange.getResponseBody().write(bytes);}
            finally{exchange.close();}
        });
        observer.start();
        var command=new ArrayList<>(List.of("node","node_modules/@playwright/test/cli.js","test","--config","tests/cf032/playwright.config.ts"));
        String grep=System.getenv("CF032_GREP");if(grep!=null&&!grep.isBlank())command.addAll(List.of("--grep",grep));
        var runner=new ProcessBuilder(command).directory(runtime.resolve("frontend").toFile()).redirectErrorStream(true).redirectOutput(evidence.resolve("playwright.log").toFile());
        runner.environment().putAll(Map.of("BACKEND_API_URL","http://127.0.0.1:"+port,"CF032_OBSERVER","http://127.0.0.1:"+observer.getAddress().getPort(),"CF_E2E_NAMESPACE",namespace,"CF032_EVIDENCE",evidence.toString(),"CF032_RUNTIME",runtime.toString(),"CF032_REPO",required("CF032_REPO"),"PLAYWRIGHT_BROWSERS_PATH","0"));
        Process process=runner.start();
        boolean finished;
        try {finished=process.waitFor(15,TimeUnit.MINUTES);}
        finally {
            if(process.isAlive()){process.descendants().forEach(ProcessHandle::destroyForcibly);process.destroyForcibly();}
            observer.stop(0);
            var all=new ArrayList<Map<String,Object>>();
            for(UUID id:sql.queryForList("select id from users where email like ?",UUID.class,"%"+namespace+"%"))all.add(snapshot(id));
            Files.writeString(evidence.resolve("terminal-sql.json"),JSON.writeValueAsString(all));
        }
        assertThat(finished).as("bounded browser harness").isTrue();
        assertThat(process.exitValue()).as("Browser assertions; failures preserved at %s",evidence.resolve("playwright.log")).isZero();
    }

    Map<String,Object> snapshot(UUID owner) {
        var result=new LinkedHashMap<String,Object>();result.put("owner",owner.toString());
        result.put("accounts",sql.queryForList("select id::text,name,balance::text,opening_balance::text,opening_date::text,opening_origin from accounts where user_id=? order by name",owner));
        result.put("investments",sql.queryForList("select id::text,name,ticker,position_mode,quantity::text,total_cost::text,valuation_amount::text,valuation_date::text,valuation_source,acquisition_date::text,historical_source from investments where user_id=? order by name",owner));
        result.put("transactions",sql.queryForList("select id::text,description,amount::text,date::text,operation_time::text as time,status,origin,is_paid,operation_id::text,recorded_at::text from transactions where user_id=? order by date,id",owner));
        result.put("goals",sql.queryForList("select id::text,title,type,current_value::text,deadline::text,numeric_progress_known,allocation_reconciled from goals where user_id=? order by title",owner));
        result.put("allocations",sql.queryForList("select a.id::text,a.goal_id::text,a.account_id::text,a.investment_id::text,a.amount::text from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=? order by a.id",owner));
        result.put("cardLines",sql.queryForList("select t.id::text,t.description,t.amount::text,t.paid_amount::text,t.refunded_amount::text,t.opening_principal::text,t.opening_charges::text,t.origin,i.month,i.year,i.due_date::text from card_transactions t join invoices i on i.id=t.invoice_id join credit_cards c on c.id=i.card_id where c.user_id=? order by i.year,i.month,t.id",owner));
        result.put("receipts",sql.queryForList("select id::text,kind from financial_intent_receipts where user_id=? order by id",owner));
        result.put("payments",sql.queryForList("select p.id::text,p.operation_id::text,p.amount::text,p.payment_date::text,p.request_fingerprint from card_payments p join invoices i on i.id=p.invoice_id join credit_cards c on c.id=i.card_id where c.user_id=? order by p.id",owner));
        result.put("habits",sql.queryForList("select id::text,name,current_streak,highest_streak from habits where user_id=?",owner));
        result.put("habitLogs",sql.queryForList("select l.log_date::text,l.status,l.goal_history_id::text from habit_logs l join habits h on h.id=l.habit_id where h.user_id=? order by l.log_date",owner));
        result.put("applications",sql.queryForObject("select count(*) from onboarding_application_items a join onboarding_sessions s on s.id=a.session_id where s.user_id=?",Integer.class,owner));
        result.put("accountTotal",sql.queryForObject("select coalesce(sum(balance),0)::text from accounts where user_id=?",String.class,owner));
        result.put("debt",sql.queryForObject("select coalesce(sum(t.amount-t.paid_amount-t.refunded_amount),0)::text from card_transactions t join invoices i on i.id=t.invoice_id join credit_cards c on c.id=i.card_id where c.user_id=?",String.class,owner));
        result.put("legacyReservations",sql.queryForList("select id::text,revision,attribution,evidence from onboarding_reservation_records where user_id=?",owner));
        String value=sql.queryForObject("select case when count(*)=count(valuation_amount) then coalesce(sum(valuation_amount),0)::text end from investments where user_id=?",String.class,owner);
        result.put("investmentTotal",value);
        String credits=sql.queryForObject("select coalesce(sum(credit_balance),0)::text from credit_cards where user_id=?",String.class,owner);
        result.put("netWorth",value==null?null:new java.math.BigDecimal(result.get("accountTotal").toString()).add(new java.math.BigDecimal(value)).add(new java.math.BigDecimal(credits)).subtract(new java.math.BigDecimal(result.get("debt").toString())).setScale(2).toPlainString());
        result.put("reservedAccounts",sql.queryForObject("select coalesce(sum(a.amount),0)::text from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=? and a.account_id is not null",String.class,owner));
        result.put("reservedInvestments",sql.queryForObject("select coalesce(sum(a.amount),0)::text from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=? and a.investment_id is not null",String.class,owner));
        // These are observed materialized allocation sums, never a claim that an
        // unrecorded legacy reservation is zero or that capacity is known.
        return result;
    }

    void legacy(UUID owner) {
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner)).isZero();
        sql.update("delete from onboarding_default_accounts where user_id=?",owner);
        sql.update("update accounts set balance=1000,opening_balance=null,opening_date=null,opening_origin='UNKNOWN' where user_id=?",owner);
        // The legacy goal's unresolved reservation uses its canonical goal ID.
        // A second arbitrary record would represent an additional independent
        // pending claim, not the same legacy reservation (identity, not name).
        UUID goal=UUID.randomUUID(),reservation=goal;
        sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,numeric_progress_known,version) values(?,'Legado sem origem','MONETARY',600,0,'2026-10-21',?,false,false,0)",goal,owner);
        String unknown="{\"state\":\"UNKNOWN\",\"value\":null,\"knownSubtotal\":null,\"outsideIndividualRange\":null,\"missingPaths\":[\"/legacy/nominal\"]}";
        String record="{\"reservationId\":\""+reservation+"\",\"revision\":\"0\",\"goal\":{\"state\":\"KNOWN\",\"value\":{\"kind\":\"GOAL\",\"id\":\""+goal+"\"}},\"nominal\":"+unknown+",\"attribution\":{\"state\":\"UNBOUNDED\",\"excluded\":[]}}";
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,'[]',now())",reservation,owner,record);
    }

    Object workbook(String name) throws Exception {
        if(name==null||!name.matches("[a-zA-Z0-9_-]+\\.xlsx"))throw new IllegalArgumentException("Invalid export filename");
        var sheets=new LinkedHashMap<String,Object>();
        try(var input=Files.newInputStream(evidence.resolve(name));var book=WorkbookFactory.create(input)) {
            for(Sheet sheet:book){var rows=new ArrayList<List<Object>>();for(Row row:sheet){var cells=new ArrayList<Object>();for(int i=0;i<row.getLastCellNum();i++){Cell c=row.getCell(i);cells.add(c==null?null:switch(c.getCellType()){case NUMERIC->java.math.BigDecimal.valueOf(c.getNumericCellValue()).toPlainString();case BOOLEAN->c.getBooleanCellValue();default->c.toString();});}rows.add(cells);}sheets.put(sheet.getSheetName(),rows);}
        }
        Files.writeString(evidence.resolve(name+".analysis.json"),JSON.writeValueAsString(sheets),StandardOpenOption.CREATE_NEW);
        return sheets;
    }

    static String required(String key){return Objects.requireNonNull(System.getenv(key),key);}
    public static class Schema implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override public void initialize(ConfigurableApplicationContext context){
            new PostgresTestContainerInitializer().initialize(context);
            String schema="cf032_"+UUID.randomUUID().toString().replace("-","");var env=context.getEnvironment();
            try(var c=DriverManager.getConnection(env.getRequiredProperty("spring.datasource.url"),env.getRequiredProperty("spring.datasource.username"),env.getRequiredProperty("spring.datasource.password"));var s=c.createStatement()){s.execute("create schema "+schema);}catch(Exception e){throw new IllegalStateException("CF032 disposable schema",e);}
            TestPropertyValues.of("spring.flyway.enabled=true","spring.flyway.schemas="+schema,"spring.flyway.default-schema="+schema,"spring.datasource.hikari.schema="+schema,"spring.jpa.hibernate.ddl-auto=validate","spring.jpa.properties.hibernate.default_schema="+schema,"logging.level.com.controlefinanceiro.api=WARN").applyTo(env);
        }
    }
    @TestConfiguration(proxyBeanMethods=false) static class Clocks {
        static final Instant AUTH_NOW=Instant.now();
        @Bean @Primary Clock cf032Clock(){return Clock.fixed(Instant.parse("2026-10-22T09:00:00Z"),ZoneId.of("America/Sao_Paulo"));}
        @Bean static org.springframework.beans.factory.config.BeanPostProcessor credentials(){return new org.springframework.beans.factory.config.BeanPostProcessor(){
            @Override public Object postProcessBeforeInitialization(Object bean,String name){if(bean instanceof com.controlefinanceiro.api.infra.security.TokenService||bean instanceof com.controlefinanceiro.api.service.AuthService)org.springframework.test.util.ReflectionTestUtils.setField(bean,"clock",Clock.fixed(AUTH_NOW,ZoneId.of("America/Sao_Paulo")));return bean;}
        };}
    }
}
