package com.controlefinanceiro.api.domain.investment;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
@Entity @Table(name="investment_valuations") @Getter @Setter @NoArgsConstructor
public class InvestmentValuation {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(nullable=false) private UUID investmentId;
    @Column(nullable=false,precision=38,scale=2) private BigDecimal amount;
    @Column(nullable=false) private LocalDate valuationDate;
    @Column(nullable=false) private String source;
    @Column(nullable=false,length=500) private String reason;
    @Column(nullable=false) private Instant recordedAt;
}
