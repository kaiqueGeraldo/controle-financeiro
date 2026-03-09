package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTransactionDTO(
        @NotBlank(message = "A descrição é obrigatória")
        String description,

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser positivo")
        BigDecimal amount,

        @NotNull(message = "A data é obrigatória")
        LocalDate date,

        String time,

        @NotNull(message = "O tipo de transação é obrigatório")
        TransactionType type,

        @NotNull(message = "A conta é obrigatória")
        UUID accountId,

        UUID categoryId,
        Boolean isPaid
) {}