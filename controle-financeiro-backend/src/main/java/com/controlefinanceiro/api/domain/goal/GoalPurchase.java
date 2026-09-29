package com.controlefinanceiro.api.domain.goal;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Financial fact independent of the lifetime of checklist intentions. */
@Entity @Table(name = "goal_purchases") @Getter @Setter @NoArgsConstructor
public class GoalPurchase {
    @Id private UUID itemId;
    @Column(nullable = false) private UUID userId;
    @Column(nullable = false) private String name;
    @Column(nullable = false, precision = 38, scale = 2) private BigDecimal amount;
    private UUID bankTransactionId;
    private UUID cardTransactionId;
    private Instant recordedAt;
    private Instant refundedAt;
}
