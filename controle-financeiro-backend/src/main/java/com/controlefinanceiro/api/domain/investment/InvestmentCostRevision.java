package com.controlefinanceiro.api.domain.investment;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.UUID;

@Entity @Table(name="investment_cost_revisions") @Getter @Setter
public class InvestmentCostRevision {
    @Id private UUID id=UUID.randomUUID();
    @Column(nullable=false) private UUID correctionId;
    @Column(nullable=false) private UUID transactionId;
    @Column(precision=38,scale=2) private BigDecimal costDelta;
    @Column(precision=38,scale=2) private BigDecimal realizedResult;
}
