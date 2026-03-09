package com.controlefinanceiro.api.domain.account.dto;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountType;
import java.math.BigDecimal;
import java.util.UUID;

public record AccountResponseDTO(
        UUID id,
        String name,
        AccountType type,
        BigDecimal balance,
        String color,
        boolean isArchived,
        Integer orderIndex
) {
    public AccountResponseDTO(Account account) {
        this(
                account.getId(),
                account.getName(),
                account.getType(),
                account.getBalance(),
                account.getColor(),
                account.isArchived(),
                account.getOrderIndex()
        );
    }
}