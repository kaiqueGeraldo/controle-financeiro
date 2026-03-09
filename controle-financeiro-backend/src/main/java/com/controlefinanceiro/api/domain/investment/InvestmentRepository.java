package com.controlefinanceiro.api.domain.investment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface InvestmentRepository extends JpaRepository<Investment, UUID> {

    List<Investment> findAllByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(i.quantity * i.currentPrice), 0) FROM Investment i WHERE i.goal.id = :goalId")
    BigDecimal sumValueByGoalId(@Param("goalId") UUID goalId);

    List<Investment> findAllByTicker(String ticker);

    @Query("SELECT i FROM Investment i LEFT JOIN FETCH i.goal WHERE i.user.id = :userId")
    List<Investment> findAllByUserIdWithGoal(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(i.quantity * i.currentPrice), 0) FROM Investment i WHERE i.user.id = :userId")
    BigDecimal sumTotalValueByUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT i.ticker FROM Investment i WHERE i.type IN :types")
    List<String> findDistinctTickersByTypes(@Param("types") List<InvestType> types);
}