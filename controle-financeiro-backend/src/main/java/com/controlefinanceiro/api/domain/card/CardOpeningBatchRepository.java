package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CardOpeningBatchRepository extends JpaRepository<CardOpeningBatch, UUID> {
    boolean existsByCardId(UUID cardId);
}
