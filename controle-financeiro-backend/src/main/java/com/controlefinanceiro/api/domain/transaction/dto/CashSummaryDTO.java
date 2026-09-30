package com.controlefinanceiro.api.domain.transaction.dto;

import java.math.BigDecimal;

public record CashSummaryDTO(BigDecimal entries, BigDecimal exits, BigDecimal balance,
        com.controlefinanceiro.api.domain.summary.dto.ReportingCoverageDTO coverage, Observed observed) {
    public record Observed(
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal entries,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal exits,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal balance) {
        public Observed {entries=entries.setScale(2);exits=exits.setScale(2);balance=balance.setScale(2);}
    }
}
