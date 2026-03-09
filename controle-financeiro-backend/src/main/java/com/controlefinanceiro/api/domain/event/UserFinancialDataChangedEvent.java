package com.controlefinanceiro.api.domain.event;

import java.util.UUID;

public record UserFinancialDataChangedEvent(
        UUID userId,
        Integer year
) {}