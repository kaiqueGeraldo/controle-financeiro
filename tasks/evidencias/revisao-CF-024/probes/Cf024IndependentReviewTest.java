package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Evidence-only extension. Select #review* to avoid rerunning inherited tests. */
class Cf024IndependentReviewTest extends Cf024ConcurrencyCacheIntegrationTest {
    @Autowired FinancialIntentService intents;
    @Autowired GoalService goals;
    @Autowired com.controlefinanceiro.api.service.listener.CacheInvalidationListener invalidation;

    String income(UUID key) {
        return """
          {"description":"review income","amount":25,"date":"2026-09-07",
           "type":"INCOME","accountId":"%s","operationId":"%s"}
          """.formatted(account,key);
    }
    tools.jackson.databind.JsonNode send(String path,String body) throws Exception {
        var response=mvc.perform(post(path).header("Authorization","Bearer "+tokens.generateToken(owner))
                .contentType("application/json").content(body)).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(200);
        return json.readTree(response.getContentAsString());
    }
    int receipts() {return sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,owner.getId());}
    int facts() {return sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId());}

    @Test void reviewPaymentAndBuyRespectExistingReservationAndPersistLinks() throws Exception {
        var goal=goals.create(new com.controlefinanceiro.api.domain.goal.dto.CreateGoalDTO("review reserve",money("700"),
                LocalDate.of(2027,1,1),"review","target","BLUE",com.controlefinanceiro.api.domain.goal.GoalType.MONETARY,false),owner);
        goals.setAllocation(goal.id(),new com.controlefinanceiro.api.domain.goal.dto.SetGoalAllocationDTO(account,null,money("700")),owner);
        var paymentKey=UUID.randomUUID();var buyKey=UUID.randomUUID();
        var result=race(accountRepository,"findAllByIdForTransfer",()->cards.payInvoice(card,payment(card,paymentKey,"200",false),owner),
                ()->investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.BUY,money("2"),money("100"),BigDecimal.ZERO,DAY,account,null,buyKey),owner));
        assertThat(result.second()).isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        verifyWait(result);balance(account,"800");
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations where account_id=?",BigDecimal.class,account)).isEqualByComparingTo("700");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("10");
        assertThat(sql.queryForObject("select sum(a.amount) from card_payment_allocations a join card_payments p on p.id=a.payment_id where p.operation_id=?",BigDecimal.class,paymentKey)).isEqualByComparingTo("200");
        assertThat(sql.queryForObject("select count(*) from card_payments p join transactions t on t.id=p.bank_transaction_id where p.operation_id=? and t.amount=200 and t.account_id=?",Integer.class,paymentKey,account)).isEqualTo(1);
        assertThat(sql.queryForObject("select sum(ct.amount-ct.paid_amount-ct.refunded_amount) from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=?",BigDecimal.class,card)).isEqualByComparingTo("0");
        assertThat(facts()).isEqualTo(1);assertThat(receipts()).isZero();
    }

    @Test void reviewLegacyUnkeyedCallsHaveTwoEffectsAsDocumented() throws Exception {
        var body=income(UUID.randomUUID()).replaceAll(",\\\"operationId\\\":\\\"[^\\\"]*\\\"", "");
        // Whitespace is not added between accountId and operationId in income().
        send("/transactions",body);send("/transactions",body);
        balance(account,"1050");assertThat(facts()).isEqualTo(2);assertThat(receipts()).isZero();
        System.out.println("REVIEW OBSERVATION: two unkeyed creations credit twice and produce no receipt.");
    }

    @Test void reviewOrdinaryCreationDefaultsDistinctIntentsAndDeletedResourceReplay() throws Exception {
        var key=UUID.randomUUID();var body=income(key);var first=send("/transactions",body);
        var normalized=body.replace("\"amount\":25","\"amount\":25.00").replace("\"type\":", "\"time\":null,\"isPaid\":null,\"fee\":0,\"type\":");
        assertThat(send("/transactions",normalized)).isEqualTo(first);
        balance(account,"1025");assertThat(facts()).isEqualTo(1);assertThat(receipts()).isEqualTo(1);
        send("/transactions",income(UUID.randomUUID()));balance(account,"1050");assertThat(facts()).isEqualTo(2);
        transactions.delete(UUID.fromString(first.get("id").asText()),owner);balance(account,"1025");
        assertThat(send("/transactions",body)).isEqualTo(first);balance(account,"1025");assertThat(facts()).isEqualTo(3);
        var recovered=mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+tokens.generateToken(owner))).andReturn().getResponse();
        assertThat(json.readTree(recovered.getContentAsString()).get("result")).isEqualTo(first);
        var pendingKey=UUID.randomUUID();var pendingBody=income(pendingKey).replace("\"type\":", "\"isPaid\":false,\"type\":");
        var pending=send("/transactions",pendingBody);
        transactions.delete(UUID.fromString(pending.get("id").asText()),owner);
        assertThat(send("/transactions",pendingBody)).isEqualTo(pending);balance(account,"1025");
        assertThat(facts()).isEqualTo(3);assertThat(receipts()).isEqualTo(3);
    }

    @ParameterizedTest @ValueSource(strings={"SELL","DIVIDEND","INTEREST"})
    void reviewOtherInvestmentTypesReplayOneEffect(String kind) throws Exception {
        var key=UUID.randomUUID();
        var body=identifiedBody("BUY",key).replace("\"type\":\"BUY\"","\"type\":\""+kind+"\"");
        if(!kind.equals("SELL"))body=body.replace("\"quantity\":2","\"quantity\":1").replace("\"fees\":0","\"fees\":10");
        var first=send("/investments/operation",body);
        assertThat(send("/investments/operation",body)).isEqualTo(first);
        balance(account,kind.equals("SELL")?"1200":"1090");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo(kind.equals("SELL")?"8":"10");
        assertThat(sql.queryForObject("select total_cost from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo(kind.equals("SELL")?"800":"1000");
        assertThat(facts()).isEqualTo(kind.equals("SELL")?1:2);assertThat(receipts()).isEqualTo(1);
        assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=? and bank_transaction_id is not null",Integer.class,investment)).isEqualTo(1);
    }

    @Test void reviewMonetaryRedemptionSnapshotDoesNotUseCurrentPosition() throws Exception {
        var fixed=investments.create(new CreateInvestmentDTO("FIX","FIX",InvestType.FIXED_INCOME,null,money("10"),money("1000"),money("1000"),DAY,"SYNTHETIC"),owner).id();
        var key=UUID.randomUUID();
        var body="""
          {"investmentId":"%s","accountId":"%s","type":"SELL","amount":"200.00","fees":0,"date":"2026-09-07","operationId":"%s"}
          """.formatted(fixed,account,key);
        var first=send("/investments/operation",body);
        assertThat(send("/investments/operation",body)).isEqualTo(first);balance(account,"1200");
        var position=sql.queryForMap("select quantity,total_cost,valuation_amount from investments where id=?",fixed);
        assertThat((BigDecimal)position.get("quantity")).isEqualByComparingTo("8");
        assertThat((BigDecimal)position.get("total_cost")).isEqualByComparingTo("800");
        assertThat((BigDecimal)position.get("valuation_amount")).isEqualByComparingTo("800");
        assertThat(receipts()).isEqualTo(1);
    }

    @Test void reviewEveryTransactionSemanticFieldConflictsWithoutPartialWrite() throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody("TRANSFER",key);send("/transactions",body);
        for(var modified:List.of(
            body.replace("identified transfer","changed"),body.replace("300","301"),
            body.replace("2026-09-07","2026-09-08"),body.replace("\"isPaid\":true","\"isPaid\":false"),
            body.replace("\"type\":\"TRANSFER\"","\"type\":\"INCOME\""),
            body.replace(destination.toString(),UUID.randomUUID().toString()),
            body.replace(account.toString(),destination.toString()),
            body.replace("\"amount\":300","\"time\":\"12:00\",\"amount\":300"),
            body.replace("\"amount\":300","\"fee\":1,\"amount\":300"),
            body.replace("\"amount\":300","\"categoryId\":\""+UUID.randomUUID()+"\",\"amount\":300"))) {
            assertThat(postCommand("/transactions",modified)).isEqualTo(409);
        }
        balance(account,"700");balance(destination,"300");assertThat(facts()).isEqualTo(2);assertThat(receipts()).isEqualTo(1);
    }

    @Test void reviewEveryInvestmentSemanticFieldConflictsWithoutPartialWrite() throws Exception {
        var body=identifiedBody("BUY",UUID.randomUUID());send("/investments/operation",body);
        for(var modified:List.of(body.replace("\"quantity\":2","\"quantity\":3"),
                body.replace("\"price\":100","\"price\":101"),body.replace("\"fees\":0","\"fees\":1"),
                body.replace("2026-09-07","2026-09-08"),body.replace("BUY","SELL"),
                body.replace(investment.toString(),UUID.randomUUID().toString()),
                body.replace(account.toString(),destination.toString()),
                body.replace("\"quantity\":2","\"amount\":\"200.00\",\"quantity\":2")))
            assertThat(postCommand("/investments/operation",modified)).isEqualTo(409);
        balance(account,"800");assertThat(facts()).isEqualTo(1);assertThat(receipts()).isEqualTo(1);
    }

    @Test void reviewRollbackWhileSameIntentWaitsAndRecoveryCanBeAbsent() throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody("BUY",key);
        var locked=new CountDownLatch(1);var release=new CountDownLatch(1);var firstThread=new AtomicReference<Thread>();
        var firstPid=new AtomicInteger();var secondPid=new AtomicInteger();var pool=Executors.newFixedThreadPool(2);
        MethodInterceptor barrier=call->{var result=call.proceed();
            if(call.getMethod().getName().equals("findOwnedForAllocation")&&Thread.currentThread()==firstThread.get()) {
                locked.countDown();if(!release.await(15,TimeUnit.SECONDS))throw new IllegalStateException("release");
            }return result;};
        var proxy=(Advised)accountRepository;proxy.addAdvice(0,barrier);
        try {
            var first=pool.submit(()->tx.execute(status->{firstThread.set(Thread.currentThread());firstPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                var result=attemptChecked(()->send("/investments/operation",body));status.setRollbackOnly();return result;}));
            assertThat(locked.await(10,TimeUnit.SECONDS)).isTrue();
            var second=pool.submit(()->tx.execute(status->{secondPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));return attemptChecked(()->send("/investments/operation",body));}));
            boolean blocked=false;long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(8);
            while(System.nanoTime()<deadline) {
                if(secondPid.get()>0&&Boolean.TRUE.equals(sql.queryForObject("select ?=any(pg_blocking_pids(?))",Boolean.class,firstPid.get(),secondPid.get()))) {blocked=true;break;}
                if(second.isDone())break;Thread.onSpinWait();
            }
            assertThat(blocked).isTrue();assertThat(firstPid.get()).isNotEqualTo(secondPid.get());
            assertThat(mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+tokens.generateToken(owner))).andReturn().getResponse().getStatus()).isEqualTo(404);
            release.countDown();first.get(15,TimeUnit.SECONDS);second.get(15,TimeUnit.SECONDS);
            balance(account,"800");assertThat(receipts()).isEqualTo(1);assertThat(facts()).isEqualTo(1);
            assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("12");
        } finally {release.countDown();proxy.removeAdvice(barrier);pool.shutdownNow();}
    }

    public static class Unserializable {public String getResult(){throw new IllegalStateException("review serializer failure");}}
    @Test void reviewActualSerializationFailureAbortsLedgerAndAllowsSameKeyInNewTransaction() {
        var key=UUID.randomUUID();var cache=caches.getCache("annualSummary");var cacheKey=owner.getId()+"-2026";cache.put(cacheKey,"before");
        assertThatThrownBy(()->tx.executeWithoutResult(status->{
            transactions.create(new CreateTransactionDTO("serialization",money("25"),DAY,null,TransactionType.INCOME,account,null,true),owner);
            intents.complete(key,owner,FinancialIntentService.TRANSACTION_CREATE,"a".repeat(64),new Unserializable());
        })).hasStackTraceContaining("review serializer failure");
        balance(account,"1000");assertThat(receipts()).isZero();assertThat(facts()).isZero();assertThat(cache.get(cacheKey,String.class)).isEqualTo("before");
        var command=new CreateTransactionDTO("serialization",money("25"),DAY,null,TransactionType.INCOME,account,null,true,null,null,key);
        transactions.create(command,owner);balance(account,"1025");assertThat(receipts()).isEqualTo(1);
    }

    @Test void reviewMovingForecastAcrossYearsAndSourcesInvalidatesBothAfterCommit() {
        var forecast=transactions.create(new CreateTransactionDTO("forecast",money("25"),DAY,null,TransactionType.INCOME,account,null,false),owner);
        var cache=caches.getCache("annualSummary");var oldKey=owner.getId()+"-2026";var newKey=owner.getId()+"-2027";
        cache.put(oldKey,"old");cache.put(newKey,"new");
        var edit=new UpdateTransactionDTO();edit.setAccountId(destination);edit.setDate(LocalDate.of(2027,1,5));
        tx.executeWithoutResult(status->{transactions.update(forecast.id(),edit,owner);assertThat(cache.get(oldKey,String.class)).isEqualTo("old");assertThat(cache.get(newKey,String.class)).isEqualTo("new");status.setRollbackOnly();});
        assertThat(cache.get(oldKey,String.class)).isEqualTo("old");assertThat(cache.get(newKey,String.class)).isEqualTo("new");
        transactions.update(forecast.id(),edit,owner);assertThat(cache.get(oldKey)).isNull();assertThat(cache.get(newKey)).isNull();balance(account,"1000");balance(destination,"0");
    }

    @Test void reviewCallbackFailureDoesNotUndoCommittedMoneyOrReceipt() throws Exception {
        MethodInterceptor failure=call->{throw new IllegalStateException("review after-commit failure");};
        var proxy=(Advised)invalidation;proxy.addAdvice(0,failure);
        var key=UUID.randomUUID();var body=income(key);
        try {assertThat(postCommand("/transactions",body)).isEqualTo(200);}
        finally {proxy.removeAdvice(failure);}
        balance(account,"1025");assertThat(receipts()).isEqualTo(1);assertThat(facts()).isEqualTo(1);
        assertThat(postCommand("/transactions",body)).isEqualTo(200);balance(account,"1025");
    }

    @Test void reviewPaymentReuseAcrossCardsAndPrepaymentTypeConflicts() {
        var second=newCard();var key=UUID.randomUUID();var command=payment(card,key,"50",true);
        cards.payInvoice(card,command,owner);
        assertThatThrownBy(()->cards.payInvoice(second,command,owner)).isInstanceOf(com.controlefinanceiro.api.service.exception.OperationConflictException.class);
        assertThatThrownBy(()->cards.payInvoice(card,payment(card,key,"50",false),owner)).isInstanceOf(com.controlefinanceiro.api.service.exception.OperationConflictException.class);
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);balance(account,"900");
        assertThat(sql.queryForObject("select count(*) from card_payments where account_id=?",Integer.class,account)).isEqualTo(2);
    }

    @Test void reviewLinkedDeletionProbeKeepsRollbackAndCacheOnFailure() {
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);
        var cache=caches.getCache("annualSummary");var cacheKey=owner.getId()+"-2026";cache.put(cacheKey,"confirmed");
        // Observation of an inherited deletion defect, not acceptance of its promised behavior.
        assertThatThrownBy(()->userService.deleteAccount(owner)).isInstanceOf(org.hibernate.exception.ConstraintViolationException.class)
                .hasMessageContaining("card_payment_allocations_card_transaction_id_fkey");
        assertThat(users.existsById(owner.getId())).isTrue();balance(account,"950");assertThat(cache.get(cacheKey,String.class)).isEqualTo("confirmed");
        assertThat(sql.queryForObject("select count(*) from card_payments where account_id=?",Integer.class,account)).isEqualTo(1);
        System.out.println("REVIEW OBSERVATION: linked deletion fails; user/payment/money/cache preserved.");
    }

    @Test void contractLinkedDeletionMustCompleteWithoutForeignKeyFailure() {
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);
        assertThatCode(()->userService.deleteAccount(owner)).doesNotThrowAnyException();
        assertThat(users.existsById(owner.getId())).isFalse();
    }

    @Test void reviewRealStaleVersionAbortsTheLosingTransaction() throws Exception {
        var read=new CyclicBarrier(2);var committed=new CountDownLatch(1);var pool=Executors.newFixedThreadPool(2);
        try {
            var first=pool.submit(()->tx.execute(status->{var entity=accountRepository.findById(account).orElseThrow();
                entity.credit(money("25"));attemptChecked(()->{read.await(10,TimeUnit.SECONDS);return null;});
                accountRepository.saveAndFlush(entity);return "done";}));
            var second=pool.submit(()->attempt(()->tx.execute(status->{var entity=accountRepository.findById(account).orElseThrow();
                entity.credit(money("50"));attemptChecked(()->{read.await(10,TimeUnit.SECONDS);assertThat(committed.await(10,TimeUnit.SECONDS)).isTrue();return null;});
                accountRepository.saveAndFlush(entity);return "done";})));
            first.get(15,TimeUnit.SECONDS);committed.countDown();
            assertThat(second.get(15,TimeUnit.SECONDS)).isInstanceOf(org.springframework.dao.OptimisticLockingFailureException.class);
            balance(account,"1025");assertThat(facts()).isZero();assertThat(receipts()).isZero();
        } finally {committed.countDown();pool.shutdownNow();}
    }

    @Test void reviewLegacySettlementReplayPreservesEffectButUsesLiveResult() {
        var forecast=transactions.create(new CreateTransactionDTO("forecast",money("25"),DAY,null,TransactionType.INCOME,account,null,false),owner);
        var command=new SettleTransactionDTO(money("25"),DAY,"10:00",UUID.randomUUID());
        var first=transactions.settle(forecast.id(),command,owner);balance(account,"1025");
        transactions.reverse(first.id(),new ReverseTransactionDTO(UUID.randomUUID(),money("25"),DAY,"11:00","review"),owner);balance(account,"1000");
        var replay=transactions.settle(forecast.id(),command,owner);balance(account,"1000");
        assertThat(replay.id()).isEqualTo(first.id());assertThat(replay.status()).isEqualTo(TransactionStatus.REVERSED);
        assertThat(first.status()).isEqualTo(TransactionStatus.SETTLED);
        System.out.println("REVIEW OBSERVATION: legacy receipt is a live ledger projection; money is not replayed.");
    }
}
