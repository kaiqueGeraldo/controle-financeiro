package com.controlefinanceiro.api.domain.card;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** FIN-03: known charges across all eligible invoices precede the oldest principal.
 * Input order is competence, installment, stable ID. This plan neither writes nor
 * assigns principal to unknown composition. One slice per line retains its audit. */
public final class CardPaymentDistribution {
    private CardPaymentDistribution() {}
    public record Slice(CardTransaction transaction, BigDecimal amount) {}

    public static List<Slice> plan(List<CardTransaction> ordered, BigDecimal amount) {
        BigDecimal remaining = amount;
        BigDecimal[] allocated = new BigDecimal[ordered.size()];
        for (int i = 0; i < ordered.size(); i++) {
            CardTransaction line = ordered.get(i);
            BigDecimal principal = line.remainingPrincipal();
            allocated[i] = BigDecimal.ZERO;
            if (principal == null) continue; // Unidentified composition stays unknown in the residual-debt pass.
            BigDecimal charges = outstanding(line).subtract(principal);
            allocated[i] = charges.min(remaining);
            remaining = remaining.subtract(allocated[i]);
        }
        for (int i = 0; i < ordered.size() && remaining.signum() > 0; i++) {
            BigDecimal next = outstanding(ordered.get(i)).subtract(allocated[i]).min(remaining);
            allocated[i] = allocated[i].add(next);
            remaining = remaining.subtract(next);
        }
        if (remaining.signum() != 0) throw new IllegalStateException("Payment plan does not cover the amount");
        List<Slice> result = new ArrayList<>();
        for (int i = 0; i < ordered.size(); i++) {
            if (allocated[i].signum() > 0) result.add(new Slice(ordered.get(i), allocated[i]));
        }
        return List.copyOf(result);
    }

    private static BigDecimal outstanding(CardTransaction line) {
        return line.getAmount().subtract(line.getPaidAmount()).subtract(line.getRefundedAmount());
    }
}
