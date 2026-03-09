package com.controlefinanceiro.api.domain.card.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record UpdateCardDTO(
        String name,

        @Positive(message = "O limite deve ser positivo")
        BigDecimal limit,

        @Min(1) @Max(31)
        Integer closingDay,

        @Min(1) @Max(31)
        Integer dueDay,

        String color
) {}