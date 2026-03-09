package com.controlefinanceiro.api.domain.card.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CardSummaryDTO(
        UUID id,
        String name,
        String last4Digits,
        BigDecimal limit,
        Integer closingDay,
        Integer dueDay,
        String color,
        String brand,
        BigDecimal currentInvoiceValue
) {}
