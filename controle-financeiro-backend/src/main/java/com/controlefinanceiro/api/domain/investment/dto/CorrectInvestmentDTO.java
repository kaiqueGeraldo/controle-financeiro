package com.controlefinanceiro.api.domain.investment.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CorrectInvestmentDTO(
    @NotNull UUID operationId,
    @NotNull LocalDate date,
    @NotBlank @Size(max=500) String reason,
    @NotNull @PositiveOrZero @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal returnedFees,
    @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal replacementQuantity,
    @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal replacementPrice,
    @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal replacementFees
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {}
