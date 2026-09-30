package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.card.*;
import com.controlefinanceiro.api.domain.card.dto.*;
import com.controlefinanceiro.api.domain.category.*;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import java.util.List;
import java.util.Set;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Independent FIN-01..08 oracles. Red tests are intentional review findings;
 * fixtures and commands commit, and observations use fresh SQL/HTTP reads. */
@AutoConfigureMockMvc
@Import(IntegratedMilestoneReviewTest.FixedClock.class)
class IntegratedMilestoneReviewTest extends PostgresIntegrationTest {
    static final LocalDate DAY = LocalDate.of(2026, 9, 7);
    @TestConfiguration static class FixedClock {
        @Bean @Primary Clock reviewClock() {
            return Clock.fixed(Instant.parse("2027-01-31T05:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        }
    }
    @Autowired AccountService accountService;
    @Autowired TransactionService transactions;
    @Autowired InvestmentService investments;
    @Autowired GoalService goals;
    @Autowired CreditCardService cards;
    @Autowired AnnualSummaryService annual;
    @Autowired DashboardService dashboard;
    @Autowired UserRepository users;
    @Autowired CategoryRepository categories;
    @Autowired TransactionTemplate tx;
    @Autowired JdbcTemplate sql;
    @Autowired MockMvc mvc;
    @Autowired TokenService tokens;

    @Test void RV01_voluntaryTransferMustNotSpendReservedFunds() {
        User u = user(); UUID a = account(u, "1000.00"), b = account(u, "0.00");
        UUID g = goal(u);
        goals.addValue(g, new GoalDepositDTO(a, m("300.00"), "Reserva", null, null), u);
        // FIN-05: only 700 free; no release or reallocation is part of this command.
        Throwable failure = catchThrowable(() -> transactions.create(transfer(a,b,"800.00"),u));
        assertThat(balance(a)).as("rollback must preserve the reserved source").isEqualByComparingTo("1000.00");
        assertThat(failure).as("transfer must require explicit release").isNotNull();
        assertThat(balance(b)).isEqualByComparingTo("0.00");
    }

    @Test void RV02_legacyPaidToggleMustPreserveForecastAndUseSettlementDate() {
        User u=user(); UUID a=account(u,"1000.00");
        var forecast=transactions.create(new CreateTransactionDTO("Previsão",m("250.00"),
                LocalDate.of(2026,12,31),null,TransactionType.INCOME,a,null,false),u);
        UpdateTransactionDTO update=new UpdateTransactionDTO(); update.setPaid(true);
        update.setDate(LocalDate.of(2027,1,2));
        transactions.update(forecast.id(),update,u);
        assertThat(sql.queryForObject("select date from transactions where id=?",LocalDate.class,forecast.id()))
                .as("FIN-02 preserves original forecast date").isEqualTo(LocalDate.of(2026,12,31));
        assertThat(sql.queryForObject("select count(*) from transactions where settlement_of_id=?",Integer.class,forecast.id())).isEqualTo(1);
    }

    @Test void RV03_archivedAccountMustRejectInvestmentBuy() {
        User u=user(); UUID a=account(u,"1000.00"); UUID i=asset(u,null,null,null);
        accountService.delete(a,u);
        Throwable failure=catchThrowable(()->investments.performOperation(operation(i,a,InvestTransType.BUY,"1","20.00","0.00"),u));
        assertThat(balance(a)).as("B16 requires reactivation before movement").isEqualByComparingTo("1000.00");
        assertThat(failure).isNotNull();
    }

    @Test void RV04_historyBeforeOpeningMustNotBePresentedAsExactZero() {
        User u=user(); account(u,"1000.00");
        // B11: no coverage before September 2026; cannot certify 2025 zero.
        assertThat(annual.getSummary(u,2025).balance().totalIncome())
                .as("FIN-08 unknown coverage must be unavailable").isNull();
    }

    @Test void RV05_openingOnlyUserStillNeedsDatedCurrentPositionInPastYearReport() {
        User u=user(); account(u,"1000.00"); asset(u,"10","400.00","500.00");
        var position=annual.getSummary(u,2025).investments();
        assertThat(position.totalValue()).as("FIN-08 current section independent of selected year").isEqualByComparingTo("500.00");
    }

    @Test void RV06_fullySoldUnquotedAssetHasKnownZeroPosition() {
        User u=user(); UUID a=account(u,"1000.00"); UUID i=asset(u,"10","200.00",null);
        investments.performOperation(operation(i,a,InvestTransType.SELL,"10","25.00","0.00"),u);
        assertThat(sql.queryForObject("select quantity from investments where id=?",BigDecimal.class,i)).isZero();
        assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i))
                .as("zero remaining units is known zero, not unavailable quote").isEqualByComparingTo("0.00");
    }

