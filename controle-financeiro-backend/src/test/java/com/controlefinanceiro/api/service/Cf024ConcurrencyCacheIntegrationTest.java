package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.aop.framework.Advised;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.cache.CacheManager;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@AutoConfigureMockMvc
@ContextConfiguration(initializers = Cf024SchemaInitializer.class)
class Cf024ConcurrencyCacheIntegrationTest extends PostgresIntegrationTest {
    static final LocalDate DAY = LocalDate.of(2026, 9, 7);
    @Autowired AccountService accounts;
    @Autowired InvestmentService investments;
    @Autowired CreditCardService cards;
    @Autowired TransactionService transactions;
    @Autowired AnnualSummaryService annual;
    @Autowired UserService userService;
    @Autowired AccountRepository accountRepository;
    @Autowired CreditCardRepository cardRepository;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired TransactionTemplate tx;
    @Autowired CacheManager caches;
    @Autowired ApplicationEventPublisher events;
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;
    @Autowired tools.jackson.databind.json.JsonMapper json;
    @MockitoBean Clock clock;
    User owner;
    UUID account, destination, investment, card;

    @BeforeEach void fixture() {
        when(clock.instant()).thenReturn(Instant.parse("2026-09-30T15:00:00Z"));
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        owner = new User(); owner.setNome("CF024"); owner.setEmail(UUID.randomUUID()+"@example.invalid"); owner.setSenha("synthetic");
        owner = users.save(owner);
        account = accounts.create(new CreateAccountDTO("source",AccountType.CHECKING,money("1000"),"BLUE",DAY),owner).id();
        destination = accounts.create(new CreateAccountDTO("destination",AccountType.CHECKING,money("0"),"BLUE",DAY),owner).id();
        investment = investments.create(new CreateInvestmentDTO("CF024","CF024",InvestType.STOCK,null,
                money("10"),money("1000"),money("1000"),DAY,"SYNTHETIC"),owner).id();
        card = newCard();
    }

    UUID newCard() {
        var c=new CreditCard(); c.setUser(owner); c.setName("CF024"); c.setLimit(money("5000")); c.setClosingDay(20); c.setDueDay(28);
        var id=cardRepository.save(c).getId();
        cards.recordOpeningPosition(new CardOpeningPosition(id,DAY,YearMonth.of(2026,9),money("200"),List.of()),owner);
        return id;
    }

    @ParameterizedTest @ValueSource(booleans={false,true})
    void samePaymentIntentHasOneEffectAndOneRecoverableReceipt(boolean advance) throws Exception {
        var key=UUID.randomUUID(); var command=payment(card,key,advance?"50":"200",advance);
        var results=race(cardRepository,"findOwnedForPayment",()->cards.payInvoice(card,command,owner),()->cards.payInvoice(card,command,owner));
        assertThat(results.first()).isEqualTo(results.second());
        assertThat(cards.paymentReceipt(card,key,owner)).isEqualTo(results.first());
        balance(account,advance?"950":"800");
        assertThat(sql.queryForObject("select count(*) from card_payments where operation_id=?",Integer.class,key)).isEqualTo(1);
        assertThat(sql.queryForObject("select sum(ct.amount-ct.paid_amount-ct.refunded_amount) from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=?",BigDecimal.class,card))
                .isEqualByComparingTo(advance?"150":"0");
        verifyWait(results);
    }

    @ParameterizedTest @CsvSource({
        "PAY,TRANSFER,500,10", "PAY,BUY,600,12", "PAY,SELL,1000,8",
        "TRANSFER,BUY,500,12", "TRANSFER,SELL,900,8", "BUY,SELL,1000,10"
    })
    void differentWritersShareTheSameAccountWithoutLostMoney(String first,String second,String expectedBalance,String expectedQuantity) throws Exception {
        var results=race(accountRepository,lockMethod(first),()->action(first),()->action(second));
        assertThat(results.second()).isNotInstanceOf(Throwable.class);
        balance(account,expectedBalance);
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo(expectedQuantity);
        if(first.equals("TRANSFER")||second.equals("TRANSFER")) balance(destination,"300");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and origin<>'OPENING'",Integer.class,owner.getId()))
                .isEqualTo(first.equals("TRANSFER")||second.equals("TRANSFER")?3:2);
        verifyWait(results);
    }

