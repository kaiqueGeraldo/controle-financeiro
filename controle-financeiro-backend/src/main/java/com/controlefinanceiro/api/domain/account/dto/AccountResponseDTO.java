package com.controlefinanceiro.api.domain.account.dto;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.account.OpeningBalanceOrigin;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AccountResponseDTO(
        UUID id,
        String name,
        AccountType type,
        BigDecimal balance,
        BigDecimal openingBalance,
        LocalDate openingDate,
        OpeningBalanceOrigin openingOrigin,
        Instant openingRecordedAt,
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
                account.getOpeningBalance(),
                account.getOpeningDate(),
                account.getOpeningOrigin() == null ? OpeningBalanceOrigin.UNKNOWN : account.getOpeningOrigin(),
                account.getOpeningRecordedAt(),
                account.getColor(),
                account.isArchived(),
                account.getOrderIndex()
        );
    }
}
