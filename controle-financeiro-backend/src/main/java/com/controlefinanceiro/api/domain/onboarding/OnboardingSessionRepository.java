package com.controlefinanceiro.api.domain.onboarding;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingSessionRepository extends JpaRepository<OnboardingSession, UUID> {
    Optional<OnboardingSession> findByUserId(UUID userId);
}
