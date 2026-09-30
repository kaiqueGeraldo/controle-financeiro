package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

@org.springframework.boot.test.context.SpringBootTest(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@org.springframework.test.context.ContextConfiguration(initializers=com.controlefinanceiro.api.migration.EmptyMigrationTestInitializer.class,inheritInitializers=false)
class MilestoneCashPresentationTest extends PostgresIntegrationTest {
    private static final LocalDate DAY=LocalDate.of(2026,9,7);
    @Autowired AccountService accounts;
    @Autowired UserRepository users;
    @Autowired InvestmentService investments;
    @Autowired TransactionService ledger;
    @Autowired DashboardService dashboard;
    @Autowired JdbcTemplate sql;

    @Test void E27_httpProjectionAndXlsxKeepGross10Fee1AndOneNetCash9() throws Exception {
        var u=user();var a=account(u,"1000.00");
        var i=investments.create(new CreateInvestmentDTO("E27","Provento",InvestType.STOCK,null,m("10"),m("200"),m("250"),DAY,"USER_PROVIDED"),u).id();
        investments.performOperation(new InvestmentOperationDTO(i,InvestTransType.DIVIDEND,m("1"),m("10"),m("1"),DAY,a),u);
        assertThat(sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a)).isEqualByComparingTo("1009");
        var rows=ledger.listAllFiltered(u,9,2026,null,a,PageRequest.of(0,20)).getContent();
        var income=rows.stream().filter(t->t.origin()==TransactionOrigin.INVESTMENT_DIVIDEND).findFirst().orElseThrow();
        var fee=rows.stream().filter(t->t.origin()==TransactionOrigin.INVESTMENT_FEE).findFirst().orElseThrow();
        assertThat(income.amount()).isEqualByComparingTo("10");assertThat(income.cashAmount()).isEqualByComparingTo("9");assertThat(income.cashDelta()).isEqualByComparingTo("9");
        assertThat(fee.amount()).isEqualByComparingTo("1");assertThat(fee.cashAmount()).isZero();assertThat(fee.cashDelta()).isZero();
        assertThat(dashboard.getPeriodTotals(u,DAY,DAY,null,null).income()).isEqualByComparingTo("10");
        assertThat(dashboard.getPeriodTotals(u,DAY,DAY,null,null).expense()).isEqualByComparingTo("1");
        assertThat(ledger.getCashSummary(u,9,2026,null,a).observed().entries()).isEqualByComparingTo("9");
        assertThat(ledger.getCashSummary(u,9,2026,null,a).observed().exits()).isZero();
        assertThat(ledger.listAllFiltered(user(),9,2026,null,null,PageRequest.of(0,20))).isEmpty();
        try(var book=new XSSFWorkbook(new ByteArrayInputStream(ledger.exportToExcel(u,9,2026,null,a)))){
            var sheet=book.getSheetAt(0);boolean sawIncome=false,sawFee=false;
            for(int n=8;n<=sheet.getLastRowNum();n++){
                var row=sheet.getRow(n);var origin=row.getCell(8).getStringCellValue();
                if(origin.equals("INVESTMENT_DIVIDEND")){sawIncome=true;assertThat(row.getCell(6).getNumericCellValue()).isEqualTo(10);assertThat(row.getCell(9).getNumericCellValue()).isEqualTo(10);assertThat(row.getCell(11).getNumericCellValue()).isEqualTo(9);assertThat(row.getCell(12).getNumericCellValue()).isEqualTo(9);}
                if(origin.equals("INVESTMENT_FEE")){sawFee=true;assertThat(row.getCell(6).getNumericCellValue()).isEqualTo(1);assertThat(row.getCell(10).getNumericCellValue()).isEqualTo(1);assertThat(row.getCell(11).getNumericCellValue()).isZero();assertThat(row.getCell(12).getNumericCellValue()).isZero();}
            }
            assertThat(sawIncome&&sawFee).isTrue();
        }
    }

    @Test void signedCashProjectionDistinguishesTransferLegAndReversalFromGrossFact(){
        var u=user();var a=account(u,"1000");var b=account(u,"0");
        var transfer=ledger.create(new CreateTransactionDTO("Transferência",m("200"),DAY,null,TransactionType.TRANSFER,a,null,true,b,m("0")),u);
        assertThat(transfer.cashDelta()).isEqualByComparingTo("-200");
        ledger.delete(transfer.id(),u);
        var rows=ledger.listAll(u,PageRequest.of(0,20)).getContent();
        assertThat(rows.stream().filter(t->t.type()==TransactionType.TRANSFER&&t.accountId().equals(a)).map(TransactionResponseDTO::cashDelta)).containsExactlyInAnyOrder(m("-200.00"),m("200.00"));
        assertThat(rows.stream().filter(t->t.type()==TransactionType.TRANSFER&&t.accountId().equals(b)).map(TransactionResponseDTO::cashDelta)).containsExactlyInAnyOrder(m("200.00"),m("-200.00"));
    }
    private User user(){var u=new User();u.setNome("Caixa saneamento");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u);}
    private UUID account(User u,String amount){return accounts.create(new CreateAccountDTO("Conta",AccountType.CHECKING,m(amount),"BLUE",DAY),u).id();}
    private static BigDecimal m(String value){return new BigDecimal(value);}
}
