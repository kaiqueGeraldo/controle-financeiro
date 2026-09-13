package com.controlefinanceiro.api.domain.card.dto;

import java.util.UUID;

public record CardTransactionDTO(UUID id, String description, java.math.BigDecimal amount, java.time.LocalDate date,
                                 String categoryName, String categoryColor,
                                 java.time.LocalTime time, String timeOrigin, java.time.Instant recordedAt,
                                 java.time.LocalDateTime legacyCreatedAtRaw) {

    public CardTransactionDTO(com.controlefinanceiro.api.domain.card.CardTransaction t) {
        this(t.getId(), t.getDescription(), t.getAmount(), t.getDate(),
                t.getCategory() == null ? "Geral" : t.getCategory().getName(),
                t.getCategory() == null ? null : t.getCategory().getColor(), t.getTime(),
                t.getTimeOrigin() == null ? "UNKNOWN" : t.getTimeOrigin().name(), t.getRecordedAt(),
                t.getLegacyCreatedAtRaw() == null ? t.getCreatedAt() : t.getLegacyCreatedAtRaw());
    }
}
