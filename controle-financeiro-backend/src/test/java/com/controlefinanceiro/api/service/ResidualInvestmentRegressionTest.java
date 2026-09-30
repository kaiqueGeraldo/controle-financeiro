package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@ContextConfiguration(initializers = EmptyMigrationTestInitializer.class, inheritInitializers = false)
class ResidualInvestmentRegressionTest extends PostgresIntegrationTest {
    static final LocalDate DAY = LocalDate.of(2026, 9, 7);
    @Autowired InvestmentService investments;
    @Autowired InvestmentCorrectionService corrections;
    @Autowired AccountService accounts;
    @Autowired AnnualSummaryService annual;
    @Autowired DashboardService dashboard;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;

    record Fixture(User user, UUID account, UUID asset) {}
    static BigDecimal decimal(String value) { return new BigDecimal(value); }

    Fixture fixture(InvestType type, String units, String cost, String value) {
        User user = new User();
        user.setNome("Residual regression");
        user.setEmail(UUID.randomUUID() + "@example.invalid");
        user.setSenha("synthetic");
        users.save(user);
        UUID account = accounts.create(new CreateAccountDTO("Source", AccountType.CHECKING,
                decimal("1000.00"), "BLUE", DAY), user).id();
        UUID asset = investments.create(new CreateInvestmentDTO("RESIDUAL", "Residual", type, null,
                decimal(units), cost == null ? null : decimal(cost), value == null ? null : decimal(value),
                value == null ? null : DAY, value == null ? null : "USER_PROVIDED"), user).id();
        return new Fixture(user, account, asset);
    }

    UUID operation(Fixture f, InvestTransType type, String units, String price, String fee) {
        investments.performOperation(new InvestmentOperationDTO(f.asset(), type, decimal(units),
                decimal(price), decimal(fee), DAY, f.account()), f.user());
        return sql.queryForObject("select id from invest_transactions where investment_id=? order by sequence_number desc limit 1",
                UUID.class, f.asset());
    }

    BigDecimal position(Fixture f, String column) {
        return sql.queryForObject("select " + column + " from investments where id=?", BigDecimal.class, f.asset());
    }

    CorrectInvestmentDTO cancel(String fees) {
        return new CorrectInvestmentDTO(UUID.randomUUID(), DAY.plusDays(1), "Provento comprovadamente cancelado",
                decimal(fees), null, null, null);
    }

    @ParameterizedTest
    @EnumSource(value = InvestTransType.class, names = {"DIVIDEND", "INTEREST"})
    void totalReferenceSurvivesIncomeReplayRetryAndSuccessiveSales(InvestTransType income) {
        Fixture f = fixture(InvestType.STOCK, "3", "3.00", "1.00");
        UUID firstSale = operation(f, InvestTransType.SELL, "1", "1.00", "0.00");
        var original = sql.queryForMap("select * from invest_transactions where id=?", firstSale);
        UUID provento = operation(f, income, "1", "1.00", "0.10");
        var command = cancel("0.10");
        var receipt = corrections.correct(provento, command, f.user());
        var corrected = sql.queryForMap("select * from investments where id=?", f.asset());
        assertThat(corrected.get("valuation_basis")).isEqualTo("TOTAL");
        assertThat(corrected.get("valuation_date")).isEqualTo(java.sql.Date.valueOf(DAY));
        assertThat(corrected.get("valuation_source")).isEqualTo("USER_PROVIDED");
        assertThat(position(f, "valuation_reference_amount")).isEqualByComparingTo("1.00");
        assertThat(position(f, "valuation_reference_quantity")).isEqualByComparingTo("3");
        assertThat(position(f, "quantity")).isEqualByComparingTo("2");
        assertThat(position(f, "total_cost")).isEqualByComparingTo("2.00");
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("0.67");
        assertThat(receipt.getCashDelta()).isEqualByComparingTo("-0.90");
        assertThat(receipt.getRealizedDelta()).isZero();
        assertThat(corrections.correct(provento, command, f.user()).getId()).isEqualTo(receipt.getId());
        assertThat(sql.queryForObject("select count(*) from investment_corrections where investment_id=?", Integer.class, f.asset())).isOne();
        assertThat(sql.queryForObject("select count(*) from investment_valuations where investment_id=?", Integer.class, f.asset())).isZero();
        assertThat(sql.queryForMap("select * from invest_transactions where id=?", firstSale)).isEqualTo(original);
        assertThat(corrections.history(f.asset(), f.user()).getFirst().getReason()).isEqualTo(command.reason());
        for (String remaining : new String[]{"0.33", "0.00"}) {
            operation(f, InvestTransType.SELL, "1", "1.00", "0.00");
            assertThat(position(f, "valuation_amount")).isEqualByComparingTo(remaining);
        }
        assertThat(investments.listAll(f.user()).getFirst().totalCost()).isZero();
        assertThat(sql.queryForObject("select balance from accounts where id=?", BigDecimal.class, f.account())).isEqualByComparingTo("1003.00");
    }

