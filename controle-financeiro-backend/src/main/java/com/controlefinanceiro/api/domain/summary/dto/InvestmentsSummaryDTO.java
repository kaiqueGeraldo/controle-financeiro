package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;

public record InvestmentsSummaryDTO(
        BigDecimal totalCost,
        BigDecimal totalValue,
        LocalDate valuationAsOf,
        boolean valuationComplete,
        List<InvestmentBreakdownDTO> items,
        boolean outsideSupportedRange,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal observedCost,
        @com.fasterxml.jackson.annotation.JsonFormat(shape=com.fasterxml.jackson.annotation.JsonFormat.Shape.STRING) BigDecimal observedValue
) {}
