package com.controlefinanceiro.api.domain.card;

import jakarta.persistence.*;
import com.controlefinanceiro.api.domain.category.Category;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "card_refunds")
@Getter @Setter
public class CardRefund {
    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private CreditCard card;

    @Column(name = "purchase_id", nullable = false)
    private UUID purchaseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "operation_id")
    private UUID operationId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "credit_created", nullable = false)
    private BigDecimal creditCreated;

    @Column(name = "refund_date", nullable = false)
    private LocalDate refundDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
