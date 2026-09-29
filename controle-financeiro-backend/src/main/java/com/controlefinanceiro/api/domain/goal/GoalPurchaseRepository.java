package com.controlefinanceiro.api.domain.goal;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.*;

public interface GoalPurchaseRepository extends JpaRepository<GoalPurchase, UUID> {
    List<GoalPurchase> findAllByUserIdOrderByRecordedAtDesc(UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM GoalPurchase p WHERE p.itemId = :id AND p.userId = :userId")
    Optional<GoalPurchase> findOwnedForRefund(UUID id, UUID userId);
}
