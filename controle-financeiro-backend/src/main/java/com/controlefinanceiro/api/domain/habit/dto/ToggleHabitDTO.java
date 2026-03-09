package com.controlefinanceiro.api.domain.habit.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ToggleHabitDTO(
        @NotNull(message = "A data é obrigatória") LocalDate date
) {}