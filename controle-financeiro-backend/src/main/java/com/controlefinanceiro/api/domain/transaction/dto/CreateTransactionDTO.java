package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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
        @Digits(integer = 12, fraction = 2, message = "O valor deve ter até 12 dígitos inteiros e 2 casas decimais")
        BigDecimal amount,

        @NotNull(message = "A data é obrigatória")
        LocalDate date,

        @WallTime String time,

        @NotNull(message = "O tipo de transação é obrigatório")
        TransactionType type,

        @NotNull(message = "A conta é obrigatória")
        UUID accountId,

        UUID categoryId,
        Boolean isPaid,

        UUID destinationAccountId,

        @DecimalMin(value = "0.00", message = "A taxa não pode ser negativa")
        @Digits(integer = 12, fraction = 2, message = "A taxa deve ter até 12 dígitos inteiros e 2 casas decimais")
        BigDecimal fee
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public CreateTransactionDTO(
            String description,
            BigDecimal amount,
            LocalDate date,
            String time,
            TransactionType type,
            UUID accountId,
            UUID categoryId,
            Boolean isPaid
    ) {
        this(description, amount, date, time, type, accountId, categoryId, isPaid, null, null);
    }
}