    @Test void RV07_resizeMustNotInventMoneyFromRoundedDerivedPrice() {
        User u=user(); UUID a=account(u,"0.00");
        // Valid 12-digit quantity and known 1.00 position. Price is derived,
        // not a separately supplied market quote. Half-position should retain .50.
        UUID i=asset(u,"200000000","1.00","1.00");
        investments.performOperation(operation(i,a,InvestTransType.SELL,"100000000","0.00000001","0.00"),u);
        assertThat(sql.queryForObject("select valuation_amount from investments where id=?",BigDecimal.class,i))
                .as("half of the explicitly valued position must remain .50").isEqualByComparingTo("0.50");
    }

    @Test void RV08_netDividendCashMustMatchE27RatherThanInventGrossBankLegs() {
        User u=user(); UUID a=account(u,"1000.00"); UUID i=asset(u,"10","200.00","250.00");
        investments.performOperation(operation(i,a,InvestTransType.DIVIDEND,"1","10.00","1.00"),u);
        assertThat(balance(a)).isEqualByComparingTo("1009.00");
        assertThat(dashboard.getMonthlyFlow(u,9,2026).observed().income()).isEqualByComparingTo("10.00");
        assertThat(dashboard.getMonthlyFlow(u,9,2026).observed().expense()).isEqualByComparingTo("1.00");
        var cash=transactions.getCashSummary(u,9,2026,null,a);
        assertThat(cash.observed().entries()).as("E27 cashIn=9.00; income=10.00 is separate").isEqualByComparingTo("9.00");
        assertThat(cash.observed().exits()).isZero();
    }

    @Test void RV09_newSettlementContractRejectsJsonNumberAndExponent() throws Exception {
        User u=user(); UUID a=account(u,"1000.00");
        var f=transactions.create(new CreateTransactionDTO("Previsão",m("250.00"),DAY,null,TransactionType.INCOME,a,null,false),u);
        mvc.perform(post("/transactions/"+f.id()+"/settlements")
                .header("Authorization","Bearer "+tokens.generateToken(u)).contentType("application/json")
                .content("{\"amount\":1e2,\"date\":\"2026-09-08\"}"))
                .andExpect(status().isBadRequest());
        assertThat(balance(a)).isEqualByComparingTo("1000.00");
    }

    @Test void RV10_accountAggregateMustNotExceedContractWithoutRangeSignal() {
        User u=user(); UUID a=account(u,"999999999999.99");
        Throwable failure=catchThrowable(()->transactions.create(new CreateTransactionDTO("Limite",m("0.01"),DAY,null,TransactionType.INCOME,a,null,true),u));
        assertThat(failure).as("FIN-06 resulting position exceeds 12 monetary integer digits").isNotNull();
        assertThat(balance(a)).isEqualByComparingTo("999999999999.99");
    }

    @Test void RV11_cardRefundMustStillResolveAfterDeletingChecklistIntent() {
        User u=user(); UUID g=goal(u); UUID c=card(u); category(u,DefaultCategory.METAS.getName());
        UUID item=goals.addItem(g,new CreateGoalItemDTO("Item",null,m("120.00")),u).id();
        goals.purchaseItem(item,new PurchaseGoalItemDTO(m("120.00"),null,c,1,null),u);
        goals.deleteItem(item,u); goals.delete(g,null,u);
        assertThatCode(()->goals.refundItem(item,u)).as("FIN-07 intent deletion preserves refundable purchase link").doesNotThrowAnyException();
        assertThat(sql.queryForObject("select count(*) from card_refunds where card_id=?",Integer.class,c)).isEqualTo(1);
    }

