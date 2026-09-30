package com.controlefinanceiro.api.domain.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record MoveGoalAllocationDTO(@NotNull UUID sourceAllocationId, UUID accountId, UUID investmentId,
                                    @NotNull @Positive @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal amount) {}