    @Test void differentCardsDebitTheSameAccountExactlyTwice() throws Exception {
        var second=newCard();
        var results=race(accountRepository,"findAllByIdForTransfer",()->cards.payInvoice(card,payment(card,UUID.randomUUID(),"200",false),owner),
                ()->cards.payInvoice(second,payment(second,UUID.randomUUID(),"200",false),owner));
        assertThat(results.second()).isNotInstanceOf(Throwable.class);
        balance(account,"600");
        assertThat(sql.queryForObject("select count(*) from card_payments where account_id=?",Integer.class,account)).isEqualTo(2);
        verifyWait(results);
    }

    @Test void twoSalesCannotSellMoreThanThePosition() throws Exception {
        var result=race(accountRepository,"findOwnedForAllocation",()->invest("SELL","7"),()->invest("SELL","7"));
        assertThat(result.second()).isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        balance(account,"1700");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("3");
        assertThat(sql.queryForObject("select total_cost from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("300");
        assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Integer.class,investment)).isEqualTo(1);
        verifyWait(result);
    }

    @Test void oppositeTransfersAcquireAccountsInOneOrder() throws Exception {
        sql.update("update accounts set balance=1000 where id=?",destination);
        var results=race(accountRepository,"findAllByIdForTransfer",()->transfer(account,destination,"300"),()->transfer(destination,account,"200"));
        assertThat(results.second()).isNotInstanceOf(Throwable.class);
        balance(account,"900"); balance(destination,"1100");
        verifyWait(results);
    }

    @Test void twoTransfersCannotSpendTheSameAvailableMoney() throws Exception {
        var result=race(accountRepository,"findAllByIdForTransfer",()->transfer(account,destination,"700"),
                ()->transfer(account,destination,"700"));
        assertThat(result.second()).isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        balance(account,"300"); balance(destination,"700");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and origin='TRANSFER'",Integer.class,owner.getId())).isEqualTo(2);
        verifyWait(result);
    }

    @Test void unrelatedAccountCanCommitWhileTheFirstSourceIsHeld() throws Exception {
        var entered=new CountDownLatch(1); var release=new CountDownLatch(1);
        var thread=new AtomicReference<Thread>();
        MethodInterceptor advice=call->{var result=call.proceed();
            if(call.getMethod().getName().equals("findOwnedForAllocation")&&Thread.currentThread()==thread.get()) {
                entered.countDown(); if(!release.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("release timeout");
            } return result;};
        var proxy=(Advised)accountRepository; proxy.addAdvice(0,advice);
        var pool=Executors.newFixedThreadPool(2);
        try {
            var held=pool.submit(()->{thread.set(Thread.currentThread()); return tx.execute(s->action("BUY"));});
            assertThat(entered.await(10,TimeUnit.SECONDS)).isTrue();
            var independent=pool.submit(()->tx.execute(s->transactions.create(new CreateTransactionDTO("income",money("25"),DAY,null,
                    TransactionType.INCOME,destination,null,true),owner)));
            independent.get(5,TimeUnit.SECONDS); balance(destination,"25");
            assertThat(held.isDone()).isFalse(); release.countDown(); held.get(10,TimeUnit.SECONDS);
        } finally {release.countDown();proxy.removeAdvice(advice);pool.shutdownNow();}
    }

    @ParameterizedTest @ValueSource(strings={"PAY","TRANSFER","BUY","SELL"})
    void rollbackDoesNotInvalidateAndCommitInvalidatesOnlyTheOwnerYear(String writer) {
        var cache=caches.getCache("annualSummary"); assertThat(cache).isNotNull();
        var key=owner.getId()+"-2026"; var other=UUID.randomUUID()+"-2026";var next=owner.getId()+"-2027";
        cache.put(key,"before");cache.put(other,"other");cache.put(next,"next");
        tx.executeWithoutResult(status->{action(writer);assertThat(cache.get(key,String.class)).isEqualTo("before");status.setRollbackOnly();});
        balance(account,"1000");balance(destination,"0");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and origin<>'OPENING'",Integer.class,owner.getId())).isZero();
        assertThat(cache.get(key,String.class)).isEqualTo("before");
        tx.executeWithoutResult(status->{action(writer);assertThat(cache.get(key,String.class)).isEqualTo("before");});
        assertThat(cache.get(key)).isNull();assertThat(cache.get(other,String.class)).isEqualTo("other");assertThat(cache.get(next,String.class)).isEqualTo("next");
        cache.put(key,sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,account));
        assertThat(cache.get(key,BigDecimal.class)).isEqualByComparingTo(writer.equals("PAY")||writer.equals("BUY")?"800":writer.equals("SELL")?"1200":"700");
    }

