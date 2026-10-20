package com.controlefinanceiro.api.domain.goal;

import java.math.BigDecimal;
/** FIN-05: only increases need known, active, unreserved capacity. */
public final class ReservationCapacity {
    private ReservationCapacity() {}
    public static boolean allows(BigDecimal value,BigDecimal alreadyReserved,BigDecimal increase,boolean active) {
        return increase.signum()<=0 || active && value!=null && value.max(BigDecimal.ZERO).subtract(alreadyReserved).compareTo(increase)>=0;
    }
}
