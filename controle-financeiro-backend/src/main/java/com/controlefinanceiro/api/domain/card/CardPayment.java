package com.controlefinanceiro.api.domain.card;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "card_payments")
@Getter @Setter
public class CardPayment {
    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "operation_id")
    private UUID operationId;
    @Column(length=64) private String requestFingerprint;

    @Column(name = "is_prepayment", nullable = false)
    private boolean prepayment;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "bank_transaction_id")
    private UUID bankTransactionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
