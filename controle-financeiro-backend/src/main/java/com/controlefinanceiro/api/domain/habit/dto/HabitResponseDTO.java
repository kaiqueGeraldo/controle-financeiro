package com.controlefinanceiro.api.domain.habit.dto;

import com.controlefinanceiro.api.domain.habit.Habit;
import com.controlefinanceiro.api.domain.habit.HabitFrequency;

import java.util.List;
import java.util.UUID;

public record HabitResponseDTO(
        UUID id,
        String name,
        String description,
        String icon,
        String color,
        HabitFrequency frequency,
        Integer weeklyGoal,
        Integer currentStreak,
        Integer highestStreak,
        Integer orderIndex,
        UUID goalId,
        List<HabitLogDTO> logs
) {
    public HabitResponseDTO(Habit h) {
        this(h.getId(), h.getName(), h.getDescription(), h.getIcon(), h.getColor(),
                h.getFrequency(), h.getWeeklyGoal(),
                h.getCurrentStreak(), h.getHighestStreak(), h.getOrderIndex(),
                h.getGoal() != null ? h.getGoal().getId() : null,
                h.getLogs() != null ? h.getLogs().stream().map(HabitLogDTO::new).toList() : List.of());
    }
}