package com.controlefinanceiro.api.domain.investment.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBalanceDTO(
        @NotNull UUID investmentId,
        @NotNull @PositiveOrZero BigDecimal newBalance,
        @NotNull java.time.LocalDate date,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=255) String source,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=500) String reason
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public UpdateBalanceDTO(UUID id, BigDecimal amount) { this(id,amount,null,null,null); }
}
