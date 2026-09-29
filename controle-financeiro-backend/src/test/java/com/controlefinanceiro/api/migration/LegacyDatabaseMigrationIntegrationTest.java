package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.MarketDataService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@ContextConfiguration(initializers = LegacyMigrationTestInitializer.class)
class LegacyDatabaseMigrationIntegrationTest {
    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID ACCOUNT_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID CATEGORY_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");
    private static final UUID LEGACY_TRANSACTION_ID = UUID.fromString("40000000-0000-0000-0000-000000000001");

    @Autowired JdbcTemplate sql;
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired TokenService tokens;

    @MockitoBean EmailService emailService;
    @MockitoBean MarketDataService marketDataService;

    @Test
    void legacyUpgradePreservesRawValuesRelationsAndUnknownMetadata() throws Exception {
        assertThat(sql.queryForList(
                "select type,version,success from flyway_schema_history order by installed_rank"))
                .containsExactly(
                        Map.of("type", "BASELINE", "version", "1", "success", true),
                        Map.of("type", "SQL", "version", "2", "success", true),
                        Map.of("type", "SQL", "version", "3", "success", true),
                        Map.of("type", "SQL", "version", "4", "success", true),
                        Map.of("type", "SQL", "version", "5", "success", true),
                        Map.of("type", "SQL", "version", "6", "success", true)
                );
        assertThat(sql.queryForObject("select balance from accounts where id=?", BigDecimal.class, ACCOUNT_ID))
                .isEqualByComparingTo("1000.25");
        assertThat(sql.queryForObject(
                "select count(*) from transactions where user_id=? and account_id=? and category_id=?",
                Integer.class, USER_ID, ACCOUNT_ID, CATEGORY_ID)).isEqualTo(2);
        assertThat(sql.queryForObject(
                "select created_at from transactions where id='40000000-0000-0000-0000-000000000002'",
                LocalDateTime.class)).isEqualTo(LocalDateTime.parse("2026-09-07T23:30:45.123456"));
        assertThat(sql.queryForObject(
                "select count(*) from transactions where operation_time is null and time_origin is null "
                        + "and recorded_at is null and legacy_created_at_raw is null", Integer.class)).isEqualTo(2);
        assertThat(sql.queryForObject(
                "select count(*) from card_transactions where operation_time is null and time_origin is null "
                        + "and recorded_at is null and legacy_created_at_raw is null", Integer.class)).isEqualTo(2);
        assertThat(sql.queryForObject(
                "select count(*) from card_transactions where origin='LEGACY_UNKNOWN' "
                        + "and paid_amount=0 and refunded_amount=0 and opening_batch_id is null",
                Integer.class)).isEqualTo(2);
        assertThat(sql.queryForObject(
                "select count(*) from invoices where closing_date is null and due_date is null",
                Integer.class)).isOne();
        assertThat(sql.queryForObject("select count(*) from card_payments", Integer.class)).isZero();
        assertThat(sql.queryForObject("select count(*) from card_opening_batches", Integer.class)).isZero();
        assertThat(sql.queryForObject(
                "select count(*) from invest_transactions where operation_date is null and date_origin is null",
                Integer.class)).isEqualTo(2);
        assertThat(sql.queryForObject("select legacy_current_price from investments where ticker='LEG3'",
                BigDecimal.class)).isEqualByComparingTo("55.00");
        assertThat(sql.queryForObject("select count(*) from investments where ticker='LEG3' "
                + "and current_price is null and valuation_amount is null and total_cost is null",
                Integer.class)).isOne();
        assertThat(sql.queryForObject(
                "select count(*) from accounts where opening_balance is null and opening_date is null "
                        + "and opening_origin is null and opening_recorded_at is null", Integer.class)).isOne();
        assertThat(sql.queryForObject(
                "select count(*) from transactions where origin is null", Integer.class)).isEqualTo(2);
        assertThat(sql.queryForObject(
                "select count(*) from transactions where (is_paid and status='SETTLED') "
                        + "or (not is_paid and status='PENDING')", Integer.class)).isEqualTo(2);

        String auth = "Bearer " + tokens.generateToken(users.findById(USER_ID).orElseThrow());
        mvc.perform(put("/transactions/{id}", LEGACY_TRANSACTION_ID)
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"date\":\"2026-09-06\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.time").isEmpty())
                .andExpect(jsonPath("$.timeOrigin").value("UNKNOWN"))
                .andExpect(jsonPath("$.recordedAt").isNotEmpty())
                .andExpect(jsonPath("$.legacyCreatedAtRaw").value("2026-09-07T00:00:00"))
                .andExpect(jsonPath("$.origin").value("CORRECTION"))
                .andExpect(jsonPath("$.correctionOfId").value(LEGACY_TRANSACTION_ID.toString()));

