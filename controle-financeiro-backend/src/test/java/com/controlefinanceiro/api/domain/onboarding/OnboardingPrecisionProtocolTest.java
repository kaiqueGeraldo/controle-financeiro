package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.onboarding.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class OnboardingPrecisionProtocolTest extends OnboardingApplicationSupport {
    @Autowired InvestmentRepository investments;
    void section(ObjectNode body,String name,List<JsonNode> items) {((ObjectNode)body.at("/payload/sections/"+name)).put("answer",items.isEmpty()?"NONE":"PROVIDED").set("items",JSON.valueToTree(items));}
    @Test void twoMaximumSourcesAndReservationsKeepWideExactKnownProgress() {
        UUID a=UUID.randomUUID(),b=UUID.randomUUID(),g=UUID.randomUUID();ObjectNode body=minimal();List<JsonNode> accounts=new ArrayList<>(),allocations=new ArrayList<>();
        for(UUID id:List.of(a,b)) {
            accounts.add(node("tempId",id.toString(),"action","CREATE","name","Maximum","type","CHECKING","balance",fact(new BigDecimal("999999999999.99"),2),"deficitAcknowledged",false,"distinctCashConfirmed",false));
            allocations.add(node("tempId",UUID.randomUUID().toString(),"goal",node("kind","GOAL","tempId",g.toString()),"source",node("kind","ACCOUNT","tempId",id.toString()),"amount","999999999999.99"));
        }
        section(body,"accounts",accounts);section(body,"goals",List.of(node("tempId",g.toString(),"action","CREATE","title","Wide progress","type","MONETARY","target","1.00","deadline","2026-09-30")));section(body,"allocations",allocations);
        var p=prepare(body);amount(p.path("summary"),"netWorth","1999999999999.98");amount(p.path("summary"),"reservedAccounts","1999999999999.98");
        assertThat(p.at("/summary/metrics/netWorth/outsideIndividualRange").booleanValue()).isTrue();assertThat(p.at("/summary/byGoal/0/progress/value").asText()).isEqualTo("1999999999999.98");
        var receipt=app.complete(user.getId(),completeCommand(p));assertThat(app.recover(user.getId(),completeCommand(p).operationId()).path("receipt")).isEqualTo(receipt);
        assertThat(sql.queryForObject("select current_value::text from goals where user_id=?",String.class,user.getId())).isEqualTo("1999999999999.98");
    }
    @Test void totalReferenceDoesNotLoseSmallValueAndPriceRoundsOnlyOnce() {
        ObjectNode body=minimal();List<JsonNode> rows=new ArrayList<>();
        rows.add(investment("200000000.00000000",node("state","KNOWN","basis","TOTAL","amount","1.00","date","2026-10-09","source","USER_DECLARED")));
        rows.add(investment("0.12500000",node("state","KNOWN","basis","PRICE","price","10.04000000","date","2026-10-09","source","USER_DECLARED")));
        section(body,"investments",rows);var p=prepare(body);amount(p.path("summary"),"investmentsValue","2.26");app.complete(user.getId(),completeCommand(p));
        assertThat(investments.findDistinctTickersByTypes(List.of(InvestType.STOCK))).doesNotContainNull();
        new TransactionTemplate(txManager).executeWithoutResult(status->{
            var actual=investments.findAllByUserId(user.getId());
            var total=actual.stream().filter(i->i.getQuantity().compareTo(new BigDecimal("200000000"))==0).findFirst().orElseThrow();
            assertThat(total.getValuationAmount()).isEqualByComparingTo("1.00");assertThat(total.getCurrentPrice()).isEqualByComparingTo("0.00000001");
            assertThat(total.valueForQuantity(new BigDecimal("100000000"))).isEqualByComparingTo("0.50");
        });
    }
    JsonNode investment(String quantity,JsonNode valuation) {return node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Exact unit","type","STOCK","positionMode","UNIT","quantity",node("state","KNOWN","value",quantity),"cost",node("state","UNKNOWN"),"valuation",valuation,"acquisitionDate",node("state","UNKNOWN"),"historicalSource",node("state","UNKNOWN"));}
    @Test void unknownInvestmentValueDoesNotBecomeCostOrZero() {
        ObjectNode body=minimal();section(body,"investments",List.of(investment("3.00000000",node("state","UNKNOWN"))));var p=prepare(body);
        assertThat(p.at("/summary/metrics/investmentsValue/state").asText()).isEqualTo("UNKNOWN");assertThat(p.at("/summary/metrics/investmentsValue/knownSubtotal").isNull()).isTrue();app.complete(user.getId(),completeCommand(p));
        assertThat(sql.queryForObject("select valuation_amount from investments where user_id=?",BigDecimal.class,user.getId())).isNull();
    }
    @Test void unknownCardCompositionAndLimitStayUnknownInDomainReaders() {
        ObjectNode body=minimal();section(body,"cards",List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Unknown composition","limit",node("state","UNKNOWN"),"closingDay",20,"dueDay",28,
                "opening",node("currentCompetence",node("year",2026,"month",10),"currentOutstanding","200.00","currentPrincipal",node("state","UNKNOWN"),"currentCharges",node("state","UNKNOWN"),"credit","20.00","creditNotNettedAcknowledged",true,"futureInstallments",List.of()))));
        var p=prepare(body);assertThat(p.at("/summary/byCard/0/committed/state").asText()).isEqualTo("UNKNOWN");amount(p.path("summary"),"netWorth","-180.00");app.complete(user.getId(),completeCommand(p));
        var read=cardService.listAllWithSummary(user).getFirst();assertThat(read.currentInvoiceValue()).isEqualByComparingTo("200.00");assertThat(read.limit()).isNull();assertThat(read.committedLimit()).isNull();assertThat(read.availableLimit()).isNull();
    }
    @Test void confirmationEnvelopeIsClosedAndAuthenticationIsRequired() throws Exception {
        var p=prepare(minimal());var c=completeCommand(p);ObjectNode body=(ObjectNode)request(c);body.put("owner",UUID.randomUUID().toString());http("/onboarding/complete",body,400,token);body.remove("owner");body.put("confirm",false);http("/onboarding/complete",body,400,token);
        assertThat(mvc.perform(post("/onboarding/prepare").contentType("application/json").content("{}")).andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mvc.perform(post("/onboarding/complete").header("Authorization","Bearer "+token).contentType("application/json").content("{\"confirm\":true,\"confirm\":false}")).andReturn().getResponse().getStatus()).isEqualTo(400);
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
    }
    @Test void prepareRouteIsIdempotentAndRejectsForeignIdentityReuse() throws Exception {
        save(minimal());var c=command(UUID.randomUUID());var body=node("contractVersion",1,"sessionId",c.sessionId().toString(),"expectedVersion","1","operationId",c.operationId().toString());
        var p=http("/onboarding/prepare",body,200,token);assertThat(http("/onboarding/prepare",body,200,token)).isEqualTo(p);
        User other=new User();other.setNome("Other");other.setEmail(UUID.randomUUID()+"@example.test");other.setSenha("synthetic");other=users.saveAndFlush(other);
        http("/onboarding/prepare",body,409,tokens.generateToken(other));
    }
    @Test void unsupportedLegacyNegativeCardAdjustmentDoesNotBecomeCreditOrNetKnownDebt() {
        UUID card=UUID.randomUUID(),invoice=UUID.randomUUID(),category=UUID.randomUUID();
        sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'Legacy',1000,20,28,?,0)",card,user.getId());
        sql.update("insert into invoices(id,card_id,month,year,status,closing_date,due_date) values(?,?,10,2026,'OPEN','2026-10-20','2026-10-28')",invoice,card);
        sql.update("insert into categories(id,name,type,user_id) values(?,'Legacy category','EXPENSE',?)",category,user.getId());
        for(String amount:List.of("200.00","-20.00"))sql.update("insert into card_transactions(id,invoice_id,category_id,description,amount,date,created_at,origin) values(?,?,?,'Unreconciled legacy',?,'2026-10-09',now(),'LEGACY_UNKNOWN')",UUID.randomUUID(),invoice,category,new BigDecimal(amount));
        var p=prepare(minimal());assertThat(p.at("/summary/byCard/0/debt/state").asText()).isEqualTo("UNKNOWN");assertThat(p.at("/summary/metrics/cardDebt/state").asText()).isEqualTo("UNKNOWN");assertThat(p.at("/summary/metrics/cardCredit/value").asText()).isEqualTo("0.00");app.complete(user.getId(),completeCommand(p));
        assertThat(sql.queryForObject("select count(*) from card_transactions where invoice_id=?",Integer.class,invoice)).isEqualTo(2);
    }
}
