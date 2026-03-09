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

    // Total gasto em cartões no ano
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c JOIN c.invoice i WHERE i.card.user.id = :userId AND i.year = :year")
    BigDecimal sumByYear(@Param("userId") UUID userId, @Param("year") Integer year);

    // Total gasto em uma categoria específica no ano (ex: Assinaturas)
    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c JOIN c.invoice i JOIN c.category cat WHERE i.card.user.id = :userId AND i.year = :year AND cat.name = :categoryName")
    BigDecimal sumByCategoryAndYear(@Param("userId") UUID userId, @Param("year") Integer year, @Param("categoryName") String categoryName);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CardTransaction c WHERE c.invoice.id = :invoiceId")
    BigDecimal sumAmountByInvoiceId(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT c FROM CardTransaction c LEFT JOIN FETCH c.category WHERE c.invoice.id = :invoiceId ORDER BY c.date DESC, c.createdAt DESC")
    List<CardTransaction> findByInvoiceIdWithDetails(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT c.invoice.id, COALESCE(SUM(c.amount), 0) FROM CardTransaction c WHERE c.invoice.id IN :invoiceIds GROUP BY c.invoice.id")
    List<Object[]> sumAmountsByInvoiceIds(@Param("invoiceIds") List<UUID> invoiceIds);
}