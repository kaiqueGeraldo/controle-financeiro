package com.controlefinanceiro.api.domain.habit.dto;

import com.controlefinanceiro.api.domain.habit.HabitFrequency;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateHabitDTO(
        @NotBlank(message = "O nome do hábito é obrigatório") String name,
        String description,
        @NotBlank String icon,
        @NotBlank String color,
        HabitFrequency frequency,
        Integer weeklyGoal,
        UUID goalId
) {}