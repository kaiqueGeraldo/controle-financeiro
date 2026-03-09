package com.controlefinanceiro.api.domain.card.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCardTransactionDTO(
        @NotBlank(message = "A descrição é obrigatória")
        String description,

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser positivo")
        BigDecimal amount,

        @NotNull(message = "A data da compra é obrigatória")
        LocalDate date,

        String time,

        @NotNull(message = "A categoria é obrigatória")
        UUID categoryId,

        @NotNull(message = "O cartão é obrigatório")
        UUID cardId,

        @Min(value = 1, message = "Mínimo de 1 parcela")
        Integer totalInstallments
) {}