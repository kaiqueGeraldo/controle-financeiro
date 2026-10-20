package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.service.onboarding.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.datasource.DelegatingDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import javax.sql.DataSource;
import java.lang.reflect.*;
import java.math.BigDecimal;
import java.sql.Connection;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

@Import(OnboardingCapacityCostTest.CountingConfig.class)
class OnboardingCapacityCostTest extends OnboardingApplicationSupport {
    static final List<String> STATEMENTS=new CopyOnWriteArrayList<>();
    @TestConfiguration(proxyBeanMethods=false)
    static class CountingConfig {
        @Bean static BeanPostProcessor countSql() {
            return new BeanPostProcessor() {
                @Override public Object postProcessAfterInitialization(Object bean,String name) {
                    if(!(bean instanceof DataSource source) || !name.equals("dataSource"))return bean;
                    return new DelegatingDataSource(source) {
                        @Override public Connection getConnection() throws java.sql.SQLException {
                            Connection connection=super.getConnection();
                            return (Connection)Proxy.newProxyInstance(Connection.class.getClassLoader(),new Class<?>[]{Connection.class},(proxy,method,args)->{
                                if(method.getName().equals("prepareStatement") && args!=null && args[0] instanceof String query)STATEMENTS.add(query);
                                try{return method.invoke(connection,args);}catch(InvocationTargetException e){throw e.getCause();}
                            });
                        }
                    };
                }
            };
        }
    }
    void section(ObjectNode body,String name,List<JsonNode> items) {((ObjectNode)body.at("/payload/sections/"+name)).put("answer",items.isEmpty()?"NONE":"PROVIDED").set("items",JSON.valueToTree(items));}
    JsonNode accountItem(int i) {return node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Synthetic "+i,"type","CHECKING","balance",fact(new BigDecimal("1000.00"),2),"deficitAcknowledged",false,"distinctCashConfirmed",false);}
    long selects() {return STATEMENTS.stream().filter(s->s.stripLeading().toLowerCase(Locale.ROOT).startsWith("select")).count();}
    @Test void selectedMaximumAndExistingInventoryUseFixedSelectCountAndExactTotals() throws Exception {
        ObjectNode one=minimal();section(one,"accounts",List.of(accountItem(1)));save(one);STATEMENTS.clear();long before=System.nanoTime();var p1=app.prepare(user.getId(),command(UUID.randomUUID()));long smallPrepareSelects=selects();long smallNanos=System.nanoTime()-before;STATEMENTS.clear();app.complete(user.getId(),completeCommand(p1));long smallCompleteSelects=selects();
        // A fresh owner keeps fixtures independent of the first completed session.
        setup();ObjectNode max=minimal();List<JsonNode> accounts=new ArrayList<>(),investments=new ArrayList<>(),goals=new ArrayList<>(),allocations=new ArrayList<>(),cards=new ArrayList<>(),forecasts=new ArrayList<>();
        for(int i=0;i<50;i++)accounts.add(accountItem(i));
        for(int i=0;i<50;i++)investments.add(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Synthetic asset "+i,"type","FIXED_INCOME","positionMode","MONETARY","quantity",node("state","NOT_APPLICABLE"),"cost",node("state","UNKNOWN"),"valuation",node("state","KNOWN","basis","TOTAL","amount","500.00","date","2026-10-09","source","USER_DECLARED"),"acquisitionDate",node("state","UNKNOWN"),"historicalSource",node("state","UNKNOWN")));
        for(int i=0;i<100;i++)goals.add(node("tempId",UUID.randomUUID().toString(),"action","CREATE","title","Synthetic goal "+i,"type","MONETARY","target","500.00","deadline","2026-09-30"));
        for(int i=0;i<200;i++)allocations.add(node("tempId",UUID.randomUUID().toString(),"goal",node("kind","GOAL","tempId",goals.get(i%100).path("tempId").asText()),"source",node("kind","ACCOUNT","tempId",accounts.get(i/4).path("tempId").asText()),"amount","1.00"));
        for(int i=0;i<20;i++) {
            List<JsonNode> future=new ArrayList<>();for(int j=0;j<30;j++)future.add(node("tempId",UUID.randomUUID().toString(),"competence",node("year",2026,"month",11),"amount","1.00","principal",fact(new BigDecimal("1.00"),2),"charges",fact(BigDecimal.ZERO,2)));
            cards.add(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Synthetic card "+i,"limit",fact(new BigDecimal("1000.00"),2),"closingDay",20,"dueDay",28,"opening",node("currentCompetence",node("year",2026,"month",10),"currentOutstanding","0.00","currentPrincipal",fact(BigDecimal.ZERO,2),"currentCharges",fact(BigDecimal.ZERO,2),"credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",future)));
        }
        UUID category=UUID.randomUUID();sql.update("insert into categories(id,name,type,user_id) values(?,'Synthetic forecast','INCOME',?)",category,user.getId());
        for(int i=0;i<120;i++)forecasts.add(node("tempId",UUID.randomUUID().toString(),"description","Synthetic forecast "+i,"direction","INCOME","amount","1.00","dueDate","2026-11-05","account",node("kind","ACCOUNT","tempId",accounts.get(i%50).path("tempId").asText()),"category",node("id",category.toString())));
        section(max,"accounts",accounts);section(max,"investments",investments);section(max,"goals",goals);section(max,"allocations",allocations);section(max,"cards",cards);section(max,"forecasts",forecasts);
        // 1140 stable temp identities; this fixture also has to fit the independent 256KiB request limit.
        assertThat(max.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length).isLessThanOrEqualTo(DraftValidator.MAX_BYTES);save(max);STATEMENTS.clear();before=System.nanoTime();var p=app.prepare(user.getId(),command(UUID.randomUUID()));long maxPrepareSelects=selects(),prepareNanos=System.nanoTime()-before;STATEMENTS.clear();before=System.nanoTime();var receipt=app.complete(user.getId(),completeCommand(p));long maxCompleteSelects=selects(),completeNanos=System.nanoTime()-before;
        assertThat(maxPrepareSelects).isEqualTo(smallPrepareSelects+1); // one batch ownership query for the CATEGORY kind absent in the small request
        assertThat(maxCompleteSelects).isEqualTo(smallCompleteSelects+3); // same category check at existence/revalidation, plus one opening-category lookup
        amount(receipt.path("summary"),"accountsSigned","50000.00");amount(receipt.path("summary"),"investmentsValue","25000.00");amount(receipt.path("summary"),"cardDebt","600.00");amount(receipt.path("summary"),"netWorth","74400.00");amount(receipt.path("summary"),"reservedAccounts","200.00");
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isEqualTo(50);assertThat(receipt.path("mapping").size()).isEqualTo(1140);
        System.out.println("CF030_COST "+node("smallPrepareSelects",smallPrepareSelects,"smallCompleteSelects",smallCompleteSelects,"maxPrepareSelects",maxPrepareSelects,"maxCompleteSelects",maxCompleteSelects,"smallPrepareNanos",smallNanos,"maxPrepareNanos",prepareNanos,"maxCompleteNanos",completeNanos,"requestBytes",max.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length,"preparedBytes",p.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length,"receiptBytes",receipt.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length));
    }
    @Test void operationalCapacityFailureIs503AndDoesNotTruncateOrWrite() {
        account("1000.00");var tiny=new OnboardingInventory(sql,1,1);
        assertProblem(()->new TransactionTemplate(txManager).execute(status->{guard.snapshot(user.getId());return tiny.load(user.getId());}),503,"SUMMARY_CAPACITY_EXCEEDED");
        var regular=new OnboardingInventory(sql,33554432,1);var raw=new TransactionTemplate(txManager).execute(status->{guard.snapshot(user.getId());return regular.load(user.getId());});
        assertThat(raw.table("accounts").size()).isEqualTo(1);assertThat(sql.queryForObject("select balance from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("1000.00");
    }
    @Test void existingInventoryBeyondRequestCardinalityIsCompleteAndMeasured() {
        List<Object[]> rows=new ArrayList<>();for(int i=0;i<1000;i++)rows.add(new Object[]{UUID.randomUUID(),"Existing "+i,new BigDecimal("1.00"),user.getId()});
        sql.batchUpdate("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,?,'CHECKING',?,?,false,0)",rows);
        save(minimal());STATEMENTS.clear();long started=System.nanoTime(),heapBefore=Runtime.getRuntime().totalMemory()-Runtime.getRuntime().freeMemory();var p=app.prepare(user.getId(),command(UUID.randomUUID()));long queries=selects(),nanos=System.nanoTime()-started,heapAfter=Runtime.getRuntime().totalMemory()-Runtime.getRuntime().freeMemory();
        assertThat(p.at("/summary/bySource").size()).isEqualTo(1000);amount(p.path("summary"),"netWorth","1000.00");assertThat(queries).isEqualTo(25);
        System.out.println("CF030_LEGACY_COST "+node("sources",1000,"selectsIncludingSessionRead",queries,"prepareNanos",nanos,"preparedBytes",p.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length,"heapBefore",heapBefore,"heapAfter",heapAfter));
    }
}
