package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.goal.ReservationCapacity;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.onboarding.OnboardingInventory;
import com.controlefinanceiro.api.service.onboarding.OnboardingProjection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/** Source knowledge is domain inventory, not interview/session state. Commands
 * that consume it take the exclusive inventory guard BEFORE source locks: evidence
 * certifies an entire inventory token, so a source lock alone cannot stabilize it. */
@Service
@Transactional(propagation=Propagation.MANDATORY)
public class SourceReservationService {
    private final OnboardingInventory inventory;
    public SourceReservationService(OnboardingInventory inventory) {this.inventory=inventory;}

    public Map<String,OnboardingProjection.SourceReservation> inspect(UUID owner) {
        return OnboardingProjection.sourceReservations(inventory.load(owner),inventory.maxRelations());
    }

    public void requireCapacity(UUID owner,UUID accountId,UUID investmentId,BigDecimal increase) {
        var source=inspect(owner).get(accountId!=null?"ACCOUNT:"+accountId:"INVESTMENT:"+investmentId);
        if(source==null || !source.known())
            throw new BusinessRuleException("Capacidade da fonte não comprovada: há reservas pendentes de reconciliação.");
        if(source.value()==null)
            throw new BusinessRuleException("Avaliação da fonte indisponível para nova destinação ou investimento.");
        if(!ReservationCapacity.allows(source.value(),source.reserved(),increase,source.active()))
            throw new BusinessRuleException("Disponível da fonte insuficiente para destinação ou investimento.");
    }
}
