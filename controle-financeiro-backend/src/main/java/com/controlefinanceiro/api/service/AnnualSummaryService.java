package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.card.CardRefundRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.note.YearlyNote;
import com.controlefinanceiro.api.domain.note.YearlyNoteRepository;
import com.controlefinanceiro.api.domain.summary.dto.*;
import com.controlefinanceiro.api.domain.user.User;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AnnualSummaryService {

    @Autowired private CardTransactionRepository cardTransactionRepository;
    @Autowired private CardRefundRepository cardRefundRepository;
    @Autowired private InvestmentRepository investmentRepository;
    @Autowired private DashboardService dashboardService;
    @Autowired private YearlyNoteRepository noteRepository;
    @Autowired private Clock clock;

    public AnnualSummaryDTO getSummary(User user, Integer year) {
        UUID userId = user.getId();
        LocalDate firstDay = LocalDate.of(year, 1, 1);
        LocalDate lastDay = firstDay.withDayOfYear(firstDay.lengthOfYear());
        DashboardService.PeriodTotals totals = dashboardService.getPeriodTotals(
                user, firstDay, lastDay, null, null);

        // Resultado do período, não saldo da conta ou patrimônio.
        BigDecimal totalIncome = totals.income();
        BigDecimal totalExpense = totals.expense();
        BigDecimal annualBalance = totals.investmentResult() == null ? null
                : totalIncome.subtract(totalExpense).add(totals.investmentResult());

        // CARTÃO DE CRÉDITO
        BigDecimal cardTotal = totals.cardConsumption();

        // Busca gastos específicos da categoria "Assinaturas"
        BigDecimal subscriptionsTotal = cardTransactionRepository.sumByCategoryAndYear(userId, year, DefaultCategory.ASSINATURAS.getName())
                .subtract(cardRefundRepository.sumByCategoryAndYear(userId, year, DefaultCategory.ASSINATURAS.getName()));

        // Média Mensal: Se for o ano atual, divide pelos meses que passaram. Se for ano passado, divide por 12.
        int monthsToDivide = 12;
        LocalDate today = LocalDate.now(clock);
        if (year.equals(today.getYear())) {
            monthsToDivide = Math.max(1, today.getMonthValue());
        }
        BigDecimal cardAverage = cardTotal.divide(BigDecimal.valueOf(monthsToDivide), 2, RoundingMode.HALF_UP);

        // Current position has its own date, independently of the flow year.
        InvestmentsSummaryDTO position = currentPosition(userId, year, today);

        // COMPARATIVO (Ano Atual vs Ano Anterior)
        YearlyComparisonDTO comparison = calculateComparison(user, year, totalIncome, totalExpense);

        YearlyNote note = noteRepository.findByUserIdAndYear(userId, year).orElse(new YearlyNote());

        return new AnnualSummaryDTO(
                year,
                new BalanceSummaryDTO(totalIncome, totalExpense, annualBalance, totals.investmentResult()),
                new CreditCardSummaryDTO(cardTotal, subscriptionsTotal, cardAverage),
                position,
                comparison,
                note.getContent() != null ? note.getContent() : ""
        );
    }

    private InvestmentsSummaryDTO currentPosition(UUID userId, int year, LocalDate today) {
        List<InvestmentBreakdownDTO> breakdown = new ArrayList<>();
        BigDecimal cost = BigDecimal.ZERO;
        BigDecimal value = BigDecimal.ZERO;
        boolean costComplete = true;
        boolean valueComplete = true;
        for (Investment investment : investmentRepository.findAllByUserId(userId)) {
            if (investment.getTotalCost() == null) costComplete = false;
            else cost = cost.add(investment.getTotalCost());
            BigDecimal assetValue = investment.getTotalValue();
            if (assetValue == null) valueComplete = false;
            else value = value.add(assetValue);
            breakdown.add(new InvestmentBreakdownDTO(investment.getName(), assetValue, "ASSET", "BLUE",investment.getValuationDate(),investment.getValuationSource()));
        }
        return new InvestmentsSummaryDTO(costComplete ? cost : null,
                valueComplete ? value : null, today, valueComplete, breakdown);
    }

    @Transactional
    @CacheEvict(value = "annualSummary", key = "#user.id + '-' + #data.year()")
    public void updateNote(User user, UpdateNoteDTO data) {
        YearlyNote note = noteRepository.findByUserIdAndYear(user.getId(), data.year())
                .orElse(new YearlyNote());

        if (note.getId() == null) {
            note.setUser(user);
            note.setYear(data.year());
        }

        note.setContent(data.content());
        noteRepository.save(note);
    }

    // Lógica criativa para comparar desempenho
    private YearlyComparisonDTO calculateComparison(User user, Integer currentYear, BigDecimal currentIncome, BigDecimal currentExpense) {
        if (currentYear <= 1) {
            return new YearlyComparisonDTO(null, null, "Sem base anterior comparável; crescimento indisponível.");
        }
        Integer prevYear = currentYear - 1;
        LocalDate firstDay = LocalDate.of(prevYear, 1, 1);
        DashboardService.PeriodTotals previous = dashboardService.getPeriodTotals(
                user, firstDay, firstDay.withDayOfYear(firstDay.lengthOfYear()), null, null);
        BigDecimal prevIncome = previous.income();
        BigDecimal prevExpense = previous.expense();

        BigDecimal incomeGrowth = calculateGrowth(prevIncome, currentIncome);
        BigDecimal expenseGrowth = calculateGrowth(prevExpense, currentExpense);

        String message;
        if (incomeGrowth != null && incomeGrowth.signum() > 0 && expenseGrowth != null && expenseGrowth.signum() < 0) {
            message = "Ano excelente! Você ganhou mais e gastou menos.";
        } else if (incomeGrowth != null && incomeGrowth.signum() > 0) {
            message = "Sua renda cresceu em relação a " + prevYear + "!";
        } else if (expenseGrowth != null && expenseGrowth.signum() < 0) {
            message = "Parabéns! Seus gastos diminuíram comparado a " + prevYear + ".";
        } else {
            message = "Mantenha o foco no planejamento.";
        }

        if (prevIncome.compareTo(BigDecimal.ZERO) == 0 && prevExpense.compareTo(BigDecimal.ZERO) == 0) {
            message = "Sem base anterior comparável; crescimento indisponível.";
        }

        return new YearlyComparisonDTO(incomeGrowth, expenseGrowth, message);
    }

    private BigDecimal calculateGrowth(BigDecimal prev, BigDecimal current) {
        if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0) return null;
        // (Current - Prev) / Prev * 100
        return current.subtract(prev).divide(prev, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }
}
