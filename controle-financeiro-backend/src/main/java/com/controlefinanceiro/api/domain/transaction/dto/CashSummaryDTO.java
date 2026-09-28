package com.controlefinanceiro.api.domain.transaction.dto;

import java.math.BigDecimal;

public record CashSummaryDTO(BigDecimal entries, BigDecimal exits, BigDecimal balance) {}
