package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CreditCard c where c.id = :id and c.user.id = :userId")
    Optional<CreditCard> findOwnedForPayment(@Param("id") UUID id, @Param("userId") UUID userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CreditCard c where c.id = :id")
    Optional<CreditCard> findByIdForUpdate(@Param("id") UUID id);
    List<CreditCard> findAllByUserIdOrderByOrderIndexAsc(UUID userId);
}
