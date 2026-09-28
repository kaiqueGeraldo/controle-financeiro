package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;

public record InvestmentsSummaryDTO(
        BigDecimal totalCost,
        BigDecimal totalValue,
        LocalDate valuationAsOf,
        boolean valuationComplete,
        List<InvestmentBreakdownDTO> items
) {}
