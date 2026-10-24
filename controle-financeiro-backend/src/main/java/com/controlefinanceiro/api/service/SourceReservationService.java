package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.ReservationCapacity;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.onboarding.OnboardingInventory;
import com.controlefinanceiro.api.service.onboarding.OnboardingProjection;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/** Commands acquire FinancialInventoryGuard.capacity before source locks. Without
 * global dependencies only the locked source and its pairs authorize capacity;
 * otherwise the unchanged inventory projection runs under exclusive protection. */
@Service
@Transactional(propagation=Propagation.MANDATORY)
public class SourceReservationService {
    private final OnboardingInventory inventory;
    private final FinancialInventoryGuard guard;
    private final JdbcTemplate jdbc;
    public SourceReservationService(OnboardingInventory inventory,FinancialInventoryGuard guard,JdbcTemplate jdbc) {
        this.inventory=inventory;this.guard=guard;this.jdbc=jdbc;
    }

    public Map<String,OnboardingProjection.SourceReservation> inspect(UUID owner) {
        return OnboardingProjection.sourceReservations(inventory.load(owner),inventory.maxRelations());
    }

    public void requireCapacity(UUID owner,UUID accountId,UUID investmentId,BigDecimal increase) {
        var source=guard.hasInventoryDependencies(owner)?
                inspect(owner).get(accountId!=null?"ACCOUNT:"+accountId:"INVESTMENT:"+investmentId):
                localSource(owner,accountId,investmentId);
        if(source==null || !source.known())
            throw new BusinessRuleException("Capacidade da fonte não comprovada: há reservas pendentes de reconciliação.");
        if(source.value()==null)
            throw new BusinessRuleException("Avaliação da fonte indisponível para nova destinação ou investimento.");
        if(!ReservationCapacity.allows(source.value(),source.reserved(),increase,source.active()))
            throw new BusinessRuleException("Disponível da fonte insuficiente para destinação ou investimento.");
    }
    private OnboardingProjection.SourceReservation localSource(UUID owner,UUID accountId,UUID investmentId) {
        boolean account=accountId!=null;
        String query=account?"""
            select s.balance as value,not s.is_archived as active,
              (select coalesce(sum(a.amount),0) from goal_allocations a where a.account_id=s.id) as reserved
            from accounts s where s.user_id=? and s.id=?
            """:"""
            select s.valuation_amount as value,true as active,
              (select coalesce(sum(a.amount),0) from goal_allocations a where a.investment_id=s.id) as reserved
            from investments s where s.user_id=? and s.id=?
            """;
        var rows=jdbc.query(query,(rs,n)->new OnboardingProjection.SourceReservation(rs.getBigDecimal("value"),
                rs.getBigDecimal("reserved"),rs.getBoolean("active"),java.util.Set.of()),owner,account?accountId:investmentId);
        return rows.isEmpty()?null:rows.getFirst();
    }
}
