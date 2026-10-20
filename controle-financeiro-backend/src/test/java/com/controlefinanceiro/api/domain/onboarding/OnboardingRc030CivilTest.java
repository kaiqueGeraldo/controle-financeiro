package com.controlefinanceiro.api.domain.onboarding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingRc030CivilTest extends OnboardingApplicationSupport {
    ObjectNode body(boolean create,int year,int month,int close,int due,String override,List<JsonNode> future) {
        JsonNode known=node("state","KNOWN","value","100.00"),zero=node("state","KNOWN","value","0.00");
        var opening=node("currentCompetence",node("year",year,"month",month),"currentOutstanding","100.00","currentPrincipal",known,"currentCharges",zero,"credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",future);
        if(override!=null)opening.put("dueDateOverride",override);
        ObjectNode item;
        if(create)item=node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","RC030 calendar","limit",node("state","KNOWN","value","1000.00"),"closingDay",close,"dueDay",due,"opening",opening);
        else {UUID card=UUID.randomUUID();sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'RC030 existing',1000,?,?,?,0)",card,close,due,user.getId());item=node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_EMPTY","ref",node("kind","CARD","id",card.toString()),"opening",opening);}
        ObjectNode b=minimal();((ObjectNode)b.at("/payload/sections/cards")).put("answer","PROVIDED").set("items",JSON.valueToTree(List.of(item)));return b;
    }
    void noOpeningWrites() {
        assertThat(sql.queryForObject("select count(*) from invoices i join credit_cards c on c.id=i.card_id where c.user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from card_opening_batches b join credit_cards c on c.id=b.card_id where c.user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from onboarding_preparations where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(drafts.get(user.getId()).version()).isEqualTo("1");
    }
    @ParameterizedTest @CsvSource({"9999,12,20,31,9999-12-31","9999,11,31,30,9999-12-30","2024,2,31,29,2024-03-29","2023,2,31,29,2023-03-29","1,1,20,28,0001-01-28"})
    void authoritativeAndCreateConfigurationsPreserveValidCivilBoundaries(int year,int month,int close,int due,String expected) {
        for(boolean create:List.of(false,true)) {
            if(create)setup(); // Separate owner for each complete interview.
            var p=prepare(body(create,year,month,close,due,null,List.of()));var c=completeCommand(p);app.complete(user.getId(),c);
            assertThat(sql.queryForObject("select i.due_date::text from invoices i join credit_cards c on c.id=i.card_id where c.user_id=?",String.class,user.getId())).isEqualTo(expected);
            UUID card=sql.queryForObject("select id from credit_cards where user_id=?",UUID.class,user.getId());
            assertThat(cardService.getInvoiceDetails(card,month,year,user).dueDate()).isEqualTo(LocalDate.parse(expected));
            assertThat(app.recover(user.getId(),c.operationId()).path("state").asText()).isEqualTo("COMPLETED");
        }
    }
    @ParameterizedTest @ValueSource(booleans={false,true})
    void firstInvalidDerivedYearIsRejectedEvenWithValidExplicitOverride(boolean create) {
        save(body(create,9999,12,31,30,"9999-12-31",List.of()));
        assertThatThrownBy(()->app.prepare(user.getId(),command(UUID.randomUUID()))).isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("DATE_INVALID");});
        noOpeningWrites();
    }
    @ParameterizedTest @ValueSource(booleans={false,true})
    void invalidFutureInstallmentCannotCrossYearBoundary(boolean create) {
        JsonNode future=node("tempId",UUID.randomUUID().toString(),"competence",node("year",9999,"month",12),"amount","1.00","principal",node("state","KNOWN","value","1.00"),"charges",node("state","KNOWN","value","0.00"));
        save(body(create,9999,11,31,30,null,List.of(future)));
        assertThatThrownBy(()->app.prepare(user.getId(),command(UUID.randomUUID()))).isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("DATE_INVALID");});
        noOpeningWrites();
    }
    @Test void validOverrideRemainsLiteralAndConfigurationChangedAfterReviewConflicts() {
        var p=prepare(body(false,9999,12,20,31,"9999-12-30",List.of()));var c=completeCommand(p);app.complete(user.getId(),c);
        assertThat(sql.queryForObject("select i.due_date_override from invoices i join credit_cards c on c.id=i.card_id where c.user_id=?",LocalDate.class,user.getId())).isEqualTo(LocalDate.of(9999,12,30));
        setup();var before=prepare(body(false,9999,12,20,31,null,List.of()));var command=completeCommand(before);
        new TransactionTemplate(txManager).executeWithoutResult(status->{guard.writer(user.getId());sql.update("update credit_cards set closing_day=31,due_day=30 where user_id=?",user.getId());});
        assertProblem(()->app.complete(user.getId(),command),409,"SOURCE_CHANGED");
        app.cancel(user.getId(),command);
        assertThatThrownBy(()->app.prepare(user.getId(),command(UUID.randomUUID()))).isInstanceOfSatisfying(DraftProblem.class,e->{assertThat(e.status()).isEqualTo(400);assertThat(e.fields()).extracting(DraftProblem.FieldError::code).contains("DATE_INVALID");});
        assertThat(sql.queryForObject("select count(*) from invoices i join credit_cards c on c.id=i.card_id where c.user_id=?",Integer.class,user.getId())).isZero();
    }
}
