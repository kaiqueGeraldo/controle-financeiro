package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record CreditCardSummaryDTO(
        BigDecimal totalSpent,
        BigDecimal subscriptionsTotal, // Assinaturas
        BigDecimal monthlyAverage
) {}