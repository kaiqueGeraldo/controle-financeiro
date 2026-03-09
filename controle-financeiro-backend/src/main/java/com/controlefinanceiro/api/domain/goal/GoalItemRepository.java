package com.controlefinanceiro.api.domain.goal;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface GoalItemRepository extends JpaRepository<GoalItem, UUID> {
}