package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.note.YearlyNote;
import com.controlefinanceiro.api.domain.note.YearlyNoteRepository;
import com.controlefinanceiro.api.domain.summary.dto.*;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AnnualSummaryService {

    @Autowired private TransactionRepository transactionRepository;
    @Autowired private CardTransactionRepository cardTransactionRepository;
    @Autowired private InvestmentRepository investmentRepository;
    @Autowired private GoalRepository goalRepository;
    @Autowired private YearlyNoteRepository noteRepository;

    @Cacheable(value = "annualSummary", key = "#user.id + '-' + #year")
    public AnnualSummaryDTO getSummary(User user, Integer year) {
        UUID userId = user.getId();

        // BALANÇO GERAL
        BigDecimal totalIncome = transactionRepository.sumByTypeAndYear(userId, TransactionType.INCOME, year);
        BigDecimal totalExpense = transactionRepository.sumByTypeAndYear(userId, TransactionType.EXPENSE, year);
        BigDecimal annualBalance = totalIncome.subtract(totalExpense);

        // CARTÃO DE CRÉDITO
        BigDecimal cardTotal = cardTransactionRepository.sumByYear(userId, year);

        // Busca gastos específicos da categoria "Assinaturas"
        BigDecimal subscriptionsTotal = cardTransactionRepository.sumByCategoryAndYear(userId, year, DefaultCategory.ASSINATURAS.getName());

        // Média Mensal: Se for o ano atual, divide pelos meses que passaram. Se for ano passado, divide por 12.
        int monthsToDivide = 12;
        if (year.equals(LocalDate.now().getYear())) {
            monthsToDivide = Math.max(1, LocalDate.now().getMonthValue());
        }
        BigDecimal cardAverage = cardTotal.divide(BigDecimal.valueOf(monthsToDivide), 2, RoundingMode.HALF_UP);

        // Agrupa Metas Financeiras + Ativos Soltos
        List<Investment> investments = investmentRepository.findAllByUserIdWithGoal(userId);
        List<Goal> goals = goalRepository.findAllByUserIdOrderByDeadlineAsc(userId);

        List<InvestmentBreakdownDTO> breakdown = new ArrayList<>();
        BigDecimal totalInvested = BigDecimal.ZERO;

        // Adiciona Metas
        for (Goal goal : goals) {
            if (goal.getType().name().equals("MONETARY") && goal.getCurrentValue().compareTo(BigDecimal.ZERO) > 0) {
                breakdown.add(new InvestmentBreakdownDTO(goal.getTitle(), goal.getCurrentValue(), "GOAL", goal.getColor()));
                totalInvested = totalInvested.add(goal.getCurrentValue());
            }
        }

        // Adiciona Ativos sem Meta (Para não duplicar valor)
        BigDecimal acoesFiisTotal = BigDecimal.ZERO;
        for (Investment inv : investments) {
            if (inv.getGoal() == null) {
                BigDecimal val = inv.getQuantity().multiply(inv.getCurrentPrice());
                if (val.compareTo(BigDecimal.ZERO) > 0) {
                    acoesFiisTotal = acoesFiisTotal.add(val);
                    totalInvested = totalInvested.add(val);
                }
            }
        }
        if (acoesFiisTotal.compareTo(BigDecimal.ZERO) > 0) {
            breakdown.add(new InvestmentBreakdownDTO("Ações / Outros", acoesFiisTotal, "ASSET", "BLUE"));
        }

        // COMPARATIVO (Ano Atual vs Ano Anterior)
        YearlyComparisonDTO comparison = calculateComparison(userId, year, totalIncome, totalExpense);

        YearlyNote note = noteRepository.findByUserIdAndYear(userId, year).orElse(new YearlyNote());

        return new AnnualSummaryDTO(
                year,
                new BalanceSummaryDTO(totalIncome, totalExpense, annualBalance),
                new CreditCardSummaryDTO(cardTotal, subscriptionsTotal, cardAverage),
                new InvestmentsSummaryDTO(totalInvested, breakdown),
                comparison,
                note.getContent() != null ? note.getContent() : ""
        );
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
    private YearlyComparisonDTO calculateComparison(UUID userId, Integer currentYear, BigDecimal currentIncome, BigDecimal currentExpense) {
        Integer prevYear = currentYear - 1;
        BigDecimal prevIncome = transactionRepository.sumByTypeAndYear(userId, TransactionType.INCOME, prevYear);
        BigDecimal prevExpense = transactionRepository.sumByTypeAndYear(userId, TransactionType.EXPENSE, prevYear);

        BigDecimal incomeGrowth = calculateGrowth(prevIncome, currentIncome);
        BigDecimal expenseGrowth = calculateGrowth(prevExpense, currentExpense);

        String message;
        if (incomeGrowth.compareTo(BigDecimal.ZERO) > 0 && expenseGrowth.compareTo(BigDecimal.ZERO) < 0) {
            message = "Ano excelente! Você ganhou mais e gastou menos.";
        } else if (incomeGrowth.compareTo(BigDecimal.ZERO) > 0) {
            message = "Sua renda cresceu em relação a " + prevYear + "!";
        } else if (expenseGrowth.compareTo(BigDecimal.ZERO) < 0) {
            message = "Parabéns! Seus gastos diminuíram comparado a " + prevYear + ".";
        } else {
            message = "Mantenha o foco no planejamento.";
        }

        if (prevIncome.compareTo(BigDecimal.ZERO) == 0 && prevExpense.compareTo(BigDecimal.ZERO) == 0) {
            message = "Primeiro ano de registros completos!";
        }

        return new YearlyComparisonDTO(incomeGrowth, expenseGrowth, message);
    }

    private BigDecimal calculateGrowth(BigDecimal prev, BigDecimal current) {
        if (prev == null || prev.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        // (Current - Prev) / Prev * 100
        return current.subtract(prev).divide(prev, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
    }
}