package com.controlefinanceiro.api.domain.goal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateGoalItemDTO(
        @NotBlank String name,
        String suggestedModel,
        @NotNull @Positive BigDecimal estimatedPrice
) {}
