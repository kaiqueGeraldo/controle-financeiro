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
        LocalDateTime legacyCreatedAtRaw,
        UUID realizationOfId,
        String reason,
        BigDecimal settledAmount,
        BigDecimal reversedAmount,
        BigDecimal remainingAmount,
        BigDecimal cashAmount,
        BigDecimal cashDelta
) {
    public TransactionResponseDTO(Transaction t) {
        this(t, BigDecimal.ZERO, BigDecimal.ZERO);
    }
    public TransactionResponseDTO(Transaction t,BigDecimal settled,BigDecimal reversed) {
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
                t.getLegacyCreatedAtRaw() == null ? t.getCreatedAt() : t.getLegacyCreatedAtRaw(),
                t.getRealizationOfId(),t.getReason(),settled,reversed,
                t.getStatus() == TransactionStatus.FULFILLED || t.getStatus() == TransactionStatus.CANCELLED || t.getStatus() == TransactionStatus.REVERSED
                    ? BigDecimal.ZERO : t.getAmount().subtract(t.isRealized()?reversed:settled),
                cashAmount(t), cashDelta(t)
        );
    }

    // Gross amount remains the historical/managerial fact. Cash is a separate effect.
    private static BigDecimal cashAmount(Transaction t) {
        if (!t.isRealized() || t.getOrigin() == TransactionOrigin.ACCOUNT_OPENING) return BigDecimal.ZERO;
        return t.getCashAmount() == null ? t.getAmount() : t.getCashAmount();
    }

    private static BigDecimal cashDelta(Transaction t) {
        BigDecimal amount = cashAmount(t);
        if (amount.signum() == 0) return amount;
        boolean inbound;
        if (t.getType() == TransactionType.TRANSFER) {
            if (t.getTransferDirection() == null) return null;
            inbound = t.getTransferDirection() == TransferDirection.INBOUND;
        } else inbound = t.getType() == TransactionType.INCOME;
        if (t.getOrigin() == TransactionOrigin.REVERSAL) inbound = !inbound;
        return inbound ? amount : amount.negate();
    }
}
