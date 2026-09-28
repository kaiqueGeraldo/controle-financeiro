package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findByCardIdAndMonthAndYear(UUID cardId, Integer month, Integer year);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdForUpdate(@Param("id") UUID id);
    List<Invoice> findByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.card.id IN :cardIds AND i.status = :status")
    List<Invoice> findByCardIdsAndStatus(@Param("cardIds") List<UUID> cardIds,
                                          @Param("status") InvoiceStatus status);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.card c JOIN FETCH c.user WHERE i.status = :status")
    List<Invoice> findByStatusWithCardAndUser(@Param("status") InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.card.id IN :cardIds AND ((i.year = :currentYear AND i.month = :currentMonth) OR (i.year = :nextYear AND i.month = :nextMonth))")
    List<Invoice> findRecentInvoicesForCards(
            @Param("cardIds") List<UUID> cardIds,
            @Param("currentMonth") Integer currentMonth,
            @Param("currentYear") Integer currentYear,
            @Param("nextMonth") Integer nextMonth,
            @Param("nextYear") Integer nextYear
    );
}
