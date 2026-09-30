package com.controlefinanceiro.api.domain.summary.dto;
import java.math.BigDecimal;

public record InvestmentBreakdownDTO(
        String name,
        BigDecimal value,
        String type,
        String color,
        java.time.LocalDate valuationDate,
        String valuationSource
) {
    public InvestmentBreakdownDTO(String name,BigDecimal value,String type,String color){this(name,value,type,color,null,null);}
}
