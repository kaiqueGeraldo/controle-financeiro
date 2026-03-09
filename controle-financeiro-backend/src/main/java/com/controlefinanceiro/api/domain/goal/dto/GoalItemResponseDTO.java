package com.controlefinanceiro.api.domain.goal.dto;

import com.controlefinanceiro.api.domain.goal.GoalItem;
import com.controlefinanceiro.api.domain.goal.GoalItemStatus;
import java.math.BigDecimal;
import java.util.UUID;

public record GoalItemResponseDTO(
        UUID id,
        String name,
        String suggestedModel,
        BigDecimal estimatedPrice,
        BigDecimal paidPrice,
        GoalItemStatus status,
        Integer orderIndex
) {
    public GoalItemResponseDTO(GoalItem i) {
        this(i.getId(), i.getName(), i.getSuggestedModel(), i.getEstimatedPrice(),
                i.getPaidPrice(), i.getStatus(), i.getOrderIndex());
    }
}