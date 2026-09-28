package com.controlefinanceiro.api.domain.card;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "card_opening_batches")
@Getter @Setter
public class CardOpeningBatch {
    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private CreditCard card;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
