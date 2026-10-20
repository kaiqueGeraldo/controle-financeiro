package com.controlefinanceiro.api.domain.onboarding;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="onboarding_default_accounts")
public class OnboardingDefaultAccount {
    @Id private UUID userId;
    @Column(nullable=false,unique=true) private UUID accountId;
    @Column(nullable=false) private Instant recordedAt;
}
