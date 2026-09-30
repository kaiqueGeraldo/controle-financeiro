package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

/** Independent literal oracles; every command commits against Flyway V1–V11. */
@SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class IndependentRemediationBoundaryTest extends PostgresIntegrationTest {
    @Autowired InvestmentService investments;
    @Autowired InvestmentCorrectionService corrections;
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    static final LocalDate DAY=LocalDate.of(2026,9,7);
    static BigDecimal money(String value) { return new BigDecimal(value); }
    record Fixture(User user,UUID account,UUID investment) {}

    Fixture fixture(String quantity,String cost,String value) {
        User user=new User(); user.setNome("Independent review");
        user.setEmail(UUID.randomUUID()+"@example.invalid"); user.setSenha("synthetic"); users.save(user);
        UUID account=accounts.create(new CreateAccountDTO("Review",AccountType.CHECKING,money("1000.00"),"BLUE",DAY),user).id();
        UUID investment=investments.create(new CreateInvestmentDTO("REVAL","Review",InvestType.STOCK,null,
                money(quantity),cost==null?null:money(cost),value==null?null:money(value),
                value==null?null:DAY,value==null?null:"USER_PROVIDED"),user).id();
        return new Fixture(user,account,investment);
    }
    UUID operation(Fixture fixture,InvestTransType type,String quantity,String price) {
        investments.performOperation(new InvestmentOperationDTO(fixture.investment(),type,money(quantity),
                money(price),money("0.00"),DAY,fixture.account()),fixture.user());
        return sql.queryForObject("select id from invest_transactions where investment_id=? order by sequence_number desc limit 1",
                UUID.class,fixture.investment());
    }
    BigDecimal position(String column,Fixture fixture) {
        // Column names are fixed literals in this test, never external input.
        return sql.queryForObject("select "+column+" from investments where id=?",BigDecimal.class,fixture.investment());
    }

    @Test void REVAL01_closingUnknownCostPositionHasZeroRemainingCostButUnknownHistoricalGain() {
        Fixture f=fixture("10",null,null);
        UUID sale=operation(f,InvestTransType.SELL,"10","25.00");
        assertThat(position("quantity",f)).isZero();
        assertThat(position("valuation_amount",f)).isZero();
        assertThat(sql.queryForObject("select realized_result from invest_transactions where id=?",BigDecimal.class,sale))
                .as("Unknown historical acquisition cost must not invent a realized gain").isNull();
        assertThat(position("total_cost",f)).as("No units remain: the current residual cost is known zero").isEqualByComparingTo("0.00");
    }

    @Test void REVAL02_dividendCompensationMustNotResetAuthoritativeValuationReference() {
        Fixture f=fixture("3","3.00","1.00");
        operation(f,InvestTransType.SELL,"1","1.00");
        assertThat(position("valuation_amount",f)).isEqualByComparingTo("0.67");
        UUID dividend=operation(f,InvestTransType.DIVIDEND,"1","1.00");
        corrections.correct(dividend,new CorrectInvestmentDTO(UUID.randomUUID(),DAY.plusDays(1),
                "Cancelamento do provento, sem nova avaliação",money("0.00"),null,null,null),f.user());
        assertThat(position("quantity",f)).isEqualByComparingTo("2");
        assertThat(position("valuation_amount",f)).isEqualByComparingTo("0.67");
        operation(f,InvestTransType.SELL,"1","1.00");
        assertThat(position("valuation_amount",f))
                .as("NG-01: original total 1.00 / 3 units leaves 0.33; compensation is not a new valuation")
                .isEqualByComparingTo("0.33");
    }
}
