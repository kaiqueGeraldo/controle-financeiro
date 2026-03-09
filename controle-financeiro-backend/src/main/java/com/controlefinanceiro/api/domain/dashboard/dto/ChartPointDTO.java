package com.controlefinanceiro.api.domain.dashboard.dto;
import java.math.BigDecimal;

public record ChartPointDTO(
        String label,
        BigDecimal valor
) {}