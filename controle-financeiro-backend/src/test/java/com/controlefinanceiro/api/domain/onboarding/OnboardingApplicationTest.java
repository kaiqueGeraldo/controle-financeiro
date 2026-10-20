package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.onboarding.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class OnboardingApplicationTest extends OnboardingApplicationSupport {
    @Test void e01PaymentUsesExistingServiceAndReconcilesPrincipalWithoutNewConsumption() throws Exception {
        var p=prepare(e01());var receipt=app.complete(user.getId(),completeCommand(p));
        UUID account=sql.queryForObject("select id from accounts where user_id=? and type='CHECKING'",UUID.class,user.getId());
        UUID card=sql.queryForObject("select id from credit_cards where user_id=?",UUID.class,user.getId());
        cardService.payInvoice(card,new com.controlefinanceiro.api.domain.card.dto.PayInvoiceDTO(account,new BigDecimal("200.00"),LocalDate.of(2026,10,19),null,10,2026,"Synthetic payment",false,UUID.randomUUID()),user);
        var actual=cardService.listAllWithSummary(user).getFirst();assertThat(actual.committedLimit()).isEqualByComparingTo("150.00");assertThat(actual.availableLimit()).isEqualByComparingTo("850.00");
        assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("1100.00");
        assertThat(sql.queryForObject("select sum(t.amount-t.paid_amount-t.refunded_amount) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,card)).isEqualByComparingTo("150.00");
        assertThat(sql.queryForObject("select count(*) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and t.origin='PURCHASE'",Integer.class,card)).isZero();
        assertThat(app.complete(user.getId(),completeCommand(p))).isEqualTo(receipt);amount(receipt.path("summary"),"netWorth","1451.00");
    }
    @Test void e01AppliesStocksWithoutHistoryAndReceiptIsRecoveredExactly() throws Exception {
        JsonNode p=prepare(e01());JsonNode summary=p.path("summary");
        amount(summary,"accountsSigned","1300.00");amount(summary,"investmentsValue","501.00");amount(summary,"cardDebt","350.00");amount(summary,"netWorth","1451.00");amount(summary,"reservedAccounts","350.00");amount(summary,"reservedInvestments","200.00");amount(summary,"freeAccountCash","950.00");
        assertThat(summary.at("/byCard/0/committed/value").asText()).isEqualTo("344.00");assertThat(summary.at("/byCard/0/availableLimit/value").asText()).isEqualTo("656.00");
        JsonNode receipt=http("/onboarding/complete",request(completeCommand(p)),200,token).path("data");
        assertThat(receipt.path("summary")).isEqualTo(summary);assertThat(receipt.path("mapping").size()).isEqualTo(p.path("mappingPreview").size());
        assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("1300.00");
        assertThat(sql.queryForObject("select sum(valuation_amount) from investments where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("501.00");
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("550.00");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and is_paid",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from invest_transactions t join investments i on i.id=t.investment_id where i.user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select count(*) from investments where user_id=? and position_mode='MONETARY' and quantity is null and total_cost is null and average_price is null",Integer.class,user.getId())).isEqualTo(1);
        assertThat(sql.queryForObject("select deadline from goals where user_id=? and deadline='2026-09-30'",LocalDate.class,user.getId())).isEqualTo(LocalDate.of(2026,9,30));
        assertThat(app.recover(user.getId(),completeCommand(p).operationId()).path("receipt")).isEqualTo(receipt);
        assertThat(app.complete(user.getId(),completeCommand(p))).isEqualTo(receipt);
        assertThat(drafts.get(user.getId()).completedReceipt()).isEqualTo(receipt);
    }
    @Test void minimalCompletionAndImmutableReplayAfterPositionsChange() {
        UUID id=account("1000.00");var p=prepare(minimal());var receipt=app.complete(user.getId(),completeCommand(p));
        sql.update("update accounts set balance=7 where id=?",id);
        assertThat(app.complete(user.getId(),completeCommand(p))).isEqualTo(receipt);amount(receipt.path("summary"),"accountsSigned","1000.00");
        assertThat(drafts.get(user.getId()).status()).isEqualTo("COMPLETED");assertThat(drafts.get(user.getId()).version()).isEqualTo("2");
    }
    @Test void changedContentConflictsBeforeConsumedVersionAndKeepsReceipt() {
        var p=prepare(minimal());var c=completeCommand(p);var receipt=app.complete(user.getId(),c);
        var changed=new OnboardingCommand(c.sessionId(),c.expectedVersion()+1,c.operationId(),c.contentHash(),c.reviewHash());
        assertProblem(()->app.complete(user.getId(),changed),409,"INTENT_CONTENT_CONFLICT");assertThat(app.recover(user.getId(),c.operationId()).path("receipt")).isEqualTo(receipt);
        assertThat(app.prepare(user.getId(),c)).isEqualTo(p);
    }
    @Test void preparationFreezesEditsAndCancelIsDurableIdempotent() {
        var p=prepare(minimal());var c=completeCommand(p);
        var write=minimal();write.put("expectedVersion","1");
        assertProblem(()->save(write),409,"INTENT_PENDING");
        assertProblem(()->app.prepare(user.getId(),command(UUID.randomUUID())),409,"INTENT_PENDING");
        var cancelled=app.cancel(user.getId(),c);assertThat(cancelled.path("state").asText()).isEqualTo("CANCELLED");
        assertThat(app.cancel(user.getId(),c)).isEqualTo(cancelled);assertThat(drafts.get(user.getId()).version()).isEqualTo("2");
        assertProblem(()->app.complete(user.getId(),c),409,"INTENT_CANCELLED");assertProblem(()->app.prepare(user.getId(),c),409,"INTENT_CANCELLED");
    }
    @Test void sourceChangedAfterSaveIsReassessedAndAfterReviewIsRejected() {
        UUID id=account("1000.00");save(minimal());sql.update("update accounts set balance=700 where id=?",id);
        var p=app.prepare(user.getId(),command(UUID.randomUUID()));amount(p.path("summary"),"accountsSigned","700.00");
        sql.update("update accounts set balance=650 where id=?",id);
        assertProblem(()->app.complete(user.getId(),completeCommand(p)),409,"SOURCE_CHANGED");
        assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(app.recover(user.getId(),completeCommand(p).operationId()).path("state").asText()).isEqualTo("PREPARED");
    }
    @Test void twoConnectionsConfirmSameOperationOnlyOnce() throws Exception {
        var p=prepare(e01());var c=completeCommand(p);CountDownLatch start=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            Callable<JsonNode> call=()->{assertThat(start.await(10,TimeUnit.SECONDS)).isTrue();return app.complete(user.getId(),c);};
            var a=pool.submit(call);var b=pool.submit(call);start.countDown();assertThat(a.get(20,TimeUnit.SECONDS)).isEqualTo(b.get(20,TimeUnit.SECONDS));
        }
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isEqualTo(1);
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isEqualTo(2);amount(app.recover(user.getId(),c.operationId()).at("/receipt/summary"),"netWorth","1451.00");
    }
    @Test void concurrentWriterCommitsBeforeRevalidationAndInvalidatesReview() throws Exception {
        UUID id=account("1000.00");var p=prepare(minimal());var c=completeCommand(p);
        CountDownLatch written=new CountDownLatch(1),release=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var writer=pool.submit(()->new TransactionTemplate(txManager).execute(s->{guard.writer(user.getId());sql.update("update accounts set balance=800 where id=?",id);written.countDown();await(release);return null;}));
            assertThat(written.await(10,TimeUnit.SECONDS)).isTrue();
            var confirmer=pool.submit(()->{assertProblem(()->app.complete(user.getId(),c),409,"SOURCE_CHANGED");});
            try {awaitBlocked();}finally {release.countDown();}
            writer.get(15,TimeUnit.SECONDS);confirmer.get(15,TimeUnit.SECONDS);
        }
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,id)).isEqualByComparingTo("800.00");
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
    }
    @Test void lastFinancialItemFailureRollsBackEveryOpeningAndRemainsCorrectable() throws Exception {
        ObjectNode body=e01();((ObjectNode)body.at("/payload/sections/forecasts/items/0")).put("description","CF030_FAIL_LAST");var p=prepare(body);var c=completeCommand(p);
        sql.execute("create function cf030_fail_last() returns trigger language plpgsql as $$ begin if new.description='CF030_FAIL_LAST' then raise exception 'synthetic final-item failure'; end if; return new; end $$");
        sql.execute("create trigger cf030_fail_last before insert on transactions for each row execute function cf030_fail_last()");
        try {assertThatThrownBy(()->app.complete(user.getId(),c)).isInstanceOf(RuntimeException.class);}
        finally {sql.execute("drop trigger cf030_fail_last on transactions");sql.execute("drop function cf030_fail_last()");}
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select count(*) from onboarding_application_items where session_id=?",Integer.class,c.sessionId())).isZero();
        assertThat(sql.queryForObject("select count(*) from credit_cards where user_id=?",Integer.class,user.getId())).isZero();
        assertThat(app.recover(user.getId(),c.operationId()).path("state").asText()).isEqualTo("PREPARED");
        app.cancel(user.getId(),c);body.put("expectedVersion","2");((ObjectNode)body.at("/payload/sections/forecasts/items/0")).put("description","Corrected synthetic");save(body);
        app.complete(user.getId(),completeCommand(app.prepare(user.getId(),command(UUID.randomUUID()))));
    }
    @Test void unauthenticatedAndOtherOwnerCannotRecoverOrUsePreparation() throws Exception {
        var p=prepare(minimal());var c=completeCommand(p);User b=new User();b.setNome("B");b.setEmail(UUID.randomUUID()+"@example.test");b.setSenha("synthetic");b=users.saveAndFlush(b);
        assertProblem(()->app.recover(UUID.randomUUID(),c.operationId()),404,"REFERENCE_NOT_FOUND");
        http("/onboarding/complete",request(c),404,tokens.generateToken(b));
        assertThat(mvc.perform(get("/onboarding/operations/"+c.operationId())).andReturn().getResponse().getStatus()).isEqualTo(401);
    }
    @Test void individualInputPrecisionIsRejectedBeforeAnyEffect() {
        var body=minimal();var section=(ObjectNode)body.at("/payload/sections/accounts");section.put("answer","PROVIDED");section.set("items",JSON.valueToTree(List.of(node("tempId",UUID.randomUUID().toString(),"action","CREATE","name","Exact","type","CHECKING","balance",node("state","KNOWN","value","1.005"),"deficitAcknowledged",false,"distinctCashConfirmed",false))));
        assertProblem(()->save(body),400,"INVALID_FIELD");assertThat(sql.queryForObject("select count(*) from accounts where user_id=?",Integer.class,user.getId())).isZero();
    }
}
