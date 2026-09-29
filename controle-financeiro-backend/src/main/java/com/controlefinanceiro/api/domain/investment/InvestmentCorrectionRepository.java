package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface InvestmentCorrectionRepository extends JpaRepository<InvestmentCorrection,UUID> {
    List<InvestmentCorrection> findByInvestmentIdOrderByRecordedAt(UUID investmentId);
    Optional<InvestmentCorrection> findByOperationId(UUID operationId);
    @Query("SELECT COALESCE(SUM(c.realizedDelta),0) FROM InvestmentCorrection c, Investment i "
        + "WHERE c.investmentId=i.id AND i.user.id=:userId AND c.effectiveDate BETWEEN :startDate AND :endDate")
    BigDecimal sumResult(UUID userId, LocalDate startDate, LocalDate endDate);
}
