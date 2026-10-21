package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.card.*;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;

class OnboardingRevalidationCivilTest extends OnboardingApplicationSupport {
    @Autowired EntityManager em;
    static Stream<Arguments> civilCases() {
        return Stream.of("UTC", "America/Sao_Paulo", "Pacific/Kiritimati").flatMap(zone ->
            Stream.of("0001-01-01", "1582-10-04", "1582-10-15", "1900-02-28", "2000-02-29", "2026-10-21", "9999-12-31")
                .map(date -> Arguments.of(zone, date)));
    }
    UUID existingCard() {
        UUID id=UUID.randomUUID();
        sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'Independent civil',1000,20,28,?,0)",id,user.getId());
        return id;
    }
    @ParameterizedTest @MethodSource("civilCases")
    void allInvoiceCivilColumnsRoundTripAndExistingSqlDatesRemainLiteral(String zone,String literal) {
        TimeZone prior=TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone(zone));
            assertThat(TimeZone.getDefault().getID()).isEqualTo(zone);
            LocalDate boundary=LocalDate.parse(literal); LocalDate closing=boundary.getYear()==9999?boundary.minusDays(1):boundary; LocalDate expected=closing.plusDays(1); String dueLiteral=expected.toString(); UUID card=existingCard();
            TransactionTemplate tx=new TransactionTemplate(txManager);
            UUID id=tx.execute(status->{
                Invoice i=new Invoice();i.setCard(em.getReference(CreditCard.class,card));
                i.setYear(expected.getYear());i.setMonth(expected.getMonthValue());i.setStatus(InvoiceStatus.OPEN);
                i.setClosingDate(closing);i.setDueDate(expected);i.setDueDateOverride(expected);em.persist(i);em.flush();return i.getId();
            });
            assertSql(id,closing.toString(),dueLiteral);
            // Independent SQL supplies an existing DATE, not a JDBC Date converted by the same writer.
            sql.update("update invoices set closing_date=cast(? as date),due_date=cast(? as date),due_date_override=cast(? as date) where id=?",closing.toString(),dueLiteral,dueLiteral,id);
            tx.executeWithoutResult(status->{
                Invoice i=em.find(Invoice.class,id);
                assertThat(i.getClosingDate()).isEqualTo(closing);assertThat(i.getDueDate()).isEqualTo(expected);
                assertThat(i.getDueDateOverride()).isEqualTo(expected);
                assertThat(em.createQuery("select i.id from Invoice i where i.id=:id and i.closingDate=:closing and i.dueDate=:date and i.dueDateOverride=:date",UUID.class)
                    .setParameter("id",id).setParameter("date",expected).setParameter("closing",closing).getResultList()).containsExactly(id);
                i.setStatus(InvoiceStatus.CLOSED);em.flush();
            });
            assertSql(id,closing.toString(),dueLiteral);
            var dto=cardService.getInvoiceDetails(card,expected.getMonthValue(),expected.getYear(),user);
            assertThat(dto.dueDate()).isEqualTo(expected);
            assertThat(JSON.valueToTree(dto).path("dueDate").asText()).isEqualTo(dueLiteral);
            System.out.println("REVALIDATION_CIVIL zone="+TimeZone.getDefault().getID()+" literal="+literal+" sql/jpa/query/json=exact");
        } finally {TimeZone.setDefault(prior);}
    }
    void assertSql(UUID id,String closing,String due) {
        Map<String,Object> row=sql.queryForMap("select closing_date::text as closing,due_date::text as due,due_date_override::text as override from invoices where id=?",id);
        assertThat(row).containsEntry("closing",closing).containsEntry("due",due).containsEntry("override",due);
    }
    @Test void invalidDerivedDateIsRejectedAtHttpBoundaryWithoutAnyApplication() throws Exception {
        UUID card=existingCard();sql.update("update credit_cards set closing_day=31,due_day=30 where id=?",card);
        var opening=node("currentCompetence",node("year",9999,"month",12),"currentOutstanding","100.00",
            "currentPrincipal",node("state","KNOWN","value","100.00"),"currentCharges",node("state","KNOWN","value","0.00"),
            "credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",List.of());
        var body=minimal();((tools.jackson.databind.node.ObjectNode)body.at("/payload/sections/cards")).put("answer","PROVIDED")
            .set("items",JSON.valueToTree(List.of(node("tempId",UUID.randomUUID().toString(),"action","INITIALIZE_EMPTY","ref",node("kind","CARD","id",card.toString()),"opening",opening))));
        save(body);var c=command(UUID.randomUUID());
        var response=http("/onboarding/prepare",node("contractVersion",1,"sessionId",c.sessionId().toString(),"expectedVersion","1","operationId",c.operationId().toString()),400,token);
        assertThat(response.at("/error/fieldErrors").toString()).contains("DATE_INVALID");
        for(String table:List.of("invoices","card_opening_batches"))assertThat(sql.queryForObject("select count(*) from "+table+" where card_id=?",Integer.class,card)).isZero();
        for(String table:List.of("onboarding_preparations","financial_intent_receipts"))assertThat(sql.queryForObject("select count(*) from "+table+" where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(drafts.get(user.getId()).version()).isEqualTo("1");
    }
}
