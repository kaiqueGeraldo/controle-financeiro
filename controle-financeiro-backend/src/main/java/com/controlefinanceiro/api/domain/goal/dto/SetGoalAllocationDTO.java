package com.controlefinanceiro.api.domain.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.UUID;

public record SetGoalAllocationDTO(UUID accountId, UUID investmentId,
                                   @NotNull @PositiveOrZero @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal amount) {}
