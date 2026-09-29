package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;



class MilestoneSourceConcurrencyTest extends PostgresIntegrationTest {
    @Autowired AccountService accounts;
    @Autowired InvestmentService investments;
    @Autowired GoalService goals;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired TransactionTemplate tx;
    @Autowired AccountRepository accountRepository;
    @Autowired InvestmentRepository investmentRepository;

    @Test void H01_allocationMoveAndInvestmentBuyUseCompatibleSourceLockOrder() throws Exception {
        var day=LocalDate.of(2026,9,7);
        var user=new User(); user.setNome("H01");user.setEmail(UUID.randomUUID()+"@example.invalid");user.setSenha("synthetic");users.save(user);
        var account=accounts.create(new CreateAccountDTO("H01",AccountType.CHECKING,new BigDecimal("1000.00"),"BLUE",day),user).id();
        var investment=investments.create(new CreateInvestmentDTO("H01","H01",InvestType.STOCK,null,new BigDecimal("10"),new BigDecimal("100.00"),new BigDecimal("100.00"),day,"USER_PROVIDED"),user).id();
        var goal=goals.create(new CreateGoalDTO("H01",new BigDecimal("1000.00"),LocalDate.of(2028,1,1),null,null,"BLUE",GoalType.MONETARY,true),user).id();
        goals.setAllocation(goal,new SetGoalAllocationDTO(account,null,new BigDecimal("100.00")),user);
        var allocation=goals.listAllocations(goal,user).getFirst().id();
        var firstLock=new CountDownLatch(1);var release=new CountDownLatch(1);
        var buyThread=new AtomicReference<Thread>();var held=new AtomicBoolean();
        var buyPid=new AtomicInteger();var movePid=new AtomicInteger();
        MethodInterceptor barrier=call->{
            Object result=call.proceed();
            if(call.getMethod().getName().equals("findOwnedForAllocation") && Thread.currentThread()==buyThread.get() && held.compareAndSet(false,true)) {
                firstLock.countDown();
                if(!release.await(10,TimeUnit.SECONDS)) throw new IllegalStateException("H01 release timeout");
            }
            return result;
        };
        ((Advised) accountRepository).addAdvice(0, barrier);
        ((Advised) investmentRepository).addAdvice(0, barrier);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var buy=pool.submit(()->tx.executeWithoutResult(s->{
                buyThread.set(Thread.currentThread());buyPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.BUY,BigDecimal.ONE,new BigDecimal("10.00"),BigDecimal.ZERO,day,account),user);
            }));
            if (!firstLock.await(10,TimeUnit.SECONDS)) { buy.get(1,TimeUnit.SECONDS); fail("first source lock not observed"); }
            var move=pool.submit(()->tx.executeWithoutResult(s->{
                movePid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                goals.moveAllocation(goal,new MoveGoalAllocationDTO(allocation,null,investment,new BigDecimal("50.00")),user);
            }));
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(8);boolean waiting=false;
            while(System.nanoTime()<deadline) {
                if(movePid.get()!=0 && Boolean.TRUE.equals(sql.queryForObject("select cardinality(pg_blocking_pids(?)) > 0",Boolean.class,movePid.get()))) {waiting=true;break;}
                Thread.sleep(20);
            }
            release.countDown();
            assertThat(waiting).as("real second transaction waits on a source lock").isTrue();
            assertThat(buyPid.get()).isNotEqualTo(movePid.get());
            buy.get(15,TimeUnit.SECONDS);move.get(15,TimeUnit.SECONDS);
        } finally {release.countDown();((Advised) accountRepository).removeAdvice(barrier); ((Advised) investmentRepository).removeAdvice(barrier);}
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,account)).isEqualByComparingTo("990.00");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,investment)).isEqualByComparingTo("11");
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations where goal_id=?",BigDecimal.class,goal)).isEqualByComparingTo("100.00");
    }
}
