package com.controlefinanceiro.api.domain.investment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBalanceDTO(
        @NotNull UUID investmentId,
        @NotNull @PositiveOrZero BigDecimal newBalance
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {}
