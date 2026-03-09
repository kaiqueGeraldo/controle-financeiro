package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record InvestmentBreakdownDTO(
        String name,
        BigDecimal value,
        String type,
        String color
) {}