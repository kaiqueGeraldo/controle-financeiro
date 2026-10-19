package com.controlefinanceiro.api.domain.onboarding;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_sessions")
@Getter @Setter
public class OnboardingSession {
    @Id private UUID id;
    @Column(name = "user_id", nullable = false, unique = true) private UUID userId;
    // Explicit wire revision, serialized under the owner lock (not Hibernate's insert version zero).
    @Column(nullable = false) private long version;
    @Column(nullable = false, length = 20) private String status;
    @Column(columnDefinition = "text") private String payload;
    @Column(nullable = false, columnDefinition = "text") private String issues;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
}
