package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class MilestoneReportingPositionTest extends PostgresIntegrationTest {
    private static final LocalDate DAY=LocalDate.of(2026,9,7);
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired InvestmentService investments;
    @Autowired AnnualSummaryService annual;
    @Autowired TransactionService ledger;
    @Autowired DashboardService dashboard;
    @Autowired CreditCardService cards;
    @Autowired CategoryRepository categories;

    @Test void archivedBalanceRemainsInPositionButNotInSourcePickerAndIsOwnerScoped() {
        var u=user();var a=account(u,"1000.00");accounts.delete(a,u);
        assertThat(accounts.listAll(u)).isEmpty();
        assertThat(accounts.position(u).totalBalance()).isEqualTo("1000.00");
        account(u,"-100.00");
        var p=accounts.position(u);
        assertThat(p.totalBalance()).isEqualTo("900.00");
        assertThat(p.checkingBalance()).isEqualTo("900.00");
        assertThat(p.archivedBalance()).isEqualTo("1000.00");
        assertThat(p.accounts()).hasSize(2);
        assertThat(p.outsideSupportedRange()).isFalse();
        var other=accounts.position(user());
        assertThat(new BigDecimal(other.totalBalance())).isZero();assertThat(other.accounts()).isEmpty();
    }

    @Test void aggregateOverflowIsExactAndExplicitRatherThanRoundedOrClamped() {
        var u=user();account(u,"999999999999.99");account(u,"1.00");
        assertThat(accounts.position(u).totalBalance()).isEqualTo("1000000000000.99");
        assertThat(accounts.position(u).outsideSupportedRange()).isTrue();
    }

    @Test void selectedFlowYearDoesNotRemoveCurrentPositionOrIndividualValuationMetadata() {
        var u=user();
        investments.create(new CreateInvestmentDTO("META","Ativo conhecido",InvestType.STOCK,null,m("20"),m("200"),m("500"),DAY,"USER_PROVIDED"),u);
        var now=annual.getSummary(u,2026).investments();var previous=annual.getSummary(u,2025).investments();
        assertThat(now.totalValue()).isEqualByComparingTo("500.00");
        assertThat(previous).isEqualTo(now);
        assertThat(previous.items().getFirst().valuationDate()).isEqualTo(DAY);
        assertThat(previous.items().getFirst().valuationSource()).isEqualTo("USER_PROVIDED");
        investments.create(new CreateInvestmentDTO("UNKNOWN","Ativo sem avaliação",InvestType.STOCK,null,m("1"),m("10"),null,null,null),u);
        assertThat(annual.getSummary(u,2025).investments().totalValue()).isNull();
        assertThat(annual.getSummary(u,2025).investments().valuationComplete()).isFalse();
    }

    @Test void transferScopeIsIdenticalInSummaryRowsAndExportAndDoesNotIncludeCardPurchases() throws Exception {
        var u=user();var a=account(u,"1000.00");var b=account(u,"0.00");
        var cat=new Category();cat.setUser(u);cat.setName(DefaultCategory.PAGAMENTO_FATURA.getName());cat.setType(TransactionType.EXPENSE);categories.save(cat);
        var card=cards.createCard(new CreateCardDTO("Cartão","1234",m("1000"),20,28,"VISA","BLUE"),u).id();
        cards.createTransaction(new CreateCardTransactionDTO("Consumo fora do filtro",m("100"),DAY,null,cat.getId(),card,1),u);
        ledger.create(new CreateTransactionDTO("Transferência",m("200"),DAY,null,TransactionType.TRANSFER,a,null,true,b,m("0")),u);
        var totals=dashboard.getPeriodTotals(u,DAY.withDayOfMonth(1),DAY.withDayOfMonth(30),TransactionType.TRANSFER,null);
        assertThat(totals.income()).isZero();assertThat(totals.expense()).isZero();assertThat(totals.cardConsumption()).isZero();
        try(var book=new XSSFWorkbook(new ByteArrayInputStream(ledger.exportToExcel(u,9,2026,TransactionType.TRANSFER,null)))) {
            assertThat(book.getNumberOfSheets()).isEqualTo(2);
            var sheet=book.getSheetAt(0);assertThat(sheet.getLastRowNum()).isEqualTo(9);
            assertThat(sheet.getRow(8).getCell(5).getStringCellValue()).isEqualTo("Transferência");
            assertThat(sheet.getRow(9).getCell(5).getStringCellValue()).isEqualTo("Transferência");
            assertThat(new BigDecimal(sheet.getRow(3).getCell(2).getStringCellValue())).isZero();
        }
        assertThat(dashboard.getPeriodTotals(u,DAY.withDayOfMonth(1),DAY.withDayOfMonth(30),null,null).cardConsumption()).isEqualByComparingTo("100");
    }

    private User user(){var u=new User();u.setNome("Relatório saneamento");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    private UUID account(User u,String amount){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m(amount),"BLUE",DAY),u).id();}
    private static BigDecimal m(String value){return new BigDecimal(value);}
}
