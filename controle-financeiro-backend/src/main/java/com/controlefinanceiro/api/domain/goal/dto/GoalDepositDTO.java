package com.controlefinanceiro.api.domain.goal.dto;

import com.controlefinanceiro.api.domain.goal.EvolutionProtocol;
import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.UUID;

public record GoalDepositDTO(
        UUID accountId,

        @NotNull(message = "O valor/quantidade é obrigatório")
        @Positive(message = "O valor deve ser positivo")
        BigDecimal amount,

        @WallTime String time,

        String note,

        EvolutionProtocol protocol
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {}
