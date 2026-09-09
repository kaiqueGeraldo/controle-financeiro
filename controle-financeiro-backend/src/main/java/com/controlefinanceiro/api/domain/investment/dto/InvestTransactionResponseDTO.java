package com.controlefinanceiro.api.domain.investment.dto;

import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.investment.InvestTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InvestTransactionResponseDTO(
        UUID id,
        InvestTransType type,
        LocalDate date,
        BigDecimal quantity,
        BigDecimal price,
        BigDecimal totalValue,
        BigDecimal fees
) {
    public InvestTransactionResponseDTO(InvestTransaction transaction) {
        this(
                transaction.getId(),
                transaction.getType(),
                transaction.getDate().toLocalDate(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTotalValue(),
                transaction.getFees()
        );
    }
}
