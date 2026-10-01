package com.controlefinanceiro.api.domain.intent.internal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface FinancialIntentReceiptRepository extends JpaRepository<FinancialIntentReceipt, UUID> {
    Optional<FinancialIntentReceipt> findByIdAndUserId(UUID id, UUID userId);
}
