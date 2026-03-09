package com.controlefinanceiro.api.domain.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseGoalItemDTO(
        @NotNull @Positive BigDecimal paidPrice,
        UUID accountId,
        UUID cardId,
        Integer installments
) {}
