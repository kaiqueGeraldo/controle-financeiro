package com.controlefinanceiro.api.domain.dashboard.dto;
import java.math.BigDecimal;

public record DashboardFlowDTO(
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        BigDecimal percentage,
        BigDecimal investmentResult,
        com.controlefinanceiro.api.domain.summary.dto.ReportingCoverageDTO coverage,
        com.controlefinanceiro.api.domain.summary.dto.ObservedTotalsDTO observed
) {}
