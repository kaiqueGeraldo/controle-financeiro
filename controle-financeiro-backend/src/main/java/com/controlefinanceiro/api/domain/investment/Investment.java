package com.controlefinanceiro.api.domain.investment;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "investments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Investment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestType type;

    @Column(nullable = false)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "average_price", nullable = false)
    private BigDecimal averagePrice = BigDecimal.ZERO;

    @Column(name = "current_price", nullable = false)
    private BigDecimal currentPrice = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version;

    // Helper para calcular saldo total atual
    public BigDecimal getTotalValue() {
        return quantity.multiply(currentPrice);
    }

    // Helper para calcular custo total (lucro/prejuízo)
    public BigDecimal getTotalCost() {
        return quantity.multiply(averagePrice);
    }
}