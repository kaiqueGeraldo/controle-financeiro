package com.controlefinanceiro.api.domain.goal.dto;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponseDTO(
        UUID id,
        String title,
        String category,
        String icon,
        String color,
        GoalType type,
        BigDecimal targetValue,
        BigDecimal currentValue,
        LocalDate deadline,
        Boolean useChecklist,
        Integer orderIndex
) {
    public GoalResponseDTO(Goal g) {
        this(g.getId(), g.getTitle(), g.getCategory(), g.getIcon(), g.getColor(),
                g.getType(), g.getTargetValue(), g.getCurrentValue(), g.getDeadline(),
                g.getUseChecklist(), g.getOrderIndex());
    }
}