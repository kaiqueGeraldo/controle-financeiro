package com.controlefinanceiro.api.domain.summary.dto;

public record AnnualSummaryDTO(
        Integer year,
        BalanceSummaryDTO balance,
        CreditCardSummaryDTO creditCard,
        InvestmentsSummaryDTO investments,
        YearlyComparisonDTO comparison,
        String note
) {}