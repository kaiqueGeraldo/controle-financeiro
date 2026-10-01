package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Evidence-only tests. Select #review* so inherited suites are not counted twice. */
class Rv24IndependentDeletionReviewTest extends Rv24DeletionIntegrationTest {
 @Autowired DataSource dataSource;

 @Test void reviewCommittedDeletionIsVisibleToIndependentConnectionWhenEmailRuns() {
  graph(); clearInvocations(emailService); var observed=new AtomicBoolean();
  doAnswer(call->{
   try(var connection=dataSource.getConnection();var query=connection.prepareStatement("select count(*) from users where id=?")) {
    query.setObject(1,owner.getId());try(var rows=query.executeQuery()){rows.next();assertThat(rows.getInt(1)).isZero();}
   }
   observed.set(true);return null;
  }).when(emailService).sendTemplatedEmail(anyString(),anyString(),anyString(),anyString());
  tx.executeWithoutResult(status->{userService.deleteAccount(owner);assertThat(observed).isFalse();verifyNoInteractions(emailService);});
  assertThat(observed).isTrue();verify(emailService,times(1)).sendTemplatedEmail(eq(owner.getEmail()),anyString(),anyString(),anyString());
 }

 @Test void reviewDeletedGoalPurchaseTransferReversalRealizationAndCorrectionAreRemoved() {
  graph();
  transactions.create(new CreateTransactionDTO("review transfer",money("40"),DAY,null,TransactionType.TRANSFER,account,null,true,destination,money("0"),UUID.randomUUID()),owner);
  var pending=transactions.create(new CreateTransactionDTO("review transfer forecast",money("15"),DAY,null,TransactionType.TRANSFER,account,null,false,destination,money("0"),UUID.randomUUID()),owner);
  transactions.realizeTransfer(pending.id(),new RealizeTransferDTO(UUID.randomUUID(),DAY,null,"review realization"),owner);
  var expense=transactions.create(new CreateTransactionDTO("review expense",money("20"),DAY,null,TransactionType.EXPENSE,account,null,true,null,null,UUID.randomUUID()),owner);
  transactions.reverse(expense.id(),new ReverseTransactionDTO(UUID.randomUUID(),money("5"),DAY,null,"review reverse"),owner);
  var correctable=transactions.create(new CreateTransactionDTO("review correct",money("10"),DAY,null,TransactionType.INCOME,account,null,true),owner);
  var update=new UpdateTransactionDTO();update.setAmount(money("12"));transactions.update(correctable.id(),update,owner);
  var goal=goals.create(new CreateGoalDTO("review temporary goal",money("100"),DAY.plusYears(1),"goal","target","BLUE",GoalType.MONETARY,true),owner);
  var item=goals.addItem(goal.id(),new CreateGoalItemDTO("review item",null,money("25")),owner);
  goals.purchaseItem(item.id(),new PurchaseGoalItemDTO(money("25"),account,null,null),owner);
  goals.delete(goal.id(),null,owner);
  assertThat(sql.queryForObject("select count(*) from goals where id=?",Integer.class,goal.id())).isZero();
  assertThat(sql.queryForObject("select count(*) from goal_purchases where item_id=?",Integer.class,item.id())).isEqualTo(1);
  for(String column:new String[]{"settlement_of_id","reversal_of_id","realization_of_id","correction_of_id"})
   assertThat(sql.queryForObject("select count(*) from transactions where user_id=? and "+column+" is not null",Integer.class,owner.getId())).as(column).isPositive();
  var before=sizes();userService.deleteAccount(owner);
  assertThat(users.existsById(owner.getId())).isFalse();
  assertThat(sql.queryForObject("select count(*) from goal_purchases where item_id=?",Integer.class,item.id())).isZero();
  assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId())).isZero();
  assertThat(sql.queryForObject("select count(*) from financial_commands where user_id=?",Integer.class,owner.getId())).isZero();
  assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,owner.getId())).isZero();
  assertThat(sizes().get("invest_transactions")).isLessThan(before.get("invest_transactions"));
 }

 @Test void reviewWriterWaitsForDeletionAndCannotCreateOrphanEffect() throws Exception {
  var removed=new CountDownLatch(1);var release=new CountDownLatch(1);
  var writerPid=new AtomicInteger();var deletePid=new AtomicInteger();var key=UUID.randomUUID();
  var pool=Executors.newFixedThreadPool(2);clearInvocations(emailService);
  try {
   var deletion=pool.submit(()->tx.execute(status->{
    deletePid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
    userService.deleteAccount(owner);removed.countDown();
    try{assertThat(release.await(15,TimeUnit.SECONDS)).isTrue();}catch(InterruptedException e){throw new RuntimeException(e);}
    return true;
   }));
   assertThat(removed.await(15,TimeUnit.SECONDS)).isTrue();verifyNoInteractions(emailService);
   var writer=pool.submit(()->{try{return tx.execute(status->{
    writerPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
    return transactions.create(new CreateTransactionDTO("review racing income",money("25"),DAY,null,TransactionType.INCOME,account,null,true,null,null,key),owner);
   });}catch(RuntimeException failure){return failure;}});
   org.awaitility.Awaitility.await().atMost(Duration.ofSeconds(10)).until(()->writerPid.get()!=0 &&
    Boolean.TRUE.equals(sql.queryForObject("select ? = any(pg_blocking_pids(?))",Boolean.class,deletePid.get(),writerPid.get())));
   assertThat(writerPid.get()).isNotEqualTo(deletePid.get());release.countDown();
   assertThat(deletion.get(15,TimeUnit.SECONDS)).isTrue();assertThat(writer.get(15,TimeUnit.SECONDS)).isInstanceOf(RuntimeException.class);
   assertThat(users.existsById(owner.getId())).isFalse();
   assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,owner.getId())).isZero();
   assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isZero();
   verify(emailService,times(1)).sendTemplatedEmail(eq(owner.getEmail()),anyString(),anyString(),anyString());
  }finally{release.countDown();pool.shutdownNow();pool.awaitTermination(15,TimeUnit.SECONDS);}
 }
}
