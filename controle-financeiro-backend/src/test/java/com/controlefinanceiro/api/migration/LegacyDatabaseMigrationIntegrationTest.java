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
                        Map.of("type", "SQL", "version", "6", "success", true),
                        Map.of("type", "SQL", "version", "7", "success", true),
                        Map.of("type", "SQL", "version", "8", "success", true),
                        Map.of("type", "SQL", "version", "9", "success", true),
                        Map.of("type", "SQL", "version", "10", "success", true),
                        Map.of("type", "SQL", "version", "11", "success", true),
                        Map.of("type", "SQL", "version", "12", "success", true),
                        Map.of("type", "SQL", "version", "13", "success", true),
                        Map.of("type", "SQL", "version", "14", "success", true),
                        Map.of("type", "SQL", "version", "15", "success", true),
                        Map.of("type", "SQL", "version", "16", "success", true)
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
    void syntheticPgDumpRestoreReconcilesThenFlywayRemainsStable(@org.junit.jupiter.api.io.TempDir java.nio.file.Path temp) throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_restore");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        Cf017PostgresSupport.assertLegacyV1Preflight(schema);
        Cf017PostgresSupport.flyway(schema).baseline();
        Cf017PostgresSupport.flyway(schema).migrate();
        String database = Cf017RestoreTest.roundTrip(schema,temp);
        var flyway = org.flywaydb.core.Flyway.configure().dataSource(Cf017PostgresSupport.restoreDatabaseUrl(database),
                Cf017PostgresSupport.username(),Cf017PostgresSupport.password()).defaultSchema(schema).schemas(schema)
                .baselineOnMigrate(false).cleanDisabled(true).load();
        flyway.validate();
        assertThat(flyway.migrate().migrationsExecuted).isZero();
    }

    // Kept as the entrypoint of the original directed regression; now covers every field/schema object.
    private Map<String, Object> fingerprint(String schema) throws Exception {
        var directory = java.nio.file.Files.createTempDirectory(java.nio.file.Path.of("target"), "cf017-fingerprint-");
        var snapshot = directory.resolve("snapshot");
        Cf017PreflightTest.snapshot(schema,snapshot);
        var result = new java.util.TreeMap<String,Object>();
        try (var files = java.nio.file.Files.list(snapshot)) {
            for (var path : files.toList()) {
                var digest = java.security.MessageDigest.getInstance("SHA-256");
                try (var in = new java.security.DigestInputStream(java.nio.file.Files.newInputStream(path),digest)) {
                    in.transferTo(java.io.OutputStream.nullOutputStream());
                }
                result.put(path.getFileName().toString(),java.util.HexFormat.of().formatHex(digest.digest()));
            }
        }
        return result;
    }
}
