package com.controlefinanceiro.api.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface GoalHistoryRepository extends JpaRepository<GoalHistory, UUID> {
    List<GoalHistory> findByGoalIdOrderByDateDesc(UUID goalId);

    @Query("SELECT gh FROM GoalHistory gh WHERE gh.goal.id = :goalId AND gh.note = :note AND CAST(gh.date AS date) = :date")
    List<GoalHistory> findByGoalAndNoteAndDate(
            @Param("goalId") UUID goalId,
            @Param("note") String note,
            @Param("date") LocalDate date
    );
}