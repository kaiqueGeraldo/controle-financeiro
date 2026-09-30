package com.controlefinanceiro.api.domain.transaction.dto;
import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
public record ReverseTransactionDTO(
    @NotNull UUID operationId,
    @NotNull @Positive @Digits(integer=12,fraction=2)
    @tools.jackson.databind.annotation.JsonDeserialize(using=com.controlefinanceiro.api.utils.DecimalStringDeserializer.class) BigDecimal amount,
    @NotNull LocalDate date, @WallTime String time,
    @NotBlank @Size(max=500) String reason) {}
