package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class MilestoneInvestmentCorrectionTest extends PostgresIntegrationTest {
    @Autowired InvestmentService investments;
    @Autowired InvestmentCorrectionService corrections;
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired DashboardService dashboard;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    static final LocalDate DAY=LocalDate.of(2026,9,7);
    static BigDecimal m(String v){return new BigDecimal(v);}
    User user(){var u=new User();u.setNome("Correction");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    record Fixture(User user,UUID account,UUID investment){}
    Fixture fixture(){var u=user();var a=accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m("1000.00"),"BLUE",DAY),u).id();
        var i=investments.create(new CreateInvestmentDTO("CORR","Correção",InvestType.STOCK,null,BigDecimal.ZERO,BigDecimal.ZERO,null,null,null),u).id();return new Fixture(u,a,i);}
    UUID operation(Fixture f,InvestTransType type,String q,String p,String fee){investments.performOperation(new InvestmentOperationDTO(f.investment(),type,m(q),m(p),m(fee),DAY,f.account()),f.user());
        return sql.queryForObject("select id from invest_transactions where investment_id=? order by sequence_number desc limit 1",UUID.class,f.investment());}
    BigDecimal scalar(String query,UUID id){return sql.queryForObject(query,BigDecimal.class,id);}
    CorrectInvestmentDTO cancel(String fee){return new CorrectInvestmentDTO(UUID.randomUUID(),DAY.plusDays(1),"Cancelamento comprovado",m(fee),null,null,null);}

    @Test void e18CancellationPreservesOriginalAndOnlyExplicitFeesReturn(){
        for(String fee:new String[]{"0.00","2.00"}){
            var f=fixture();var id=operation(f,InvestTransType.BUY,"20","10","2.00");var command=cancel(fee);
            var receipt=corrections.correct(id,command,f.user());
            assertThat(corrections.correct(id,command,f.user()).getId()).isEqualTo(receipt.getId());
            assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo(fee.equals("0.00")?"998.00":"1000.00");
            assertThat(scalar("select quantity from investments where id=?",f.investment())).isZero();
            assertThat(scalar("select total_cost from investments where id=?",f.investment())).isZero();
            assertThat(scalar("select valuation_amount from investments where id=?",f.investment())).isZero();
            assertThat(scalar("select cost_delta from invest_transactions where id=?",id)).isEqualByComparingTo("202.00");
            assertThat(receipt.getRealizedDelta()).isEqualByComparingTo(fee.equals("0.00")?"-2.00":"0.00");
            assertThatThrownBy(()->corrections.correct(id,cancel(fee),f.user())).hasMessageContaining("já compensada");
            assertThatThrownBy(()->corrections.correct(id,command,user())).hasMessageContaining("não encontrado");
        }
    }
    @Test void correctionRecalculatesDependentSalesWithoutRewritingTheirOriginalCosts(){
        var f=fixture();var buy=operation(f,InvestTransType.BUY,"20","10","2.00");var sell=operation(f,InvestTransType.SELL,"5","15","1.00");
        assertThatThrownBy(()->corrections.correct(buy,cancel("2.00"),f.user())).hasMessageContaining("Vendas dependentes");
        assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo("872.00");
        var command=new CorrectInvestmentDTO(UUID.randomUUID(),DAY.plusDays(1),"Preço de aquisição corrigido",m("2.00"),m("20"),m("8"),m("2.00"));
        var receipt=corrections.correct(buy,command,f.user());
        assertThat(receipt.getCashDelta()).isEqualByComparingTo("40.00");assertThat(receipt.getRealizedDelta()).isEqualByComparingTo("10.00");
        assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo("912.00");
        assertThat(scalar("select total_cost from investments where id=?",f.investment())).isEqualByComparingTo("121.50");
        assertThat(scalar("select cost_delta from invest_transactions where id=?",sell)).isEqualByComparingTo("50.50");
        assertThat(scalar("select cost_delta from investment_cost_revisions where transaction_id=?",sell)).isEqualByComparingTo("40.50");
        assertThat(dashboard.getPeriodTotals(f.user(),DAY,DAY.plusDays(1),null,null).investmentResult()).isEqualByComparingTo("33.50");
        assertThatThrownBy(()->corrections.correct(buy,new CorrectInvestmentDTO(command.operationId(),command.date(),"Outro motivo",command.returnedFees(),command.replacementQuantity(),command.replacementPrice(),command.replacementFees()),f.user())).hasMessageContaining("outro conteúdo");
        // A later cancellation replays the already-corrected chain.
        corrections.correct(sell,cancel("1.00"),f.user());
        assertThat(scalar("select total_cost from investments where id=?",f.investment())).isEqualByComparingTo("162.00");
        assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo("838.00");
    }
    @Test void dividendRefundKeepsNetCashAndGrossManagerialDecomposition(){
        var f=fixture();var id=operation(f,InvestTransType.DIVIDEND,"1","10","1.00");
        corrections.correct(id,cancel("1.00"),f.user());
        assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo("1000.00");
        var total=dashboard.getPeriodTotals(f.user(),DAY.plusDays(1),DAY.plusDays(1),null,null);
        assertThat(total.income()).isEqualByComparingTo("-10.00");assertThat(total.expense()).isEqualByComparingTo("-1.00");
        assertThat(scalar("select quantity from investments where id=?",f.investment())).isZero();
    }
    @Test void simultaneousRetriesCommitOneCompensation() throws Exception {
        var f=fixture();var id=operation(f,InvestTransType.BUY,"20","10","2.00");var command=cancel("2.00");
        var locked=new java.util.concurrent.CountDownLatch(1);var release=new java.util.concurrent.CountDownLatch(1);
        var ready=new java.util.concurrent.CountDownLatch(2);
        try(var pool=java.util.concurrent.Executors.newFixedThreadPool(3)) {
            var holder=pool.submit(()->new org.springframework.transaction.support.TransactionTemplate(transactionManager).execute(status->{
                sql.queryForObject("select id from accounts where id=? for update",UUID.class,f.account());locked.countDown();
                try{if(!release.await(10,java.util.concurrent.TimeUnit.SECONDS))throw new IllegalStateException("barrier timeout");}
                catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException(e);}return null;
            }));
            assertThat(locked.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            java.util.concurrent.Callable<UUID> action=()->{ready.countDown();return corrections.correct(id,command,f.user()).getId();};
            var first=pool.submit(action);var second=pool.submit(action);
            assertThat(ready.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();release.countDown();
            assertThat(first.get(15,java.util.concurrent.TimeUnit.SECONDS)).isEqualTo(second.get(15,java.util.concurrent.TimeUnit.SECONDS));
            holder.get(15,java.util.concurrent.TimeUnit.SECONDS);
        } finally {release.countDown();}
        assertThat(sql.queryForObject("select count(*) from investment_corrections where original_id=?",Integer.class,id)).isOne();
        assertThat(scalar("select balance from accounts where id=?",f.account())).isEqualByComparingTo("1000.00");
    }
}
