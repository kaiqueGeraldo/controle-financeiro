package com.controlefinanceiro.api.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GoalItemRepository extends JpaRepository<GoalItem, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT i FROM GoalItem i JOIN FETCH i.goal g WHERE g.user.id = :userId ORDER BY i.orderIndex, i.id")
    java.util.List<GoalItem> findAllOwned(UUID userId);
}
