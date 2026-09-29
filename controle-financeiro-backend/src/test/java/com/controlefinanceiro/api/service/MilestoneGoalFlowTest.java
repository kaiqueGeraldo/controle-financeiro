package com.controlefinanceiro.api.service;
import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
class MilestoneGoalFlowTest extends PostgresIntegrationTest {
 @Autowired GoalService goals; @Autowired AccountService accounts; @Autowired CreditCardService cards;
 @Autowired UserRepository users; @Autowired CategoryRepository categories; @Autowired JdbcTemplate sql;
 static final LocalDate DAY=LocalDate.of(2026,9,7);
 User user(){var u=new User();u.setNome("Goal test");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
 UUID goal(User u){return goals.create(new CreateGoalDTO("Checklist",new BigDecimal("1000.00"),LocalDate.of(2028,1,1),null,null,"BLUE",GoalType.MONETARY,true),u).id();}
 UUID account(User u){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,new BigDecimal("1000.00"),"BLUE",DAY),u).id();}
 @Test void bankChecklistSurvivesReloadDeletionAndRefundWithOwnership(){
   var u=user();var other=user();var a=account(u);var g=goal(u);
   goals.setAllocation(g,new SetGoalAllocationDTO(a,null,new BigDecimal("300.00")),u);
   var item=goals.addItem(g,new CreateGoalItemDTO("Notebook",null,new BigDecimal("120.00")),u).id();
   assertThat(goals.listAll(u).getFirst().items()).extracting(GoalItemResponseDTO::id).containsExactly(item);
   assertThat(goals.listAll(other)).isEmpty();
   var allocation=goals.listAllocations(g,u).getFirst().id();
   goals.purchaseItem(item,new PurchaseGoalItemDTO(new BigDecimal("120.00"),a,null,null,allocation),u);
   assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("880.00");
   assertThat(goals.listAllocations(g,u).getFirst().amount()).isEqualByComparingTo("180.00");
   goals.deleteItem(item,u);goals.delete(g,null,u);
   assertThat(goals.listPurchases(u)).extracting(GoalPurchaseResponseDTO::itemId).containsExactly(item);
   assertThat(goals.listPurchases(other)).isEmpty();
   assertThatThrownBy(()->goals.refundItem(item,other)).isInstanceOf(RuntimeException.class);
   goals.refundItem(item,u);
   assertThatThrownBy(()->goals.refundItem(item,u)).isInstanceOf(RuntimeException.class);
   assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("1000.00");
   assertThat(sql.queryForObject("select count(*) from transactions where reversal_of_id is not null and user_id=?",Integer.class,u.getId())).isEqualTo(1);
 }
 @Test void cardPurchaseRefundAfterIntentDeletionPreservesPartialAndTotalPayments(){
   for(String paid:new String[]{"20.00","120.00"}){
     var u=user();var a=account(u);var g=goal(u);
     var cat=new Category();cat.setName(DefaultCategory.METAS.getName());cat.setType(TransactionType.EXPENSE);cat.setUser(u);categories.save(cat);
     var c=cards.createCard(new CreateCardDTO("Card","1234",new BigDecimal("1000.00"),20,28,"VISA","BLUE"),u).id();
     var item=goals.addItem(g,new CreateGoalItemDTO("Notebook",null,new BigDecimal("120.00")),u).id();
     goals.purchaseItem(item,new PurchaseGoalItemDTO(new BigDecimal("120.00"),null,c,1,null),u);
     UUID txId=goals.listPurchases(u).getFirst().cardTransactionId();
     var period=sql.queryForMap("select i.month,i.year from invoices i join card_transactions t on t.invoice_id=i.id where t.id=?",txId);
     cards.payInvoice(c,new PayInvoiceDTO(a,new BigDecimal(paid),DAY,null,(Integer)period.get("month"),(Integer)period.get("year"),"Partial/total",false,UUID.randomUUID()),u);
     goals.deleteItem(item,u);goals.delete(g,null,u);goals.refundItem(item,u);
     assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo(new BigDecimal("1000.00").subtract(new BigDecimal(paid)));
     assertThat(sql.queryForObject("select credit_balance from credit_cards where id=?",BigDecimal.class,c)).isEqualByComparingTo(paid);
     assertThat(sql.queryForObject("select sum(t.amount-t.paid_amount-t.refunded_amount) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,c)).isZero();
     assertThatThrownBy(()->goals.refundItem(item,u)).isInstanceOf(RuntimeException.class);
     assertThat(sql.queryForObject("select count(*) from card_refunds where card_id=?",Integer.class,c)).isEqualTo(1);
   }
 }
}
