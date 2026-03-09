package com.controlefinanceiro.api.domain.card.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateCardDTO(
        @NotBlank(message = "O nome do cartão é obrigatório")
        String name,

        @NotBlank(message = "Os últimos 4 dígitos são obrigatórios")
        @Size(min = 4, max = 4, message = "Deve conter exatamente 4 dígitos")
        @Pattern(regexp = "\\d+", message = "Deve conter apenas números")
        String last4Digits,

        @NotNull(message = "O limite é obrigatório")
        @Positive(message = "O limite deve ser positivo")
        BigDecimal limit,

        @NotNull(message = "O dia de fechamento é obrigatório")
        @Min(value = 1, message = "Dia inválido") @Max(value = 31, message = "Dia inválido")
        Integer closingDay,

        @NotNull(message = "O dia de vencimento é obrigatório")
        @Min(value = 1, message = "Dia inválido") @Max(value = 31, message = "Dia inválido")
        Integer dueDay,

        @NotBlank(message = "A bandeira é obrigatória")
        String brand,

        String color
) {}