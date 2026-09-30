package com.controlefinanceiro.api.domain.summary.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReportingCoverageDTO(String state, LocalDate requestedFrom, LocalDate requestedThrough,
        LocalDate knownFrom, LocalDate knownThrough, long unknownSources, String reason) {
    public boolean complete() { return "COMPLETE".equals(state); }
    public ReportingCoverageDTO withTotals(BigDecimal... values) {
        for(BigDecimal value:values) if(value!=null&&value.abs().compareTo(new BigDecimal("999999999999.99"))>0)
            return new ReportingCoverageDTO("OUT_OF_RANGE",requestedFrom,requestedThrough,knownFrom,knownThrough,
                    unknownSources,reason+" Total fora da faixa monetária; subtotal exato preservado.");
        return this;
    }
    public BigDecimal exact(BigDecimal observed) {
        return complete() && observed != null && observed.abs().compareTo(new BigDecimal("999999999999.99")) <= 0
                ? observed : null;
    }
}
