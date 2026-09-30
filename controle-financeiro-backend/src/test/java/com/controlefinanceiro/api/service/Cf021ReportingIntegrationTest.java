package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.investment.InvestType;
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.investment.InvestTransaction;
import com.controlefinanceiro.api.domain.investment.InvestTransactionRepository;
import com.controlefinanceiro.api.domain.investment.InvestTransType;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@org.springframework.context.annotation.Import(Cf021ReportingIntegrationTest.FixedClock.class)
class Cf021ReportingIntegrationTest extends PostgresIntegrationTest {
    private static final LocalDate DAY = LocalDate.of(2026, 9, 7);

    @TestConfiguration
    static class FixedClock {
        @Bean @Primary Clock reportTestClock() {
            return Clock.fixed(Instant.parse("2026-09-28T12:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        }
    }

    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired TransactionRepository transactions;
    @Autowired InvestmentRepository investments;
    @Autowired InvestTransactionRepository investmentOperations;
    @Autowired CreditCardRepository cards;
    @Autowired InvoiceRepository invoices;
    @Autowired CardTransactionRepository cardTransactions;
    @Autowired CardRefundRepository refunds;
    @Autowired CategoryRepository categories;
    @Autowired DashboardService dashboard;
    @Autowired AnnualSummaryService annual;
    @Autowired TransactionService transactionService;
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;

    @Test
    void authenticatedSummaryAndExportExposeSamePeriodAndRejectIncompletePeriod() throws Exception {
        User owner = new User();
        owner.setNome("CF021 contrato HTTP");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(BigDecimal.ZERO);
        account = accounts.save(account);
        save(owner, account, "12.34", TransactionType.INCOME, TransactionOrigin.USER, true, DAY);
        String auth = "Bearer " + tokens.generateToken(owner);

        mvc.perform(get("/transactions/summary?month=9&year=2026&page=99")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entries").isEmpty())
                .andExpect(jsonPath("$.coverage.state").value("UNKNOWN_ORIGIN"))
                .andExpect(jsonPath("$.observed.entries").value("12.34"))
                .andExpect(jsonPath("$.observed.exits").value("0.00"))
                .andExpect(jsonPath("$.observed.balance").value("12.34"));
        byte[] xlsx = mvc.perform(get("/transactions/export?month=9&year=2026")
                        .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            assertThat(new BigDecimal(workbook.getSheetAt(0).getRow(2).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(12.34);
        }
        mvc.perform(get("/transactions/export?month=9").header("Authorization", auth))
                .andExpect(status().isBadRequest());
    }

    @Test
    void periodResultExcludesOpeningPendingTransferAndInvestmentPrincipal() throws Exception {
        User owner = new User();
        owner.setNome("CF021");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("1000.00"));
        account = accounts.save(account);

        save(owner, account, "1000.00", TransactionType.INCOME, TransactionOrigin.ACCOUNT_OPENING, true, DAY);
        save(owner, account, "100.00", TransactionType.INCOME, TransactionOrigin.USER, true, DAY);
        save(owner, account, "250.00", TransactionType.INCOME, TransactionOrigin.USER, false, DAY);
        save(owner, account, "40.00", TransactionType.EXPENSE, TransactionOrigin.USER, true, DAY);
        save(owner, account, "200.00", TransactionType.EXPENSE, TransactionOrigin.INVESTMENT_BUY, true, DAY);
        save(owner, account, "20.00", TransactionType.EXPENSE, TransactionOrigin.INVOICE_PAYMENT, true, DAY);
        save(owner, account, "9.00", TransactionType.EXPENSE, TransactionOrigin.USER, true, DAY.minusYears(1));

        var month = dashboard.getMonthlyFlow(owner, 9, 2026);
        assertThat(month.observed().income()).isEqualByComparingTo("100.00");
        assertThat(month.observed().expense()).isEqualByComparingTo("40.00");
        assertThat(month.observed().balance()).isEqualByComparingTo("60.00");
        // Fluxo de caixa inclui principal aplicado e fatura, mas não a abertura.
        assertThat(dashboard.getWealthChart("30D", owner).getLast().observedValue())
                .isEqualByComparingTo("-160.00");
        var year = annual.getSummary(owner, 2026);
        assertThat(year.balance().observed().income()).isEqualByComparingTo("100.00");
        assertThat(year.balance().observed().expense()).isEqualByComparingTo("40.00");
        assertThat(year.balance().observed().balance()).isEqualByComparingTo("60.00");
        assertThat(annual.getSummary(owner, 2025).balance().observed().expense()).isEqualByComparingTo("9.00");
        assertThat(annual.getSummary(owner, 2026).comparison().incomeGrowthPercentage()).isNull();
        var cash = transactionService.getCashSummary(owner, 9, 2026, null, null);
        assertThat(cash.observed().entries()).isEqualByComparingTo("100.00");
        assertThat(cash.observed().exits()).isEqualByComparingTo("260.00");
        assertThat(cash.observed().balance()).isEqualByComparingTo("-160.00");

        assertThat(transactions.findFilteredByUserId(owner.getId(), DAY, DAY, null, null, PageRequest.of(0, 2))
                .getTotalElements()).isEqualTo(6);
        assertThat(transactions.findFilteredByUserId(owner.getId(), DAY, DAY, null, null, PageRequest.of(1, 2))
                .getTotalElements()).isEqualTo(6);

        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(transactionService.exportToExcel(owner)))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(new BigDecimal(sheet.getRow(2).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(100.0);
            assertThat(new BigDecimal(sheet.getRow(3).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(49.0);
        }
    }

    @Test
    void internalTransferAppearsByAccountAndCancelsInConsolidatedCash() {
        User owner = new User();
        owner.setNome("CF021 transferência");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account source = new Account();
        source.setUser(owner);
        source.setName("Origem");
        source.setType(AccountType.CHECKING);
        source.setBalance(new BigDecimal("800.00"));
        source = accounts.save(source);
        Account target = new Account();
        target.setUser(owner);
        target.setName("Destino");
        target.setType(AccountType.CHECKING);
        target.setBalance(new BigDecimal("250.00"));
        target = accounts.save(target);
        Transaction outbound = save(owner, source, "200.00", TransactionType.TRANSFER,
                TransactionOrigin.TRANSFER, true, DAY);
        outbound.setTransferDirection(TransferDirection.OUTBOUND);
        Transaction inbound = save(owner, target, "200.00", TransactionType.TRANSFER,
                TransactionOrigin.TRANSFER, true, DAY);
        inbound.setTransferDirection(TransferDirection.INBOUND);
        save(owner, source, "2.00", TransactionType.EXPENSE, TransactionOrigin.TRANSFER_FEE, true, DAY);

        var all = transactionService.getCashSummary(owner, 9, 2026, null, null);
        assertThat(all.observed().entries()).isEqualByComparingTo("0.00");
        assertThat(all.observed().exits()).isEqualByComparingTo("2.00");
        var from = transactionService.getCashSummary(owner, 9, 2026, null, source.getId());
        assertThat(from.observed().entries()).isEqualByComparingTo("0.00");
        assertThat(from.observed().exits()).isEqualByComparingTo("202.00");
        var to = transactionService.getCashSummary(owner, 9, 2026, null, target.getId());
        assertThat(to.observed().entries()).isEqualByComparingTo("200.00");
        assertThat(to.observed().exits()).isEqualByComparingTo("0.00");

        Transaction undoOut = save(owner, source, "200.00", TransactionType.TRANSFER,
                TransactionOrigin.REVERSAL, true, DAY.plusMonths(1));
        undoOut.setReversalOfId(outbound.getId());
        Transaction undoIn = save(owner, target, "200.00", TransactionType.TRANSFER,
                TransactionOrigin.REVERSAL, true, DAY.plusMonths(1));
        undoIn.setReversalOfId(inbound.getId());
        var sourceReversal = transactionService.getCashSummary(owner, 10, 2026, null, source.getId());
        assertThat(sourceReversal.observed().entries()).isEqualByComparingTo("200.00");
        assertThat(sourceReversal.observed().exits()).isEqualByComparingTo("0.00");
        assertThat(sourceReversal.observed().balance()).isEqualByComparingTo("200.00");
        var targetReversal = transactionService.getCashSummary(owner, 10, 2026, null, target.getId());
        assertThat(targetReversal.observed().entries()).isEqualByComparingTo("0.00");
        assertThat(targetReversal.observed().exits()).isEqualByComparingTo("200.00");
        assertThat(targetReversal.observed().balance()).isEqualByComparingTo("-200.00");
        assertThat(transactionService.getCashSummary(owner, 10, 2026, null, null).observed().balance())
                .isEqualByComparingTo("0.00");
    }

    @Test
    void reversingInvestmentPrincipalDoesNotCreateNegativeConsumption() throws Exception {
        User owner = new User();
        owner.setNome("CF021 estorno principal");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(BigDecimal.ZERO);
        account = accounts.save(account);
        Transaction buy = save(owner, account, "200.00", TransactionType.EXPENSE,
                TransactionOrigin.INVESTMENT_BUY, true, DAY);
        Transaction reversal = save(owner, account, "200.00", TransactionType.EXPENSE,
                TransactionOrigin.REVERSAL, true, DAY.plusDays(1));
        reversal.setReversalOfId(buy.getId());

        assertThat(dashboard.getMonthlyFlow(owner, 9, 2026).observed().expense()).isEqualByComparingTo("0.00");
        var cash = transactionService.getCashSummary(owner, 9, 2026, null, null);
        assertThat(cash.observed().entries()).isEqualByComparingTo("200.00");
        assertThat(cash.observed().exits()).isEqualByComparingTo("200.00");
        assertThat(cash.observed().balance()).isEqualByComparingTo("0.00");
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(
                transactionService.exportToExcel(owner, 9, 2026, null, null)))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(new BigDecimal(sheet.getRow(3).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(0.0);
            assertThat(sheet.getRow(8).getCell(10)).isNull();
            assertThat(sheet.getRow(9).getCell(10)).isNull();
        }
    }

    @Test
    void exportTraversesSecondDatabasePageWithoutChangingGlobalTotal() throws Exception {
        User owner = new User();
        owner.setNome("CF021 paginação");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(BigDecimal.ZERO);
        account = accounts.save(account);
        for (int i = 0; i < 501; i++) {
            save(owner, account, "0.01", TransactionType.INCOME, TransactionOrigin.USER, true, DAY);
        }
        assertThat(transactions.findFilteredByUserId(owner.getId(), DAY, DAY, null, null,
                PageRequest.of(0, 30)).getTotalElements()).isEqualTo(501);
        assertThat(transactions.findFilteredByUserId(owner.getId(), DAY, DAY, null, null,
                PageRequest.of(1, 30)).getTotalElements()).isEqualTo(501);
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(transactionService.exportToExcel(owner)))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(new BigDecimal(sheet.getRow(2).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(5.01);
            assertThat(sheet.getLastRowNum()).isEqualTo(508);
            assertThat(sheet.getRow(508).getCell(0).getStringCellValue()).isEqualTo("07/09/2026");
        }
    }

    @Test
    void investmentPrincipalIsExcludedButRealizedGainIsItsOwnLine() throws Exception {
        User owner = new User();
        owner.setNome("CF021 venda");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("99.00"));
        account = accounts.save(account);
        save(owner, account, "99.00", TransactionType.INCOME, TransactionOrigin.INVESTMENT_SELL, true, DAY);
        Investment asset = new Investment();
        asset.setUser(owner);
        asset.setTicker("TEST3");
        asset.setName("Ativo sintético");
        asset.setType(InvestType.STOCK);
        asset.setQuantityAndCost(new BigDecimal("6"), new BigDecimal("121.20"));
        asset.evaluate(new BigDecimal("25.00"), DAY, "USER_PROVIDED");
        asset = investments.save(asset);
        InvestTransaction sale = new InvestTransaction();
        sale.setInvestment(asset);
        sale.setType(InvestTransType.SELL);
        sale.setDate(DAY.atTime(10, 0));
        sale.setOperationDate(DAY);
        sale.setQuantity(new BigDecimal("4"));
        sale.setPrice(new BigDecimal("25.00"));
        sale.setTotalValue(new BigDecimal("100.00"));
        sale.setFees(new BigDecimal("1.00"));
        sale.setCostDelta(new BigDecimal("80.80"));
        sale.setRealizedResult(new BigDecimal("18.20"));
        investmentOperations.save(sale);

        var month = dashboard.getMonthlyFlow(owner, 9, 2026);
        assertThat(month.observed().income()).isEqualByComparingTo("0.00");
        assertThat(month.observed().investmentResult()).isEqualByComparingTo("18.20");
        assertThat(month.observed().balance()).isEqualByComparingTo("18.20");
        var year = annual.getSummary(owner, 2026).balance();
        assertThat(year.observed().income()).isEqualByComparingTo("0.00");
        assertThat(year.observed().investmentResult()).isEqualByComparingTo("18.20");
        assertThat(year.observed().balance()).isEqualByComparingTo("18.20");
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(
                transactionService.exportToExcel(owner, 9, 2026, null, null)))) {
            assertThat(new BigDecimal(workbook.getSheetAt(0).getRow(6).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(18.20);
            assertThat(workbook.getSheetAt(0).getRow(8).getCell(9)).isNull();
        }
        sale.setRealizedResult(null);
        investmentOperations.saveAndFlush(sale);
        assertThat(annual.getSummary(owner, 2026).balance().observed().balance()).isNull();
    }

    @Test
    void cardConsumptionAndRefundAppearOnceInDashboardAnnualAndPeriodExport() throws Exception {
        User owner = new User();
        owner.setNome("CF021 cartão");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Account account = new Account();
        account.setUser(owner);
        account.setName("Conta sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal("1000.00"));
        account = accounts.save(account);
        save(owner, account, "50.00", TransactionType.INCOME, TransactionOrigin.USER, true, DAY);
        save(owner, account, "40.00", TransactionType.EXPENSE, TransactionOrigin.USER, true, DAY);
        save(owner, account, "20.00", TransactionType.EXPENSE, TransactionOrigin.INVOICE_PAYMENT, true, DAY);

        Category category = new Category();
        category.setUser(owner);
        category.setName("Compras sintéticas");
        category.setType(TransactionType.EXPENSE);
        category = categories.save(category);
        CreditCard card = new CreditCard();
        card.setUser(owner);
        card.setName("Cartão sintético");
        card.setLimit(new BigDecimal("1000.00"));
        card.setClosingDay(20);
        card.setDueDay(28);
        card = cards.save(card);
        Invoice invoice = new Invoice();
        invoice.setCard(card);
        invoice.setYear(2026);
        invoice.setMonth(9);
        invoice.setStatus(InvoiceStatus.OPEN);
        invoice = invoices.save(invoice);
        CardTransaction purchase = new CardTransaction();
        purchase.setInvoice(invoice);
        purchase.setCategory(category);
        purchase.setDescription("Compra CF021");
        purchase.setAmount(new BigDecimal("120.00"));
        purchase.setOrigin(CardTransactionOrigin.PURCHASE);
        purchase.setDate(DAY);
        purchase.setCreatedAt(DAY.atTime(10, 0));
        purchase = cardTransactions.save(purchase);
        CardRefund refund = new CardRefund();
        refund.setCard(card);
        refund.setCategory(category);
        refund.setPurchaseId(purchase.getId());
        refund.setAmount(new BigDecimal("20.00"));
        refund.setCreditCreated(BigDecimal.ZERO);
        refund.setRefundDate(DAY.plusDays(1));
        refund.setCreatedAt(DAY.atStartOfDay(java.time.ZoneOffset.UTC).toInstant());
        refunds.save(refund);

        assertThat(dashboard.getMonthlyFlow(owner, 9, 2026).observed().expense()).isEqualByComparingTo("140.00");
        var summary = annual.getSummary(owner, 2026);
        assertThat(summary.balance().observed().expense()).isEqualByComparingTo("140.00");
        assertThat(summary.creditCard().observed().totalSpent()).isEqualByComparingTo("100.00");
        assertThat(dashboard.getPeriodTotals(owner, DAY.withDayOfMonth(1), DAY.withDayOfMonth(30),
                null, account.getId()).expense()).isEqualByComparingTo("40.00");

        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(
                transactionService.exportToExcel(owner, 9, 2026, null, null)))) {
            assertThat(new BigDecimal(workbook.getSheetAt(0).getRow(3).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(140.0);
            var cardSheet = workbook.getSheet("Consumo cartão");
            assertThat(cardSheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("07/09/2026");
            assertThat(cardSheet.getRow(1).getCell(3).getNumericCellValue()).isEqualTo(120.0);
            assertThat(cardSheet.getRow(2).getCell(0).getStringCellValue()).isEqualTo("08/09/2026");
            assertThat(cardSheet.getRow(2).getCell(3).getNumericCellValue()).isEqualTo(-20.0);
        }
        try (var workbook = new XSSFWorkbook(new ByteArrayInputStream(
                transactionService.exportToExcel(owner, 9, 2026, null, account.getId())))) {
            assertThat(new BigDecimal(workbook.getSheetAt(0).getRow(3).getCell(2).getStringCellValue()).doubleValue()).isEqualTo(40.0);
            assertThat(workbook.getSheet("Consumo cartão")).isNull();
        }
    }

    @Test
    void selectedFlowYearKeepsSeparatelyDatedCurrentPositionAndCostIsNotAddedToValue() {
        User owner = new User();
        owner.setNome("CF021 posição");
        owner.setEmail(UUID.randomUUID() + "@example.invalid");
        owner.setSenha("synthetic");
        owner = users.save(owner);
        Investment asset = new Investment();
        asset.setUser(owner);
        asset.setTicker("TEST3");
        asset.setName("Ativo sintético");
        asset.setType(InvestType.STOCK);
        asset.setQuantityAndCost(new BigDecimal("10"), new BigDecimal("400.00"));
        asset.evaluate(new BigDecimal("50.00"), DAY, "USER_PROVIDED");
        investments.save(asset);

        // DEC04/FIN08: current position is independently dated, not a 2025 closing snapshot.
        var currentInPastReport=annual.getSummary(owner,2025).investments();
        assertThat(currentInPastReport.totalValue()).isEqualByComparingTo("500.00");
        assertThat(currentInPastReport.valuationAsOf()).isEqualTo(LocalDate.of(2026,9,28));
        assertThat(currentInPastReport.items().getFirst().valuationDate()).isEqualTo(DAY);
        assertThat(currentInPastReport.items().getFirst().valuationSource()).isEqualTo("USER_PROVIDED");
        assertThat(annual.getSummary(owner, 2026).investments().totalValue())
                .isEqualByComparingTo("500.00");
        Investment withoutQuote = new Investment();
        withoutQuote.setUser(owner);
        withoutQuote.setTicker("SEM1");
        withoutQuote.setName("Sem avaliação");
        withoutQuote.setType(InvestType.STOCK);
        withoutQuote.setQuantityAndCost(BigDecimal.ONE, new BigDecimal("50.00"));
        investments.save(withoutQuote);
        var incomplete = annual.getSummary(owner, 2026).investments();
        assertThat(incomplete.totalCost()).isEqualByComparingTo("450.00");
        assertThat(incomplete.totalValue()).isNull();
        assertThat(incomplete.valuationComplete()).isFalse();
    }

    private Transaction save(User user, Account account, String amount, TransactionType type,
                      TransactionOrigin origin, boolean paid, LocalDate date) {
        Transaction transaction = new Transaction();
        transaction.setUser(user);
        transaction.setAccount(account);
        transaction.setDescription("CF021 " + origin);
        transaction.setAmount(new BigDecimal(amount));
        transaction.setType(type);
        transaction.setOrigin(origin);
        transaction.setDate(date);
        transaction.setCreatedAt(LocalDateTime.of(2026, 9, 7, 10, 0));
        transaction.setPaid(paid);
        return transactions.save(transaction);
    }
}