    @Test void RV12_pendingTransferNeedsAtomicSettlementPath() {
        User u=user(); UUID a=account(u,"1000.00"),b=account(u,"50.00");
        var f=transactions.create(new CreateTransactionDTO("Transferência futura",m("200.00"),DAY,null,TransactionType.TRANSFER,a,null,false,b,m("2.00")),u);
        // RV12 identifies the missing use case, not a mandated generic endpoint.
        // FIN-02 realization preserves the original paired forecast and fee.
        assertThatCode(()->transactions.realizeTransfer(f.id(),new com.controlefinanceiro.api.domain.transaction.dto.RealizeTransferDTO(UUID.randomUUID(),DAY.plusDays(1),null,"Transferência confirmada"),u))
                .as("FIN-02 future transfer must be realizable atomically").doesNotThrowAnyException();
        assertThat(balance(a)).isEqualByComparingTo("798.00");
        assertThat(balance(b)).isEqualByComparingTo("250.00");
    }

    @Test void C01_transferVersusPaymentUsesIndependentConnectionsAndConservesEveryCommittedEffect() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),b=account(u,"50.00"),c=card(u);
        UUID cat=category(u,"Compras concorrentes");
        cards.createTransaction(new CreateCardTransactionDTO("Compra",m("100.00"),DAY,null,cat,c,1),u);
        List<Boolean> outcomes=race(()->transactions.create(transfer(a,b,"200.00"),u),
                ()->cards.payInvoice(c,new PayInvoiceDTO(a,m("100.00"),DAY,null,9,2026,"Pagamento",false,UUID.randomUUID()),u));
        assertThat(outcomes).containsExactly(true,true);
        assertThat(balance(a)).isEqualByComparingTo("700.00");assertThat(balance(b)).isEqualByComparingTo("250.00");
        assertThat(sql.queryForObject("select sum(ct.amount-ct.paid_amount-ct.refunded_amount) from card_transactions ct join invoices i on i.id=ct.invoice_id where i.card_id=?",BigDecimal.class,c)).isZero();
    }

    @Test void RV14_transferFilteredExportMustNotIncludeCardConsumption() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),b=account(u,"0.00"),c=card(u);
        cards.createTransaction(new CreateCardTransactionDTO("Compra alheia ao filtro",m("100.00"),DAY,null,category(u,"Compras"),c,1),u);
        transactions.create(transfer(a,b,"200.00"),u);
        var totals=dashboard.getPeriodTotals(u,DAY.withDayOfMonth(1),DAY.withDayOfMonth(30),TransactionType.TRANSFER,null);
        assertThat(totals.expense()).as("TRANSFER filter excludes card consumption").isZero();
    }

    @Test void RV15_zeroQuantityMustNotAcceptPositiveManualValuation() {
        User u=user();UUID i=asset(u,null,null,null);
        Throwable failure=catchThrowable(()->investments.updateBalance(new UpdateBalanceDTO(i,m("20.00")),u));
        assertThat(failure).as("zero position cannot be assigned a positive value without acquiring units").isNotNull();
    }

    @Test void RV16_checklistCardPurchaseMustAcceptApplicationClockWithNanoseconds() {
        User u=user();UUID g=goal(u),c=card(u);category(u,DefaultCategory.METAS.getName());
        UUID item=goals.addItem(g,new CreateGoalItemDTO("Item nanos",null,m("120.00")),u).id();
        Object old=org.springframework.test.util.ReflectionTestUtils.getField(goals,"clock");
        try {
            org.springframework.test.util.ReflectionTestUtils.setField(goals,"clock",Clock.fixed(Instant.parse("2027-01-15T12:00:00.123456Z"),ZoneId.of("America/Sao_Paulo")));
            assertThatCode(()->goals.purchaseItem(item,new PurchaseGoalItemDTO(m("120.00"),null,c,1,null),u)).doesNotThrowAnyException();
        } finally {org.springframework.test.util.ReflectionTestUtils.setField(goals,"clock",old);}
    }

    @Test void C05_contractMaximumKeepsCentsThroughHttpAndExcel() throws Exception {
        User u=user();UUID a=account(u,"0.00");
        transactions.create(new CreateTransactionDTO("Máximo",m("999999999999.99"),DAY,null,TransactionType.INCOME,a,null,true),u);
        mvc.perform(get("/transactions/summary?month=9&year=2026").header("Authorization","Bearer "+tokens.generateToken(u)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.observed.entries").value("999999999999.99"));
        try(var book=new org.apache.poi.xssf.usermodel.XSSFWorkbook(new java.io.ByteArrayInputStream(transactions.exportToExcel(u,9,2026,null,null)))) {
            BigDecimal cell=new BigDecimal(book.getSheetAt(0).getRow(2).getCell(2).getStringCellValue());
            assertThat(cell).isEqualByComparingTo("999999999999.99");
        }
    }

    @Test void C02_twoSettlementsCannotOverpayForecast() throws Exception {
        User u=user();UUID a=account(u,"1000.00");
        UUID f=transactions.create(new CreateTransactionDTO("Previsão concorrente",m("300.00"),DAY,null,TransactionType.INCOME,a,null,false),u).id();
        var outcomes=race(()->transactions.settle(f,new SettleTransactionDTO(m("200.00"),DAY,null),u),
                ()->transactions.settle(f,new SettleTransactionDTO(m("200.00"),DAY,null),u));
        assertThat(outcomes.stream().filter(Boolean::booleanValue).count()).isEqualTo(1);
        assertThat(balance(a)).isEqualByComparingTo("1200.00");
        assertThat(sql.queryForObject("select count(*) from transactions where settlement_of_id=?",Integer.class,f)).isEqualTo(1);
    }

    @Test void C03_twoReservationsSerializeCapacity() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),g=goal(u),h=goal(u);
        var outcomes=race(()->goals.setAllocation(g,new SetGoalAllocationDTO(a,null,m("700.00")),u),
                ()->goals.setAllocation(h,new SetGoalAllocationDTO(a,null,m("700.00")),u));
        assertThat(outcomes.stream().filter(Boolean::booleanValue).count()).isEqualTo(1);
        assertThat(sql.queryForObject("select sum(amount) from goal_allocations where account_id=?",BigDecimal.class,a)).isEqualByComparingTo("700.00");
        assertThat(balance(a)).isEqualByComparingTo("1000.00");
    }

    @Test void C04_concurrentRefundHasExactlyOneCashEffect() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),g=goal(u);
        UUID item=goals.addItem(g,new CreateGoalItemDTO("Compra concorrente",null,m("120.00")),u).id();
        goals.purchaseItem(item,new PurchaseGoalItemDTO(m("120.00"),a,null,null,null),u);
        var outcomes=race(()->goals.refundItem(item,u),()->goals.refundItem(item,u));
        assertThat(outcomes.stream().filter(Boolean::booleanValue).count()).isEqualTo(1);
        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(sql.queryForObject("select count(*) from transactions where account_id=? and origin='REVERSAL'",Integer.class,a)).isEqualTo(1);
    }

    @Test void RV13_allocationVersusVoluntaryTransferMustNotCommitDeficit() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),b=account(u,"50.00"),g=goal(u);
        CountDownLatch allocated=new CountDownLatch(1);
        race(()->{goals.setAllocation(g,new SetGoalAllocationDTO(a,null,m("700.00")),u);allocated.countDown();},
                ()->{
                    try {if(!allocated.await(15,TimeUnit.SECONDS))throw new IllegalStateException("allocation barrier");}
                    catch(InterruptedException e){throw new RuntimeException(e);}
                    transactions.create(transfer(a,b,"800.00"),u);
                });
        BigDecimal reserved=sql.queryForObject("select coalesce(sum(amount),0) from goal_allocations where account_id=?",BigDecimal.class,a);
        assertThat(balance(a).subtract(reserved)).as("no serial order may spend reserved funds voluntarily").isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    private List<Boolean> race(Runnable first,Runnable second) throws Exception {
        CountDownLatch ready=new CountDownLatch(2),go=new CountDownLatch(1);
        Set<Integer> pids=ConcurrentHashMap.newKeySet();
        try(var pool=Executors.newFixedThreadPool(2)){
            var futures=List.of(first,second).stream().map(work->pool.submit(()->{
                try {tx.executeWithoutResult(status->{
                    pids.add(sql.queryForObject("select pg_backend_pid()",Integer.class));ready.countDown();
                    try {if(!go.await(15,TimeUnit.SECONDS))throw new IllegalStateException("review barrier timeout");}
                    catch(InterruptedException e){Thread.currentThread().interrupt();throw new RuntimeException(e);}
                    work.run();
                });return true;}catch(RuntimeException e){System.out.println("REVIEW concurrent rejection: "+e.getClass().getSimpleName()+": "+e.getMessage());return false;}
            })).toList();
            assertThat(ready.await(15,TimeUnit.SECONDS)).isTrue();
            assertThat(pids).as("separate PostgreSQL connections acquired before release").hasSize(2);go.countDown();
            var results=List.of(futures.get(0).get(20,TimeUnit.SECONDS),futures.get(1).get(20,TimeUnit.SECONDS));
            System.out.println("REVIEW independent PostgreSQL pids="+pids+" outcomes="+results);return results;
        } finally {go.countDown();}
    }

    @Test void C06_newDecimalContractsRejectNumericExponentAndNeverTruncate() throws Exception {
        User u=user();UUID a=account(u,"1000.00"),g=goal(u);String auth="Bearer "+tokens.generateToken(u);
        mvc.perform(put("/goals/"+g+"/allocations").header("Authorization",auth).contentType("application/json")
                .content("{\"accountId\":\""+a+"\",\"amount\":1e2}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/goals/"+g+"/allocations").header("Authorization",auth).contentType("application/json")
                .content("{\"accountId\":\""+a+"\",\"amount\":\"100.00\"}"))
                .andExpect(status().isNoContent());
        String base="{\"ticker\":\"CANON\",\"name\":\"Decimal\",\"type\":\"STOCK\",\"openingQuantity\":\"1.00000000\",\"openingCost\":";
        for(String invalid:List.of("1e2","\"1e2\"","\"1.005\""))mvc.perform(post("/investments")
                .header("Authorization",auth).contentType("application/json").content(base+invalid+"}"))
                .andExpect(status().isBadRequest());
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,u.getId())).isZero();
        mvc.perform(post("/investments").header("Authorization",auth).contentType("application/json").content(base+"\"1.00\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalCost").value(1.00));
        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(sql.queryForObject("select amount from goal_allocations where goal_id=?",BigDecimal.class,g)).isEqualByComparingTo("100.00");
    }

    private User user() { User u=new User(); u.setNome("Revisão sintética");u.setEmail(UUID.randomUUID()+"@example.invalid");u.setSenha("synthetic");return users.save(u); }
    private UUID account(User u,String amount) { return accountService.create(new CreateAccountDTO("Conta review",AccountType.CHECKING,m(amount),"#123456",DAY),u).id(); }
    private UUID goal(User u) { return goals.create(new CreateGoalDTO("Meta review",m("1000.00"),LocalDate.of(2028,1,1),null,null,"BLUE",GoalType.MONETARY,true),u).id(); }
    private UUID asset(User u,String q,String cost,String value) { return investments.create(new CreateInvestmentDTO("RV"+UUID.randomUUID().toString().substring(0,8),"Ativo sintético",InvestType.STOCK,null,q==null?null:m(q),cost==null?null:m(cost),value==null?null:m(value),value==null?null:DAY,value==null?null:"USER_PROVIDED"),u).id(); }
    private UUID card(User u) { category(u,DefaultCategory.PAGAMENTO_FATURA.getName());return cards.createCard(new CreateCardDTO("Cartão review","1234",m("1000.00"),20,28,"VISA","BLUE"),u).id(); }
    private UUID category(User u,String name) {Category c=new Category();c.setUser(u);c.setName(name);c.setType(TransactionType.EXPENSE);return categories.save(c).getId();}
    private BigDecimal balance(UUID a) {return sql.queryForObject("select balance from accounts where id=?",BigDecimal.class,a);}
    private static BigDecimal m(String x) {return new BigDecimal(x);}
    private CreateTransactionDTO transfer(UUID a,UUID b,String amount) {return new CreateTransactionDTO("Transferência",m(amount),DAY,null,TransactionType.TRANSFER,a,null,true,b,BigDecimal.ZERO);}
    private InvestmentOperationDTO operation(UUID i,UUID a,InvestTransType type,String q,String price,String fee) {return new InvestmentOperationDTO(i,type,m(q),m(price),m(fee),DAY,a);}
}
