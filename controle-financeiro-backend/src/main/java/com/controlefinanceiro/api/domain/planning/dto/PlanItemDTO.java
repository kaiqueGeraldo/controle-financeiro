package com.controlefinanceiro.api.domain.planning.dto;

import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PlanItemDTO(
        UUID id,
        String description,
        BigDecimal amount,
        LocalDate dueDate,
        PlanItemStatus status,
        UUID categoryId,
        String categoryName,
        String categoryIcon,
        String categoryColor,
        UUID cardId
) {}