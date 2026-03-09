package com.controlefinanceiro.api.domain.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MonthlyPlanRepository extends JpaRepository<MonthlyPlan, UUID> {
    Optional<MonthlyPlan> findByUserIdAndMonthAndYear(UUID userId, Integer month, Integer year);

    @Query("SELECT DISTINCT m FROM MonthlyPlan m LEFT JOIN FETCH m.items i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.card WHERE m.user.id = :userId AND m.month = :month AND m.year = :year")
    Optional<MonthlyPlan> findByUserIdAndMonthAndYearWithDetails(@Param("userId") UUID userId, @Param("month") Integer month, @Param("year") Integer year);
}