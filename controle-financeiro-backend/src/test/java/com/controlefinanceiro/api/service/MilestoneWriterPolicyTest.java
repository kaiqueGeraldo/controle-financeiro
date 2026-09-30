package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.aop.framework.Advised;
import org.aopalliance.intercept.MethodInterceptor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class MilestoneWriterPolicyTest extends PostgresIntegrationTest {
    static final LocalDate DAY=LocalDate.of(2026,9,7);
    @Autowired AccountService accounts; @Autowired AccountRepository accountRepository;
    @Autowired TransactionService ledger; @Autowired TransactionRepository transactions;
    @Autowired GoalService goals; @Autowired InvestmentService investments;
    @Autowired InvestmentCorrectionService corrections; @Autowired CreditCardService cards;
    @Autowired UserRepository users; @Autowired CategoryRepository categories; @Autowired JdbcTemplate sql;
    @Autowired org.springframework.transaction.PlatformTransactionManager manager;

    @Test void voluntaryWritersRespectReservedCapacityButRealBankLiquidationRecordsDeficit(){
        var u=user();var a=account(u);var b=account(u);var g=goal(u);var i=asset(u);
        goals.setAllocation(g,new SetGoalAllocationDTO(a,null,m("700.00")),u);
        var item=goals.addItem(g,new CreateGoalItemDTO("Livre insuficiente",null,m("301.00")),u).id();
        for(Runnable writer:List.<Runnable>of(
            ()->ledger.create(transfer(a,b,"301.00"),u),
            ()->investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.BUY,m("1"),m("301.00"),m("0.00"),DAY,a),u),
            ()->goals.purchaseItem(item,new PurchaseGoalItemDTO(m("301.00"),a,null,null,null),u),
            ()->goals.setAllocation(goal(u),new SetGoalAllocationDTO(a,null,m("301.00")),u))) {
            assertThatThrownBy(writer::run).isInstanceOf(RuntimeException.class);
            assertThat(balance(a)).isEqualByComparingTo("1000.00");
            assertThat(sql.queryForObject("select sum(amount) from goal_allocations where account_id=?",BigDecimal.class,a)).isEqualByComparingTo("700.00");
        }
        ledger.create(new CreateTransactionDTO("Débito confirmado no banco",m("1100.00"),DAY,null,TransactionType.EXPENSE,a,null,true),u);
        assertThat(balance(a)).isEqualByComparingTo("-100.00");
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations where account_id=?",BigDecimal.class,a)).isEqualByComparingTo("700.00");
    }

    @Test void archivePolicyRollsBackEveryCashWriterIncludingZeroNetAndRefund(){
        var u=user();var a=account(u);var b=account(u);var g=goal(u);var i=asset(u);
        var forecast=ledger.create(new CreateTransactionDTO("Previsto",m("10.00"),DAY,null,TransactionType.INCOME,a,null,false),u).id();
        var direct=ledger.create(new CreateTransactionDTO("Despesa",m("10.00"),DAY,null,TransactionType.EXPENSE,a,null,true),u).id();
        var item=goals.addItem(g,new CreateGoalItemDTO("Compra",null,m("10.00")),u).id();goals.purchaseItem(item,new PurchaseGoalItemDTO(m("10.00"),a,null,null,null),u);
        investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.BUY,m("1"),m("10.00"),m("0.00"),DAY,a),u);
        var buy=investments.getHistory(i,u).getFirst().id();
        var cat=new Category();cat.setName(DefaultCategory.PAGAMENTO_FATURA.getName());cat.setType(TransactionType.EXPENSE);cat.setUser(u);categories.save(cat);
        var c=cards.createCard(new CreateCardDTO("Cartão","1234",m("1000.00"),20,28,"VISA","BLUE"),u).id();
        cards.createTransaction(new CreateCardTransactionDTO("Compra",m("10.00"),DAY,null,cat.getId(),c,1),u);
        accounts.delete(a,u);var before=balance(a);int count=count(u);
        for(Runnable writer:List.<Runnable>of(
            ()->ledger.create(new CreateTransactionDTO("Entrada",m("1.00"),DAY,null,TransactionType.INCOME,a,null,true),u),
            ()->ledger.create(transfer(a,b,"1.00"),u),
            ()->ledger.settle(forecast,new SettleTransactionDTO(m("1.00"),DAY,null),u),
            ()->ledger.reverse(direct,new ReverseTransactionDTO(UUID.randomUUID(),m("1.00"),DAY,null,"Estorno"),u),
            ()->goals.setAllocation(g,new SetGoalAllocationDTO(a,null,m("1.00")),u),
            ()->goals.refundItem(item,u),
            ()->investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.DIVIDEND,m("1"),m("1.00"),m("1.00"),DAY,a),u),
            ()->corrections.correct(buy,new CorrectInvestmentDTO(UUID.randomUUID(),DAY,"Cancelar",m("0.00"),null,null,null),u),
            ()->cards.payInvoice(c,new PayInvoiceDTO(a,m("1.00"),DAY,null,9,2026,"Pagamento",false,UUID.randomUUID()),u))) {
            assertThatThrownBy(writer::run).isInstanceOf(RuntimeException.class);
            assertThat(balance(a)).isEqualByComparingTo(before);assertThat(count(u)).isEqualTo(count);
        }
        assertThat(sql.queryForObject("select refunded_at from goal_purchases where item_id=?",Object.class,item)).isNull();
        assertThat(sql.queryForObject("select count(*) from card_payments p join invoices i on i.id=p.invoice_id where i.card_id=?",Integer.class,c)).isZero();
    }

    @Test void archiveWaitsForTheSameSourceLockAndPreservesCommittedBalance() throws Exception {
        var u=user();var a=account(u);var held=new CountDownLatch(1);var release=new CountDownLatch(1);
        var writerThread=new AtomicReference<Thread>();var first=new AtomicBoolean();var archivePid=new AtomicInteger();var writerPid=new AtomicInteger();
        MethodInterceptor barrier=call->{var result=call.proceed();if(call.getMethod().getName().equals("findOwnedForAllocation")&&Thread.currentThread()==writerThread.get()&&first.compareAndSet(false,true)){held.countDown();if(!release.await(10,TimeUnit.SECONDS))throw new IllegalStateException("Source lock timeout");}return result;};
        ((Advised)accountRepository).addAdvice(0,barrier);
        var tx=new TransactionTemplate(manager);
        try(var pool=Executors.newFixedThreadPool(2)){
            var writer=pool.submit(()->tx.executeWithoutResult(s->{writerThread.set(Thread.currentThread());writerPid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));ledger.create(new CreateTransactionDTO("Antes do arquivo",m("10.00"),DAY,null,TransactionType.INCOME,a,null,true),u);}));
            assertThat(held.await(10,TimeUnit.SECONDS)).isTrue();
            var archive=pool.submit(()->tx.executeWithoutResult(s->{archivePid.set(sql.queryForObject("select pg_backend_pid()",Integer.class));accounts.delete(a,u);}));
            boolean waiting=false;long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(8);
            while(System.nanoTime()<deadline){if(archivePid.get()!=0&&Boolean.TRUE.equals(sql.queryForObject("select cardinality(pg_blocking_pids(?))>0",Boolean.class,archivePid.get()))){waiting=true;break;}Thread.sleep(20);}
            assertThat(waiting).isTrue();assertThat(archivePid.get()).isNotEqualTo(writerPid.get());release.countDown();writer.get(15,TimeUnit.SECONDS);archive.get(15,TimeUnit.SECONDS);
        } finally {release.countDown();((Advised)accountRepository).removeAdvice(barrier);}
        assertThat(balance(a)).isEqualByComparingTo("1010.00");assertThat(sql.queryForObject("select is_archived from accounts where id=?",Boolean.class,a)).isTrue();
    }

    @Test void aggregatesRejectOverflowAndGoalMoneyNeverTruncates() {
        var u=user();var g=goal(u);
        assertThatThrownBy(()->goals.update(g,new UpdateGoalDTO(null,m("1.005"),null),u))
                .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        var a=accounts.create(new CreateAccountDTO("Máximo",AccountType.CHECKING,m("999999999999.99"),"BLUE",DAY),u).id();
        var b=accounts.create(new CreateAccountDTO("Um centavo",AccountType.CHECKING,m("0.01"),"BLUE",DAY),u).id();
        goals.setAllocation(g,new SetGoalAllocationDTO(a,null,m("999999999999.99")),u);
        assertThatThrownBy(()->goals.setAllocation(g,new SetGoalAllocationDTO(b,null,m("0.01")),u))
                .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        assertThat(sql.queryForObject("select current_value from goals where id=?",BigDecimal.class,g)).isEqualByComparingTo("999999999999.99");
        assertThat(sql.queryForObject("select count(*) from goal_allocations where goal_id=?",Integer.class,g)).isOne();
        var cat=new Category();cat.setName("Compra");cat.setType(TransactionType.EXPENSE);cat.setUser(u);categories.save(cat);
        var c=cards.createCard(new CreateCardDTO("Teto","1234",m("999999999999.99"),20,28,"VISA","BLUE"),u).id();
        cards.createTransaction(new CreateCardTransactionDTO("Máximo",m("999999999999.99"),DAY,null,cat.getId(),c,1),u);
        assertThatThrownBy(()->cards.createTransaction(new CreateCardTransactionDTO("Centavo excedente",m("0.01"),DAY,null,cat.getId(),c,1),u))
                .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        assertThat(sql.queryForObject("select count(*) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",Integer.class,c)).isOne();
    }

    private User user(){var u=new User();u.setNome("Writers");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    private UUID account(User u){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m("1000.00"),"BLUE",DAY),u).id();}
    private UUID goal(User u){return goals.create(new CreateGoalDTO("Meta",m("1000.00"),LocalDate.of(2028,1,1),null,null,"BLUE",GoalType.MONETARY,true),u).id();}
    private UUID asset(User u){return investments.create(new CreateInvestmentDTO("POLICY","Ativo",InvestType.STOCK,null,m("0"),m("0"),null,null,null),u).id();}
    private BigDecimal balance(UUID a){return sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a);}
    private int count(User u){return sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,u.getId());}
    private CreateTransactionDTO transfer(UUID a,UUID b,String value){return new CreateTransactionDTO("Transferência",m(value),DAY,null,TransactionType.TRANSFER,a,null,true,b,m("0.00"));}
    private static BigDecimal m(String value){return new BigDecimal(value);}
}
