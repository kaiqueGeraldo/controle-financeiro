package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.InvestmentService;
import com.controlefinanceiro.api.service.TransactionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/** Historical DEC10 progress guarantee. A red assertion is preserved separately
 * from the positive controls and mutation baselines. Never relax it silently. */
class Cf033ProgressIndependenceProbeTest extends OnboardingApplicationSupport {
    @Autowired InvestmentService investments;
    @Autowired TransactionService transactions;

    @Test void unrelatedAccountProgressIsNotBlockedByAnotherSourcesBuy() throws Exception {
        UUID source=account("1000.00"), destination=account("0.00");
        LocalDate date=LocalDate.of(2026,10,19);
        UUID investment=investments.create(new CreateInvestmentDTO("CF033","CF033 progress",InvestType.STOCK,
                null,new BigDecimal("10"),new BigDecimal("1000.00"),new BigDecimal("1000.00"),date,"SYNTHETIC"),user).id();
        var other=new User();other.setNome("CF033 other owner");other.setEmail(UUID.randomUUID()+"@example.invalid");other.setSenha("synthetic");
        User otherOwner=users.saveAndFlush(other);
        UUID otherSource=UUID.randomUUID();
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,'CF033 independent owner','CHECKING',0,?,false,0)",otherSource,otherOwner.getId());
        var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var waiterEntered=new CountDownLatch(1);
        var holderPid=new AtomicInteger();var waiterPid=new AtomicInteger();
        Map<String,Object> observation=new LinkedHashMap<>();
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var holder=pool.submit(()->new TransactionTemplate(txManager).executeWithoutResult(status->{
                holderPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));
                investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.BUY,
                        new BigDecimal("2"),new BigDecimal("100"),BigDecimal.ZERO,date,source),user);
                entered.countDown();await(release);
            }));
            await(entered);
            var waiter=pool.submit(()->new TransactionTemplate(txManager).execute(status->{
                waiterPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));waiterEntered.countDown();
                return transactions.create(new CreateTransactionDTO("CF033 unrelated income",new BigDecimal("25.00"),date,null,
                        TransactionType.INCOME,destination,null,true),user);
            }));
            try {
                await(waiterEntered);
                // Accept either correct immediate progress or an observed lock.
                // Do not make a successful future repair time out in this observer.
                long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
                while(!waiter.isDone() && !blocked(waiterPid.get()) && System.nanoTime()<deadline)Thread.onSpinWait();
                boolean sameOwnerBlocked=blocked(waiterPid.get());
                assertThat(waiter.isDone() || sameOwnerBlocked).as("observable completion or PostgreSQL blocker").isTrue();
                observation.put("holderPid",holderPid.get());observation.put("waiterPid",waiterPid.get());
                observation.put("waiter",sql.queryForMap("select pid,wait_event_type,wait_event,pg_blocking_pids(pid)::text as blockers,query from pg_stat_activity where pid=?",waiterPid.get()));
                observation.put("locks",sql.queryForList("select pid,locktype,mode,granted,classid,objid from pg_locks where pid in (?,?) and locktype='advisory' order by pid,granted",holderPid.get(),waiterPid.get()));
                observation.put("sameOwnerBlocked",sameOwnerBlocked);
                pool.submit(()->transactions.create(new CreateTransactionDTO("CF033 other owner income",new BigDecimal("42.17"),date,null,
                        TransactionType.INCOME,otherSource,null,true),otherOwner)).get(4,TimeUnit.SECONDS);
                observation.put("otherOwnerBalance",balance(otherSource));
            } finally {release.countDown();}
            holder.get(15,TimeUnit.SECONDS);waiter.get(15,TimeUnit.SECONDS);
        }
        observation.put("sourceAfter",balance(source));observation.put("destinationAfter",balance(destination));
        String output=System.getenv("CF032_EVIDENCE");
        if(output!=null)Files.writeString(Path.of(output,"progress-locks.json"),OnboardingJson.JSON.writeValueAsString(observation),StandardOpenOption.CREATE_NEW);
        assertThat(balance(source)).isEqualByComparingTo("800.00");
        assertThat(balance(destination)).isEqualByComparingTo("25.00");
        assertThat(balance(otherSource)).isEqualByComparingTo("42.17");
        assertThat(observation.get("sameOwnerBlocked"))
                .as("DEC10: another account of the same owner must progress while BUY holds its own source; observed PostgreSQL blockers=%s",observation.get("waiter"))
                .isEqualTo(false);
    }

    BigDecimal balance(UUID account) {
        return sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,account);
    }

    boolean blocked(int pid) {
        return Boolean.TRUE.equals(sql.queryForObject("select cardinality(pg_blocking_pids(?))>0",Boolean.class,pid));
    }
}
