package com.controlefinanceiro.api.domain.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseGoalItemDTO(
        @NotNull @Positive BigDecimal paidPrice,
        UUID accountId,
        UUID cardId,
        Integer installments,
        UUID allocationId
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public PurchaseGoalItemDTO(BigDecimal paidPrice, UUID accountId, UUID cardId, Integer installments) {
        this(paidPrice, accountId, cardId, installments, null);
    }
}
