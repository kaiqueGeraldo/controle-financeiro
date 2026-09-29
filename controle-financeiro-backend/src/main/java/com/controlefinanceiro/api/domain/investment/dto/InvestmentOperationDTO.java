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
        @Positive BigDecimal quantity,
        @Positive BigDecimal price,
        BigDecimal fees,
        @NotNull LocalDate date,
        @NotNull UUID accountId,
        @tools.jackson.databind.annotation.JsonDeserialize(using = com.controlefinanceiro.api.utils.DecimalStringDeserializer.class)
        BigDecimal amount
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public InvestmentOperationDTO(UUID investmentId, InvestTransType type, BigDecimal quantity,
            BigDecimal price, BigDecimal fees, LocalDate date, UUID accountId) {
        this(investmentId,type,quantity,price,fees,date,accountId,null);
    }
}
