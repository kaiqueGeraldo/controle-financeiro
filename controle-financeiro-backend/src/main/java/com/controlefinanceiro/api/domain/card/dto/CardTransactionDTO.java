package com.controlefinanceiro.api.domain.card.dto;
import com.controlefinanceiro.api.domain.card.CardTransactionOrigin;

import java.util.UUID;

public record CardTransactionDTO(UUID id, String description, java.math.BigDecimal amount, java.time.LocalDate date,
                                 String categoryName, String categoryColor,
                                 java.time.LocalTime time, String timeOrigin, java.time.Instant recordedAt,
                                 java.time.LocalDateTime legacyCreatedAtRaw,
                                 java.math.BigDecimal paidAmount, java.math.BigDecimal refundedAmount,
                                 java.math.BigDecimal remainingAmount,
                                 Integer installment, Integer totalInstallments) {

    public CardTransactionDTO(com.controlefinanceiro.api.domain.card.CardTransaction t) {
        this(t.getId(), t.getDescription(), t.getAmount(), t.getDate(),
                t.getCategory() == null ? "Geral" : t.getCategory().getName(),
                t.getCategory() == null ? null : t.getCategory().getColor(), t.getTime(),
                t.getTimeOrigin() == null ? "UNKNOWN" : t.getTimeOrigin().name(), t.getRecordedAt(),
                t.getLegacyCreatedAtRaw() == null ? t.getCreatedAt() : t.getLegacyCreatedAtRaw(),
                t.getPaidAmount(), t.getRefundedAmount(),
                t.getOrigin() == CardTransactionOrigin.LEGACY_UNKNOWN ? null
                        : t.getAmount().subtract(t.getPaidAmount()).subtract(t.getRefundedAmount()),
                t.getInstallment(), t.getTotalInstallments());
    }
}
