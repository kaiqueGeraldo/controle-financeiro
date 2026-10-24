package com.controlefinanceiro.api.domain.onboarding;

import com.controlefinanceiro.api.domain.card.dto.CreateCardTransactionDTO;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.CreateTransactionDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.*;
import com.controlefinanceiro.api.service.exception.OperationConflictException;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;

/** Literals from FIN02/06/07 and DEC09/10. No financial collaborator is mocked.
 * The inherited Clock is fixed; email/quotes remain external doubles only. */
class Cf033AdversarialIntegrationTest extends OnboardingApplicationSupport {
    @Autowired TransactionService transactions;
    @Autowired DashboardService dashboard;
    @Autowired AnnualSummaryService annual;
    @Autowired AccountService accounts;

    @BeforeEach void recordDisposableEnvironment() throws Exception {
        assertThat(sql.queryForObject("select count(*) from flyway_schema_history where success and version is not null",Integer.class)).isEqualTo(16);
        String output = System.getenv("CF032_EVIDENCE");
        if(output != null && !Files.exists(Path.of(output,"backend-environment.json")))
            evidence("backend-environment",Map.of("jvmZone",java.time.ZoneId.systemDefault().getId(),
                    "java",System.getProperty("java.version"),
                    "database",sql.queryForMap("select current_database() as database,current_schema() as schema,current_setting('TimeZone') as timezone,version() as version"),
                    "migrations",sql.queryForList("select version,checksum,success from flyway_schema_history where version is not null order by installed_rank")));
    }

    UUID category(User owner, TransactionType type) {
        UUID id = UUID.randomUUID();
        sql.update("insert into categories(id,name,type,user_id) values(?,'CF033 synthetic',?,?)",
                id, type.name(), owner.getId());
        return id;
    }

    CreateTransactionDTO income(UUID source, UUID category, String amount, LocalDate date,
                                boolean paid, UUID key) {
        return new CreateTransactionDTO("CF033 centavos", new BigDecimal(amount), date,
                "23:59:58", TransactionType.INCOME, source, category, paid, null, null, key);
    }

    void evidence(String name, Object value) throws Exception {
        String output = System.getenv("CF032_EVIDENCE");
        if (output != null) Files.writeString(Path.of(output, name + ".json"),
                OnboardingJson.JSON.writeValueAsString(value), StandardOpenOption.CREATE_NEW);
    }

    BigDecimal balance(UUID source) {
        return sql.queryForObject("select balance from accounts where id=?", BigDecimal.class, source);
    }

    @Test void halfUpProductIsRoundedOnceBeforeCommitAndReplay() throws Exception {
        var draft = minimal();
        var item = OnboardingJson.node("tempId",UUID.randomUUID().toString(),"action","CREATE",
                "name","CF033 HALF_UP","type","STOCK","positionMode","UNIT",
                "quantity",OnboardingJson.node("state","KNOWN","value","0.12500000"),
                "cost",OnboardingJson.node("state","UNKNOWN"),
                "valuation",OnboardingJson.node("state","KNOWN","basis","PRICE","price","10.04000000","date","2026-10-09","source","USER_DECLARED"),
                "acquisitionDate",OnboardingJson.node("state","UNKNOWN"),"historicalSource",OnboardingJson.node("state","UNKNOWN"));
        var section = (tools.jackson.databind.node.ObjectNode)draft.at("/payload/sections/investments");
        section.put("answer","PROVIDED").set("items",OnboardingJson.JSON.valueToTree(List.of(item)));
        var prepared = prepare(draft);
        amount(prepared.path("summary"),"netWorth","1.26"); // .125 * 10.04 = 1.255, HALF_UP = 1.26.
        var command = completeCommand(prepared);
        var original = app.complete(user.getId(),command);
        assertThat(app.complete(user.getId(),command)).isEqualTo(original);
        assertThat(sql.queryForObject("select valuation_amount from investments where user_id=?",BigDecimal.class,user.getId())).isEqualByComparingTo("1.26");
        assertThat(sql.queryForObject("select count(*) from investments where user_id=?",Integer.class,user.getId())).isOne();
        evidence("half-up",Map.of("prepared",prepared,"receipt",original));
    }

    @Test void pendingAcrossYearAndExactCentsAgreeInCashReportsAndXlsx() throws Exception {
        UUID source = account("1000.00"), category = category(user, TransactionType.INCOME);
        transactions.create(income(source, category, "250.00", LocalDate.of(2026,12,31), false, null), user);
        transactions.create(income(source, category, "0.10", LocalDate.of(2027,1,1), true, null), user);
        transactions.create(income(source, category, "0.20", LocalDate.of(2027,1,1), true, null), user);
        assertThat(balance(source)).isEqualByComparingTo("1000.30");
        assertThat(dashboard.getMonthlyFlow(user,12,2026).observed().income()).isEqualByComparingTo("0.00");
        assertThat(annual.getSummary(user,2026).balance().observed().income()).isEqualByComparingTo("0.00");
        assertThat(transactions.getCashSummary(user,12,2026,null,null).observed().entries()).isEqualByComparingTo("0.00");
        assertThat(dashboard.getMonthlyFlow(user,1,2027).observed().income()).isEqualByComparingTo("0.30");
        assertThat(annual.getSummary(user,2027).balance().observed().income()).isEqualByComparingTo("0.30");
        assertThat(transactions.getCashSummary(user,1,2027,null,null).observed().entries()).isEqualByComparingTo("0.30");
        byte[] bytes = transactions.exportToExcel(user,1,2027,null,null);
        try (var book = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            assertThat(book.getSheetAt(0).getRow(2).getCell(2).getStringCellValue()).isEqualTo("0.30");
        }
        if (System.getenv("CF032_EVIDENCE") != null)
            Files.write(Path.of(System.getenv("CF032_EVIDENCE"),"centavos.xlsx"), bytes, StandardOpenOption.CREATE_NEW);
        evidence("centavos-sql", sql.queryForList("select amount::text,date::text,status,is_paid from transactions where user_id=? order by date,amount",user.getId()));
    }

