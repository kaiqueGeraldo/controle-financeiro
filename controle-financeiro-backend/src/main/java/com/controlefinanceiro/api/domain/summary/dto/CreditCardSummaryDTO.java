package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record CreditCardSummaryDTO(
        BigDecimal totalSpent,
        BigDecimal subscriptionsTotal, // Assinaturas
        BigDecimal monthlyAverage,
        ReportingCoverageDTO coverage,
        Observed observed
) {
    public record Observed(
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal totalSpent,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal subscriptionsTotal,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal monthlyAverage) {
        public Observed {totalSpent=totalSpent.setScale(2);subscriptionsTotal=subscriptionsTotal.setScale(2);monthlyAverage=monthlyAverage.setScale(2);}
    }
}
