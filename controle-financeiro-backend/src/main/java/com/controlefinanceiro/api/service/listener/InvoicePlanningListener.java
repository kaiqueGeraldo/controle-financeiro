package com.controlefinanceiro.api.service.listener;

import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.card.InvoiceStatus;
import com.controlefinanceiro.api.domain.card.InvoiceRepository;
import com.controlefinanceiro.api.domain.card.Invoice;
import com.controlefinanceiro.api.domain.event.InvoiceChangedEvent;
import com.controlefinanceiro.api.domain.planning.MonthlyPlan;
import com.controlefinanceiro.api.domain.planning.MonthlyPlanRepository;
import com.controlefinanceiro.api.domain.planning.PlanItem;
import com.controlefinanceiro.api.domain.planning.PlanItemRepository;
import com.controlefinanceiro.api.domain.planning.PlanItemStatus;
import com.controlefinanceiro.api.domain.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Component
public class InvoicePlanningListener {

    @Autowired private MonthlyPlanRepository monthlyPlanRepository;
    @Autowired private PlanItemRepository planItemRepository;
    @Autowired private CardTransactionRepository cardTransactionRepository;
    @Autowired private InvoiceRepository invoiceRepository;

    @EventListener
    public void onInvoiceChanged(InvoiceChangedEvent event) {
        Invoice invoice = event.invoice();
        User user = invoice.getCard().getUser();

        YearMonth competence = YearMonth.of(invoice.getYear(), invoice.getMonth());
        YearMonth previous = competence.equals(YearMonth.of(1, 1)) ? null : competence.minusMonths(1);
        boolean includeRolled = previous != null && invoiceRepository.findByCardIdAndMonthAndYear(
                        invoice.getCard().getId(), previous.getMonthValue(), previous.getYear())
                .filter(prior -> prior.getStatus() == InvoiceStatus.ROLLED).isPresent();
        BigDecimal totalDue = cardTransactionRepository.sumOutstandingUpTo(
                invoice.getCard().getId(), invoice.getMonth(), invoice.getYear(), includeRolled);

        MonthlyPlan plan = monthlyPlanRepository.findByUserIdAndMonthAndYear(user.getId(), invoice.getMonth(), invoice.getYear())
                .orElseGet(() -> {
                    MonthlyPlan newPlan = new MonthlyPlan();
                    newPlan.setUser(user);
                    newPlan.setMonth(invoice.getMonth());
                    newPlan.setYear(invoice.getYear());
                    return monthlyPlanRepository.save(newPlan);
                });

        PlanItem planItem = planItemRepository.findByPlanIdAndCardId(plan.getId(), invoice.getCard().getId())
                .orElse(new PlanItem());

        planItem.setPlan(plan);
        planItem.setCard(invoice.getCard());
        planItem.setDescription("Fatura " + invoice.getCard().getName());
        planItem.setAmount(invoice.getStatus() == InvoiceStatus.ROLLED ? BigDecimal.ZERO : totalDue);

        int ano = invoice.getYear();
        int mes = invoice.getMonth();
        int diaVencimento = invoice.getCard().getDueDay();
        int ultimoDiaDoMes = LocalDate.of(ano, mes, 1).lengthOfMonth();

        planItem.setDueDate(invoice.getDueDate() != null
                ? invoice.getDueDate()
                : LocalDate.of(ano, mes, Math.min(diaVencimento, ultimoDiaDoMes)));
        planItem.setStatus(switch (invoice.getStatus()) {
            case PAID -> PlanItemStatus.PAID;
            case ROLLED -> PlanItemStatus.SAVED;
            default -> PlanItemStatus.PENDING;
        });

        planItemRepository.save(planItem);
    }
}
