package com.controlefinanceiro.api.service;

import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/** Intent lock precedes this guard; all source/aggregate locks follow it.
 * Shared writers keep their existing source concurrency. Onboarding captures/applies
 * an entire owner inventory exclusively. No process-local lock or external effects. */
@Component
public class FinancialInventoryGuard {
    private final EntityManager em;
    public FinancialInventoryGuard(EntityManager em) { this.em=em; }
    @Transactional(propagation=Propagation.MANDATORY)
    public void writer(UUID owner) { lock(owner,true); }
    @Transactional(propagation=Propagation.MANDATORY)
    public void snapshot(UUID owner) { lock(owner,false); }
    private void lock(UUID owner,boolean shared) {
        em.createNativeQuery("select set_config('lock_timeout',case when current_setting('lock_timeout')::interval=interval '0' or current_setting('lock_timeout')::interval>interval '5 seconds' then '5s' else current_setting('lock_timeout') end,true)").getSingleResult();
        em.createNativeQuery("select 1 from pg_advisory_xact_lock"+(shared?"_shared":"")+
                "(hashtextextended(cast(?1 as text),0))")
                .setParameter(1,"financial-inventory:"+owner).getSingleResult();
    }
}
