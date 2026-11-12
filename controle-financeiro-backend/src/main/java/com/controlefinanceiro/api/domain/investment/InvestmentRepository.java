package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InvestmentRepository extends JpaRepository<Investment, UUID> {
    boolean existsByIdAndUserId(UUID id,UUID userId);

    List<Investment> findAllByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Investment i WHERE i.id = :id AND i.user.id = :userId")
    java.util.Optional<Investment> findOwnedForAllocation(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(i.valuationAmount), 0) FROM Investment i WHERE i.goal.id = :goalId")
    BigDecimal sumValueByGoalId(@Param("goalId") UUID goalId);

    @Query("""
            SELECT UPPER(TRIM(i.ticker)) AS ticker, i.user.id AS ownerId, i.id AS investmentId
            FROM Investment i
            WHERE UPPER(TRIM(i.ticker)) IN :tickers AND i.type IN :types AND i.positionMode = 'UNIT'
            ORDER BY i.user.id, i.id
            """)
    List<QuotePosition> findQuotePositions(@Param("tickers") Collection<String> tickers,
                                           @Param("types") List<InvestType> types);

    interface QuotePosition {
        String getTicker();
        UUID getOwnerId();
        UUID getInvestmentId();
    }

    @Query("SELECT i FROM Investment i LEFT JOIN FETCH i.goal WHERE i.user.id = :userId")
    List<Investment> findAllByUserIdWithGoal(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(i.valuationAmount), 0) FROM Investment i WHERE i.user.id = :userId")
    BigDecimal sumTotalValueByUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT i.ticker FROM Investment i WHERE i.type IN :types AND i.ticker IS NOT NULL AND TRIM(i.ticker) <> '' AND i.positionMode = 'UNIT'")
    List<String> findDistinctTickersByTypes(@Param("types") List<InvestType> types);
}
