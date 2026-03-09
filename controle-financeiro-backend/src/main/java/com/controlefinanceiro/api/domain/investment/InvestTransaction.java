package com.controlefinanceiro.api.domain.investment;

import com.controlefinanceiro.api.domain.transaction.Transaction;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "invest_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class InvestTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestTransType type;

    @Column(nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "total_value", nullable = false)
    private BigDecimal totalValue;

    private BigDecimal fees = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id", nullable = false)
    private Investment investment;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_transaction_id")
    private Transaction bankTransaction;
}