package com.controlefinanceiro.api.domain.onboarding;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="onboarding_reservation_history")
public class ReservationDeclarationHistory {
    @Id private UUID id;
    @Column(nullable=false) private UUID reservationId;
    @Column(nullable=false) private UUID userId;
    @Column(nullable=false) private long revision;
    @Column(nullable=false,columnDefinition="text") private String previousJson;
    @Column(nullable=false,columnDefinition="text") private String declarationJson;
    @Column(nullable=false) private Instant recordedAt;
}
