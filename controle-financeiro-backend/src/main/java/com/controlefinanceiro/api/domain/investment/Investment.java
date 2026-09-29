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

    @Column(name = "average_price", nullable = false, precision = 38, scale = 8)
    private BigDecimal averagePrice = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 38, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "current_price", precision = 38, scale = 8)
    private BigDecimal currentPrice;

    @Column(name = "valuation_amount", precision = 38, scale = 2)
    private BigDecimal valuationAmount;

    @Column(name = "valuation_date")
    private LocalDate valuationDate;

    @Column(name = "valuation_source")
    private String valuationSource;

    @Enumerated(EnumType.STRING)
    private ValuationBasis valuationBasis;
    @Column(precision = 38, scale = 2)
    private BigDecimal valuationReferenceAmount;
    @Column(precision = 20, scale = 8)
    private BigDecimal valuationReferenceQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version;

    @Column(precision=20,scale=8) private BigDecimal replayQuantity;
    @Column(precision=38,scale=2) private BigDecimal replayCost;
    @Column(nullable=false) private long operationSequence;

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
        valuationBasis = ValuationBasis.PRICE;
        currentPrice = price;
        valuationReferenceAmount = null;
        valuationReferenceQuantity = null;
        valuationAmount = valueForQuantity(quantity);
        valuationDate = date;
        valuationSource = source;
    }

    public void resizeValuation() {
        valuationAmount = valueForQuantity(quantity);
    }

    public void evaluateTotal(BigDecimal total, LocalDate date, String source) {
        valuationBasis = ValuationBasis.TOTAL;
        valuationAmount = total;
        valuationReferenceAmount = total;
        valuationReferenceQuantity = quantity;
        valuationDate = date;
        valuationSource = source;
        currentPrice = quantity.signum() == 0 ? null : total.divide(quantity, 8, RoundingMode.HALF_UP);
    }

    public BigDecimal valueForQuantity(BigDecimal units) {
        if (units.signum() == 0) return BigDecimal.ZERO.setScale(2);
        BigDecimal value;
        if (valuationBasis == ValuationBasis.TOTAL && valuationReferenceQuantity != null
                && valuationReferenceQuantity.signum() > 0) {
            value = valuationReferenceAmount.multiply(units).divide(valuationReferenceQuantity, 2, RoundingMode.HALF_UP);
        } else {
            value = currentPrice == null ? null : units.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);
        }
        if (value != null && value.precision() - value.scale() > 12)
            throw new com.controlefinanceiro.api.service.exception.BusinessRuleException("Avaliação fora da faixa monetária.");
        return value;
    }
}
