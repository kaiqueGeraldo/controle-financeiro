package com.controlefinanceiro.api.domain.habit.dto;

import com.controlefinanceiro.api.domain.habit.HabitFrequency;
import java.util.UUID;

public record UpdateHabitDTO(
        String name,
        String description,
        String icon,
        String color,
        HabitFrequency frequency,
        Integer weeklyGoal,
        UUID goalId
) {}