package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardRefundRepository;
import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.dashboard.dto.ChartPointDTO;
import com.controlefinanceiro.api.domain.dashboard.dto.DashboardFlowDTO;
import com.controlefinanceiro.api.domain.investment.InvestTransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired private CardTransactionRepository cardTransactionRepository;
    @Autowired private CardRefundRepository cardRefundRepository;
    @Autowired private InvestTransactionRepository investTransactionRepository;
    @Autowired private com.controlefinanceiro.api.domain.investment.InvestmentCorrectionRepository investmentCorrections;
    @Autowired
    private Clock clock;
    @Autowired private ReportingCoverageService coverageService;

    @org.springframework.transaction.annotation.Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public DashboardFlowDTO getMonthlyFlow(User user, int month, int year) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        PeriodTotals totals = getPeriodTotals(user, startOfMonth, endOfMonth, null, null);
        BigDecimal totalIncome = totals.income();
        BigDecimal totalExpense = totals.expense();

        BigDecimal percentage = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalExpense.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        } else if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            percentage = BigDecimal.valueOf(100);
        }

        BigDecimal balance = totals.investmentResult() == null ? null
                : totalIncome.subtract(totalExpense).add(totals.investmentResult());
        var coverage=coverageService.assess(user,startOfMonth,endOfMonth,null,null,true)
                .withTotals(totalIncome,totalExpense,balance,totals.investmentResult());
        return new DashboardFlowDTO(coverage.exact(totalIncome), coverage.exact(totalExpense), coverage.exact(balance),
                coverage.complete()?percentage:null, coverage.exact(totals.investmentResult()), coverage,
                new com.controlefinanceiro.api.domain.summary.dto.ObservedTotalsDTO(totalIncome,totalExpense,balance,
                        totals.investmentResult(),totals.cardConsumption()));
    }

    /** Resultado gerencial, independente da página do extrato. Cartão só entra no consolidado. */
    public PeriodTotals getPeriodTotals(User user, LocalDate startDate, LocalDate endDate,
                                        TransactionType type, UUID accountId) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expense = BigDecimal.ZERO;
        for (Object[] row : transactionRepository.sumReportByPeriod(
                user.getId(), startDate, endDate, type, accountId)) {
            BigDecimal amount = new BigDecimal(row[1].toString());
            if (row[0].toString().equals(TransactionType.INCOME.name())) income = amount;
            if (row[0].toString().equals(TransactionType.EXPENSE.name())) expense = amount;
        }
        BigDecimal cardConsumption = BigDecimal.ZERO;
        if (accountId == null && (type == null || type == TransactionType.EXPENSE)) {
            cardConsumption = cardTransactionRepository.sumPurchasesByPeriod(user.getId(), startDate, endDate)
                    .subtract(cardRefundRepository.sumByPeriod(user.getId(), startDate, endDate));
            expense = expense.add(cardConsumption);
        }
        BigDecimal investmentResult = BigDecimal.ZERO;
        if (accountId == null && type == null) {
            investmentResult = investTransactionRepository.countUnknownResultsByPeriod(
                    user.getId(), startDate, endDate) > 0 ? null
                    : investTransactionRepository.sumRealizedResultByPeriod(user.getId(), startDate, endDate)
                        .add(investmentCorrections.sumResult(user.getId(), startDate, endDate));
        }
        return new PeriodTotals(income, expense, cardConsumption, investmentResult);
    }

    public record PeriodTotals(BigDecimal income, BigDecimal expense,
                               BigDecimal cardConsumption, BigDecimal investmentResult) {}

    @org.springframework.transaction.annotation.Transactional(readOnly=true,isolation=org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
    public List<ChartPointDTO> getWealthChart(String period, User user) {
        List<ChartPointDTO> points = new ArrayList<>();
        LocalDate today = LocalDate.now(clock);
        BigDecimal runningCashFlow = BigDecimal.ZERO;

        if ("30D".equals(period)) {
            LocalDate startDate = today.minusDays(29);
            var coverage=coverageService.assess(user,startDate,today,null,null,false);
            List<Object[]> flowData = transactionRepository.sumCashByDateAndType(user.getId(), startDate);
            Map<LocalDate, BigDecimal> deltas = new HashMap<>();
            for (Object[] row : flowData) {
                TransactionType type = TransactionType.valueOf(row[1].toString());
                if (type != TransactionType.INCOME && type != TransactionType.EXPENSE) continue;
                BigDecimal amount = row[2] == null ? BigDecimal.ZERO : new BigDecimal(row[2].toString());
                deltas.merge((LocalDate) row[0], type == TransactionType.INCOME ? amount : amount.negate(), BigDecimal::add);
            }
            for (int i = 0; i < 30; i++) {
                LocalDate date = startDate.plusDays(i);
                runningCashFlow = runningCashFlow.add(deltas.getOrDefault(date, BigDecimal.ZERO));
                var pointCoverage=coverageService.interval(startDate,date,coverage.knownFrom(),today,coverage.unknownSources()).withTotals(runningCashFlow);
                points.add(new ChartPointDTO(date.getDayOfMonth() + "/" + date.getMonthValue(),
                        pointCoverage.exact(runningCashFlow),runningCashFlow,pointCoverage));
            }
        } else {
            int numMonths = "6M".equals(period) ? 6 : 12;
            LocalDate startDate = today.minusMonths(numMonths - 1L).withDayOfMonth(1);
            var coverage=coverageService.assess(user,startDate,today,null,null,false);
            List<Object[]> flowData = transactionRepository.sumCashByMonthAndType(user.getId(), startDate);
            Map<YearMonth, BigDecimal> deltas = new HashMap<>();
            for (Object[] row : flowData) {
                YearMonth month = YearMonth.of(((Number) row[0]).intValue(), ((Number) row[1]).intValue());
                TransactionType type = TransactionType.valueOf(row[2].toString());
                if (type != TransactionType.INCOME && type != TransactionType.EXPENSE) continue;
                BigDecimal amount = row[3] == null ? BigDecimal.ZERO : new BigDecimal(row[3].toString());
                deltas.merge(month, type == TransactionType.INCOME ? amount : amount.negate(), BigDecimal::add);
            }
            for (int i = 0; i < numMonths; i++) {
                YearMonth month = YearMonth.from(startDate).plusMonths(i);
                runningCashFlow = runningCashFlow.add(deltas.getOrDefault(month, BigDecimal.ZERO));
                LocalDate through=month.atEndOfMonth().isAfter(today)?today:month.atEndOfMonth();
                var pointCoverage=coverageService.interval(startDate,through,coverage.knownFrom(),today,coverage.unknownSources()).withTotals(runningCashFlow);
                points.add(new ChartPointDTO(getMonthShortName(month.getMonthValue()),
                        pointCoverage.exact(runningCashFlow),runningCashFlow,pointCoverage));
            }
        }
        return points;
    }

    private String getMonthShortName(int month) {
        return Month.of(month).getDisplayName(
                TextStyle.SHORT,
                Locale.of("pt", "BR")
        );
    }
}
