package com.controlefinanceiro.api.domain.planning.dto;

import com.controlefinanceiro.api.utils.StrictIntegerDeserializer;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.annotation.JsonDeserialize;

public record CopyPreviousPlanDTO(
        @NotNull @Min(1) @Max(12) @JsonDeserialize(using = StrictIntegerDeserializer.class) Integer month,
        @NotNull @Min(1) @Max(9999) @JsonDeserialize(using = StrictIntegerDeserializer.class) Integer year
) {}
