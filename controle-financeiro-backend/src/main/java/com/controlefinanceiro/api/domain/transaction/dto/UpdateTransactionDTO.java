package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateTransactionDTO(
        String description,
        BigDecimal amount,
        LocalDate date,
        String time,
        TransactionType type,
        UUID accountId,
        UUID categoryId,
        Boolean isPaid
) {}