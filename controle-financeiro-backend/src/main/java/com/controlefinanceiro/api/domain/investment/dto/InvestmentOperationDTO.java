package com.controlefinanceiro.api.domain.investment.dto;

import com.controlefinanceiro.api.domain.investment.InvestTransType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InvestmentOperationDTO(
        @NotNull UUID investmentId,
        @NotNull InvestTransType type,
        @NotNull @Positive BigDecimal quantity,
        @NotNull @Positive BigDecimal price,
        BigDecimal fees,
        @NotNull LocalDate date,
        @NotNull UUID accountId // De onde sai/entra o dinheiro
) {}