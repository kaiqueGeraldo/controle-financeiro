package com.controlefinanceiro.api.domain.planning.dto;

import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePlanStatusDTO(@NotNull PlanItemStatus status) {}
