package com.controlefinanceiro.api.domain.category.dto;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCategoryDTO(
        @NotBlank(message = "O nome da categoria é obrigatório")
        String name,

        @NotBlank(message = "O ícone é obrigatório")
        String icon,

        @NotBlank(message = "A cor é obrigatória")
        String color,

        @NotNull(message = "O tipo da categoria é obrigatório")
        TransactionType type
) {}