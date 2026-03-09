package com.controlefinanceiro.api.domain.investment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBalanceDTO(
        @NotNull UUID investmentId,
        @NotNull @Positive BigDecimal newBalance
) {}