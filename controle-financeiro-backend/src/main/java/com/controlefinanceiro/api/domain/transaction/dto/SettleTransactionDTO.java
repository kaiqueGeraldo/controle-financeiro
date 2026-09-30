package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SettleTransactionDTO(
        @NotNull
        @Positive(message = "O valor da baixa deve ser positivo")
        @Digits(integer = 12, fraction = 2, message = "O valor deve ter até 12 dígitos inteiros e 2 casas decimais")
        @tools.jackson.databind.annotation.JsonDeserialize(using = com.controlefinanceiro.api.utils.DecimalStringDeserializer.class)
        BigDecimal amount,
        @NotNull LocalDate date,
        @WallTime String time,
        java.util.UUID operationId
) {
    public SettleTransactionDTO(BigDecimal amount, LocalDate date, String time) { this(amount,date,time,null); }
}
