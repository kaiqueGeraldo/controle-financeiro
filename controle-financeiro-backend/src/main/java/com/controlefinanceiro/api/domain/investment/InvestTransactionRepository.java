package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface InvestTransactionRepository extends JpaRepository<InvestTransaction, UUID> {
    boolean existsByInvestmentId(UUID investmentId);
    @org.springframework.data.jpa.repository.Query("SELECT t FROM InvestTransaction t WHERE t.investment.id = :investmentId " +
            "ORDER BY CASE WHEN t.dateOrigin IS NULL THEN 1 ELSE 0 END, t.operationDate DESC, t.id DESC")
    List<InvestTransaction> findHistory(UUID investmentId);
}
