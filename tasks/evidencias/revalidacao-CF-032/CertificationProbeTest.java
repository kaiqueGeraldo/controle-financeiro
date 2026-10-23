package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.service.GoalService;
import com.controlefinanceiro.api.service.onboarding.OnboardingInventory;
import com.controlefinanceiro.api.service.onboarding.OnboardingProjection;
import com.controlefinanceiro.api.domain.goal.dto.SetGoalAllocationDTO;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.*;
import static com.controlefinanceiro.api.domain.onboarding.OnboardingJson.*;
import static org.assertj.core.api.Assertions.*;

/** Independent review probes: actual JDBC writes and failure in certification.
 * No domain implementation is replaced. Token comparison uses the protocol
 * serializer; monetary, revision and rollback expectations are literal. */
class CertificationProbeTest extends OnboardingApplicationSupport {
    @Autowired GoalService goals;
    @Autowired OnboardingInventory inventory;
    @Autowired com.controlefinanceiro.api.service.InvestmentService investments;
    UUID legacy;
    String oldEvidence;
    UUID goal() {
        UUID id=UUID.randomUUID();
        sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,version) values(?,'Independent certification','MONETARY',2000,0,'2027-10-23',?,true,0)",id,user.getId());
        return id;
    }
    ObjectNode fixture(String action, UUID source) {
        legacy=goal();
        sql.update("update goals set allocation_reconciled=false,current_value=100 where id=?",legacy);
        var old=node("id",UUID.randomUUID().toString(),"revision","0","basis","CURRENT_DECLARATION","reservationId",legacy.toString(),"claim","CLOSURE","sources",List.of(),"inventoryToken","historical-token","validatedAt","2026-01-01T00:00:00Z");
        oldEvidence=JSON.valueToTree(List.of(old)).toString();
        var r=node("reservationId",legacy.toString(),"revision","0","goal",node("state","KNOWN","value",node("kind","GOAL","id",legacy.toString())),"nominal",node("state","UNKNOWN","value",null,"knownSubtotal",null,"outsideIndividualRange",null,"missingPaths",List.of("/legacy")),"attribution",node("state","UNBOUNDED","excluded",List.of()));
        sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,?,now())",legacy,user.getId(),r.toString(),oldEvidence);
        ObjectNode c=node("reservationId",legacy.toString(),"expectedRevision","0","action",action,"currentSituationConfirmed",true);
        if(action.equals("ASSIGN")) {
            c.set("goal",node("kind","GOAL","id",legacy.toString()));
            c.set("parts",JSON.valueToTree(List.of(node("source",node("kind","ACCOUNT","id",source.toString()),"amount","400.00"))));
        }
        var write=minimal();((ObjectNode)write.path("payload")).set("reservationConfirmations",JSON.valueToTree(List.of(c)));return write;
    }
    String actualToken() {return new TransactionTemplate(txManager).execute(s->{guard.snapshot(user.getId());return OnboardingProjection.baseToken(inventory.load(user.getId()),object());});}
    String evidence() {return sql.queryForObject("select evidence from onboarding_reservation_records where id=?",String.class,legacy);}
    @org.junit.jupiter.api.Test
    void legacyInvestmentLinkDoesNotAuthorizeNominalAllocation() {
        UUID source=account("1000.00"),target=goal();fixture("CLOSE",source);
        var created=investments.create(new com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO(
            "RVLINK","Independent linked position",com.controlefinanceiro.api.domain.investment.InvestType.STOCK,target,
            BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ONE,java.time.LocalDate.of(2026,10,19),"USER_DECLARED"),user);
        UUID id=sql.queryForObject("select id from investments where user_id=? and ticker='RVLINK'",UUID.class,user.getId());
        assertThat(sql.queryForObject("select goal_id from investments where id=?",UUID.class,id)).isEqualTo(target);
        assertThat(sql.queryForObject("select count(*) from goal_allocations where investment_id=?",Integer.class,id)).isZero();
        assertThat(sql.queryForObject("select current_value from goals where id=?",BigDecimal.class,target)).isEqualByComparingTo("0");
        assertThatThrownBy(()->goals.setAllocation(target,new SetGoalAllocationDTO(null,id,new BigDecimal("0.01")),user))
            .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class);
        assertThat(sql.queryForObject("select count(*) from goal_allocations where investment_id=?",Integer.class,id)).isZero();
    }
    @ParameterizedTest @ValueSource(strings={"CLOSE","ASSIGN"})
    void certificateBindsPersistedInventoryPreservesHistoryAndExpiresOnLaterChange(String action) {
        UUID source=account("1000.00"),target=goal();var p=prepare(fixture(action,source));String before=actualToken();
        app.complete(user.getId(),completeCommand(p));
        JsonNode certificate=JSON.readTree(evidence()).get(0);
        assertThat(certificate.path("inventoryToken").asText()).isEqualTo(actualToken()).isNotEqualTo(before);
        assertThat(certificate.path("revision").asText()).isEqualTo("1");
        assertThat(certificate.path("basis").asText()).isEqualTo("CURRENT_DECLARATION");
        assertThat(certificate.path("claim").asText()).isEqualTo(action.equals("CLOSE")?"CLOSURE":"ASSIGNMENT");
        var history=JSON.readTree(sql.queryForObject("select previous_json from onboarding_reservation_history where reservation_id=?",String.class,legacy));
        assertThat(history.path("evidence")).isEqualTo(JSON.readTree(oldEvidence));
        assertThat(sql.queryForObject("select allocation_reconciled from goals where id=?",Boolean.class,legacy)).isTrue();
        assertThat(sql.queryForObject("select current_value from goals where id=?",BigDecimal.class,legacy)).isEqualByComparingTo(action.equals("CLOSE")?"0":"400");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,user.getId())).isZero();
        String saved=evidence();
        // The first legitimate allocation proves the certificate is usable.
        goals.setAllocation(target,new SetGoalAllocationDTO(source,null,new BigDecimal("1.00")),user);
        assertThat(evidence()).isEqualTo(saved); // no historical renewal
        var capacity=new TransactionTemplate(txManager).execute(s->{guard.snapshot(user.getId());return OnboardingProjection.sourceReservations(inventory.load(user.getId()),inventory.maxRelations()).get("ACCOUNT:"+source);});
        assertThat(capacity.known()).isFalse(); // changed inventory invalidates old proof
    }
    @ParameterizedTest @ValueSource(strings={"CLOSE","ASSIGN"})
    void failureBetweenWritesAndCertificationRollsBackEntireCompletion(String action) {
        UUID source=account("1000.00");var p=prepare(fixture(action,source));var command=completeCommand(p);
        String before=evidence();
        String fn="review_cert_"+legacy.toString().replace("-","");
        // Trigger only on the final UPDATE (revision already changed in the prior
        // UPSERT). Throws after all financial SQL, exactly before certification.
        sql.execute("create function "+fn+"() returns trigger language plpgsql as 'begin if NEW.id = ''"+legacy+"''::uuid and NEW.revision=OLD.revision then raise exception ''REVIEW_CERTIFICATION_FAILURE''; end if; return NEW; end'");
        sql.execute("create trigger "+fn+" before update of evidence on onboarding_reservation_records for each row execute function "+fn+"()");
        try {
            assertThatThrownBy(()->app.complete(user.getId(),command)).hasStackTraceContaining("REVIEW_CERTIFICATION_FAILURE");
            assertThat(evidence()).isEqualTo(before);
            assertThat(sql.queryForObject("select revision from onboarding_reservation_records where id=?",Long.class,legacy)).isZero();
            assertThat(sql.queryForObject("select count(*) from onboarding_reservation_history where reservation_id=?",Integer.class,legacy)).isZero();
            assertThat(sql.queryForObject("select count(*) from goal_allocations where reservation_id=?",Integer.class,legacy)).isZero();
            assertThat(sql.queryForObject("select allocation_reconciled from goals where id=?",Boolean.class,legacy)).isFalse();
            assertThat(sql.queryForObject("select current_value from goals where id=?",BigDecimal.class,legacy)).isEqualByComparingTo("100");
            assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?",Integer.class,user.getId())).isZero();
            assertThat(app.recover(user.getId(),command.operationId()).path("state").asText()).isEqualTo("PREPARED");
        } finally {
            sql.execute("drop trigger "+fn+" on onboarding_reservation_records");sql.execute("drop function "+fn+"()");
        }
        assertThat(app.complete(user.getId(),command).path("status").asText()).isEqualTo("COMPLETED");
    }
}
