package com.controlefinanceiro.api.domain.account.dto;

import com.controlefinanceiro.api.domain.account.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateAccountDTO(
        @NotBlank(message = "O nome da conta é obrigatório")
        String name,

        @NotNull(message = "O tipo da conta é obrigatório")
        AccountType type,

        @NotNull(message = "O saldo inicial é obrigatório (pode ser zero)")
        @Digits(integer = 12, fraction = 2, message = "O saldo inicial deve ter até 12 dígitos inteiros e 2 casas decimais")
        BigDecimal initialBalance,

        String color,

        LocalDate openingDate
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public CreateAccountDTO(String name, AccountType type, BigDecimal initialBalance, String color) {
        this(name, type, initialBalance, color, null);
    }
}
