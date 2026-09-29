package com.controlefinanceiro.api.domain.investment.dto;

import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.Investment;
import java.math.BigDecimal;
import java.util.UUID;

public record InvestmentResponseDTO(
        UUID id,
        String ticker,
        String name,
        InvestType type,
        BigDecimal quantity,
        BigDecimal averagePrice,
        BigDecimal currentPrice,
        BigDecimal totalCost,
        BigDecimal valuationAmount,
        java.time.LocalDate valuationDate,
        String valuationSource,
        com.controlefinanceiro.api.domain.investment.ValuationBasis valuationBasis,
        UUID goalId
) {
    public InvestmentResponseDTO(Investment i) {
        this(i.getId(), i.getTicker(), i.getName(), i.getType(), i.getQuantity(),
                i.getAveragePrice(), i.getCurrentPrice(), i.getTotalCost(), i.getValuationAmount(),
                i.getValuationDate(), i.getValuationSource(), i.getValuationBasis(),
                i.getGoal() != null ? i.getGoal().getId() : null);
    }
}
