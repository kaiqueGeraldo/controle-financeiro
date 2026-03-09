package com.controlefinanceiro.api.domain.habit.dto;

import com.controlefinanceiro.api.domain.habit.HabitLog;
import com.controlefinanceiro.api.domain.habit.HabitStatus;

import java.time.LocalDate;
import java.util.UUID;

public record HabitLogDTO(
        UUID id,
        LocalDate date,
        HabitStatus status
) {
    public HabitLogDTO(HabitLog log) {
        this(log.getId(), log.getDate(), log.getStatus());
    }
}