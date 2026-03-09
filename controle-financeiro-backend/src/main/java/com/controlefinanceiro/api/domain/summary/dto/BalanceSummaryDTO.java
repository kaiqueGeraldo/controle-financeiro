package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record BalanceSummaryDTO(
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal annualBalance // Saldo (Receita - Despesa)
) {}