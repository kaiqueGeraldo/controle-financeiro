package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.transaction.TransactionStatus;
import com.controlefinanceiro.api.domain.transaction.TransferDirection;
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
        LocalDate dueDate,
        java.time.Instant settledAt,
        boolean isPaid,
        TransactionType type,
        LocalDateTime createdAt,
        UUID accountId,
        String accountName,
        UUID categoryId,
        String categoryName,
        String categoryColor,
        @JsonProperty("isSystemManaged")
        boolean isSystemManaged,
        TransactionStatus status,
        TransactionOrigin origin,
        UUID operationId,
        TransferDirection transferDirection,
        UUID counterpartyAccountId,
        UUID reversalOfId,
        UUID settlementOfId,
        UUID correctionOfId,
        java.time.LocalTime time,
        String timeOrigin,
        java.time.Instant recordedAt,
        LocalDateTime legacyCreatedAtRaw
) {
    public TransactionResponseDTO(Transaction t) {
        this(
                t.getId(), t.getDescription(), t.getAmount(), t.getDate(), t.getDueDate(), t.getSettledAt(),
                t.isPaid(), t.getType(), t.getCreatedAt(),
                t.getAccount().getId(), t.getAccount().getName(),
                t.getCategory() != null ? t.getCategory().getId() : null,
                t.getCategory() != null ? t.getCategory().getName() : null,
                t.getCategory() != null ? t.getCategory().getColor() : null,
                t.isSystemManaged(), t.getStatus(),
                t.getOrigin() == null ? TransactionOrigin.UNKNOWN : t.getOrigin(),
                t.getOperationId(), t.getTransferDirection(), t.getCounterpartyAccountId(), t.getReversalOfId(),
                t.getSettlementOfId(), t.getCorrectionOfId(),
                t.getTime(),
                t.getTimeOrigin() == null ? "UNKNOWN" : t.getTimeOrigin().name(), t.getRecordedAt(),
                t.getLegacyCreatedAtRaw() == null ? t.getCreatedAt() : t.getLegacyCreatedAtRaw()
        );
    }
}
