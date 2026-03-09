package com.controlefinanceiro.api.domain.planning.dto;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyPlanDTO(
        BigDecimal incomeForecast,
        List<PlanItemDTO> items
) {}