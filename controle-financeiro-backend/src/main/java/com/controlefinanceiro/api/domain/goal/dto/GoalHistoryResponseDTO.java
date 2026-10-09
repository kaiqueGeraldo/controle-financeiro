package com.controlefinanceiro.api.domain.goal.dto;

import com.controlefinanceiro.api.domain.goal.EvolutionProtocol;
import com.controlefinanceiro.api.domain.goal.GoalHistory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/** The compatibility date is an instant only when recordedAt proves its origin. */
public record GoalHistoryResponseDTO(UUID id, String date, Instant recordedAt,
        String dateOrigin, String legacyDateRaw, BigDecimal amount, String note,
        UUID allocationId, EvolutionProtocol protocol) {
    public GoalHistoryResponseDTO(GoalHistory history) {
        this(history.getId(), history.getRecordedAt() != null ? history.getRecordedAt().toString() : raw(history),
                history.getRecordedAt(), history.getRecordedAt() != null ? "SERVER_CLOCK" : "UNKNOWN",
                raw(history), history.getAmount(), history.getNote(), history.getAllocationId(), history.getProtocol());
    }

    private static String raw(GoalHistory history) {
        return history.getDate() == null ? null : history.getDate().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
