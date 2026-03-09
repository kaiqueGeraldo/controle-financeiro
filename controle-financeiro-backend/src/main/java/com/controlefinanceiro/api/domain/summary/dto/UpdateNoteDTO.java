package com.controlefinanceiro.api.domain.summary.dto;
import jakarta.validation.constraints.NotNull;

public record UpdateNoteDTO(
        @NotNull Integer year,
        String content
) {}