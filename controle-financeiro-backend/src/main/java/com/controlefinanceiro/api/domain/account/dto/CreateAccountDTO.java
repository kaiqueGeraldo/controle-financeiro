package com.controlefinanceiro.api.domain.account.dto;

import com.controlefinanceiro.api.domain.account.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateAccountDTO(
        @NotBlank(message = "O nome da conta é obrigatório")
        String name,

        @NotNull(message = "O tipo da conta é obrigatório")
        AccountType type,

        @NotNull(message = "O saldo inicial é obrigatório (pode ser zero)")
        BigDecimal initialBalance,

        String color
) {}