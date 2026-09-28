package com.controlefinanceiro.api.domain.card;

import java.time.LocalDate;
import java.time.YearMonth;

/** Calendário gerencial do produto. Não representa autorização ou contrato do emissor. */
public record CardCycle(YearMonth competence, LocalDate closingDate, LocalDate dueDate) {
    public static CardCycle forPurchase(LocalDate purchaseDate, int closingDay, int dueDay) {
        YearMonth month = YearMonth.from(purchaseDate);
        if (!purchaseDate.isBefore(day(month, closingDay))) {
            month = month.plusMonths(1);
        }
        return forCompetence(month, closingDay, dueDay);
    }

    public static CardCycle forCompetence(YearMonth competence, int closingDay, int dueDay) {
        LocalDate closing = day(competence, closingDay);
        YearMonth dueMonth = competence;
        LocalDate due = day(dueMonth, dueDay);
        if (!due.isAfter(closing)) {
            dueMonth = dueMonth.plusMonths(1);
            due = day(dueMonth, dueDay);
        }
        return new CardCycle(competence, closing, due);
    }

    private static LocalDate day(YearMonth month, int nominalDay) {
        if (nominalDay < 1 || nominalDay > 31) {
            throw new IllegalArgumentException("Dia nominal do cartão deve estar entre 1 e 31");
        }
        return month.atDay(Math.min(nominalDay, month.lengthOfMonth()));
    }
}
