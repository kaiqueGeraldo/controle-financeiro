package com.controlefinanceiro.api.domain.goal.dto;
import com.controlefinanceiro.api.domain.goal.GoalPurchase;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record GoalPurchaseResponseDTO(UUID itemId, String name, BigDecimal amount,
        UUID bankTransactionId, UUID cardTransactionId, Instant recordedAt, Instant refundedAt) {
    public GoalPurchaseResponseDTO(GoalPurchase p) {
        this(p.getItemId(), p.getName(), p.getAmount(), p.getBankTransactionId(),
                p.getCardTransactionId(), p.getRecordedAt(), p.getRefundedAt());
    }
}
