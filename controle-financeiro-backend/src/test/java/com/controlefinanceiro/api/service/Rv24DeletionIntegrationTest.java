package com.controlefinanceiro.api.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.card.CreditCard;
import com.controlefinanceiro.api.domain.card.dto.CreateCardTransactionDTO;
import java.nio.file.*;
import java.util.*;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/** The original independent functional contract, with actual purchase/payment/allocation. */
class Rv24DeletionIntegrationTest extends Cf024ConcurrencyCacheIntegrationTest {
    @Autowired GoalService goals;
    @Autowired InvestmentCorrectionService corrections;
    // Every application-owned relation, including UUID-only links and collection tables.
    static final List<String> TABLES = List.of("users", "accounts", "categories", "credit_cards", "invoices", "card_transactions", "card_opening_batches", "card_payments", "card_payment_allocations", "card_refunds", "goals", "goal_items", "goal_history", "goal_allocations", "goal_purchases", "habits", "habit_days", "habit_logs", "investments", "invest_transactions", "investment_valuations", "investment_corrections", "investment_cost_revisions", "transactions", "financial_commands", "financial_intent_receipts", "monthly_plans", "plan_items", "yearly_notes");
    Map<String,List<String>> snapshot() {
        var result=new LinkedHashMap<String,List<String>>();
        for(var table:TABLES) result.put(table,sql.queryForList("select to_jsonb(t)::text from "+table+" t order by to_jsonb(t)::text",String.class));
        return result;
    }
    Map<String,Integer> sizes() {
        var result=new LinkedHashMap<String,Integer>();
        for(var table:TABLES) result.put(table,sql.queryForObject("select count(*) from "+table,Integer.class));
        return result;
    }
    UUID graph() {
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);
        // A real purchase in addition to the inherited opening batch.
        UUID category=sql.queryForObject("select category_id from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=? limit 1",UUID.class,card);
        UUID invoice=sql.queryForObject("select id from invoices where card_id=? limit 1",UUID.class,card);
        UUID purchase=UUID.randomUUID(),cardFact=UUID.randomUUID();
        sql.update("insert into card_transactions(id,description,amount,date,created_at,invoice_id,category_id,purchase_id,origin) values (?,'linked purchase',25,?,now(),?,?,?,'PURCHASE')",cardFact,DAY,invoice,category,purchase);
        sql.update("insert into card_refunds(id,card_id,purchase_id,category_id,operation_id,amount,credit_created,refund_date,created_at) values (?,?,?,?,?,5,0,?,now())",UUID.randomUUID(),card,purchase,category,UUID.randomUUID(),DAY);
        // Both V13 kinds, plus an inherited financial command referencing the live ledger.
        var fact=transactions.create(new CreateTransactionDTO("receipt",money("25"),DAY,null,TransactionType.INCOME,account,null,true,null,null,UUID.randomUUID()),owner);
        var forecast=transactions.create(new CreateTransactionDTO("forecast",money("10"),DAY,null,TransactionType.EXPENSE,account,null,false),owner);
        transactions.settle(forecast.id(),new SettleTransactionDTO(money("10"),DAY,null,UUID.randomUUID()),owner);
        investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.BUY,money("2"),money("100"),money("0"),DAY,account,null,UUID.randomUUID()),owner);
        UUID buy=sql.queryForObject("select id from invest_transactions where investment_id=? order by sequence_number desc limit 1",UUID.class,investment);
        investments.performOperation(new InvestmentOperationDTO(investment,InvestTransType.SELL,money("1"),money("110"),money("0"),DAY,account),owner);
        corrections.correct(buy,new CorrectInvestmentDTO(UUID.randomUUID(),DAY.plusDays(1),"correction",money("0"),money("2"),money("90"),money("0")),owner);
        sql.update("insert into investment_valuations(id,investment_id,amount,valuation_date,source,reason,recorded_at) values (?,?,1100,?,'SYNTHETIC','audit',now())",UUID.randomUUID(),investment,DAY);
        UUID goal=goals.create(new CreateGoalDTO("linked goal",money("500"),DAY.plusYears(1),"goal","target","BLUE",GoalType.MONETARY,false),owner).id();
        goals.setAllocation(goal,new SetGoalAllocationDTO(account,null,money("20")),owner);
        goals.setAllocation(goal,new SetGoalAllocationDTO(null,investment,money("20")),owner);
        UUID allocation=sql.queryForObject("select id from goal_allocations where goal_id=? and account_id=?",UUID.class,goal,account);
        UUID history=UUID.randomUUID(),item=UUID.randomUUID(),habit=UUID.randomUUID();
        sql.update("update investments set goal_id=? where id=?",goal,investment);
        sql.update("insert into goal_history(id,date,amount,note,goal_id,allocation_id) values (?,now(),1,'legacy',?,?)",history,goal,allocation);
        sql.update("insert into goal_items(id,name,estimated_price,paid_price,status,goal_id,bank_transaction_id,allocation_id) values (?,'purchased',25,25,'PURCHASED',?,?,?)",item,goal,fact.id(),allocation);
        sql.update("insert into goal_purchases(item_id,user_id,name,amount,bank_transaction_id,recorded_at) values (?,?,'preserved purchase',25,?,now())",item,owner.getId(),fact.id());
        sql.update("insert into goal_purchases(item_id,user_id,name,amount,card_transaction_id) values (?,?,'legacy card purchase',25,?)",UUID.randomUUID(),owner.getId(),cardFact);
        sql.update("insert into habits(id,name,icon,color,current_streak,highest_streak,frequency,user_id,goal_id) values (?,'habit','Check','BLUE',0,0,'WEEKLY',?,?)",habit,owner.getId(),goal);
        sql.update("insert into habit_days(habit_id,day_of_week) values (?,'MONDAY')",habit);
        sql.update("insert into habit_logs(id,log_date,status,habit_id,goal_history_id,goal_effect_managed) values (?,?,'COMPLETED',?,?,true)",UUID.randomUUID(),DAY,habit,history);
        sql.update("insert into habit_logs(id,log_date,status,habit_id) values (?,?,'COMPLETED',?)",UUID.randomUUID(),DAY.minusDays(1),habit);
        UUID plan=UUID.randomUUID();
        sql.update("insert into monthly_plans(id,month,year,user_id) values (?,1,2028,?)",plan,owner.getId());
        sql.update("insert into plan_items(id,description,amount,status,plan_id,category_id,card_id) values (?,'plan',25,'PENDING',?,?,?)",UUID.randomUUID(),plan,category,card);
        sql.update("insert into yearly_notes(id,note_year,content,user_id) values (?,2026,'note',?)",UUID.randomUUID(),owner.getId());
        // Legacy payment retains unknown fingerprint provenance.
        sql.update("update card_payments set request_fingerprint=null where account_id=?",account);
        assertThat(sql.queryForObject("select count(*) from investment_cost_revisions r join investment_corrections c on c.id=r.correction_id where c.investment_id=?",Integer.class,investment)).isPositive();
        return goal;
    }
    @Test void contractLinkedDeletionMustCompleteWithoutForeignKeyFailure() {
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);
        assertThat(sql.queryForObject("select count(*) from card_payment_allocations a join card_payments p on p.id=a.payment_id where p.account_id=?",Integer.class,account)).isEqualTo(1);
        assertThatCode(()->userService.deleteAccount(owner)).doesNotThrowAnyException();
        assertThat(users.existsById(owner.getId())).isFalse();
    }

    @Test void ordinaryPaidPurchaseAllocationMustAlsoDeleteWithoutForeignKeyFailure() {
        var purchaseCard=new CreditCard();purchaseCard.setUser(owner);purchaseCard.setName("ordinary purchase");purchaseCard.setLimit(money("1000"));purchaseCard.setClosingDay(20);purchaseCard.setDueDay(28);
        UUID purchaseCardId=cardRepository.save(purchaseCard).getId();
        UUID category=sql.queryForObject("select category_id from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=? limit 1",UUID.class,card);
        cards.createTransaction(new CreateCardTransactionDTO("ordinary paid purchase",money("25"),DAY,null,category,purchaseCardId,1),owner);
        cards.payInvoice(purchaseCardId,payment(purchaseCardId,UUID.randomUUID(),"25",false),owner);
        assertThat(sql.queryForObject("select count(*) from card_payment_allocations a join card_transactions ct on ct.id=a.card_transaction_id join invoices i on i.id=ct.invoice_id where i.card_id=? and ct.origin='PURCHASE' and ct.paid_amount=25 and a.amount=25",Integer.class,purchaseCardId)).isEqualTo(1);
        assertThatCode(()->userService.deleteAccount(owner)).doesNotThrowAnyException();
        assertThat(users.existsById(owner.getId())).isFalse();
    }

    @Test void completeGraphDeletionPreservesEveryOtherRowAndNotifiesOnlyAfterCommit() throws Exception {
        var originalOwner=owner;var originalAccount=account;var originalDestination=destination;var originalInvestment=investment;var originalCard=card;
        fixture();graph(); // A second owner has the entire representative graph, not just an empty account.
        owner=originalOwner;account=originalAccount;destination=originalDestination;investment=originalInvestment;card=originalCard;
        var baseline=snapshot(); var before=sizes();
        graph(); var afterSeed=sizes();
        for(var table:TABLES) if(!List.of("users","accounts","credit_cards","investments","categories","invoices","card_opening_batches").contains(table)) assertThat(afterSeed.get(table)-before.get(table)).as("representative "+table).isPositive();
        // These two dependencies were already created by fixture(), before graph() was measured.
        assertThat(sql.queryForObject("select count(*) from invoices where card_id=?",Integer.class,card)).isPositive();
        assertThat(sql.queryForObject("select count(*) from card_opening_batches where card_id=?",Integer.class,card)).isEqualTo(1);
        var cache=caches.getCache("annualSummary"); cache.put("unrelated-2026","other"); cache.put(owner.getId()+"-2026","owner");
        clearInvocations(emailService);
        doAnswer(call->{assertThat(users.existsById(owner.getId())).isFalse(); return null;}).when(emailService).sendTemplatedEmail(anyString(),anyString(),anyString(),anyString());
        tx.executeWithoutResult(status->{
            userService.deleteAccount(owner);
            verifyNoInteractions(emailService);
            assertThat(cache.get("unrelated-2026",String.class)).isEqualTo("other");
        });
        // Remove from the baseline the fixture's original rows; no other owner's row is allowed to change.
        var remaining=snapshot();
        for(var table:TABLES) {
            var expected=baseline.get(table).stream().filter(row->!row.contains(owner.getId().toString()) && !row.contains(account.toString()) && !row.contains(destination.toString()) && !row.contains(card.toString()) && !row.contains(investment.toString())).toList();
            // Baseline includes invoice/card facts whose JSON contains the invoice ID rather than card ID.
            if(List.of("invoices","card_transactions","card_opening_batches").contains(table)) {
                var ownInvoiceIds=baseline.get("invoices").stream().filter(row->row.contains(card.toString())).map(row->json.readTree(row).get("id").asText()).toList();
                expected=expected.stream().filter(row->ownInvoiceIds.stream().noneMatch(row::contains)).toList();
            }
            assertThat(remaining.get(table)).as("all surviving rows "+table).containsExactlyElementsOf(expected);
        }
        verify(emailService,times(1)).sendTemplatedEmail(eq(owner.getEmail()),anyString(),anyString(),anyString());
        assertThat(cache.get("unrelated-2026")).isNull(); // existing global deletion eviction is preserved.
        Path evidence=Path.of("../tasks/evidencias/RV24-02");Files.createDirectories(evidence);
        Files.writeString(evidence.resolve("fk-inventory.txt"),sql.queryForList("select conrelid::regclass::text as child, confrelid::regclass::text as parent, pg_get_constraintdef(oid) as definition from pg_constraint where contype='f' and connamespace=(select oid from pg_namespace where nspname=current_schema()) order by 1,2,3").toString());
        Files.writeString(evidence.resolve("representative-counts.txt"),"before="+before+"\nseeded="+afterSeed+"\nafter="+sizes()+"\nAll surviving application rows matched baseline exactly.\n");
    }

    @Test void intermediateDatabaseFailureRollsBackAllRowsCacheAndNotification() {
        graph(); var before=snapshot(); var cache=caches.getCache("annualSummary"); cache.put(owner.getId()+"-2026","before"); clearInvocations(emailService);
        sql.execute("create function rv24_fail_delete() returns trigger language plpgsql as $$ begin raise exception 'RV24 intermediate fault'; end $$");
        sql.execute("create trigger rv24_fail_delete before delete on investments for each row execute function rv24_fail_delete()");
        try {
            assertThatThrownBy(()->userService.deleteAccount(owner)).hasMessageContaining("RV24 intermediate fault");
            assertThat(snapshot()).isEqualTo(before);
            assertThat(cache.get(owner.getId()+"-2026",String.class)).isEqualTo("before");verifyNoInteractions(emailService);
        } finally {sql.execute("drop trigger rv24_fail_delete on investments");sql.execute("drop function rv24_fail_delete()");}
    }

    @Test void foreignLegacySetNullAndUuidOnlyLinksRejectDeletionWithoutChangingEitherOwner() {
        UUID goal=graph(); User other=new User();other.setNome("other");other.setEmail(UUID.randomUUID()+"@example.invalid");other.setSenha("synthetic");other=users.save(other);
        UUID otherInvestment=investments.create(new CreateInvestmentDTO("OTHER","other",InvestType.STOCK,null,money("1"),money("100"),null,null,null),other).id();
        sql.update("update investments set goal_id=? where id=?",goal,otherInvestment);
        var before=snapshot();clearInvocations(emailService);
        assertThatThrownBy(()->userService.deleteAccount(owner)).hasMessageContaining("vínculos herdados entre proprietários");
        assertThat(snapshot()).isEqualTo(before);verifyNoInteractions(emailService);
        sql.update("update investments set goal_id=null where id=?",otherInvestment);
        UUID foreignGoal=goals.create(new CreateGoalDTO("foreign",money("100"),DAY.plusYears(1),"goal","target","BLUE",GoalType.MONETARY,false),other).id();
        UUID fact=sql.queryForObject("select id from transactions where user_id=? limit 1",UUID.class,owner.getId());
        sql.update("insert into goal_items(id,name,estimated_price,status,goal_id,bank_transaction_id) values (?,'legacy link',25,'PENDING',?,?)",UUID.randomUUID(),foreignGoal,fact);
        before=snapshot();
        assertThatThrownBy(()->userService.deleteAccount(owner)).hasMessageContaining("vínculos herdados entre proprietários");
        assertThat(snapshot()).isEqualTo(before);verifyNoInteractions(emailService);
    }

    @Test void postCommitNotificationFailureDoesNotRecreateUserOrPretendRollback() {
        cards.payInvoice(card,payment(card,UUID.randomUUID(),"50",true),owner);
        var cache=caches.getCache("annualSummary"); cache.put(owner.getId()+"-2026","before");
        doThrow(new IllegalStateException("synthetic async executor rejection")).when(emailService).sendTemplatedEmail(anyString(),anyString(),anyString(),anyString());
        assertThatCode(()->userService.deleteAccount(owner)).doesNotThrowAnyException();
        assertThat(users.existsById(owner.getId())).isFalse();assertThat(cache.get(owner.getId()+"-2026")).isNull();
    }
}
