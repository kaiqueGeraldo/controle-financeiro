package com.controlefinanceiro.api.domain.investment;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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

    @Column(nullable = false, precision = 20, scale = 8)
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "average_price", nullable = false, precision = 20, scale = 8)
    private BigDecimal averagePrice = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 38, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "current_price", precision = 20, scale = 8)
    private BigDecimal currentPrice;

    @Column(name = "valuation_amount", precision = 38, scale = 2)
    private BigDecimal valuationAmount;

    @Column(name = "valuation_date")
    private LocalDate valuationDate;

    @Column(name = "valuation_source")
    private String valuationSource;

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
        return valuationAmount;
    }

    // Helper para calcular custo total (lucro/prejuízo)
    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
        this.averagePrice = totalCost == null || quantity.signum() == 0
                ? BigDecimal.ZERO : totalCost.divide(quantity, 8, RoundingMode.HALF_UP);
    }

    public void setQuantityAndCost(BigDecimal newQuantity, BigDecimal newCost) {
        quantity = newQuantity;
        setTotalCost(newCost);
    }

    public void evaluate(BigDecimal price, LocalDate date, String source) {
        currentPrice = price;
        valuationAmount = quantity.multiply(price).setScale(2, RoundingMode.HALF_UP);
        valuationDate = date;
        valuationSource = source;
    }

    public void resizeValuation() {
        if (currentPrice != null) {
            valuationAmount = quantity.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);
        }
    }
}
