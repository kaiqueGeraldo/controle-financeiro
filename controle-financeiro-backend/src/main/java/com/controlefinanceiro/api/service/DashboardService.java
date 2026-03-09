package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.dashboard.dto.ChartPointDTO;
import com.controlefinanceiro.api.domain.dashboard.dto.DashboardFlowDTO;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private InvestmentRepository investmentRepository;

    public DashboardFlowDTO getMonthlyFlow(User user, int month, int year) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        List<Object[]> totals = transactionRepository.sumAmountByTypeAndDateBetween(user.getId(), startOfMonth, endOfMonth);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Object[] row : totals) {
            String type = row[0].toString();
            BigDecimal sum = row[1] != null ? BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO;
            if ("INCOME".equals(type)) totalIncome = sum;
            else if ("EXPENSE".equals(type)) totalExpense = sum;
        }

        BigDecimal percentage = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            percentage = totalExpense.divide(totalIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        } else if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            percentage = BigDecimal.valueOf(100);
        }

        return new DashboardFlowDTO(totalIncome, totalExpense, totalIncome.subtract(totalExpense), percentage);
    }

    public List<ChartPointDTO> getWealthChart(String period, User user) {
        BigDecimal accBalance = accountRepository.sumTotalBalanceByUserId(user.getId());
        BigDecimal invBalance = investmentRepository.sumTotalValueByUserId(user.getId());
        BigDecimal currentBalance = accBalance.add(invBalance);

        List<ChartPointDTO> points = new ArrayList<>();
        LocalDate today = LocalDate.now();

        if ("30D".equals(period)) {
            LocalDate startDate = today.minusDays(30);
            List<Object[]> flowData = transactionRepository.sumAmountByDateAndType(user.getId(), startDate);

            BigDecimal runningBalance = currentBalance;
            for (int i = 0; i < 30; i++) {
                LocalDate d = today.minusDays(i);
                points.add(0, new ChartPointDTO(d.getDayOfMonth() + "/" + d.getMonthValue(), runningBalance));

                BigDecimal dayIncome = getAmountForDate(flowData, d, TransactionType.INCOME);
                BigDecimal dayExpense = getAmountForDate(flowData, d, TransactionType.EXPENSE);

                // Como estamos a andar para trás no tempo, revertemos a matemática
                runningBalance = runningBalance.subtract(dayIncome).add(dayExpense);
            }
        } else {
            int numMonths = "6M".equals(period) ? 6 : 12;
            LocalDate startDate = today.minusMonths(numMonths).withDayOfMonth(1);
            List<Object[]> flowData = transactionRepository.sumAmountByMonthAndType(user.getId(), startDate);

            BigDecimal runningBalance = currentBalance;
            for (int i = 0; i < numMonths; i++) {
                YearMonth ym = YearMonth.from(today.minusMonths(i));
                // Formata "Jan", "Fev", etc
                String label = getMonthShortName(ym.getMonthValue());
                points.add(0, new ChartPointDTO(label, runningBalance));

                BigDecimal monthIncome = getAmountForMonth(flowData, ym, TransactionType.INCOME);
                BigDecimal monthExpense = getAmountForMonth(flowData, ym, TransactionType.EXPENSE);

                runningBalance = runningBalance.subtract(monthIncome).add(monthExpense);
            }
        }
        return points;
    }

    // --- Helpers de busca em memória ---
    private BigDecimal getAmountForDate(List<Object[]> data, LocalDate date, TransactionType type) {
        return data.stream()
                .filter(row -> {
                    LocalDate rowDate = (LocalDate) row[0];
                    String rowType = row[1].toString();
                    return rowDate.equals(date) && rowType.equals(type.name());
                })
                .map(row -> {
                    Number amount = (Number) row[2];
                    return amount != null ? BigDecimal.valueOf(amount.doubleValue()) : BigDecimal.ZERO;
                })
                .findFirst().orElse(BigDecimal.ZERO);
    }

    private BigDecimal getAmountForMonth(List<Object[]> data, YearMonth ym, TransactionType type) {
        return data.stream()
                .filter(row -> {
                    int year = ((Number) row[0]).intValue();
                    int month = ((Number) row[1]).intValue();
                    String rowType = row[2].toString();
                    return year == ym.getYear() && month == ym.getMonthValue() && rowType.equals(type.name());
                })
                .map(row -> {
                    Number amount = (Number) row[3];
                    return amount != null ? BigDecimal.valueOf(amount.doubleValue()) : BigDecimal.ZERO;
                })
                .findFirst().orElse(BigDecimal.ZERO);
    }

    private String getMonthShortName(int month) {
        return Month.of(month).getDisplayName(
                TextStyle.SHORT,
                Locale.of("pt", "BR")
        );
    }
}