    @Test
    void priceValuationRemainsPriceThroughReplacementAndReopening() {
        Fixture f = fixture(InvestType.STOCK, "3", "3.00", null);
        // Explicit persisted PRICE declaration, never a total derived from 0.66.
        sql.update("update investments set valuation_basis='PRICE',current_price=0.33333333,valuation_amount=1.00,valuation_date=?,valuation_source='BANK_STATEMENT' where id=?", DAY, f.asset());
        operation(f, InvestTransType.SELL, "1", "1.00", "0.00");
        UUID income = operation(f, InvestTransType.DIVIDEND, "1", "1.00", "0.00");
        corrections.correct(income, new CorrectInvestmentDTO(UUID.randomUUID(), DAY.plusDays(1),
                "Provento substituído", decimal("0.00"), decimal("1"), decimal("2.00"), decimal("0.00")), f.user());
        assertThat(sql.queryForObject("select valuation_basis from investments where id=?", String.class, f.asset())).isEqualTo("PRICE");
        assertThat(position(f, "current_price")).isEqualByComparingTo("0.33333333");
        assertThat(position(f, "valuation_reference_amount")).isNull();
        assertThat(position(f, "valuation_reference_quantity")).isNull();
        assertThat(position(f, "total_cost")).isEqualByComparingTo("2.00");
        assertThat(investments.listAll(f.user()).getFirst().valuationSource()).isEqualTo("BANK_STATEMENT");
        operation(f, InvestTransType.SELL, "1", "1.00", "0.00");
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("0.33");
        UUID last = operation(f, InvestTransType.SELL, "1", "1.00", "0.00");
        assertThat(position(f, "valuation_amount")).isZero();
        corrections.correct(last, cancel("0.00"), f.user());
        assertThat(position(f, "quantity")).isEqualByComparingTo("1");
        assertThat(position(f, "total_cost")).isEqualByComparingTo("1.00");
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("0.33");
    }

    @Test
    void quantityCorrectionUsesOriginalTotalDeclarationInsteadOfIntermediateValue() {
        Fixture f = fixture(InvestType.STOCK, "3", "3.00", "1.00");
        UUID buy = operation(f, InvestTransType.BUY, "3", "1.00", "0.00");
        operation(f, InvestTransType.SELL, "2", "1.00", "0.00");
        corrections.correct(buy, new CorrectInvestmentDTO(UUID.randomUUID(), DAY.plusDays(1),
                "Quantidade adquirida corrigida", decimal("0.00"), decimal("2"), decimal("1.00"), decimal("0.00")), f.user());
        assertThat(position(f, "quantity")).isEqualByComparingTo("3");
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("1.00");
        assertThat(position(f, "valuation_reference_quantity")).isEqualByComparingTo("3");
        operation(f, InvestTransType.SELL, "2", "1.00", "0.00");
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("0.33");
    }

