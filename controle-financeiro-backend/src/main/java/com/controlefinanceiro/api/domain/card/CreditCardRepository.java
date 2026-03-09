package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {
    List<CreditCard> findAllByUserIdOrderByOrderIndexAsc(UUID userId);
}