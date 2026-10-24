package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.service.SourceReservationService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

/** Counts actual JDBC statements, including ORM and inventory reads; local synthetic
 * elapsed time covers the critical section through commit, not a production SLA. */
@Import(OnboardingCapacityCostTest.CountingConfig.class)
class Cf033CapacityCostTest extends OnboardingApplicationSupport {
    @Autowired SourceReservationService capacities;
    @Test void queryCountDoesNotGrowWithSourcesOrUnboundedReservations() throws Exception {
        UUID source=account("1000.00");List<Map<String,Object>> observations=new ArrayList<>();
        observations.add(measure(source,1,0));
        List<Object[]> rows=new ArrayList<>();
        for(int n=0;n<999;n++)rows.add(new Object[]{UUID.randomUUID(),user.getId()});
        sql.batchUpdate("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,'Synthetic','CHECKING',1000,?,false,0)",rows);
        observations.add(measure(source,1000,0));
        for(int n=1;n<=50;n++) {
            UUID id=UUID.randomUUID();
            var record=OnboardingJson.node("reservationId",id.toString(),"revision","0","goal",OnboardingJson.node("state","UNKNOWN"),
                    "nominal",SummaryAmount.unknown("/synthetic/nominal").json(),"attribution",OnboardingJson.node("state","UNBOUNDED","excluded",List.of()));
            sql.update("insert into onboarding_reservation_records(id,user_id,revision,attribution,evidence,recorded_at) values(?,?,0,?,'[]',now())",id,user.getId(),record.toString());
            if(n==1 || n==50)observations.add(measure(source,1000,n));
        }
        assertThat(observations.get(1).get("selects")).isEqualTo(observations.get(0).get("selects"));
        assertThat(observations.get(3).get("selects")).isEqualTo(observations.get(2).get("selects"));
        assertThat(observations.get(0).get("outcome")).isEqualTo("ALLOWED");
        assertThat(observations.get(2).get("outcome")).isEqualTo("BLOCKED_UNKNOWN");
        String out=System.getenv("CF032_EVIDENCE");
        if(out!=null)Files.writeString(Path.of(out,"capacity-cost.json"),OnboardingJson.JSON.writeValueAsString(observations),StandardOpenOption.CREATE_NEW);
    }
    Map<String,Object> measure(UUID source,int sources,int pending) {
        OnboardingCapacityCostTest.STATEMENTS.clear();long started=System.nanoTime();
        String outcome=new TransactionTemplate(txManager).execute(s->{
            guard.capacity(user.getId());
            sql.queryForObject("select balance from accounts where id=? for update",BigDecimal.class,source);
            try {capacities.requireCapacity(user.getId(),source,null,new BigDecimal("1.00"));return "ALLOWED";}
            catch(BusinessRuleException e){s.setRollbackOnly();return "BLOCKED_UNKNOWN";}
        });
        long nanos=System.nanoTime()-started;
        List<String> statements=List.copyOf(OnboardingCapacityCostTest.STATEMENTS);
        long selects=statements.stream().filter(q->q.stripLeading().toLowerCase(Locale.ROOT).startsWith("select")).count();
        return Map.of("sources",sources,"pending",pending,"selects",selects,"elapsedNanos",nanos,"outcome",outcome,"statements",statements);
    }
}
