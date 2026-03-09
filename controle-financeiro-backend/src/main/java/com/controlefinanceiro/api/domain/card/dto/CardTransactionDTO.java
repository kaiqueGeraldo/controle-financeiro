package com.controlefinanceiro.api.domain.card.dto;

import java.util.UUID;

public record CardTransactionDTO(UUID id, String description, java.math.BigDecimal amount, java.time.LocalDate date,
                                 String categoryName, String categoryColor) {
}