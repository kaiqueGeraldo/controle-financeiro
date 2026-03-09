package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;
import java.util.List;

public record InvestmentsSummaryDTO(
        BigDecimal totalValue,
        List<InvestmentBreakdownDTO> items
) {}