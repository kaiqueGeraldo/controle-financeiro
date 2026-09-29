package com.controlefinanceiro.api.service;
import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
class MilestoneValuationTest extends PostgresIntegrationTest {
 @Autowired InvestmentService investments; @Autowired AccountService accounts;
 @Autowired UserRepository users; @Autowired JdbcTemplate sql;
 static final LocalDate DAY=LocalDate.of(2026,9,7);
 static BigDecimal m(String v){return new BigDecimal(v);}
 User user(){var u=new User();u.setNome("Valuation");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
 UUID asset(User u,String quantity,String cost,String value){return investments.create(new CreateInvestmentDTO("FIX","Fixed",InvestType.FIXED_INCOME,null,m(quantity),m(cost),m(value),DAY,"USER_PROVIDED"),u).id();}
 UUID account(User u){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m("1000.00"),"BLUE",DAY),u).id();}
 @Test void monetaryRedemptionB08ThenFinalRedemptionWithFee(){
  var u=user();var a=account(u);var i=asset(u,"1000","1000.00","1100.00");
  investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.SELL,null,null,m("0.00"),DAY,a,m("220.00")),u);
  var row=sql.queryForMap("select quantity,total_cost,valuation_amount from investments where id=?",i);
  assertThat((BigDecimal)row.get("quantity")).isEqualByComparingTo("800");
  assertThat((BigDecimal)row.get("total_cost")).isEqualByComparingTo("800.00");
  assertThat((BigDecimal)row.get("valuation_amount")).isEqualByComparingTo("880.00");
  assertThat(sql.queryForObject("select realized_result from invest_transactions where investment_id=?",BigDecimal.class,i)).isEqualByComparingTo("20.00");
  investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.SELL,null,null,m("1.00"),DAY,a,m("880.00")),u);
  assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("2099.00");
  assertThat(sql.queryForObject("select total_cost from investments where id=?",BigDecimal.class,i)).isZero();
  assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i)).isZero();
  assertThat(sql.queryForObject("select sum(realized_result) from invest_transactions where investment_id=?",BigDecimal.class,i)).isEqualByComparingTo("99.00");
 }
 @Test void referenceTotalDoesNotAccumulateRoundedPriceOrIntermediateRounding(){
  var u=user();var a=account(u);var i=asset(u,"3","1.00","1.00");
  for(String expected:new String[]{"0.67","0.33","0.00"}){
   investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.SELL,BigDecimal.ONE,BigDecimal.ONE,BigDecimal.ZERO,DAY,a),u);
   assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i)).isEqualByComparingTo(expected);
  }
 }
 @Test void totalValuationAcceptsDerivedPriceAboveInputPriceLimitAndKeepsAudit(){
  var u=user();var i=asset(u,"0.00000001","1.00","999999999999.99");
  assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i)).isEqualByComparingTo("999999999999.99");
  investments.updateBalance(new UpdateBalanceDTO(i,m("20.00"),DAY.plusDays(1),"BANK_STATEMENT","Avaliação comprovada"),u);
  var audit=sql.queryForMap("select amount,valuation_date,source,reason,recorded_at from investment_valuations where investment_id=?",i);
  assertThat(audit.get("recorded_at")).isNotNull();assertThat(audit.get("source")).isEqualTo("BANK_STATEMENT");assertThat(audit.get("reason")).isEqualTo("Avaliação comprovada");
  assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Integer.class,i)).isZero();
 }
 @Test void partialRedemptionCannotRoundAwayTheRemainingPosition(){
  var u=user();var a=account(u);var i=asset(u,"0.00000001","1.00","10.00");
  assertThatThrownBy(()->investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.SELL,null,null,BigDecimal.ZERO,DAY,a,m("9.00")),u))
    .isInstanceOf(com.controlefinanceiro.api.service.exception.BusinessRuleException.class).hasMessageContaining("precisão");
  assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("1000.00");
  assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i)).isEqualByComparingTo("10.00");
  assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?",Integer.class,i)).isZero();
 }
}
