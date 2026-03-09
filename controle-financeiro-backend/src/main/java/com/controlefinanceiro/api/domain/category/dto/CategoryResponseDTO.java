package com.controlefinanceiro.api.domain.category.dto;

import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import java.util.UUID;

public record CategoryResponseDTO(
        UUID id,
        String name,
        String icon,
        String color,
        TransactionType type
) {
    public CategoryResponseDTO(Category c) {
        this(c.getId(), c.getName(), c.getIcon(), c.getColor(), c.getType());
    }
}