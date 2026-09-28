package com.controlefinanceiro.api.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalAllocationRepository extends JpaRepository<GoalAllocation, UUID> {
    Optional<GoalAllocation> findByGoalIdAndAccountId(UUID goalId, UUID accountId);
    Optional<GoalAllocation> findByGoalIdAndInvestmentId(UUID goalId, UUID investmentId);
    List<GoalAllocation> findAllByGoalId(UUID goalId);

    @Query("SELECT a FROM GoalAllocation a JOIN FETCH a.goal g LEFT JOIN FETCH a.account "
            + "LEFT JOIN FETCH a.investment WHERE g.user.id = :userId")
    List<GoalAllocation> findAllOwnedWithSources(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM GoalAllocation a WHERE a.account.id = :id")
    BigDecimal sumByAccountId(@Param("id") UUID id);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM GoalAllocation a WHERE a.investment.id = :id")
    BigDecimal sumByInvestmentId(@Param("id") UUID id);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM GoalAllocation a WHERE a.goal.id = :id")
    BigDecimal sumByGoalId(@Param("id") UUID id);
}
