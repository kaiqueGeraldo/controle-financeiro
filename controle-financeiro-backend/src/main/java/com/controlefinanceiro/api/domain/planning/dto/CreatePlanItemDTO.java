package com.controlefinanceiro.api.domain.planning.dto;

import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePlanItemDTO(
        @NotBlank(message = "A descrição é obrigatória")
        String description,

        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser positivo")
        BigDecimal amount,

        @NotNull(message = "A data de vencimento é obrigatória")
        LocalDate dueDate,

        UUID categoryId,

        PlanItemStatus status
) {}