        assertThat(sql.queryForObject(
                "select count(*) from transactions where id=? and date='2026-09-07' "
                        + "and status='REVERSED' and recorded_at is null and legacy_created_at_raw is null",
                Integer.class, LEGACY_TRANSACTION_ID)).isOne();

        mvc.perform(post("/transactions")
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Nova apos upgrade","amount":12.34,"date":"2026-09-07",
                                 "time":"00:00","type":"EXPENSE","isPaid":false,
                                 "accountId":"20000000-0000-0000-0000-000000000001",
                                 "categoryId":"30000000-0000-0000-0000-000000000001"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.time").value("00:00:00"))
                .andExpect(jsonPath("$.timeOrigin").value("USER_INPUT"))
                .andExpect(jsonPath("$.recordedAt").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.origin").value("USER"));
    }

    @Test
    void syntheticPgDumpRestoreReconcilesThenFlywayRemainsStable() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_restore");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        Cf017PostgresSupport.assertLegacyV1Preflight(schema);
        var flyway = Cf017PostgresSupport.flyway(schema);
        flyway.baseline();
        flyway.migrate();

        Map<String, Object> before = fingerprint(schema);
        String backup = "/tmp/" + schema + ".sql";
        var dump = Cf017PostgresSupport.exec(
                "pg_dump", "-U", Cf017PostgresSupport.username(), "-d", Cf017PostgresSupport.databaseName(),
                "--schema=" + schema, "--no-owner", "--no-privileges", "--file=" + backup
        );
        assertThat(dump.getExitCode()).as(dump.getStderr()).isZero();

        try (var connection = Cf017PostgresSupport.connect(); var statement = connection.createStatement()) {
            statement.execute("DROP SCHEMA " + schema + " CASCADE");
        }
        var restore = Cf017PostgresSupport.exec(
                "psql", "-v", "ON_ERROR_STOP=1", "-U", Cf017PostgresSupport.username(),
                "-d", Cf017PostgresSupport.databaseName(), "-f", backup
        );
        assertThat(restore.getExitCode()).as(restore.getStderr()).isZero();

        assertThat(fingerprint(schema)).isEqualTo(before);
        Cf017PostgresSupport.flyway(schema).validate();
        assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isZero();
    }

    private Map<String, Object> fingerprint(String schema) throws Exception {
        try (var connection = Cf017PostgresSupport.connect(); var statement = connection.createStatement();
             var rows = statement.executeQuery("""
                     SELECT
                       (SELECT count(*) FROM %1$s.transactions) AS transaction_count,
                       (SELECT sum(amount) FROM %1$s.transactions) AS transaction_sum,
                       (SELECT count(*) FROM %1$s.card_transactions) AS card_count,
                       (SELECT sum(amount) FROM %1$s.card_transactions) AS card_sum,
                       (SELECT count(*) FROM %1$s.invest_transactions) AS investment_count,
                       (SELECT sum(total_value) FROM %1$s.invest_transactions) AS investment_sum,
                       (SELECT count(*) FROM %1$s.transactions t JOIN %1$s.accounts a ON a.id=t.account_id
                          JOIN %1$s.users u ON u.id=t.user_id WHERE a.user_id=u.id) AS owned_relations,
                       (SELECT count(*) FROM %1$s.transactions WHERE recorded_at IS NULL) AS unknown_audits,
                       (SELECT count(*) FROM %1$s.flyway_schema_history WHERE success) AS migration_count
                     """.formatted(schema))) {
            rows.next();
            return Map.of(
                    "transactionCount", rows.getInt("transaction_count"),
                    "transactionSum", rows.getBigDecimal("transaction_sum"),
                    "cardCount", rows.getInt("card_count"),
                    "cardSum", rows.getBigDecimal("card_sum"),
                    "investmentCount", rows.getInt("investment_count"),
                    "investmentSum", rows.getBigDecimal("investment_sum"),
                    "ownedRelations", rows.getInt("owned_relations"),
                    "unknownAudits", rows.getInt("unknown_audits"),
                    "migrationCount", rows.getInt("migration_count")
            );
        }
    }
}
