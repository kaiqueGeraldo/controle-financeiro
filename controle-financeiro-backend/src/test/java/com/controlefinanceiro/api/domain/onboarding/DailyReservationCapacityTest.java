package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.onboarding.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static com.controlefinanceiro.api.domain.onboarding.SummaryAmount.*;
import static org.assertj.core.api.Assertions.*;

/** Independent monetary literals and SQL outcomes; production helpers never compute expected values. */
class DailyReservationCapacityTest extends OnboardingApplicationSupport {
    @Autowired GoalService goals;
    @Autowired InvestmentService investments;
    @Autowired OnboardingInventory inventories;
    UUID goal() {
        UUID id=UUID.randomUUID();
        sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,version) values(?,'Daily reserve','MONETARY',2000,0,'2027-10-23',?,true,0)",id,user.getId());
        return id;
    }
    UUID investment() {
        UUID id=UUID.randomUUID();
        sql.update("insert into investments(id,name,type,ticker,quantity,average_price,total_cost,current_price,valuation_amount,valuation_basis,valuation_date,valuation_source,user_id,version) values(?,'Synthetic position','STOCK',null,10,10,100,10,100,'PRICE','2026-10-19','USER_DECLARED',?,0)",id,user.getId());
        return id;
    }
    JsonNode ref(UUID id,boolean investment) {return node("kind",investment?"INVESTMENT":"ACCOUNT","id",id.toString());}
    String inventoryToken() {return new TransactionTemplate(txManager).execute(s->{guard.snapshot(user.getId());return OnboardingProjection.baseToken(inventories.load(user.getId()),object());});}
    UUID pending(JsonNode attribution,List<JsonNode> evidence) {
        UUID id=UUID.randomUUID();seed(id,attribution,evidence);return id;
    }
    void seed(UUID id,JsonNode attribution,List<JsonNode> evidence) {
        var reservation=node("reservationId",id.toString(),"revision","0","goal",node("state","UNKNOWN"),
                "nominal",unknown("/legacy/nominal").json(),"attribution",attribution);
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,?,now())",id,user.getId(),reservation.toString(),JSON.valueToTree(evidence).toString());
    }
    JsonNode proof(UUID id,UUID reservation,String claim,List<JsonNode> sources,String token) {
        return node("id",id.toString(),"revision","0","basis","CURRENT_DECLARATION","reservationId",reservation.toString(),"claim",claim,"sources",sources,"inventoryToken",token,"validatedAt","2026-10-19T15:00:00Z");
    }
    void set(UUID goal,UUID source,boolean investment,String amount) {
        goals.setAllocation(goal,new SetGoalAllocationDTO(investment?null:source,investment?source:null,new BigDecimal(amount)),user);
    }
    BigDecimal reserved() {return sql.queryForObject("select coalesce(sum(a.amount),0) from goal_allocations a join goals g on g.id=a.goal_id where g.user_id=?",BigDecimal.class,user.getId());}
    long count(String table) {return sql.queryForObject("select count(*) from "+table+" where user_id=?",Long.class,user.getId());}

    @ParameterizedTest @ValueSource(booleans={false,true})
    void unknownBlocksSetAndDepositOnAccountAndInvestmentWithoutPartialWrites(boolean investment) {
        UUID source=investment?investment():account("1000.00"),g=goal();
        UUID r=pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        String before=sql.queryForObject("select attribution from onboarding_reservation_records where id=?",String.class,r);
        assertThatThrownBy(()->set(g,source,investment,"0.01")).isInstanceOf(BusinessRuleException.class);
        assertThatThrownBy(()->goals.addValue(g,new GoalDepositDTO(investment?null:source,new BigDecimal("0.01"),null,null,null,investment?source:null),user)).isInstanceOf(BusinessRuleException.class);
        assertThat(reserved()).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select current_value from goals where id=?",BigDecimal.class,g)).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select count(*) from goal_history h join goals g on g.id=h.goal_id where g.user_id=?",Long.class,user.getId())).isZero();
        assertThat(count("transactions")).isZero();assertThat(count("financial_intent_receipts")).isZero();
        assertThat(sql.queryForObject("select attribution from onboarding_reservation_records where id=?",String.class,r)).isEqualTo(before);
        assertThat(sql.queryForObject(investment?"select valuation_amount from investments where id=?":"select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo(investment?"100.00":"1000.00");
    }

    @ParameterizedTest @ValueSource(booleans={false,true})
    void knownCapacityAcceptsExactLimitAndRejectsAdditionalCent(boolean investment) {
        UUID source=investment?investment():account("1000.00"),g=goal();
        set(g,source,investment,investment?"100.00":"1000.00");
        assertThatThrownBy(()->goals.addValue(g,new GoalDepositDTO(investment?null:source,new BigDecimal("0.01"),null,null,null,investment?source:null),user)).isInstanceOf(BusinessRuleException.class);
        assertThat(reserved()).isEqualByComparingTo(investment?"100.00":"1000.00");
    }

    @ParameterizedTest @ValueSource(booleans={false,true})
    void exclusionRequiresCurrentMatchingEvidenceAndEveryOtherPendingReservationStillBlocks(boolean investment) {
        UUID source=investment?investment():account("1000.00"),g=goal(),r=UUID.randomUUID(),e=UUID.randomUUID();
        var exclusion=node("state","UNBOUNDED","excluded",List.of(node("source",ref(source,investment),"evidenceRefs",List.of(e.toString()))));
        seed(r,exclusion,List.of(proof(e,r,"EXCLUSION",List.of(ref(source,investment)),inventoryToken())));
        UUID second=pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        assertThatThrownBy(()->set(g,source,investment,"0.01")).isInstanceOf(BusinessRuleException.class);
        // Closing/removing only the other risk does not substitute for proof of the first.
        sql.update("delete from onboarding_reservation_records where id=?",second);
        set(g,source,investment,investment?"100.00":"1000.00");
        assertThat(reserved()).isEqualByComparingTo(investment?"100.00":"1000.00");
    }

    @ParameterizedTest @ValueSource(strings={"missing","stale","wrong-source","wrong-claim"})
    void unprovenExclusionNeverCreatesIndependentCapacity(String fault) {
        UUID source=account("1000.00"),other=account("10.00"),g=goal(),r=UUID.randomUUID(),e=UUID.randomUUID();
        String token=inventoryToken();
        var proof=proof(e,r,fault.equals("wrong-claim")?"ASSIGNMENT":"EXCLUSION",List.of(ref(fault.equals("wrong-source")?other:source,false)),fault.equals("stale")?"old-token":token);
        seed(r,node("state","UNBOUNDED","excluded",List.of(node("source",ref(source,false),"evidenceRefs",List.of(e.toString())))),fault.equals("missing")?List.of():List.of(proof));
        assertThatThrownBy(()->set(g,source,false,"0.01")).isInstanceOf(BusinessRuleException.class);
        assertThat(reserved()).isEqualByComparingTo("0.00");
    }

    @Test void exhaustiveCandidatesBlockOnlyCertifiedSources() {
        UUID source=account("1000.00"),other=account("200.00"),g=goal(),r=UUID.randomUUID(),e=UUID.randomUUID();
        seed(r,node("state","CANDIDATES","sources",List.of(ref(source,false)),"evidenceRefs",List.of(e.toString())),
                List.of(proof(e,r,"EXHAUSTIVE_CANDIDATES",List.of(ref(source,false)),inventoryToken())));
        assertThatThrownBy(()->set(g,source,false,"0.01")).isInstanceOf(BusinessRuleException.class);
        set(g,other,false,"200.00");assertThat(reserved()).isEqualByComparingTo("200.00");
    }

    @Test void anUnmaterializedLegacyFlagStillBlocksNewReservations() {
        UUID source=account("1000.00"),g=goal(),legacy=goal();
        sql.update("update goals set allocation_reconciled=false,current_value=100 where id=?",legacy);
        assertThatThrownBy(()->set(g,source,false,"0.01")).isInstanceOf(BusinessRuleException.class);
        assertThat(count("onboarding_reservation_records")).isZero();assertThat(reserved()).isEqualByComparingTo("0.00");
    }

    @Test void confirmedUnknownAmountBlocksOnlyItsProvenSource() {
        UUID source=account("1000.00"),other=account("200.00"),g=goal(),r=UUID.randomUUID(),e=UUID.randomUUID();
        seed(r,node("state","CONFIRMED","parts",List.of(node("source",ref(source,false),"amount",unknown("/legacy/nominal").json())),"evidenceRefs",List.of(e.toString())),
                List.of(proof(e,r,"ASSIGNMENT",List.of(ref(source,false)),inventoryToken())));
        assertThatThrownBy(()->set(g,source,false,"0.01")).isInstanceOf(BusinessRuleException.class);
        set(g,other,false,"200.00");assertThat(reserved()).isEqualByComparingTo("200.00");
    }

    @Test void knownConfirmedReservationAndItsMaterializedPairAreCountedOnlyOnce() {
        UUID source=account("1000.00"),oldGoal=goal(),newGoal=goal(),r=UUID.randomUUID(),e=UUID.randomUUID();
        sql.update("update goals set current_value=400 where id=?",oldGoal);
        sql.update("insert into goal_allocations(id,goal_id,account_id,amount,version,reservation_id) values(?,?,?,400,0,?)",UUID.randomUUID(),oldGoal,source,r);
        String token=inventoryToken();
        var reservation=node("reservationId",r.toString(),"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",oldGoal.toString())),
                "nominal",known(new BigDecimal("400.00")).json(),"attribution",node("state","CONFIRMED","parts",List.of(node("source",ref(source,false),"amount",known(new BigDecimal("400.00")).json())),"evidenceRefs",List.of(e.toString())));
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,?,now())",r,user.getId(),reservation.toString(),JSON.valueToTree(List.of(proof(e,r,"ASSIGNMENT",List.of(ref(source,false)),token))).toString());
        assertThat(goals.listAllocations(oldGoal,user).getFirst().sourceFree()).isEqualByComparingTo("600.00");
        set(newGoal,source,false,"600.00");
        assertThat(reserved()).isEqualByComparingTo("1000.00");
    }

    @Test void resolvingOneActualReservationDoesNotClearTheOtherPending() {
        UUID source=account("1000.00"),g=goal();
        UUID one=pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        UUID two=pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        var write=minimal();((tools.jackson.databind.node.ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node(
                "reservationId",one.toString(),"expectedRevision","0","action","CLOSE","currentSituationConfirmed",true))));
        var prepared=prepare(write);app.complete(user.getId(),completeCommand(prepared));
        assertThatThrownBy(()->set(g,source,false,"0.01")).isInstanceOf(BusinessRuleException.class);
        assertThat(reserved()).isEqualByComparingTo("0.00");
        assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,one)).isEqualTo(1L);
        assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,two)).isZero();
        assertThat(count("onboarding_reservation_history")).isEqualTo(1L);
    }

    @Test void knownReductionAndReleaseRemainAllowedButMoveIntoUnknownDestinationRollsBack() {
        UUID source=account("1000.00"),destination=account("500.00"),g=goal();set(g,source,false,"300.00");
        pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        UUID allocation=sql.queryForObject("select id from goal_allocations where goal_id=?",UUID.class,g);
        assertThatThrownBy(()->goals.moveAllocation(g,new MoveGoalAllocationDTO(allocation,destination,null,new BigDecimal("0.01")),user)).isInstanceOf(BusinessRuleException.class);
        assertThat(reserved()).isEqualByComparingTo("300.00");
        set(g,source,false,"200.00");assertThat(reserved()).isEqualByComparingTo("200.00");
        var row=goals.listAllocations(g,user).getFirst();assertThat(row.sourceFree()).isNull();assertThat(row.sourceTotalAllocated()).isNull();
        set(g,source,false,"0.00");assertThat(reserved()).isEqualByComparingTo("0.00");
    }

    @Test void voluntaryInvestmentBuyCannotConsumeCashWithUnknownReservations() {
        UUID source=account("1000.00"),asset=investment();pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        UUID operation=UUID.randomUUID();
        assertThatThrownBy(()->investments.performOperation(new InvestmentOperationDTO(asset,InvestTransType.BUY,BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ZERO,LocalDate.of(2026,10,19),source,null,operation),user)).isInstanceOf(BusinessRuleException.class);
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo("1000.00");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,asset)).isEqualByComparingTo("10");
        assertThat(count("transactions")).isZero();assertThat(count("financial_intent_receipts")).isZero();
    }

    @Test void completedInvestmentReplayKeepsOriginalEffectEvenWhenCapacityLaterBecomesUnknown() {
        UUID source=account("1000.00"),asset=investment(),operation=UUID.randomUUID();
        var command=new InvestmentOperationDTO(asset,InvestTransType.BUY,BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ZERO,LocalDate.of(2026,10,19),source,null,operation);
        var original=investments.performOperation(command,user);
        UUID reservation=pending(node("state","UNBOUNDED","excluded",List.of()),List.of());
        var replay=investments.performOperation(command,user);
        JsonNode replayJson=JSON.valueToTree(replay),originalJson=JSON.valueToTree(original);
        assertThat(replayJson).isEqualTo(originalJson);
        assertThatThrownBy(()->investments.performOperation(new InvestmentOperationDTO(asset,InvestTransType.BUY,BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ZERO,LocalDate.of(2026,10,19),source,null,UUID.randomUUID()),user)).isInstanceOf(BusinessRuleException.class);
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo("999.00");
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,asset)).isEqualByComparingTo("11");
        assertThat(count("transactions")).isEqualTo(1L);assertThat(count("financial_intent_receipts")).isEqualTo(1L);
        assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Long.class,asset)).isEqualTo(1L);
        assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,reservation)).isZero();
    }

    @Test void closingTheLastLegacyReservationAllowsKnownCapacityImmediatelyAfterCommit() {
        UUID source=account("1000.00"),legacy=goal(),target=goal();
        sql.update("update goals set allocation_reconciled=false,current_value=100 where id=?",legacy);
        JsonNode reservation=node("reservationId",legacy.toString(),"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",legacy.toString())),
                "nominal",unknown("/legacy/nominal").json(),"attribution",node("state","UNBOUNDED","excluded",List.of()));
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,'[]',now())",legacy,user.getId(),reservation.toString());
        var write=minimal();((tools.jackson.databind.node.ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node(
                "reservationId",legacy.toString(),"expectedRevision","0","action","CLOSE","currentSituationConfirmed",true))));
        var prepared=prepare(write);app.complete(user.getId(),completeCommand(prepared));
        assertThat(sql.queryForObject("select allocation_reconciled from goals where id=?",Boolean.class,legacy)).isTrue();
        set(target,source,false,"1000.00");
        assertThat(reserved()).isEqualByComparingTo("1000.00");
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo("1000.00");
    }

    @Test void confirmedAssignmentAllowsOnlyItsRemainingCapacityAfterCommit() {
        UUID source=account("1000.00"),legacy=goal(),target=goal();
        sql.update("update goals set allocation_reconciled=false,current_value=100 where id=?",legacy);
        JsonNode reservation=node("reservationId",legacy.toString(),"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",legacy.toString())),
                "nominal",unknown("/legacy/nominal").json(),"attribution",node("state","UNBOUNDED","excluded",List.of()));
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,'[]',now())",legacy,user.getId(),reservation.toString());
        var write=minimal();((tools.jackson.databind.node.ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(node(
                "reservationId",legacy.toString(),"expectedRevision","0","action","ASSIGN","currentSituationConfirmed",true,
                "goal",node("kind","GOAL","id",legacy.toString()),"parts",List.of(node("source",ref(source,false),"amount","400.00"))))));
        var prepared=prepare(write);app.complete(user.getId(),completeCommand(prepared));
        assertThat(goals.listAllocations(legacy,user).getFirst().sourceFree()).isEqualByComparingTo("600.00");
        set(target,source,false,"600.00");assertThat(reserved()).isEqualByComparingTo("1000.00");
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo("1000.00");
    }
}
