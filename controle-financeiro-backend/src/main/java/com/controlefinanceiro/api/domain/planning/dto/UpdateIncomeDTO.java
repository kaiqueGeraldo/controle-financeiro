package com.controlefinanceiro.api.domain.planning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record UpdateIncomeDTO(
        @NotNull(message = "O mês é obrigatório")
        @Min(1) @Max(12)
        Integer month,

        @NotNull(message = "O ano é obrigatório")
        Integer year,

        @NotNull(message = "A renda é obrigatória")
        @PositiveOrZero(message = "A renda não pode ser negativa")
        BigDecimal income
) {}