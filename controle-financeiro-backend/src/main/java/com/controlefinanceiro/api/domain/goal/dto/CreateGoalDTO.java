package com.controlefinanceiro.api.domain.goal.dto;

import com.controlefinanceiro.api.domain.goal.GoalType;
import com.controlefinanceiro.api.domain.validation.FutureInProductZone;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateGoalDTO(
        @NotBlank(message = "O título é obrigatório")
        String title,

        @NotNull(message = "O valor alvo é obrigatório")
        @PositiveOrZero(message = "O valor não pode ser negativo")
        BigDecimal targetValue,

        @NotNull(message = "A data limite é obrigatória")
        @FutureInProductZone
        LocalDate deadline,

        String category,
        String icon,
        String color,

        @NotNull(message = "O tipo é obrigatório")
        GoalType type,

        Boolean useChecklist,
        BigDecimal initialProgress
) {
    public CreateGoalDTO(String title, BigDecimal targetValue, LocalDate deadline, String category,
                         String icon, String color, GoalType type, Boolean useChecklist) {
        this(title, targetValue, deadline, category, icon, color, type, useChecklist, null);
    }
}