    @Test void finalRemainderAndCompetencesCrossTheYearWithoutPartialInvalidPurchase() throws Exception {
        UUID card = UUID.randomUUID(), category = category(user,TransactionType.EXPENSE);
        sql.update("insert into credit_cards(id,name,card_limit,closing_day,due_day,user_id,credit_balance) values(?,'CF033 card',1000,20,28,?,0)",card,user.getId());
        cardService.createTransaction(new CreateCardTransactionDTO("CF033 .05/3",new BigDecimal("0.05"),
                LocalDate.of(2026,12,19),"23:59:58",category,card,3),user);
        var lines = sql.queryForList("select t.installment,t.amount::text,i.month,i.year from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? order by t.installment",card);
        assertThat(lines).containsExactly(
                Map.of("installment",1,"amount","0.01","month",12,"year",2026),
                Map.of("installment",2,"amount","0.01","month",1,"year",2027),
                Map.of("installment",3,"amount","0.03","month",2,"year",2027));
        assertThatThrownBy(() -> cardService.createTransaction(new CreateCardTransactionDTO("invalid .02/3",
                new BigDecimal("0.02"),LocalDate.of(2026,12,19),null,category,card,3),user))
                .hasMessageContaining("cobrir todas as parcelas");
        assertThat(sql.queryForObject("select count(*) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",Integer.class,card)).isEqualTo(3);
        assertThat(sql.queryForObject("select sum(t.amount) from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=?",BigDecimal.class,card)).isEqualByComparingTo("0.05");
        evidence("installments-sql",lines);
    }

    @Test void collectionOwnershipRemainsExactWithDistinctOwnerAndArchivedSource() throws Exception {
        UUID active = account("42.17"), archived = account("9.00");
        sql.update("update accounts set is_archived=true where id=?",archived);
        User other = new User(); other.setNome("CF033 B"); other.setEmail(UUID.randomUUID()+"@example.invalid");other.setSenha("synthetic");
        other = users.saveAndFlush(other);
        UUID foreign = UUID.randomUUID();
        sql.update("insert into accounts(id,name,type,balance,user_id,is_archived,version) values(?,'CF033 private B','CHECKING',700,?,false,0)",foreign,other.getId());
        assertThat(accounts.listAll(user)).extracting(a -> a.id()).containsExactly(active);
        assertThat(accounts.listAll(other)).extracting(a -> a.id()).containsExactly(foreign);
        assertThat(accounts.position(user).totalBalance()).isEqualTo("51.17");
        evidence("ownership",Map.of("activeA",active,"archivedA",archived,"activeB",foreign));
    }

    @Test void replayAfterNewMovementReturnsOriginalIdentityAndConflictingContentDoesNotWrite() throws Exception {
        UUID source = account("0.00"), category = category(user,TransactionType.INCOME), key = UUID.randomUUID();
        var input = income(source,category,"0.07",LocalDate.of(2026,10,19),true,key);
        var original = transactions.create(input,user);
        transactions.create(income(source,category,"0.11",LocalDate.of(2026,10,19),true,UUID.randomUUID()),user);
        var replay = transactions.create(input,user);
        assertThat(replay).isEqualTo(original);
        assertThat(balance(source)).isEqualByComparingTo("0.18");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,user.getId())).isEqualTo(2);
        assertThatThrownBy(() -> transactions.create(income(source,category,"0.08",LocalDate.of(2026,10,19),true,key),user))
                .isInstanceOf(OperationConflictException.class);
        assertThat(balance(source)).isEqualByComparingTo("0.18");
        evidence("replay",Map.of("original",original,"replay",replay,"balance",balance(source)));
    }

    @Test void sameIntentWaitsForCommitAndReturnsOneEffect() throws Exception { race(false); }
    @Test void sameIntentWaitsForRollbackThenCreatesOneEffect() throws Exception { race(true); }

    void race(boolean rollback) throws Exception {
        UUID source = account("1.00"), category = category(user,TransactionType.INCOME), key = UUID.randomUUID();
        var input = income(source,category,"0.05",LocalDate.of(2026,10,19),true,key);
        CountDownLatch written = new CountDownLatch(1), release = new CountDownLatch(1);
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = pool.submit(() -> new TransactionTemplate(txManager).execute(status -> {
                var result = transactions.create(input,user);
                written.countDown(); await(release);
                if (rollback) status.setRollbackOnly();
                return result;
            }));
            await(written);
            var second = pool.submit(() -> transactions.create(input,user));
            try {
                awaitBlocked(); assertThat(second.isDone()).isFalse();
                assertThat(balance(source)).isEqualByComparingTo("1.00");
                assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isZero();
            } finally { release.countDown(); }
            var a = first.get(15,TimeUnit.SECONDS); var b = second.get(15,TimeUnit.SECONDS);
            if (rollback) assertThat(b.id()).isNotEqualTo(a.id());
            else assertThat(b).isEqualTo(a);
        }
        assertThat(balance(source)).isEqualByComparingTo("1.05");
        assertThat(sql.queryForObject("select count(*) from transactions where user_id=?",Integer.class,user.getId())).isOne();
        assertThat(sql.queryForObject("select count(*) from financial_intent_receipts where id=?",Integer.class,key)).isOne();
        evidence(rollback?"rollback-race":"commit-race",Map.of("balance",balance(source),"operation",key,"rollbackFirst",rollback));
    }
}
