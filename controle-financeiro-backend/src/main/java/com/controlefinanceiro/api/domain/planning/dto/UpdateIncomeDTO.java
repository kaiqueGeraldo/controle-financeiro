package com.controlefinanceiro.api.domain.planning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import com.controlefinanceiro.api.utils.StrictIntegerDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;
import java.math.BigDecimal;

public record UpdateIncomeDTO(
        @NotNull(message = "O mês é obrigatório")
        @Min(1) @Max(12)
        @JsonDeserialize(using = StrictIntegerDeserializer.class)
        Integer month,

        @NotNull(message = "O ano é obrigatório")
        @Min(1) @Max(9999) @JsonDeserialize(using = StrictIntegerDeserializer.class)
        Integer year,

        @NotNull(message = "A renda é obrigatória")
        @PositiveOrZero(message = "A renda não pode ser negativa")
        BigDecimal income
) {}
