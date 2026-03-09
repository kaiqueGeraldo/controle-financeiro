package com.controlefinanceiro.api.domain.investment.dto;

import com.controlefinanceiro.api.domain.investment.InvestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateInvestmentDTO(
        @NotBlank String ticker,
        @NotBlank String name,
        @NotNull InvestType type,
        UUID goalId
) {}