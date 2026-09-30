package com.controlefinanceiro.api.domain.transaction.dto;
import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;
public record RealizeTransferDTO(@NotNull UUID operationId, @NotNull LocalDate date,
    @WallTime String time, @NotBlank @Size(max=500) String reason) {}
