package com.controlefinanceiro.api.domain.habit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HabitLogRepository extends JpaRepository<HabitLog, UUID> {
    Optional<HabitLog> findByHabitIdAndDate(UUID habitId, LocalDate date);
    List<HabitLog> findAllByHabitIdAndDateBetween(UUID habitId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT l FROM HabitLog l WHERE l.habit.id IN :habitIds AND l.date IN (:yesterday, :dayBefore)")
    List<HabitLog> findLogsForHabitsInDates(@Param("habitIds") List<UUID> habitIds, @Param("yesterday") LocalDate yesterday, @Param("dayBefore") LocalDate dayBefore);

    @Query("SELECT COUNT(l) FROM HabitLog l WHERE l.habit.id = :habitId AND l.status = 'COMPLETED' AND l.date >= :startDate AND l.date <= :endDate")
    long countCompletedLogsBetween(@Param("habitId") UUID habitId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}