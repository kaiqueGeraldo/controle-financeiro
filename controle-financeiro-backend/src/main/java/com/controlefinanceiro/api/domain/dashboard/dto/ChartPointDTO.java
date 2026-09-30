package com.controlefinanceiro.api.domain.dashboard.dto;
import java.math.BigDecimal;

public record ChartPointDTO(
        String label,
        BigDecimal valor,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal observedValue,
        com.controlefinanceiro.api.domain.summary.dto.ReportingCoverageDTO coverage
) {}
