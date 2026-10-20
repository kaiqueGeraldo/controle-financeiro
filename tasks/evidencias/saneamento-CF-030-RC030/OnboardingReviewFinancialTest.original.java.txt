package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.card.dto.PayInvoiceDTO;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingReviewFinancialTest extends OnboardingApplicationSupport {
    void section(ObjectNode b,String name,List<JsonNode> rows) {
        ((ObjectNode)b.at("/payload/sections/"+name)).put("answer",rows.isEmpty()?"NONE":"PROVIDED").set("items",JSON.valueToTree(rows));
    }
    JsonNode known(String amount) {return node("state","KNOWN","value",amount);}
    JsonNode opening(int year,int month,String principal,String charges,List<JsonNode> future) {
        return node("currentCompetence",node("year",year,"month",month),"currentOutstanding",new BigDecimal(principal).add(new BigDecimal(charges)).toPlainString(),
                "currentPrincipal",known(principal),"currentCharges",known(charges),"credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",future);
    }
    @Test void identifiedChargesMustBePaidBeforeOlderPrincipalAcrossRolledInvoices() {
        UUID account=account("1000.00");ObjectNode b=minimal();
        JsonNode future=node("tempId",UUID.randomUUID().toString(),"competence",node("year",2026,"month",11),"amount","100.00","principal",known("90.00"),"charges",known("10.00"));
        section(b,"cards",List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Review charges","limit",known("1000.00"),"closingDay",20,"dueDay",28,
                "opening",opening(2026,10,"100.00","0.00",List.of(future)))));
        var p=prepare(b);app.complete(user.getId(),completeCommand(p));
        UUID card=sql.queryForObject("select id from credit_cards where user_id=?",UUID.class,user.getId());
        // FIN-03: first payment rolls 99 principal; November has 90 principal +10 charges.
        cardService.payInvoice(card,new PayInvoiceDTO(account,new BigDecimal("1.00"),LocalDate.of(2026,10,19),null,10,2026,"Review roll",false,UUID.randomUUID()),user);
        assertThat(cardService.listAllWithSummary(user).getFirst().committedLimit()).isEqualByComparingTo("189.00");
        cardService.payInvoice(card,new PayInvoiceDTO(account,new BigDecimal("10.00"),LocalDate.of(2026,11,19),null,11,2026,"Review charges first",true,UUID.randomUUID()),user);
        assertThat(sql.queryForObject("select sum(t.amount-t.paid_amount-t.refunded_amount) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,card)).isEqualByComparingTo("189.00");
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,account)).isEqualByComparingTo("989.00");
        // Paying known charges does not free principal/limit. Independent FIN-03 oracle.
        assertThat(cardService.listAllWithSummary(user).getFirst().committedLimit())
                .as("FIN-03 charges10 precede rolled principal99; principal must remain189").isEqualByComparingTo("189.00");
        assertThat(sql.queryForObject("select t.paid_amount from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and i.month=11",BigDecimal.class,card)).isEqualByComparingTo("10.00");
    }
    @Test void maximumTotalWithTinyQuantitySurvivesDatabaseReplayAndRecovery() {
        ObjectNode b=minimal();
        section(b,"investments",List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Tiny units","type","STOCK","positionMode","UNIT",
                "quantity",known("0.00000001"),"cost",node("state","UNKNOWN"),"valuation",node("state","KNOWN","basis","TOTAL","amount","999999999999.99","date","2026-10-09","source","USER_DECLARED"),
                "acquisitionDate",node("state","UNKNOWN"),"historicalSource",node("state","UNKNOWN"))));
        var p=prepare(b);var c=completeCommand(p);var receipt=app.complete(user.getId(),c);
        assertThat(sql.queryForObject("select valuation_amount::text from investments where user_id=?",String.class,user.getId())).isEqualTo("999999999999.99");
        assertThat(sql.queryForObject("select quantity::text from investments where user_id=?",String.class,user.getId())).isEqualTo("0.00000001");
        amount(receipt.path("summary"),"netWorth","999999999999.99");
        assertThat(app.complete(user.getId(),c)).isEqualTo(receipt);assertThat(app.recover(user.getId(),c.operationId()).path("receipt")).isEqualTo(receipt);
    }
    @Test void initializeEmptyMustRejectCalculatedDateOutsideCivilContractAtPrepare() {
        UUID card=UUID.randomUUID();
        sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'Review year boundary',1000,31,30,?,0)",card,user.getId());
        ObjectNode b=minimal();section(b,"cards",List.of(node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_EMPTY","ref",node("kind","CARD","id",card.toString()),
                "opening",opening(9999,12,"100.00","0.00",List.of()))));
        save(b);
        assertThatThrownBy(()->app.prepare(user.getId(),command(UUID.randomUUID())))
                .as("CivilDate maximum9999: derived due date10000-01-30 must fail before presenting an applicable revision")
                .isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("DATE_INVALID");});
    }
    @Test void initializedInvoiceCannotPersistYear10000BehindACompletedReceipt() {
        UUID card=UUID.randomUUID();
        sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'Review persisted boundary',1000,31,30,?,0)",card,user.getId());
        ObjectNode b=minimal();section(b,"cards",List.of(node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_EMPTY","ref",node("kind","CARD","id",card.toString()),
                "opening",opening(9999,12,"100.00","0.00",List.of()))));
        var p=prepare(b);var c=completeCommand(p);app.complete(user.getId(),c);
        String persisted=sql.queryForObject("select due_date::text from invoices where card_id=?",String.class,card);
        System.out.println("RC030_CIVIL_OBSERVATION due_date="+persisted+" state="+app.recover(user.getId(),c.operationId()).path("state").asText());
        assertThat(sql.queryForObject("select extract(year from due_date)::integer from invoices where card_id=?",Integer.class,card))
                .as("CivilDate years0001..9999 must survive persistence and successful completion").isLessThanOrEqualTo(9999);
    }
    @Test void oversizedContractVersionMustNotWrapToV1OnPrepare() throws Exception {
        save(minimal());var c=command(UUID.randomUUID());
        var body=node("contractVersion",4294967297L,"sessionId",c.sessionId().toString(),"expectedVersion","1","operationId",c.operationId().toString());
        http("/onboarding/prepare",body,400,token);
    }
}