    @Test
    void unknownOpenCostAndHistoricalGainStayUnknownWhileClosedPositionIsKnownZero() {
        Fixture f = fixture(InvestType.STOCK, "10", null, null);
        UUID partial = operation(f, InvestTransType.SELL, "4", "25.00", "1.00");
        assertThat(position(f, "quantity")).isEqualByComparingTo("6");
        assertThat(position(f, "total_cost")).isNull();
        assertThat(annual.getSummary(f.user(), 2026).investments().totalCost()).isNull();
        UUID last = operation(f, InvestTransType.SELL, "6", "25.00", "1.00");
        var reload = investments.listAll(f.user()).getFirst();
        assertThat(reload.quantity()).isZero();
        assertThat(reload.totalCost()).isZero();
        assertThat(reload.valuationAmount()).isZero();
        assertThat(reload.valuationDate()).isNull();
        assertThat(reload.valuationSource()).isNull();
        assertThat(position(f, "replay_cost")).isNull();
        for (UUID id : new UUID[]{partial, last}) {
            var fact = sql.queryForMap("select cost_delta,realized_result from invest_transactions where id=?", id);
            assertThat(fact.get("cost_delta")).isNull();
            assertThat(fact.get("realized_result")).isNull();
        }
        var report = annual.getSummary(f.user(), 2026);
        assertThat(report.investments().totalCost()).isZero();
        assertThat(report.investments().totalValue()).isZero();
        assertThat(report.investments().valuationComplete()).isTrue();
        assertThat(report.balance().investmentResult()).isNull();
        assertThat(dashboard.getPeriodTotals(f.user(), DAY, DAY, null, null).investmentResult()).isNull();
        assertThat(sql.queryForObject("select balance from accounts where id=?", BigDecimal.class, f.account())).isEqualByComparingTo("1248.00");
    }

    @Test
    void finalMonetaryRedemptionWithUnknownCostDoesNotInventHistoricalGain() {
        Fixture f = fixture(InvestType.FIXED_INCOME, "10", null, "250.00");
        investments.performOperation(new InvestmentOperationDTO(f.asset(), InvestTransType.SELL, null,
                null, decimal("1.00"), DAY, f.account(), decimal("250.00")), f.user());
        assertThat(position(f, "total_cost")).isZero();
        assertThat(position(f, "quantity")).isZero();
        assertThat(position(f, "valuation_amount")).isZero();
        assertThat(investments.getHistory(f.asset(), f.user()).getFirst().realizedResult()).isNull();
        assertThat(position(f, "replay_cost")).isNull();
    }

    @Test
    void legacyClosedRawCostRemainsStoredWhileCurrentPositionIsKnownZero() {
        Fixture f = fixture(InvestType.STOCK, "0", null, null);
        sql.update("update investments set total_cost=null,valuation_amount=0.00,reporting_known_from=null where id=?", f.asset());
        assertThat(position(f, "total_cost")).isNull();
        assertThat(position(f, "valuation_amount")).isZero();
        var current = investments.listAll(f.user()).getFirst();
        assertThat(current.totalCost()).isZero();
        assertThat(current.valuationAmount()).isZero();
        assertThat(current.valuationDate()).isNull();
        assertThat(current.valuationSource()).isNull();
        var report = annual.getSummary(f.user(), 2026);
        assertThat(report.investments().totalCost()).isZero();
        assertThat(report.investments().totalValue()).isZero();
        assertThat(report.balance().coverage().complete()).isFalse();
        assertThat(position(f, "total_cost")).isNull();
        assertThat(sql.queryForObject("select reporting_known_from from investments where id=?", LocalDate.class, f.asset())).isNull();
    }

    @Test
    void extremeTotalReferenceSurvivesCompensationBetweenHalfAndFinalSale() {
        Fixture f = fixture(InvestType.STOCK, "200000000", "1.00", "1.00");
        operation(f, InvestTransType.SELL, "100000000", "0.00000001", "0.00");
        UUID income = operation(f, InvestTransType.DIVIDEND, "1", "1.00", "0.00");
        corrections.correct(income, cancel("0.00"), f.user());
        assertThat(position(f, "valuation_amount")).isEqualByComparingTo("0.50");
        assertThat(position(f, "valuation_reference_quantity")).isEqualByComparingTo("200000000");
        assertThat(position(f, "valuation_reference_amount")).isEqualByComparingTo("1.00");
        operation(f, InvestTransType.SELL, "100000000", "0.00000001", "0.00");
        assertThat(position(f, "valuation_amount")).isZero();
        assertThat(position(f, "total_cost")).isZero();
    }
}
