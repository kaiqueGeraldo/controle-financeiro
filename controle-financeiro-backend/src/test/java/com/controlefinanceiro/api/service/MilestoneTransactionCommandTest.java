package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class MilestoneTransactionCommandTest extends PostgresIntegrationTest {
    @Autowired TransactionService service;
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    static final LocalDate DAY=LocalDate.of(2026,9,7);
    static BigDecimal m(String v){return new BigDecimal(v);}
    User user(){var u=new User();u.setNome("Commands");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    UUID account(User u,String balance){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m(balance),"BLUE",DAY),u).id();}
    BigDecimal balance(UUID a){return sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a);}
    TransactionResponseDTO direct(User u,UUID a,boolean paid){return service.create(new CreateTransactionDTO("Despesa original",m("100.00"),DAY,"09:00",TransactionType.EXPENSE,a,null,paid),u);}
    ReverseTransactionDTO reversal(String amount){return new ReverseTransactionDTO(UUID.randomUUID(),m(amount),DAY.plusDays(2),"10:15:30","Reembolso comprovado");}
    TransactionResponseDTO listed(User u,UUID id){return service.listAllFiltered(u,9,2026,null,null,org.springframework.data.domain.Pageable.unpaged()).getContent().stream().filter(t->t.id().equals(id)).findFirst().orElseThrow();}

    @Test void forecastAndPartialReversalKeepOriginalAndReopenOnlyTheNetRemaining(){
        var u=user();var a=account(u,"500.00");var forecast=direct(u,a,false);
        var first=new SettleTransactionDTO(m("40.00"),DAY.plusDays(1),null,UUID.randomUUID());
        var settlement=service.settle(forecast.id(),first,u);
        assertThat(service.settle(forecast.id(),first,u).id()).isEqualTo(settlement.id());
        assertThat(listed(u,forecast.id()).remainingAmount()).isEqualByComparingTo("60.00");
        assertThat(balance(a)).isEqualByComparingTo("460.00");
        var partial=reversal("10.00");var receipt=service.reverse(settlement.id(),partial,u);
        assertThat(service.reverse(settlement.id(),partial,u).id()).isEqualTo(receipt.id());
        assertThat(receipt.reason()).isEqualTo("Reembolso comprovado");assertThat(receipt.date()).isEqualTo(DAY.plusDays(2));
        assertThat(listed(u,settlement.id()).remainingAmount()).isEqualByComparingTo("30.00");
        assertThat(listed(u,forecast.id()).remainingAmount()).isEqualByComparingTo("70.00");
        service.settle(forecast.id(),new SettleTransactionDTO(m("60.00"),DAY.plusDays(1),null,UUID.randomUUID()),u);
        service.reverse(settlement.id(),reversal("30.00"),u);
        assertThat(listed(u,settlement.id()).status()).isEqualTo(TransactionStatus.REVERSED);
        assertThat(listed(u,forecast.id()).remainingAmount()).isEqualByComparingTo("40.00");
        service.settle(forecast.id(),new SettleTransactionDTO(m("40.00"),DAY.plusDays(3),null,UUID.randomUUID()),u);
        assertThat(listed(u,forecast.id()).status()).isEqualTo(TransactionStatus.FULFILLED);
        assertThat(listed(u,forecast.id()).amount()).isEqualByComparingTo("100.00");
        assertThat(listed(u,forecast.id()).date()).isEqualTo(DAY);assertThat(balance(a)).isEqualByComparingTo("400.00");
        assertThatThrownBy(()->service.reverse(settlement.id(),reversal("0.01"),u)).hasMessageContaining("restante");
    }

    @Test void changedIntentAndOtherOwnerCannotAlterPartialOrFullRefund(){
        var u=user();var a=account(u,"500.00");var original=direct(u,a,true);var command=reversal("30.00");
        var first=service.reverse(original.id(),command,u);
        assertThatThrownBy(()->service.reverse(original.id(),new ReverseTransactionDTO(command.operationId(),m("31.00"),command.date(),command.time(),command.reason()),u)).hasMessageContaining("outro conteúdo");
        assertThatThrownBy(()->service.reverse(original.id(),reversal("70.01"),u)).hasMessageContaining("restante");
        assertThatThrownBy(()->service.reverse(original.id(),reversal("1.00"),user())).hasMessageContaining("não encontrada");
        assertThatThrownBy(()->service.receipt(command.operationId(),user())).hasMessageContaining("não encontrado");
        assertThat(service.receipt(command.operationId(),u).id()).isEqualTo(first.id());
        assertThat(balance(a)).isEqualByComparingTo("430.00");
        service.reverse(original.id(),reversal("70.00"),u);assertThat(balance(a)).isEqualByComparingTo("500.00");
        assertThat(listed(u,original.id()).reversedAmount()).isEqualByComparingTo("100.00");
        assertThat(listed(u,original.id()).amount()).isEqualByComparingTo("100.00");
    }

    @Test void transferRealizesBothLegsAndFeeAtomicallyAndKeepsItsForecast(){
        var u=user();var a=account(u,"500.00");var b=account(u,"10.00");
        var forecast=service.create(new CreateTransactionDTO("Transferência prevista",m("100.00"),DAY,null,TransactionType.TRANSFER,a,null,false,b,m("2.00")),u);
        var command=new RealizeTransferDTO(UUID.randomUUID(),DAY.plusDays(1),"11:00","Comprovante bancário");
        var actual=service.realizeTransfer(forecast.id(),command,u);
        assertThat(service.realizeTransfer(forecast.id(),command,u).id()).isEqualTo(actual.id());
        assertThat(balance(a)).isEqualByComparingTo("398.00");assertThat(balance(b)).isEqualByComparingTo("110.00");
        assertThat(actual.realizationOfId()).isEqualTo(forecast.id());assertThat(actual.operationId()).isNotEqualTo(forecast.operationId());
        assertThat(sql.queryForObject("select count(*) from transactions where operation_id=? and status='FULFILLED'",Integer.class,forecast.operationId())).isEqualTo(3);
        assertThat(sql.queryForObject("select count(*) from transactions where operation_id=? and status='SETTLED'",Integer.class,actual.operationId())).isEqualTo(3);
        assertThat(listed(u,forecast.id()).date()).isEqualTo(DAY);assertThat(listed(u,forecast.id()).remainingAmount()).isZero();
        assertThatThrownBy(()->service.realizeTransfer(forecast.id(),new RealizeTransferDTO(UUID.randomUUID(),DAY,null,"Outra intenção"),u)).hasMessageContaining("já foi realizada");
        assertThatThrownBy(()->service.realizeTransfer(forecast.id(),new RealizeTransferDTO(UUID.randomUUID(),DAY,null,"Outro dono"),user())).hasMessageContaining("não encontrada");
    }

    @Test void failedTransferRollsBackEverythingAndDoesNotConsumeTheIntent(){
        var u=user();var a=account(u,"100.00");var b=account(u,"10.00");
        var forecast=service.create(new CreateTransactionDTO("Taxa exige capacidade",m("100.00"),DAY,null,TransactionType.TRANSFER,a,null,false,b,m("2.00")),u);
        var command=new RealizeTransferDTO(UUID.randomUUID(),DAY.plusDays(1),null,"Realização");
        assertThatThrownBy(()->service.realizeTransfer(forecast.id(),command,u)).hasMessageContaining("Disponível livre");
        assertThat(balance(a)).isEqualByComparingTo("100.00");assertThat(balance(b)).isEqualByComparingTo("10.00");
        assertThat(sql.queryForObject("select count(*) from financial_commands where id=?",Integer.class,command.operationId())).isZero();
        assertThat(sql.queryForObject("select count(*) from transactions where realization_of_id=?",Integer.class,forecast.id())).isZero();
        assertThat(listed(u,forecast.id()).status()).isEqualTo(TransactionStatus.PENDING);
        service.create(new CreateTransactionDTO("Entrada real",m("2.00"),DAY,null,TransactionType.INCOME,a,null,true),u);
        service.realizeTransfer(forecast.id(),command,u);assertThat(balance(a)).isZero();
    }

    @Test void concurrentIntentsRespectRemainingAndConcurrentRetriesHaveOneEffect() throws Exception {
        for(boolean sameIntent:new boolean[]{false,true}) {
            var u=user();var a=account(u,"500.00");var original=direct(u,a,true);var first=reversal("60.00");var second=sameIntent?first:reversal("60.00");
            var locked=new java.util.concurrent.CountDownLatch(1);var ready=new java.util.concurrent.CountDownLatch(2);var release=new java.util.concurrent.CountDownLatch(1);
            try(var pool=java.util.concurrent.Executors.newFixedThreadPool(3)) {
                var holder=pool.submit(()->new org.springframework.transaction.support.TransactionTemplate(transactionManager).execute(status->{
                    sql.queryForObject("select id from accounts where id=? for update",UUID.class,a);locked.countDown();
                    try{if(!release.await(10,java.util.concurrent.TimeUnit.SECONDS))throw new IllegalStateException("barrier timeout");}
                    catch(InterruptedException e){Thread.currentThread().interrupt();throw new IllegalStateException(e);}return null;
                }));
                assertThat(locked.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();
                java.util.function.Function<ReverseTransactionDTO,String> action=c->{ready.countDown();try{return service.reverse(original.id(),c,u).id().toString();}catch(com.controlefinanceiro.api.service.exception.OperationConflictException ex){return "conflict";}};
                var one=pool.submit(()->action.apply(first));var two=pool.submit(()->action.apply(second));
                assertThat(ready.await(10,java.util.concurrent.TimeUnit.SECONDS)).isTrue();release.countDown();
                var results=List.of(one.get(15,java.util.concurrent.TimeUnit.SECONDS),two.get(15,java.util.concurrent.TimeUnit.SECONDS));holder.get(15,java.util.concurrent.TimeUnit.SECONDS);
                if(sameIntent)assertThat(results.getFirst()).isEqualTo(results.getLast());else assertThat(results).containsExactlyInAnyOrder("conflict",results.stream().filter(v->!v.equals("conflict")).findFirst().orElseThrow());
            } finally {release.countDown();}
            assertThat(balance(a)).isEqualByComparingTo("460.00");
            assertThat(sql.queryForObject("select count(*) from transactions where reversal_of_id=?",Integer.class,original.id())).isOne();
        }
    }
}
