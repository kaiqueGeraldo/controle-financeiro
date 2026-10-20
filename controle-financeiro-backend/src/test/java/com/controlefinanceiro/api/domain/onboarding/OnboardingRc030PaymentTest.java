package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.card.dto.PayInvoiceDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingRc030PaymentTest extends OnboardingApplicationSupport {
    record Fixture(UUID account,UUID card) {}
    JsonNode known(String v){return node("state","KNOWN","value",v);}
    Fixture fixture(boolean unknown) {
        UUID account=account("1000.00");ObjectNode b=minimal();
        JsonNode first=node("tempId",UUID.randomUUID().toString(),"competence",node("year",2026,"month",11),"amount",unknown?"20.00":"60.00",
                "principal",unknown?node("state","UNKNOWN"):known("50.00"),"charges",unknown?node("state","UNKNOWN"):known("10.00"));
        JsonNode second=node("tempId",UUID.randomUUID().toString(),"competence",node("year",2026,"month",11),"amount",unknown?"30.00":"40.00",
                "principal",known(unknown?"20.00":"35.00"),"charges",known(unknown?"10.00":"5.00"));
        JsonNode opening=node("currentCompetence",node("year",2026,"month",10),"currentOutstanding",unknown?"10.00":"30.00",
                "currentPrincipal",known(unknown?"10.00":"30.00"),"currentCharges",known("0.00"),"credit","0.00","creditNotNettedAcknowledged",true,"futureInstallments",List.of(first,second));
        ((ObjectNode)b.at("/payload/sections/cards")).put("answer","PROVIDED").set("items",JSON.valueToTree(List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","RC030 charges","limit",known("1000.00"),"closingDay",20,"dueDay",28,"opening",opening))));
        var p=prepare(b);app.complete(user.getId(),completeCommand(p));
        UUID card=sql.queryForObject("select id from credit_cards where user_id=?",UUID.class,user.getId());
        cardService.payInvoice(card,new PayInvoiceDTO(account,new BigDecimal("1.00"),LocalDate.of(2026,10,19),null,10,2026,"Roll principal",false,UUID.randomUUID()),user);
        return new Fixture(account,card);
    }
    PayInvoiceDTO payment(Fixture f,String amount,UUID operation){return new PayInvoiceDTO(f.account(),new BigDecimal(amount),LocalDate.of(2026,11,19),null,11,2026,"Charges first",true,operation);}
    BigDecimal debt(Fixture f){return sql.queryForObject("select sum(t.amount-t.paid_amount-t.refunded_amount) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,f.card());}

    @ParameterizedTest @CsvSource({"5.00,994.00,124.00,114.00,1.00","15.00,984.00,114.00,114.00,1.00","35.00,964.00,94.00,94.00,21.00","129.00,870.00,0.00,0.00,30.00"})
    void chargesAcrossInvoicesAndMultipleLinesPrecedeOldestPrincipal(String paid,String cash,String debt,String principal,String octoberPaid) {
        Fixture f=fixture(false);UUID operation=UUID.randomUUID();var request=payment(f,paid,operation);var receipt=cardService.payInvoice(f.card(),request,user);
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,f.account())).isEqualByComparingTo(cash);
        assertThat(debt(f)).isEqualByComparingTo(debt);
        var summary=cardService.listAllWithSummary(user).getFirst();assertThat(summary.committedLimit()).isEqualByComparingTo(principal);
        assertThat(summary.availableLimit()).isEqualByComparingTo(new BigDecimal("1000.00").subtract(new BigDecimal(principal)));
        assertThat(sql.queryForObject("select t.paid_amount from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and i.month=10",BigDecimal.class,f.card())).isEqualByComparingTo(octoberPaid);
        assertThat(sql.queryForObject("select sum(amount) from card_payment_allocations where payment_id=?",BigDecimal.class,receipt.id())).isEqualByComparingTo(paid);
        assertThat(sql.queryForObject("select count(*) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and (t.paid_amount<0 or t.paid_amount+t.refunded_amount>t.amount)",Integer.class,f.card())).isZero();
        assertThat(sql.queryForObject("select sum(opening_principal) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,f.card())).isEqualByComparingTo("115.00");
        assertThat(sql.queryForObject("select sum(opening_charges) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,f.card())).isEqualByComparingTo("15.00");
        assertThat(cardService.payInvoice(f.card(),request,user).id()).isEqualTo(receipt.id());
        assertThat(cardService.paymentReceipt(f.card(),operation,user).bankTransactionId()).isEqualTo(receipt.bankTransactionId());
        assertThat(sql.queryForObject("select count(*) from card_payments p join invoices i on i.id=p.invoice_id where i.card_id=?",Integer.class,f.card())).isEqualTo(2);
    }
    @Test void unknownCompositionStaysUnknownWhileKnownChargesArePaidFirst() {
        Fixture f=fixture(true);var receipt=cardService.payInvoice(f.card(),payment(f,"5.00",UUID.randomUUID()),user);
        assertThat(debt(f)).isEqualByComparingTo("54.00");assertThat(cardService.listAllWithSummary(user).getFirst().committedLimit()).isNull();
        assertThat(sql.queryForObject("select t.paid_amount from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and t.opening_principal is null",BigDecimal.class,f.card())).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select sum(a.amount) from card_payment_allocations a join card_transactions t on t.id=a.card_transaction_id where a.payment_id=? and t.opening_charges=10",BigDecimal.class,receipt.id())).isEqualByComparingTo("5.00");
        cardService.payInvoice(f.card(),payment(f,"54.00",UUID.randomUUID()),user);
        assertThat(debt(f)).isEqualByComparingTo("0.00");assertThat(cardService.listAllWithSummary(user).getFirst().committedLimit()).isEqualByComparingTo("0.00");
    }
    @Test void paymentAboveExactOutstandingIsRejectedWithoutAnyNewWrite() {
        Fixture f=fixture(false);
        assertThatThrownBy(()->cardService.payInvoice(f.card(),payment(f,"129.01",UUID.randomUUID()),user)).isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        assertThat(debt(f)).isEqualByComparingTo("129.00");assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,f.account())).isEqualByComparingTo("999.00");
        assertThat(sql.queryForObject("select count(*) from card_payments p join invoices i on i.id=p.invoice_id where i.card_id=?",Integer.class,f.card())).isEqualTo(1);
    }
    @Test void allocationFailureRollsBackPaymentBankDebitAndAllLineUpdates() {
        Fixture f=fixture(false);UUID operation=UUID.randomUUID();
        sql.execute("create function rc030_reject_allocation() returns trigger language plpgsql as $$ begin if exists(select 1 from card_payments where id=new.payment_id and operation_id='"+operation+"'::uuid) then raise exception 'RC030 synthetic allocation failure'; end if; return new; end; $$");
        sql.execute("create trigger rc030_fail_allocation before insert on card_payment_allocations for each row execute function rc030_reject_allocation()");
        try {assertThatThrownBy(()->cardService.payInvoice(f.card(),payment(f,"35.00",operation),user)).hasStackTraceContaining("RC030 synthetic allocation failure");}
        finally {sql.execute("drop trigger rc030_fail_allocation on card_payment_allocations");sql.execute("drop function rc030_reject_allocation()");}
        assertThat(debt(f)).isEqualByComparingTo("129.00");assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,f.account())).isEqualByComparingTo("999.00");
        assertThat(sql.queryForObject("select count(*) from card_payments where operation_id=?",Integer.class,operation)).isZero();
        assertThat(cardService.listAllWithSummary(user).getFirst().committedLimit()).isEqualByComparingTo("114.00");
    }
}
