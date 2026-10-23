package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.goal.dto.SetGoalAllocationDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.util.AopTestUtils;
import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doAnswer;

/** Real adapter delegated unchanged; barriers expose the authorization/write window. */
class DailyReservationConcurrencyTest extends OnboardingApplicationSupport {
    @Autowired GoalService goals;
    @MockitoSpyBean SourceReservationService capacity;
    UUID goal(UUID owner) {
        UUID id=UUID.randomUUID();sql.update("insert into goals(id,title,type,target_value,current_value,deadline,user_id,allocation_reconciled,version) values(?,'Race reserve','MONETARY',2000,0,'2027-10-23',?,true,0)",id,owner);return id;
    }
    @Test void aCompetingWriterWaitsAfterCapacityCheckAndAnotherOwnerContinues() throws Exception {
        UUID source=account("1000.00"),one=goal(user.getId()),two=goal(user.getId());
        User other=new User();other.setNome("Other synthetic");other.setEmail(UUID.randomUUID()+"@example.test");other.setSenha("synthetic");other=users.saveAndFlush(other);
        User otherUser=other;UUID otherGoal=goal(other.getId()),otherSource=UUID.randomUUID();
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,'Other','CHECKING',1000,?,false,0)",otherSource,other.getId());
        CountDownLatch checked=new CountDownLatch(1),release=new CountDownLatch(1);
        SourceReservationService observed=AopTestUtils.getUltimateTargetObject(capacity);
        doAnswer(call->{call.callRealMethod();if(user.getId().equals(call.getArgument(0))&&checked.getCount()>0){checked.countDown();await(release);}return null;})
                .when(observed).requireCapacity(any(),any(),any(),any());
        try(var pool=Executors.newVirtualThreadPerTaskExecutor()) {
            var first=pool.submit(()->goals.setAllocation(one,new SetGoalAllocationDTO(source,null,new BigDecimal("600.00")),user));await(checked);
            var competing=pool.submit(()->{try{goals.setAllocation(two,new SetGoalAllocationDTO(source,null,new BigDecimal("600.00")),user);return "COMMITTED";}catch(BusinessRuleException e){return "CAPACITY_REJECTED";}});
            try {
                awaitBlocked();assertThat(competing.isDone()).isFalse();
                pool.submit(()->goals.setAllocation(otherGoal,new SetGoalAllocationDTO(otherSource,null,new BigDecimal("1000.00")),otherUser)).get(4,TimeUnit.SECONDS);
            }finally{release.countDown();}
            first.get(15,TimeUnit.SECONDS);assertThat(competing.get(15,TimeUnit.SECONDS)).isEqualTo("CAPACITY_REJECTED");
        }
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations where account_id=?",BigDecimal.class,source)).isEqualByComparingTo("600.00");
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,source)).isEqualByComparingTo("1000.00");
    }
}
