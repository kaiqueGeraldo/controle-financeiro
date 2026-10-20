package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.account.dto.UpdateAccountDTO;
import com.controlefinanceiro.api.service.AccountService;
import com.controlefinanceiro.api.domain.account.AccountType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

class OnboardingLifecycleConcurrencyTest extends OnboardingApplicationSupport {
    @Autowired AccountService accounts;
    @Test void distinctIntentsRaceForSinglePreparationAndOnlyWinnerCanComplete() throws Exception {
        save(minimal());var c1=command(UUID.randomUUID());var c2=command(UUID.randomUUID());CountDownLatch start=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            Callable<Object> one=()->{await(start);try{return app.prepare(user.getId(),c1);}catch(DraftProblem e){return e.code();}};
            Callable<Object> two=()->{await(start);try{return app.prepare(user.getId(),c2);}catch(DraftProblem e){return e.code();}};
            var a=pool.submit(one);var b=pool.submit(two);start.countDown();List<Object> results=List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS));
            assertThat(results.stream().filter(JsonNode.class::isInstance).count()).isEqualTo(1);assertThat(results).contains("INTENT_PENDING");
            var prepared=(JsonNode)results.stream().filter(JsonNode.class::isInstance).findFirst().orElseThrow();app.complete(user.getId(),completeCommand(prepared));
        }
        assertThat(sql.queryForObject("select count(*) from onboarding_preparations where user_id=? and state='COMPLETED'",Integer.class,user.getId())).isEqualTo(1);
    }
    @Test void cancellationAndCompletionResolveToOneCoherentTerminalOutcome() throws Exception {
        var p=prepare(minimal());var c=completeCommand(p);CountDownLatch start=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var completed=pool.submit(()->{await(start);try{return app.complete(user.getId(),c).path("status").asText();}catch(DraftProblem e){return e.code();}});
            var cancelled=pool.submit(()->{await(start);try{return app.cancel(user.getId(),c).path("state").asText();}catch(DraftProblem e){return e.code();}});
            start.countDown();String a=completed.get(15,TimeUnit.SECONDS),b=cancelled.get(15,TimeUnit.SECONDS);
            assertThat(a+"|"+b).isIn("COMPLETED|ALREADY_COMPLETED","INTENT_CANCELLED|CANCELLED");
        }
        assertThat(drafts.get(user.getId()).version()).isEqualTo("2");var op=app.recover(user.getId(),c.operationId());
        assertThat(op.path("receipt").isNull()).isEqualTo(op.path("state").asText().equals("CANCELLED"));
    }
    @Test void aRealAccountWriterParticipatesBeforeReadingResources() throws Exception {
        UUID id=account("1000.00");var p=prepare(minimal());var c=completeCommand(p);CountDownLatch held=new CountDownLatch(1),release=new CountDownLatch(1);
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var holder=pool.submit(()->new TransactionTemplate(txManager).execute(s->{guard.snapshot(user.getId());held.countDown();await(release);return null;}));assertThat(held.await(10,TimeUnit.SECONDS)).isTrue();
            var writer=pool.submit(()->accounts.update(id,new UpdateAccountDTO("Changed",AccountType.CHECKING,"#123456"),user));
            try{awaitBlocked();}finally{release.countDown();}holder.get(15,TimeUnit.SECONDS);writer.get(15,TimeUnit.SECONDS);
        }
        assertProblem(()->app.complete(user.getId(),c),409,"SOURCE_CHANGED");
        assertThat(sql.queryForObject("select name from accounts where id=?",String.class,id)).isEqualTo("Changed");
    }
    @Test void removedReferencedAccountGetsUniform404AndNoEffects() {
        UUID id=account("1000.00");ObjectNode body=minimal();((ObjectNode)body.at("/payload/sections/accounts")).put("answer","PROVIDED").set("items",JSON.valueToTree(List.of(node("tempId",UUID.randomUUID().toString(),"action","LINK","ref",node("kind","ACCOUNT","id",id.toString())))));
        var p=prepare(body);sql.update("delete from accounts where id=?",id);assertProblem(()->app.complete(user.getId(),completeCommand(p)),404,"REFERENCE_NOT_FOUND");
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
    }
    @Test void failureWritingAuthoritativeReceiptRollsBackFinancialEffects() throws Exception {
        var p=prepare(e01());var c=completeCommand(p);sql.execute("create function cf030_fail_receipt() returns trigger language plpgsql as $$ begin if new.kind='ONBOARDING_COMPLETE' then raise exception 'synthetic receipt failure'; end if; return new; end $$");sql.execute("create trigger cf030_fail_receipt before insert on financial_intent_receipts for each row execute function cf030_fail_receipt()");
        try{assertThatThrownBy(()->app.complete(user.getId(),c)).isInstanceOf(RuntimeException.class);}
        finally{sql.execute("drop trigger cf030_fail_receipt on financial_intent_receipts");sql.execute("drop function cf030_fail_receipt()");}
        assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isZero();assertThat(drafts.get(user.getId()).status()).isEqualTo("IN_PROGRESS");assertThat(app.recover(user.getId(),c.operationId()).path("state").asText()).isEqualTo("PREPARED");
    }
    @Test void completedGraphDeletionIncludesReceiptsMappingAndDefaultIdentityAndRollback() throws Exception {
        var p=prepare(e01());var c=completeCommand(p);app.complete(user.getId(),c);
        new TransactionTemplate(txManager).executeWithoutResult(status->{userService.deleteAccount(user);status.setRollbackOnly();});
        assertThat(users.existsById(user.getId())).isTrue();assertThat(app.recover(user.getId(),c.operationId()).path("state").asText()).isEqualTo("COMPLETED");
        userService.deleteAccount(user);assertThat(users.existsById(user.getId())).isFalse();
        for(String table:List.of("onboarding_preparations","onboarding_default_accounts","onboarding_sessions","onboarding_reservation_history","onboarding_reservation_records","financial_intent_receipts"))assertThat(sql.queryForObject("select count(*) from "+table+" where user_id=?",Integer.class,user.getId())).as(table).isZero();
        assertThat(sql.queryForObject("select count(*) from onboarding_application_items where session_id=?",Integer.class,c.sessionId())).isZero();
    }
    @Test void defaultAccountWithNoExplicitIdentityIsNeverInitializedByHeuristic() throws Exception {
        ObjectNode body=e01();sql.update("delete from onboarding_default_accounts where user_id=?",user.getId());save(body);assertProblem(()->app.prepare(user.getId(),command(UUID.randomUUID())),409,"DEFAULT_NOT_PRISTINE");assertThat(sql.queryForObject("select sum(balance) from accounts where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("0.00");
    }
}
