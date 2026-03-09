package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record TransactionResponseDTO(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate date,
        boolean isPaid,
        TransactionType type,
        LocalDateTime createdAt,
        UUID accountId,
        String accountName,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        @JsonProperty("isSystemManaged")
        boolean isSystemManaged
) {
    public TransactionResponseDTO(Transaction t) {
        this(
                t.getId(), t.getDescription(), t.getAmount(), t.getDate(), t.isPaid(), t.getType(), t.getCreatedAt(),
                t.getAccount().getId(), t.getAccount().getName(),
                t.getCategory() != null ? t.getCategory().getId() : null,
                t.getCategory() != null ? t.getCategory().getName() : null,
                t.getCategory() != null ? t.getCategory().getColor() : null,
                t.isSystemManaged()
        );
    }
}