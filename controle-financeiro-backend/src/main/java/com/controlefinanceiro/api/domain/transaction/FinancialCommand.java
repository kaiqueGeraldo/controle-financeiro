package com.controlefinanceiro.api.domain.transaction;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

/** Receipt for one financial intent. Original ledger rows remain immutable. */
@Entity @Table(name="financial_commands") @Getter @Setter @NoArgsConstructor
public class FinancialCommand {
    @Id private UUID id;
    @Column(nullable=false) private UUID userId;
    @Column(nullable=false) private UUID originalId;
    @Column(nullable=false, length=32) private String kind;
    @Column(nullable=false, length=64) private String fingerprint;
    @Column(nullable=false) private UUID transactionId;
    @Column(nullable=false) private Instant recordedAt;
}