    @Test void nonTransactionalEventCannotInvalidateConfirmedData() {
        var cache=caches.getCache("annualSummary");var key=owner.getId()+"-2026";cache.put(key,"confirmed");
        events.publishEvent(new UserFinancialDataChangedEvent(owner.getId(),2026));
        assertThat(cache.get(key,String.class)).isEqualTo("confirmed");
    }

    @Test void annualNoteInvalidationAlsoWaitsForCommit() {
        var cache=caches.getCache("annualSummary");var key=owner.getId()+"-2026";cache.put(key,"confirmed");
        tx.executeWithoutResult(status->{
            annual.updateNote(owner,new com.controlefinanceiro.api.domain.summary.dto.UpdateNoteDTO(2026,"rollback"));
            assertThat(cache.get(key,String.class)).isEqualTo("confirmed");status.setRollbackOnly();
        });
        assertThat(sql.queryForObject("select count(*) from yearly_notes where user_id=?",Integer.class,owner.getId())).isZero();
        assertThat(cache.get(key,String.class)).isEqualTo("confirmed");
        annual.updateNote(owner,new com.controlefinanceiro.api.domain.summary.dto.UpdateNoteDTO(2026,"committed"));
        assertThat(cache.get(key)).isNull();
    }

    @Test void accountDeletionCannotClearCachesBeforeCommitAndReceiptCleanupIsAtomic() {
        var bare=new User();bare.setNome("CF024 removal");bare.setEmail(UUID.randomUUID()+"@example.invalid");bare.setSenha("synthetic");
        var removable=users.save(bare);var intent=UUID.randomUUID();
        sql.update("insert into financial_intent_receipts(id,user_id,kind,fingerprint,result_json,recorded_at) values(?,?,'TRANSACTION_CREATE',?,'{}',now())",
                intent,removable.getId(),"a".repeat(64));
        var cache=caches.getCache("annualSummary");var key=owner.getId()+"-2026";cache.put(key,"confirmed");
        tx.executeWithoutResult(status->{userService.deleteAccount(removable);assertThat(cache.get(key,String.class)).isEqualTo("confirmed");status.setRollbackOnly();});
        assertThat(users.existsById(removable.getId())).isTrue();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,intent)).isEqualTo(1);
        assertThat(cache.get(key,String.class)).isEqualTo("confirmed");
        userService.deleteAccount(removable);
        assertThat(users.existsById(removable.getId())).isFalse();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,intent)).isZero();
        assertThat(cache.get(key)).isNull();
    }

    @Test void realPostgresLockTimeoutReturnsRecoverable409WithoutWriting() throws Exception {
        var acquired=new CountDownLatch(1);var release=new CountDownLatch(1);var pool=Executors.newFixedThreadPool(2);
        try {
            var holder=pool.submit(()->tx.executeWithoutResult(status->{
                sql.queryForObject("select balance from accounts where id=? for update",BigDecimal.class,account);acquired.countDown();
                try {if(!release.await(10,TimeUnit.SECONDS))throw new IllegalStateException("holder timeout");}
                catch(InterruptedException ex){Thread.currentThread().interrupt();throw new IllegalStateException(ex);}
            }));
            assertThat(acquired.await(10,TimeUnit.SECONDS)).isTrue();
            var response=pool.submit(()->tx.execute(status->{
                status.setRollbackOnly();sql.execute("set local lock_timeout='500ms'");
                return attemptChecked(()->mvc.perform(post("/transactions").header("Authorization","Bearer "+tokens.generateToken(owner))
                        .contentType("application/json").content(identifiedBody("TRANSFER",UUID.randomUUID()))).andReturn().getResponse());
            }));
            var actual=(org.springframework.mock.web.MockHttpServletResponse)response.get(5,TimeUnit.SECONDS);
            release.countDown();holder.get(10,TimeUnit.SECONDS);
            assertThat(actual.getStatus()).isEqualTo(409);
            assertThat(actual.getContentAsString()).contains("Atualize").doesNotContain("SQL","lock_timeout","accounts");
            balance(account,"1000");balance(destination,"0");
            assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId())).isZero();
        } finally {release.countDown();pool.shutdownNow();}
    }

    @Test void realPostgresDeadlockRollsBackTheLoserAndReturns409() throws Exception {
        sql.update("update accounts set balance=1000 where id=?",destination);
        var barrier=new CyclicBarrier(2);var pool=Executors.newFixedThreadPool(2);var pids=new ConcurrentHashMap<UUID,Integer>();
        try {
            var a=pool.submit(()->deadlockedTransfer(account,destination,barrier,pids));
            var b=pool.submit(()->deadlockedTransfer(destination,account,barrier,pids));
            var first=a.get(15,TimeUnit.SECONDS);var second=b.get(15,TimeUnit.SECONDS);
            assertThat(List.of(first.status(),second.status())).containsExactlyInAnyOrder(200,409);
            assertThat(pids.get(account)).isPositive().isNotEqualTo(pids.get(destination));
            var winner=first.status()==200?first:second;
            balance(winner.source(),"700");balance(winner.source().equals(account)?destination:account,"1300");
            assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId())).isEqualTo(2);
            assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,owner.getId())).isEqualTo(1);
        } finally {pool.shutdownNow();}
    }

    record DirectedResponse(UUID source,int status) {}
    DirectedResponse deadlockedTransfer(UUID from,UUID to,CyclicBarrier barrier,Map<UUID,Integer> pids) {
        return tx.execute(status->{
            pids.put(from,sql.queryForObject("select pg_backend_pid()",Integer.class));
            sql.queryForObject("select balance from accounts where id=? for update",BigDecimal.class,from);
            // Deliberately invert an enclosing writer's locks to exercise PostgreSQL's real victim selection.
            attemptChecked(()->{barrier.await(10,TimeUnit.SECONDS);return null;});
            var body=identifiedBody("TRANSFER",UUID.randomUUID()).replace(account.toString(),"SOURCE")
                    .replace(destination.toString(),to.toString()).replace("SOURCE",from.toString());
            int response=(Integer)attemptChecked(()->postCommand("/transactions",body));
            if(response!=200)status.setRollbackOnly();
            return new DirectedResponse(from,response);
        });
    }

    @ParameterizedTest @ValueSource(strings={"BUY","TRANSFER"})
    void repeatedIdentifiedHttpCommandHasOneEffect(String kind) throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody(kind,key);var path=kind.equals("BUY")?"/investments/operation":"/transactions";
        assertThat(postCommand(path,body)).isEqualTo(200);
        assertThat(postCommand(path,body)).isEqualTo(200);
        balance(account,kind.equals("BUY")?"800":"700");
        if(kind.equals("TRANSFER"))balance(destination,"300");
        var response=mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+tokens.generateToken(owner))).andReturn();
        assertThat(response.getResponse().getStatus()).isEqualTo(200);
        assertThat(postCommand(path,body.replace(kind.equals("BUY")?"\"quantity\":2":"\"amount\":300",kind.equals("BUY")?"\"quantity\":3":"\"amount\":400"))).isEqualTo(409);
        balance(account,kind.equals("BUY")?"800":"700");
    }

    @ParameterizedTest @ValueSource(strings={"BUY","TRANSFER"})
    void concurrentIdentifiedHttpCommandsReturnTheSamePersistedResult(String kind) throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody(kind,key);
        var path=kind.equals("BUY")?"/investments/operation":"/transactions";
        Work send=()->{
            var result=mvc.perform(post(path).header("Authorization","Bearer "+tokens.generateToken(owner))
                    .contentType("application/json").content(body)).andReturn().getResponse();
            assertThat(result.getStatus()).isEqualTo(200);return json.readTree(result.getContentAsString());
        };
        var results=race(accountRepository,kind.equals("BUY")?"findOwnedForAllocation":"findAllByIdForTransfer",send,send);
        assertThat(results.second()).isEqualTo(results.first());
        balance(account,kind.equals("BUY")?"800":"700");
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isEqualTo(1);
        var recovered=mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+tokens.generateToken(owner))).andReturn().getResponse();
        assertThat(json.readTree(recovered.getContentAsString()).get("result")).isEqualTo(results.first());
        if(kind.equals("BUY")) {
            action("SELL");balance(account,"1000");
            assertThat(json.readTree(sql.queryForObject("select result_json from financial_intent_receipts where id=?",String.class,key))).isEqualTo(results.first());
            assertThat(send.run()).isEqualTo(results.first());balance(account,"1000");
        }
        verifyWait(results);
    }

    @Test void canonicalDecimalsAndDefaultsReplayButCrossKindReuseConflicts() throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody("BUY",key);
        assertThat(postCommand("/investments/operation",body)).isEqualTo(200);
        assertThat(postCommand("/investments/operation",body.replace("\"quantity\":2","\"quantity\":2.00000000").replace("\"fees\":0,",""))).isEqualTo(200);
        assertThat(postCommand("/transactions",identifiedBody("TRANSFER",key))).isEqualTo(409);
        balance(account,"800");balance(destination,"0");
    }

    @Test void receiptOwnerIsolationAndCredentialFailurePreserveMoney() throws Exception {
        var key=UUID.randomUUID();assertThat(postCommand("/investments/operation",identifiedBody("BUY",key))).isEqualTo(200);
        var other=new User();other.setNome("CF024-B");other.setEmail(UUID.randomUUID()+"@example.invalid");other.setSenha("synthetic");other=users.save(other);
        var otherToken=tokens.generateToken(other);
        var foreign=mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+otherToken)).andReturn().getResponse();
        var absent=mvc.perform(get("/financial-intents/"+UUID.randomUUID()).header("Authorization","Bearer "+otherToken)).andReturn().getResponse();
        assertThat(foreign.getStatus()).isEqualTo(404);assertThat(absent.getStatus()).isEqualTo(404);
        assertThat(json.readTree(foreign.getContentAsString()).get("message")).isEqualTo(json.readTree(absent.getContentAsString()).get("message"));
        assertThat(mvc.perform(get("/financial-intents/"+key)).andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mvc.perform(post("/investments/operation").header("Authorization","Bearer "+otherToken).contentType("application/json")
                .content(identifiedBody("BUY",key))).andReturn().getResponse().getStatus()).isEqualTo(409);
        balance(account,"800");assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isEqualTo(1);
    }

    @ParameterizedTest @ValueSource(strings={"BUY","TRANSFER"})
    void failureWhileSavingReceiptRollsBackLedgerPositionAndCache(String kind) throws Exception {
        var key=UUID.randomUUID();var body=identifiedBody(kind,key);var path=kind.equals("BUY")?"/investments/operation":"/transactions";
        var cache=caches.getCache("annualSummary");var cacheKey=owner.getId()+"-2026";cache.put(cacheKey,"before");
        sql.execute("create function cf024_fail_receipt() returns trigger language plpgsql as $$ begin if new.id='"+key+"'::uuid then raise exception 'CF024 synthetic receipt failure'; end if; return new; end $$");
        sql.execute("create trigger cf024_fail_receipt before insert on financial_intent_receipts for each row execute function cf024_fail_receipt()");
        try {
            assertThat(postCommand(path,body)).isEqualTo(500);
            balance(account,"1000");balance(destination,"0");
            assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("10");
            assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId())).isZero();
            assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Integer.class,investment)).isZero();
            assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isZero();
            assertThat(cache.get(cacheKey,String.class)).isEqualTo("before");
            assertThat(mvc.perform(get("/financial-intents/"+key).header("Authorization","Bearer "+tokens.generateToken(owner))).andReturn().getResponse().getStatus()).isEqualTo(404);
        } finally {sql.execute("drop trigger cf024_fail_receipt on financial_intent_receipts");sql.execute("drop function cf024_fail_receipt()");}
        assertThat(postCommand(path,body)).isEqualTo(200);balance(account,kind.equals("BUY")?"800":"700");
        assertThat(cache.get(cacheKey)).isNull();
    }

    String identifiedBody(String kind,UUID key) {
        return kind.equals("BUY")?"""
            {"investmentId":"%s","accountId":"%s","type":"BUY","quantity":2,"price":100,"fees":0,"date":"2026-09-07","operationId":"%s"}
            """.formatted(investment,account,key):"""
            {"description":"identified transfer","accountId":"%s","destinationAccountId":"%s","type":"TRANSFER","amount":300,"date":"2026-09-07","isPaid":true,"operationId":"%s"}
            """.formatted(account,destination,key);
    }
    int postCommand(String path,String body) throws Exception {
        return mvc.perform(post(path).header("Authorization","Bearer "+tokens.generateToken(owner)).contentType("application/json").content(body)).andReturn().getResponse().getStatus();
    }
    Object action(String type) {
        return switch(type) {
            case "PAY"->cards.payInvoice(card,payment(card,UUID.randomUUID(),"200",false),owner);
            case "TRANSFER"->transfer(account,destination,"300");
            default->invest(type,"2");
        };
    }
    Object invest(String type,String quantity) {
        investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.valueOf(type),money(quantity),money("100"),BigDecimal.ZERO,DAY,account),owner);return "committed";
    }
    Object transfer(UUID from,UUID to,String amount) {
        return transactions.create(new CreateTransactionDTO("CF024 transfer",money(amount),DAY,null,TransactionType.TRANSFER,from,null,true,to,BigDecimal.ZERO),owner);
    }
    PayInvoiceDTO payment(UUID ignored,UUID key,String amount,boolean advance) {return new PayInvoiceDTO(account,money(amount),DAY,"10:00",9,2026,"CF024",advance,key);}
    String lockMethod(String kind) {return kind.equals("PAY")||kind.equals("TRANSFER")?"findAllByIdForTransfer":"findOwnedForAllocation";}
    static BigDecimal money(String value) {return new BigDecimal(value);}
    void balance(UUID id,String expected) {assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,id)).isEqualByComparingTo(expected);}
    interface Work {Object run() throws Exception;}
    Object attempt(Work work) {try{return work.run();}catch(Exception ex){return ex;}}
    record Results(Object first,Object second,boolean blocked) {}
    void verifyWait(Results results) {assertThat(results.blocked()).as("second connection actually waits on first transaction").isTrue();}

    Results race(Object repository,String method,Work first,Work second) throws Exception {
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var firstThread=new AtomicReference<Thread>();
        var held=new AtomicBoolean();var firstPid=new AtomicInteger();var secondPid=new AtomicInteger();
        MethodInterceptor barrier=call->{Object result=call.proceed();
            if(call.getMethod().getName().equals(method)&&Thread.currentThread()==firstThread.get()&&held.compareAndSet(false,true)) {
                entered.countDown();if(!release.await(15,TimeUnit.SECONDS))throw new IllegalStateException("first lock release timeout");
            }return result;};
        var proxy=(Advised)repository;proxy.addAdvice(0,barrier);var pool=Executors.newFixedThreadPool(2);
        try {
            var a=pool.submit(()->attempt(()->tx.execute(status->{firstThread.set(Thread.currentThread());firstPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));return attemptChecked(first);})));
            assertThat(entered.await(10,TimeUnit.SECONDS)).as("first source lock observed").isTrue();
            var b=pool.submit(()->attempt(()->tx.execute(status->{secondPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));return attemptChecked(second);})));
            boolean blocked=false;long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(8);
            while(System.nanoTime()<deadline) {
                if(secondPid.get()!=0&&Boolean.TRUE.equals(sql.queryForObject("select ? = any(pg_blocking_pids(?))",Boolean.class,firstPid.get(),secondPid.get()))) {blocked=true;break;}
                if(b.isDone())break;Thread.onSpinWait();
            }
            release.countDown();
            var result=new Results(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS),blocked);
            assertThat(firstPid.get()).isPositive().isNotEqualTo(secondPid.get());
            assertThat(result.first()).isNotInstanceOf(Throwable.class);
            return result;
        } finally {release.countDown();proxy.removeAdvice(barrier);pool.shutdownNow();}
    }
    Object attemptChecked(Work work) {try{return work.run();}catch(RuntimeException ex){throw ex;}catch(Exception ex){throw new IllegalStateException(ex);}}
}
