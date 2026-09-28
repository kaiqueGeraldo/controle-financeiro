package com.controlefinanceiro.api.domain.card;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "card_payment_allocations")
@Getter @Setter
public class CardPaymentAllocation {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(name = "card_transaction_id", nullable = false)
    private UUID cardTransactionId;

    @Column(nullable = false)
    private BigDecimal amount;
}
