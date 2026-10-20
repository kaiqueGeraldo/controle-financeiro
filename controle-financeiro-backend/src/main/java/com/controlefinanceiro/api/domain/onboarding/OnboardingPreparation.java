package com.controlefinanceiro.api.domain.onboarding;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="onboarding_preparations") @Getter @Setter
public class OnboardingPreparation {
    @Id private UUID operationId;
    @Column(nullable=false) private UUID sessionId;
    @Column(nullable=false) private UUID userId;
    @Column(nullable=false) private long draftVersion;
    @Column(nullable=false,length=16) private String state;
    @Column(nullable=false,length=64) private String contentHash;
    @Column(nullable=false,columnDefinition="text") private String preparedJson;
    @Column(nullable=false) private Instant preparedAt;
    private Long cancelledVersion;
}
