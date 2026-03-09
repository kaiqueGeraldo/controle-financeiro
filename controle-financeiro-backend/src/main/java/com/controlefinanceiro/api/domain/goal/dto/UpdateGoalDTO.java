package com.controlefinanceiro.api.domain.goal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateGoalDTO(
        String title,
        BigDecimal targetValue,
        LocalDate deadline
) {}