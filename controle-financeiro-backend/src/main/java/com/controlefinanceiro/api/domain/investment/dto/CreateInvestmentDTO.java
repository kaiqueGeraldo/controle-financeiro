package com.controlefinanceiro.api.domain.investment.dto;

import com.controlefinanceiro.api.domain.investment.InvestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateInvestmentDTO(
        @NotBlank String ticker,
        @NotBlank String name,
        @NotNull InvestType type,
        UUID goalId,
        BigDecimal openingQuantity,
        BigDecimal openingCost,
        BigDecimal openingValue,
        LocalDate valuationDate,
        String valuationSource
) {
    public CreateInvestmentDTO(String ticker, String name, InvestType type, UUID goalId) {
        this(ticker, name, type, goalId, null, null, null, null, null);
    }
}
