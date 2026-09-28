package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface CardRefundRepository extends JpaRepository<CardRefund, UUID> {
    boolean existsByOperationId(UUID operationId);
    boolean existsByCardId(UUID cardId);
    boolean existsByCardIdAndPurchaseIdAndAmountAndRefundDateAndOperationIdIsNull(
            UUID cardId, UUID purchaseId, BigDecimal amount, LocalDate refundDate);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM CardRefund r WHERE r.card.id = :cardId AND r.purchaseId = :purchaseId")
    BigDecimal sumByPurchase(@Param("cardId") UUID cardId, @Param("purchaseId") UUID purchaseId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM CardRefund r WHERE r.card.user.id = :userId AND EXTRACT(YEAR FROM r.refundDate) = :year")
    BigDecimal sumByYear(@Param("userId") UUID userId, @Param("year") int year);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM CardRefund r WHERE r.card.user.id = :userId AND EXTRACT(YEAR FROM r.refundDate) = :year AND r.category.name = :categoryName")
    BigDecimal sumByCategoryAndYear(@Param("userId") UUID userId,
                                     @Param("year") int year, @Param("categoryName") String categoryName);
}
