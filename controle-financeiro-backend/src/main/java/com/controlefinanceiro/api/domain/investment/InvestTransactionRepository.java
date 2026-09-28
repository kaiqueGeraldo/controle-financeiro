package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface InvestTransactionRepository extends JpaRepository<InvestTransaction, UUID> {
    boolean existsByInvestmentId(UUID investmentId);
    @org.springframework.data.jpa.repository.Query("SELECT t FROM InvestTransaction t WHERE t.investment.id = :investmentId " +
            "ORDER BY CASE WHEN t.dateOrigin IS NULL THEN 1 ELSE 0 END, t.operationDate DESC, t.id DESC")
    List<InvestTransaction> findHistory(UUID investmentId);

    @Query("SELECT COALESCE(SUM(t.realizedResult), 0) FROM InvestTransaction t "
            + "WHERE t.investment.user.id = :userId AND t.type = com.controlefinanceiro.api.domain.investment.InvestTransType.SELL "
            + "AND t.operationDate BETWEEN :startDate AND :endDate")
    BigDecimal sumRealizedResultByPeriod(@Param("userId") UUID userId,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(t) FROM InvestTransaction t WHERE t.investment.user.id = :userId "
            + "AND t.type = com.controlefinanceiro.api.domain.investment.InvestTransType.SELL "
            + "AND t.operationDate BETWEEN :startDate AND :endDate AND t.realizedResult IS NULL")
    long countUnknownResultsByPeriod(@Param("userId") UUID userId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);
}
