package com.controlefinanceiro.api.domain.investment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name="investment_corrections") @Getter @Setter
public class InvestmentCorrection {
    @Id private UUID id = UUID.randomUUID();
    @Column(nullable=false) private UUID investmentId;
    @Column(nullable=false,unique=true) private UUID originalId;
    @Column(nullable=false,unique=true) private UUID operationId;
    @Column(nullable=false) private UUID accountId;
    @Column(nullable=false) private LocalDate effectiveDate;
    @Column(nullable=false,length=500) private String reason;
    @Column(nullable=false,precision=38,scale=2) private BigDecimal returnedFees;
    @Column(precision=20,scale=8) private BigDecimal replacementQuantity;
    @Column(precision=38,scale=8) private BigDecimal replacementPrice;
    private BigDecimal replacementFees;
    @Column(nullable=false,precision=38,scale=2) private BigDecimal cashDelta;
    @Column(nullable=false,precision=38,scale=2) private BigDecimal realizedDelta;
    @Column(nullable=false) private Instant recordedAt;
}
