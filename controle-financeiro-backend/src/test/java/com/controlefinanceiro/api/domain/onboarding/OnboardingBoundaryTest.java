package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.controlefinanceiro.api.service.AuthService;
import com.controlefinanceiro.api.domain.auth.dto.RegisterRequestDTO;
import com.controlefinanceiro.api.domain.user.User;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingBoundaryTest extends OnboardingApplicationSupport {
    @Autowired AuthService auth;
    void section(ObjectNode body,String section,List<JsonNode> rows){((ObjectNode)body.at("/payload/sections/"+section)).put("answer",rows.isEmpty()?"NONE":"PROVIDED").set("items",JSON.valueToTree(rows));}
    @Test void actualRegistrationRecordsDefaultIdentityAndOnboardingInitializesItOnce() {
        String email=UUID.randomUUID()+"@example.test";auth.register(new RegisterRequestDTO("Synthetic registration",email,"synthetic-password"));user=(User)users.findByEmail(email);token=tokens.generateToken(user);
        UUID id=sql.queryForObject("select account_id from onboarding_default_accounts where user_id=?",UUID.class,user.getId());ObjectNode body=minimal();
        section(body,"accounts",List.of(node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_DEFAULT","ref",node("kind","ACCOUNT","id",id.toString()),"balance",fact(new BigDecimal("100.00"),2),"deficitAcknowledged",false)));
        var p=prepare(body);app.complete(user.getId(),completeCommand(p));
        assertThat(sql.queryForObject("select count(*) from accounts where user_id=?",Integer.class,user.getId())).isEqualTo(1);assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,id)).isEqualByComparingTo("100.00");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,user.getId())).isZero();
    }
    @Test void initializeEmptyReusesAnExistingEmptyInvoiceAndPreservesDeclaredCivilDueDate() {
        UUID card=UUID.randomUUID(),invoice=UUID.randomUUID();sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'Existing empty',0,31,30,?,0)",card,user.getId());
        sql.update("insert into invoices(id,card_id,month,year,status,closing_date,due_date) values(?,?,2,2027,'OPEN','2027-02-28','2027-03-30')",invoice,card);
        ObjectNode body=minimal();section(body,"cards",List.of(node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_EMPTY","ref",node("kind","CARD","id",card.toString()),"opening",node("currentCompetence",node("year",2027,"month",2),"currentOutstanding","200.00","currentPrincipal",fact(new BigDecimal("194.00"),2),"currentCharges",fact(new BigDecimal("6.00"),2),"dueDateOverride","2027-03-15","credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",List.of()))));
        var p=prepare(body);assertThat(p.at("/summary/byCard/0/availableLimit/value").asText()).isEqualTo("-194.00");app.complete(user.getId(),completeCommand(p));
        assertThat(sql.queryForObject("select count(*) from invoices where card_id=?",Integer.class,card)).isEqualTo(1);assertThat(sql.queryForObject("select due_date_override from invoices where id=?",LocalDate.class,invoice)).isEqualTo(LocalDate.of(2027,3,15));
        assertThat(cardService.getInvoiceDetails(card,2,2027,user).dueDate()).isEqualTo(LocalDate.of(2027,3,15));
    }
    @Test void releasingKnownPairKeepsOtherReservationsAndShowsBeforeFinalAndDelta() {
        UUID account=account("1000.00"),g1=UUID.randomUUID(),g2=UUID.randomUUID(),a1=UUID.randomUUID(),a2=UUID.randomUUID(),temp=UUID.randomUUID();
        for(UUID goal:List.of(g1,g2))sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,version) values(?,'Existing','MONETARY',1000,300,'2026-09-30',?,true,0)",goal,user.getId());
        sql.update("insert into goal_allocations(id,goal_id,account_id,amount,version) values(?,?,?,400,0)",a1,g1,account);sql.update("insert into goal_allocations(id,goal_id,account_id,amount,version) values(?,?,?,300,0)",a2,g2,account);
        ObjectNode body=minimal();section(body,"allocations",List.of(node("tempId",temp.toString(),"goal",node("kind","GOAL","id",g1.toString()),"source",node("kind","ACCOUNT","id",account.toString()),"amount","0.00")));
        var p=prepare(body);amount(p.path("summary"),"reservedAccounts","300.00");amount(p.path("summary"),"freeAccountCash","700.00");assertThat(p.at("/summary/allocationChanges/0/previousAmount").asText()).isEqualTo("400.00");assertThat(p.at("/summary/allocationChanges/0/delta").asText()).isEqualTo("-400.00");
        var receipt=app.complete(user.getId(),completeCommand(p));assertThat(receipt.path("mapping").get(0).path("action").asText()).isEqualTo("RELEASE");assertThat(receipt.path("mapping").get(0).path("id").asText()).isEqualTo(a1.toString());
        assertThat(sql.queryForObject("select amount from goal_allocations where id=?",BigDecimal.class,a2)).isEqualByComparingTo("300.00");assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,account)).isEqualByComparingTo("1000.00");
    }
    @Test void numericProgressAndTargetPreserveEightPlacesInDatabaseAndRecovery() {
        ObjectNode body=minimal();section(body,"goals",List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","title","Exact numeric","type","NUMERIC","target","999999999999.99999999","initialProgress","999999999999.12345678","unit","unidades","deadline","2026-09-30")));
        var p=prepare(body);assertThat(p.at("/summary/byGoal/0/progress/value").asText()).isEqualTo("999999999999.12345678");assertThat(p.at("/summary/byGoal/0/covered/state").asText()).isEqualTo("NOT_APPLICABLE");
        var receipt=app.complete(user.getId(),completeCommand(p));assertThat(sql.queryForObject("select current_value::text from goals where user_id=?",String.class,user.getId())).isEqualTo("999999999999.12345678");assertThat(sql.queryForObject("select target_value::text from goals where user_id=?",String.class,user.getId())).isEqualTo("999999999999.99999999");assertThat(app.recover(user.getId(),completeCommand(p).operationId()).path("receipt")).isEqualTo(receipt);
    }
}
