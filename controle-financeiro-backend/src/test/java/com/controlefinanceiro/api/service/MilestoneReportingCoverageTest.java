package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import java.io.ByteArrayInputStream;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
@org.springframework.context.annotation.Import(MilestoneReportingCoverageTest.FixedClock.class)
class MilestoneReportingCoverageTest extends PostgresIntegrationTest {
    @org.springframework.boot.test.context.TestConfiguration static class FixedClock {
        @org.springframework.context.annotation.Bean @org.springframework.context.annotation.Primary Clock clock(){return Clock.fixed(Instant.parse("2026-09-30T12:00:00Z"),ZoneOffset.UTC);}
    }
    @Autowired UserRepository users; @Autowired AccountService accounts; @Autowired TransactionService ledger;
    @Autowired DashboardService dashboard; @Autowired AnnualSummaryService annual; @Autowired JdbcTemplate sql;
    @Autowired InvestmentService investments;

    @Test void coveredEmptyZeroDiffersFromAbsentHistoricalAndFuturePeriods() throws Exception {
        var u=user();var a=account(u);
        var covered=ledger.getCashSummary(u,9,2026,null,a);
        assertThat(covered.coverage().state()).isEqualTo("COMPLETE");assertThat(covered.entries()).isZero();assertThat(covered.balance()).isZero();
        var before=ledger.getCashSummary(u,7,2026,null,a);
        assertThat(before.coverage().state()).isEqualTo("UNAVAILABLE");assertThat(before.entries()).isNull();assertThat(before.observed().entries()).isZero();
        var future=ledger.getCashSummary(u,10,2026,null,a);
        assertThat(future.coverage().state()).isEqualTo("UNAVAILABLE");assertThat(future.balance()).isNull();
        assertThat(annual.getSummary(u,2025).balance().totalIncome()).isNull();
        assertThat(annual.getSummary(u,2026).balance().coverage().state()).isEqualTo("PARTIAL");
        try(var book=new XSSFWorkbook(new ByteArrayInputStream(ledger.exportToExcel(u,7,2026,null,a)))){
            assertThat(book.getSheetAt(0).getRow(2).getCell(1).getStringCellValue()).startsWith("Indisponível");
            assertThat(book.getSheetAt(0).getRow(2).getCell(2).getStringCellValue()).isEqualTo("0.00");
            assertThat(book.getSheet("Cobertura").getRow(0).getCell(0).getStringCellValue()).contains("UNAVAILABLE");
        }
    }
    @Test void unknownBaseAndUnknownFactRetainObservedAmountAndRespectOwnerAndScope(){
        var u=user();var a=account(u);var b=account(u);income(u,a,"12.34");
        sql.update("update accounts set opening_origin=null,opening_date=null,opening_balance=null,opening_recorded_at=null where id=?",b);
        var global=dashboard.getMonthlyFlow(u,9,2026);
        assertThat(global.coverage().state()).isEqualTo("UNKNOWN_ORIGIN");assertThat(global.income()).isNull();assertThat(global.observed().income()).isEqualByComparingTo("12.34");
        assertThat(ledger.getCashSummary(u,9,2026,null,a).entries()).isEqualByComparingTo("12.34");
        accounts.delete(b,u);assertThat(dashboard.getMonthlyFlow(u,9,2026).income()).isNull();
        sql.update("update transactions set origin=null where account_id=? and origin='USER'",a);
        assertThat(ledger.getCashSummary(u,9,2026,null,a).coverage().state()).isEqualTo("UNKNOWN_ORIGIN");
        var other=user();assertThatThrownBy(()->ledger.getCashSummary(other,9,2026,null,a)).isInstanceOf(com.controlefinanceiro.api.service.exception.ResourceNotFoundException.class);
    }
    @Test void overflowIsUnavailableWithExactObservedDecimalAndExportText() throws Exception {
        var u=user();var a=account(u);var b=account(u);income(u,a,"999999999999.99");income(u,b,"999999999999.99");
        var flow=dashboard.getMonthlyFlow(u,9,2026);
        assertThat(flow.coverage().state()).isEqualTo("OUT_OF_RANGE");assertThat(flow.income()).isNull();assertThat(flow.observed().income()).isEqualByComparingTo("1999999999999.98");
        try(var book=new XSSFWorkbook(new ByteArrayInputStream(ledger.exportToExcel(u,9,2026,null,null)))){
            assertThat(book.getSheetAt(0).getRow(2).getCell(1).getStringCellValue()).contains("Indisponível");
            assertThat(book.getSheetAt(0).getRow(2).getCell(2).getStringCellValue()).isEqualTo("1999999999999.98");
        }
    }
    @Test void unknownTransferDirectionCannotFabricateAnObservedCashExit(){
        var u=user();var a=account(u);var b=account(u);income(u,a,"100.00");
        var transfer=ledger.create(new CreateTransactionDTO("Direção legada desconhecida",new BigDecimal("10.00"),
                LocalDate.of(2026,9,7),null,TransactionType.TRANSFER,a,null,true,b,BigDecimal.ZERO),u);
        sql.update("update transactions set origin='UNKNOWN',transfer_direction=null where id=?",transfer.id());
        var summary=ledger.getCashSummary(u,9,2026,null,a);
        assertThat(summary.coverage().state()).isEqualTo("UNKNOWN_ORIGIN");assertThat(summary.entries()).isNull();
        assertThat(summary.observed().entries()).isEqualByComparingTo("100.00");
        assertThat(summary.observed().exits()).isZero();assertThat(summary.observed().balance()).isEqualByComparingTo("100.00");
        assertThat(ledger.listAllFiltered(u,9,2026,null,a,org.springframework.data.domain.PageRequest.of(0,20)).getContent())
                .filteredOn(t->t.id().equals(transfer.id())).singleElement().satisfies(t->assertThat(t.cashDelta()).isNull());
    }
    @Test void currentInvestmentAggregateAlsoSignalsRangeWithoutLosingIndividualValues(){
        var u=user();
        for(String ticker:java.util.List.of("MAX1","MAX2"))investments.create(
                new com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO(ticker,ticker,
                    com.controlefinanceiro.api.domain.investment.InvestType.STOCK,null,BigDecimal.ONE,
                    new BigDecimal("999999999999.99"),new BigDecimal("999999999999.99"),LocalDate.of(2026,9,30),"USER_PROVIDED"),u);
        var position=annual.getSummary(u,2025).investments();
        assertThat(position.outsideSupportedRange()).isTrue();assertThat(position.totalValue()).isNull();assertThat(position.totalCost()).isNull();
        assertThat(position.observedValue()).isEqualByComparingTo("1999999999999.98");assertThat(position.items()).hasSize(2);
        assertThat(position.items().getFirst().value()).isEqualByComparingTo("999999999999.99");
    }
    private User user(){var u=new User();u.setNome("Coverage");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    private UUID account(User u){return accounts.create(new CreateAccountDTO("Fonte",AccountType.CHECKING,BigDecimal.ZERO,"BLUE",LocalDate.of(2026,8,1)),u).id();}
    private void income(User u,UUID a,String amount){ledger.create(new CreateTransactionDTO("Entrada observada",new BigDecimal(amount),LocalDate.of(2026,9,7),null,TransactionType.INCOME,a,null,true),u);}
}
