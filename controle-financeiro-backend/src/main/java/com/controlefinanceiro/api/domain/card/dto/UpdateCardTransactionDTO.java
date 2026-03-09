package com.controlefinanceiro.api.domain.card.dto;

import java.util.UUID;

public record UpdateCardTransactionDTO(
        String description,
        UUID categoryId
) {}