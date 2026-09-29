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

    @Column(name = "operation_date")
    private java.time.LocalDate operationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "date_origin")
    private com.controlefinanceiro.api.domain.temporal.DateOrigin dateOrigin;

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 38, scale = 8)
    private BigDecimal price;

    @Column(name = "total_value", nullable = false)
    private BigDecimal totalValue;

    private BigDecimal fees = BigDecimal.ZERO;

    @Column(name = "cost_delta", precision = 38, scale = 2)
    private BigDecimal costDelta;

    @Column(name = "realized_result", precision = 38, scale = 2)
    private BigDecimal realizedResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id", nullable = false)
    private Investment investment;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_transaction_id")
    private Transaction bankTransaction;
}
