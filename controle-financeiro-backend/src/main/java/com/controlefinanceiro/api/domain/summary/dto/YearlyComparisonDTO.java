package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record YearlyComparisonDTO(
        BigDecimal incomeGrowthPercentage, // Crescimento de Renda vs Ano Anterior
        BigDecimal expenseGrowthPercentage, // Crescimento de Despesas vs Ano Anterior
        String message // "Você economizou 10% a mais que em 2025!"
) {}