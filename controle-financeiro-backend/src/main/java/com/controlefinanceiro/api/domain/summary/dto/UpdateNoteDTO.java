package com.controlefinanceiro.api.domain.summary.dto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import com.controlefinanceiro.api.utils.StrictIntegerDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;

public record UpdateNoteDTO(
        @NotNull @Min(1) @Max(9999) @JsonDeserialize(using = StrictIntegerDeserializer.class) Integer year,
        String content
) {}
