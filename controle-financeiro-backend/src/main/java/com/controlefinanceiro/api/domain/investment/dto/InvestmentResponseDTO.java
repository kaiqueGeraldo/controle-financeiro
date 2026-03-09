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
        UUID goalId
) {
    public InvestmentResponseDTO(Investment i) {
        this(i.getId(), i.getTicker(), i.getName(), i.getType(), i.getQuantity(),
                i.getAveragePrice(), i.getCurrentPrice(),
                i.getGoal() != null ? i.getGoal().getId() : null);
    }
}