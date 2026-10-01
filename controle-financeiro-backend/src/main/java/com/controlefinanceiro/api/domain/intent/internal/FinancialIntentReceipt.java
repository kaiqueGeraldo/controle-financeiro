package com.controlefinanceiro.api.domain.intent.internal;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.UUID;

/** Immutable response to a committed creation intent, separate from mutable ledger projections. */
@Entity
@Table(name = "financial_intent_receipts")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class FinancialIntentReceipt {
    @Id private UUID id;
    @Column(nullable = false, updatable = false) private UUID userId;
    @Column(nullable = false, updatable = false, length = 32) private String kind;
    @Column(nullable = false, updatable = false, length = 64) private String fingerprint;
    @Column(nullable = false, updatable = false, columnDefinition = "text") private String resultJson;
    @Column(nullable = false, updatable = false) private Instant recordedAt;

    public FinancialIntentReceipt(UUID id, UUID userId, String kind, String fingerprint, String resultJson, Instant recordedAt) {
        this.id=id; this.userId=userId; this.kind=kind; this.fingerprint=fingerprint;
        this.resultJson=resultJson; this.recordedAt=recordedAt;
    }
}
