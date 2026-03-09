package com.controlefinanceiro.api.domain.planning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanItemRepository extends JpaRepository<PlanItem, UUID> {
    Optional<PlanItem> findByPlanIdAndCardId(UUID planId, UUID cardId);

    @Query("SELECT p FROM PlanItem p WHERE p.plan.user.id = :userId AND p.dueDate = :targetDate AND p.status = 'PENDING'")
    List<PlanItem> findPendingByUserIdAndDate(@Param("userId") UUID userId, @Param("targetDate") java.time.LocalDate targetDate);

    List<PlanItem> findAllByCategoryId(UUID categoryId);

    @Modifying
    @Query("UPDATE PlanItem p SET p.status = 'PAID' WHERE p.card.id = :cardId AND p.plan.month = :month AND p.plan.year = :year")
    void markAsPaidByCardAndMonth(@Param("cardId") UUID cardId, @Param("month") int month, @Param("year") int year);
}