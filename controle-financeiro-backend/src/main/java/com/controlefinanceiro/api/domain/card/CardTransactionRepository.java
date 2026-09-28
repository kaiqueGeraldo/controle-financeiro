package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CardTransactionRepository extends JpaRepository<CardTransaction, UUID> {
    List<CardTransaction> findByInvoiceIdOrderByDateDescCreatedAtDesc(UUID invoiceId);

    List<CardTransaction> findAllByPurchaseId(UUID purchaseId);
    @Query("SELECT c.invoice.card.id FROM CardTransaction c WHERE c.id = :transactionId")
    java.util.Optional<UUID> findCardIdByTransactionId(@Param("transactionId") UUID transactionId);

    @Query("SELECT c FROM CardTransaction c JOIN FETCH c.invoice WHERE c.purchaseId = :purchaseId ORDER BY c.installment DESC, c.id DESC")
    List<CardTransaction> findPurchaseInstallments(@Param("purchaseId") UUID purchaseId);

    boolean existsByInvoiceCardId(UUID cardId);

    @Query("""
            SELECT c FROM CardTransaction c JOIN FETCH c.invoice i
            WHERE i.card.id = :cardId AND ((i.year = :year AND i.month = :month)
                OR (:includeRolled = true AND (i.year < :year OR (i.year = :year AND i.month < :month))
                    AND i.status = com.controlefinanceiro.api.domain.card.InvoiceStatus.ROLLED))
              AND c.amount > 0 AND c.paidAmount + c.refundedAmount < c.amount
              AND (c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN
                   OR i.status <> com.controlefinanceiro.api.domain.card.InvoiceStatus.PAID)
            ORDER BY i.year, i.month, COALESCE(c.installment, 0), c.id
            """)
    List<CardTransaction> findOutstandingUpTo(@Param("cardId") UUID cardId,
                                                @Param("month") int month, @Param("year") int year,
                                                @Param("includeRolled") boolean includeRolled);

    @Query("""
            SELECT COALESCE(SUM(c.amount - c.paidAmount - c.refundedAmount), 0)
            FROM CardTransaction c JOIN c.invoice i WHERE i.id = :invoiceId AND c.amount > 0
              AND (c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN
                   OR i.status <> com.controlefinanceiro.api.domain.card.InvoiceStatus.PAID)
            """)
    BigDecimal sumOutstandingByInvoiceId(@Param("invoiceId") UUID invoiceId);

    @Query("""
            SELECT COALESCE(SUM(c.amount - c.paidAmount - c.refundedAmount), 0)
            FROM CardTransaction c JOIN c.invoice i WHERE i.card.id = :cardId AND c.amount > 0
              AND (c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN
                   OR i.status <> com.controlefinanceiro.api.domain.card.InvoiceStatus.PAID)
            """)
    BigDecimal sumOutstandingByCardId(@Param("cardId") UUID cardId);

    @Query("""
            SELECT COALESCE(SUM(c.amount - c.paidAmount - c.refundedAmount), 0)
            FROM CardTransaction c JOIN c.invoice i
            WHERE i.card.id = :cardId AND ((i.year = :year AND i.month = :month)
                OR (:includeRolled = true AND (i.year < :year OR (i.year = :year AND i.month < :month))
                    AND i.status = com.controlefinanceiro.api.domain.card.InvoiceStatus.ROLLED))
              AND c.amount > 0
              AND (c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN
                   OR i.status <> com.controlefinanceiro.api.domain.card.InvoiceStatus.PAID)
            """)
    BigDecimal sumOutstandingUpTo(@Param("cardId") UUID cardId,
                                   @Param("month") int month, @Param("year") int year,
                                   @Param("includeRolled") boolean includeRolled);

    @Query("""
            SELECT i.card.id, i.month, i.year, i.status, SUM(c.amount - c.paidAmount - c.refundedAmount)
            FROM CardTransaction c JOIN c.invoice i
            WHERE i.card.id IN :cardIds AND c.amount > 0
              AND (c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN
                   OR i.status <> com.controlefinanceiro.api.domain.card.InvoiceStatus.PAID)
            GROUP BY i.card.id, i.month, i.year, i.status
            """)
    List<Object[]> outstandingByCardPeriod(@Param("cardIds") List<UUID> cardIds);

    @Query("""
            SELECT COUNT(c) FROM CardTransaction c JOIN c.invoice i
            WHERE i.card.id = :cardId AND ((i.year = :year AND i.month = :month)
                OR (:includeRolled = true AND (i.year < :year OR (i.year = :year AND i.month < :month))
                    AND i.status = com.controlefinanceiro.api.domain.card.InvoiceStatus.ROLLED))
              AND c.amount < 0
            """)
    long countLegacyAdjustmentsUpTo(@Param("cardId") UUID cardId,
                                     @Param("month") int month, @Param("year") int year,
                                     @Param("includeRolled") boolean includeRolled);

    // Total gasto em cartões no ano
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c JOIN c.invoice i WHERE i.card.user.id = :userId AND c.origin <> com.controlefinanceiro.api.domain.card.CardTransactionOrigin.OPENING AND ((c.origin = com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN AND i.year = :year) OR (c.origin = com.controlefinanceiro.api.domain.card.CardTransactionOrigin.PURCHASE AND EXTRACT(YEAR FROM c.date) = :year))")
    BigDecimal sumByYear(@Param("userId") UUID userId, @Param("year") Integer year);

    // Total gasto em uma categoria específica no ano (ex: Assinaturas)
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c JOIN c.invoice i JOIN c.category cat WHERE i.card.user.id = :userId AND cat.name = :categoryName AND ((c.origin = com.controlefinanceiro.api.domain.card.CardTransactionOrigin.LEGACY_UNKNOWN AND i.year = :year) OR (c.origin = com.controlefinanceiro.api.domain.card.CardTransactionOrigin.PURCHASE AND EXTRACT(YEAR FROM c.date) = :year))")
    BigDecimal sumByCategoryAndYear(@Param("userId") UUID userId, @Param("year") Integer year, @Param("categoryName") String categoryName);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c WHERE c.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT c FROM CardTransaction c LEFT JOIN FETCH c.category WHERE c.invoice.id = :invoiceId ORDER BY c.date DESC, CASE WHEN c.time IS NULL THEN 1 ELSE 0 END, c.time DESC, c.id DESC")
    List<CardTransaction> findByInvoiceIdWithDetails(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT c.invoice.id, COALESCE(SUM(c.amount), 0) FROM CardTransaction c WHERE c.invoice.id IN :invoiceIds GROUP BY c.invoice.id")
    List<Object[]> sumAmountsByInvoiceIds(@Param("invoiceIds") List<UUID> invoiceIds);
}
