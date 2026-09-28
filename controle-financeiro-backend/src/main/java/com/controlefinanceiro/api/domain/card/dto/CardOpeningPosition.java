package com.controlefinanceiro.api.domain.card.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Posição declarada na data-base. A fatura corrente já inclui sua parcela corrente. */
public record CardOpeningPosition(UUID cardId, LocalDate baseDate, YearMonth currentCompetence,
                                  BigDecimal currentOutstanding, List<FutureInstallment> futureInstallments) {
    public record FutureInstallment(YearMonth competence, BigDecimal amount, String description) {}
}
