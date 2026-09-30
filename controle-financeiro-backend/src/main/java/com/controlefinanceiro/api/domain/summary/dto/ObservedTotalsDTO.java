package com.controlefinanceiro.api.domain.summary.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;

/** Exact decimal strings; recorded subtotals never imply complete historical coverage. */
public record ObservedTotalsDTO(
        @JsonFormat(shape=JsonFormat.Shape.STRING) BigDecimal income,
        @JsonFormat(shape=JsonFormat.Shape.STRING) BigDecimal expense,
        @JsonFormat(shape=JsonFormat.Shape.STRING) BigDecimal balance,
        @JsonFormat(shape=JsonFormat.Shape.STRING) BigDecimal investmentResult,
        @JsonFormat(shape=JsonFormat.Shape.STRING) BigDecimal cardConsumption) {
    public ObservedTotalsDTO {
        income=money(income);expense=money(expense);balance=money(balance);
        investmentResult=money(investmentResult);cardConsumption=money(cardConsumption);
    }
    private static BigDecimal money(BigDecimal value){return value==null?null:value.setScale(2,java.math.RoundingMode.UNNECESSARY);}
}
