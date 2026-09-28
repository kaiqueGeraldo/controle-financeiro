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
        BigDecimal fees,
        BigDecimal costDelta,
        BigDecimal realizedResult,
        String dateOrigin,
        java.time.LocalDateTime legacyDateRaw
) {
    public InvestTransactionResponseDTO(InvestTransaction transaction) {
        this(
                transaction.getId(),
                transaction.getType(),
                transaction.getDateOrigin() == null ? null : transaction.getOperationDate(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTotalValue(),
                transaction.getFees(),
                transaction.getCostDelta(),
                transaction.getRealizedResult(),
                transaction.getDateOrigin() == null ? "UNKNOWN" : transaction.getDateOrigin().name(),
                transaction.getDate()
        );
    }
}
