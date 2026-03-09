package com.controlefinanceiro.api.domain.dashboard.dto;
import java.math.BigDecimal;

public record DashboardFlowDTO(
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        BigDecimal percentage
) {}