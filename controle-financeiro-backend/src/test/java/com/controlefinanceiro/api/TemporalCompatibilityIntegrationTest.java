package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.*;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
@Import(TemporalCompatibilityIntegrationTest.FixedClock.class)
class TemporalCompatibilityIntegrationTest extends PostgresIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired AccountRepository accounts;
    @Autowired InvestmentRepository investments;
    @Autowired InvestTransactionRepository history;
    @Autowired TransactionRepository transactions;
    @Autowired TokenService tokens;
    @Autowired JdbcTemplate sql;
    @Autowired Clock clock;
    @Autowired com.controlefinanceiro.api.domain.card.CreditCardRepository cards;
    @Autowired com.controlefinanceiro.api.domain.category.CategoryRepository categories;
    User owner;
    Account account;
    String auth;

    @BeforeEach void setup() {
        ((MutableClock) clock).instant = Instant.parse("2026-09-08T03:10:00Z");
        owner = new User(); owner.setNome("Sintético temporal"); owner.setEmail(UUID.randomUUID()+"@example.test");
        owner.setSenha("synthetic-hash"); owner = users.save(owner);
        account = new Account(); account.setUser(owner); account.setName("Conta sintética");
        account.setType(AccountType.CHECKING); account.setBalance(new BigDecimal("1000")); account = accounts.save(account);
        auth = "Bearer " + tokens.generateToken(owner);
    }

    @Test void unknownInvestmentKeepsRawWithoutClaimingCivilDate() throws Exception {
        for (String raw : new String[]{"2026-09-07T00:00:00", "2026-09-07T23:30:00"}) {
            Investment asset = asset();
            InvestTransaction row = new InvestTransaction(); row.setInvestment(asset); row.setType(InvestTransType.BUY);
            row.setDate(LocalDateTime.parse(raw)); row.setQuantity(BigDecimal.ONE); row.setPrice(BigDecimal.TEN);
            row.setTotalValue(BigDecimal.TEN); row = history.save(row);
            mvc.perform(get("/investments/" + asset.getId() + "/history").header("Authorization", auth))
                    .andExpect(status().isOk()).andExpect(jsonPath("$[0].date").isEmpty())
                    .andExpect(jsonPath("$[0].dateOrigin").value("UNKNOWN"))
                    .andExpect(jsonPath("$[0].legacyDateRaw").value(raw));
            assertThat(sql.queryForObject("select date from invest_transactions where id=?", LocalDateTime.class, row.getId()))
                    .isEqualTo(LocalDateTime.parse(raw));
        }
    }

    @Test void newOperationSeparatesMissingTimeFromMidnight() throws Exception {
        for (String input : new String[]{"", ",\"time\":null", ",\"time\":\"00:00\""}) {
            ResultActions created = create(input).andExpect(status().isOk())
                    .andExpect(jsonPath("$.date").value("2026-09-07"))
                    .andExpect(jsonPath("$.recordedAt").value("2026-09-08T03:10:00Z"));
            UUID id = id(created);
            if (input.contains("00:00")) created.andExpect(jsonPath("$.time").value("00:00:00"))
                    .andExpect(jsonPath("$.timeOrigin").value("USER_INPUT"));
            else created.andExpect(jsonPath("$.time").isEmpty()).andExpect(jsonPath("$.timeOrigin").value("NOT_PROVIDED"));
            assertThat(sql.queryForObject("select recorded_at from transactions where id=?", OffsetDateTime.class, id).toInstant())
                    .isEqualTo(Instant.parse("2026-09-08T03:10:00Z"));
        }
    }

    @Test void editingPreservesRawAndAuditWhileOmissionAndNullHaveDistinctMeaning() throws Exception {
        UUID id = id(create(",\"time\":\"23:30\"").andExpect(status().isOk()));
        ((MutableClock) clock).instant = Instant.parse("2026-09-08T03:20:00Z");
        edit(id, "{\"date\":\"2026-09-06\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.time").value("23:30:00"));
        edit(id, "{\"time\":\"00:00\"}").andExpect(status().isOk());
        edit(id, "{}").andExpect(status().isOk()).andExpect(jsonPath("$.time").value("00:00:00"));
        edit(id, "{\"time\":null}").andExpect(status().isOk()).andExpect(jsonPath("$.time").isEmpty())
                .andExpect(jsonPath("$.timeOrigin").value("NOT_PROVIDED"))
                .andExpect(jsonPath("$.recordedAt").value("2026-09-08T03:10:00Z"))
                .andExpect(jsonPath("$.legacyCreatedAtRaw").value("2026-09-07T23:30:00"));
        mvc.perform(get("/transactions?month=9&year=2026").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].date").value("2026-09-06"))
                .andExpect(jsonPath("$.content[0].time").isEmpty())
                .andExpect(jsonPath("$.content[0].recordedAt").value("2026-09-08T03:10:00Z"))
                .andExpect(jsonPath("$.content[0].legacyCreatedAtRaw").value("2026-09-07T23:30:00"));
    }

    @Test void legacyMidnightHasUnknownTimeAndUnreconstructibleAuditEvenAfterEditing() throws Exception {
        Transaction row = new Transaction(); row.setUser(owner); row.setAccount(account); row.setType(TransactionType.EXPENSE);
        row.setDescription("Legado sintético"); row.setAmount(BigDecimal.TEN); row.setPaid(false);
        row.setDate(LocalDate.of(2026,9,7)); row.setCreatedAt(LocalDateTime.parse("2026-09-07T00:00:00"));
        row = transactions.save(row);
        edit(row.getId(), "{\"date\":\"2026-09-06\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.time").isEmpty()).andExpect(jsonPath("$.timeOrigin").value("UNKNOWN"))
                .andExpect(jsonPath("$.recordedAt").isEmpty())
                .andExpect(jsonPath("$.legacyCreatedAtRaw").value("2026-09-07T00:00:00"));
        edit(row.getId(), "{\"time\":\"00:00\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.time").value("00:00:00")).andExpect(jsonPath("$.timeOrigin").value("USER_INPUT"))
                .andExpect(jsonPath("$.recordedAt").isEmpty());
    }

    @Test void requestCannotBackdateAuditOrChangeRawOrOrigin() throws Exception {
        UUID id = id(create(",\"time\":\"00:00\"").andExpect(status().isOk()));
        for (String field : new String[]{"recordedAt", "createdAt", "legacyCreatedAtRaw", "timeOrigin"}) {
            String value = ",\"" + field + "\":\"2020-01-01T00:00:00Z\"";
            create(value).andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields."+field).isNotEmpty());
            edit(id, "{\"date\":\"2026-09-06\"" + value + "}")
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields."+field).isNotEmpty());
        }
        assertThat(sql.queryForObject("select date from transactions where id=?", LocalDate.class, id))
                .isEqualTo(LocalDate.of(2026,9,7));
    }

    @Test void provenInvestmentWritersPersistExplicitCivilAndProductOrigin() throws Exception {
        Investment manual = asset();
        mvc.perform(post("/investments/operation").header("Authorization", auth).contentType("application/json")
                .content("{\"investmentId\":\""+manual.getId()+"\",\"type\":\"BUY\",\"quantity\":1,\"price\":10,\"fees\":0,\"date\":\"2026-09-07\",\"accountId\":\""+account.getId()+"\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/investments/"+manual.getId()+"/history").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].date").value("2026-09-07"))
                .andExpect(jsonPath("$[0].dateOrigin").value("USER_INPUT"))
                .andExpect(jsonPath("$[0].legacyDateRaw").value("2026-09-07T00:00:00"));
        Investment automatic = asset();
        automatic.setQuantity(BigDecimal.ONE); investments.saveAndFlush(automatic);
        mvc.perform(post("/investments/update-balance").header("Authorization", auth).contentType("application/json")
                .content("{\"investmentId\":\""+automatic.getId()+"\",\"newBalance\":20,\"date\":\"2026-09-08\",\"source\":\"USER_PROVIDED\",\"reason\":\"Avaliação informada\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/investments/"+automatic.getId()+"/history").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        assertThat(sql.queryForObject("select operation_date from invest_transactions where investment_id=?", LocalDate.class, manual.getId()))
                .isEqualTo(LocalDate.of(2026,9,7));
        assertThat(sql.queryForObject("select valuation_date from investments where id=?", LocalDate.class, automatic.getId()))
                .isEqualTo(LocalDate.of(2026,9,8));
        assertThat(sql.queryForObject("select valuation_amount from investments where id=?", java.math.BigDecimal.class, automatic.getId()))
                .isEqualByComparingTo("20.00");
        assertThat(sql.queryForObject("select count(*) from invest_transactions where investment_id=?", Integer.class, automatic.getId()))
                .isZero();
        mvc.perform(get("/transactions?month=9&year=2026").header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].time").isEmpty())
                .andExpect(jsonPath("$.content[0].timeOrigin").value("NOT_PROVIDED"))
                .andExpect(jsonPath("$.content[0].recordedAt").value("2026-09-08T03:10:00Z"));
    }

    @Test void cardCreationAndDescriptionEditKeepMissingTimeDistinctFromMidnight() throws Exception {
        var card = new com.controlefinanceiro.api.domain.card.CreditCard(); card.setUser(owner); card.setName("Cartão sintético");
        card.setLimit(new BigDecimal("1000")); card.setClosingDay(20); card.setDueDay(25); card.setLast4Digits("0000");
        card = cards.save(card);
        var category = new com.controlefinanceiro.api.domain.category.Category(); category.setUser(owner);
        category.setName("Categoria sintética"); category.setType(TransactionType.EXPENSE); category = categories.save(category);
        for (String input : new String[]{"", ",\"time\":\"00:00\""}) {
            mvc.perform(post("/cards/transaction").header("Authorization", auth).contentType("application/json")
                    .content("{\"description\":\"Compra sintética\",\"amount\":10,\"date\":\"2026-09-07\",\"categoryId\":\""+category.getId()+"\",\"cardId\":\""+card.getId()+"\",\"totalInstallments\":1"+input+"}"))
                    .andExpect(status().isOk());
            UUID id = sql.queryForObject("select t.id from card_transactions t join invoices i on i.id=t.invoice_id where i.card_id=? and t.time_origin=?",
                    UUID.class, card.getId(), input.isEmpty() ? "NOT_PROVIDED" : "USER_INPUT");
            var before = sql.queryForMap("select operation_time,time_origin,recorded_at,created_at,legacy_created_at_raw from card_transactions where id=?",id);
            assertThat(before.get("time_origin")).isEqualTo(input.isEmpty() ? "NOT_PROVIDED" : "USER_INPUT");
            if (input.isEmpty()) assertThat(before.get("operation_time")).isNull();
            else assertThat(sql.queryForObject("select operation_time from card_transactions where id=?", LocalTime.class,id)).isEqualTo(LocalTime.MIDNIGHT);
            assertThat(sql.queryForObject("select recorded_at from card_transactions where id=?",OffsetDateTime.class,id).toInstant()).isEqualTo(Instant.parse("2026-09-08T03:10:00Z"));
            mvc.perform(patch("/cards/transaction/"+id).header("Authorization",auth).contentType("application/json").content("{\"description\":\"Editada\"}"))
                    .andExpect(status().isOk());
            assertThat(sql.queryForMap("select operation_time,time_origin,recorded_at,created_at,legacy_created_at_raw from card_transactions where id=?",id)).isEqualTo(before);
            mvc.perform(patch("/cards/transaction/"+id).header("Authorization",auth).contentType("application/json").content("{\"recordedAt\":null}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.recordedAt").isNotEmpty());
        }
    }

    @Test void paginationAndExportUseKnownWallTimeBeforeUnknownWithoutInventingAudit() throws Exception {
        UUID midnight = id(create(",\"time\":\"00:00\"").andExpect(status().isOk()));
        UUID missing = id(create("").andExpect(status().isOk()));
        // SPEC-002: canonical output retains seconds, including in exported data.
        UUID evening = id(create(",\"time\":\"23:30:45\"").andExpect(status().isOk()));
        UUID[] expected = {evening, midnight, missing};
        for (int page=0; page<3; page++) {
            mvc.perform(get("/transactions?month=9&year=2026&size=1&page="+page+"&sort=createdAt,desc").header("Authorization",auth))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(expected[page].toString()));
        }
        byte[] bytes = mvc.perform(get("/transactions/export").header("Authorization",auth))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray();
        try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook(new java.io.ByteArrayInputStream(bytes))) {
            var sheet = workbook.getSheetAt(0);
            assertThat(sheet.getRow(8).getCell(1).getStringCellValue()).isEqualTo("23:30:45");
            assertThat(sheet.getRow(9).getCell(1).getStringCellValue()).isEqualTo("00:00:00");
            assertThat(sheet.getRow(10).getCell(1).getStringCellValue()).isEqualTo("—");
        }
    }

    @Test void additiveCandidatePreservesSyntheticLegacyAndRollsBackWithoutBackfill() throws Exception {
        // Transactional DDL in a private schema of the disposable database. Never targets public/real data.
        try (var connection = sql.getDataSource().getConnection(); var statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            String schema = "legacy_" + UUID.randomUUID().toString().replace("-", "");
            try {
                statement.execute("CREATE SCHEMA " + schema);
                statement.execute("SET LOCAL search_path TO " + schema);
                statement.execute("CREATE TABLE transactions (id integer primary key, date date not null, created_at timestamp(6) not null, user_id uuid)");
                statement.execute("CREATE TABLE card_transactions (id integer primary key, date date not null, created_at timestamp(6) not null, invoice_id uuid)");
                statement.execute("CREATE TABLE invest_transactions (id integer primary key, date timestamp(6) not null)");
                for (String table : new String[]{"transactions", "card_transactions"})
                    statement.execute("INSERT INTO " + table + " (id,date,created_at) VALUES (1, '2026-09-07', '2026-09-07 00:00:00'), (2, '2026-09-07', '2026-09-07 23:30:45.123456')");
                statement.execute("INSERT INTO invest_transactions VALUES (1, '2026-09-07 00:00:00'), (2, '2026-09-07 23:30:45.123456')");
                var beforeUpgrade = connection.setSavepoint();
                org.springframework.jdbc.datasource.init.ScriptUtils.executeSqlScript(connection,
                        new org.springframework.core.io.ClassPathResource("db/migration/V2__adopt_temporal_metadata.sql"));
                for (String table : new String[]{"transactions", "card_transactions"}) {
                    try (var rows = statement.executeQuery("SELECT count(*) FROM " + table + " WHERE operation_time IS NULL AND time_origin IS NULL AND recorded_at IS NULL AND legacy_created_at_raw IS NULL")) {
                        rows.next(); assertThat(rows.getInt(1)).isEqualTo(2);
                    }
                    try (var rows = statement.executeQuery("SELECT created_at FROM " + table + " WHERE id=2")) {
                        rows.next(); assertThat(rows.getObject(1, LocalDateTime.class)).isEqualTo(LocalDateTime.parse("2026-09-07T23:30:45.123456"));
                    }
                }
                try (var rows = statement.executeQuery("SELECT date, operation_date, date_origin FROM invest_transactions WHERE id=1")) {
                    rows.next(); assertThat(rows.getObject(1, LocalDateTime.class)).isEqualTo(LocalDateTime.parse("2026-09-07T00:00:00"));
                    assertThat(rows.getObject(2)).isNull(); assertThat(rows.getObject(3)).isNull();
                }
                connection.rollback(beforeUpgrade);
                try (var rows = statement.executeQuery("SELECT count(*) FROM information_schema.columns WHERE table_schema='"+schema+"' AND column_name='recorded_at'")) {
                    rows.next(); assertThat(rows.getInt(1)).isZero();
                }
            } finally { connection.rollback(); }
        }
    }

    private ResultActions create(String fields) throws Exception {
        return mvc.perform(post("/transactions").header("Authorization", auth).contentType("application/json")
                .content("{\"description\":\"Operação sintética\",\"amount\":10,\"date\":\"2026-09-07\",\"type\":\"EXPENSE\",\"isPaid\":false,\"accountId\":\""+account.getId()+"\""+fields+"}"));
    }
    private ResultActions edit(UUID id, String body) throws Exception {
        return mvc.perform(put("/transactions/"+id).header("Authorization", auth).contentType("application/json").content(body));
    }
    private UUID id(ResultActions result) throws Exception {
        return UUID.fromString(JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id"));
    }
    private Investment asset() {
        Investment asset = new Investment(); asset.setUser(owner); asset.setName("Ativo sintético"); asset.setTicker("SINT3");
        asset.setType(InvestType.STOCK); return investments.save(asset);
    }
    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClock {
        @Bean @Primary Clock productClockForCompatibility() {
            return new MutableClock();
        }
    }
    static class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-09-08T03:10:00Z");
        @Override public Instant instant() { return instant; }
        @Override public ZoneId getZone() { return ZoneId.of("America/Sao_Paulo"); }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(instant, zone); }
    }
}
