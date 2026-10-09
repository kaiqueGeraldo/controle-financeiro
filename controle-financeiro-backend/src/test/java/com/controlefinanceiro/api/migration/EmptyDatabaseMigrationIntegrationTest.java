package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import org.flywaydb.core.api.exception.FlywayValidateException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@SpringBootTest
@ContextConfiguration(initializers = EmptyMigrationTestInitializer.class)
class EmptyDatabaseMigrationIntegrationTest {
    @Autowired JdbcTemplate sql;

    @MockitoBean EmailService emailService;
    @MockitoBean MarketDataService marketDataService;

    @Test
    void emptyDatabaseRunsEveryMigrationOnceAndHibernateValidateStarts() {
        assertThat(sql.queryForObject(
                "select count(*) from flyway_schema_history where success", Integer.class)).isEqualTo(14);
        assertThat(sql.queryForList(
                "select version from flyway_schema_history where success order by installed_rank", String.class))
                .containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14");
        assertThat(sql.queryForObject(
                "select count(*) from information_schema.tables where table_schema=? and table_name='shedlock'",
                Integer.class, EmptyMigrationTestInitializer.SCHEMA)).isOne();
        assertThat(sql.queryForObject(
                "select data_type from information_schema.columns where table_schema=? "
                        + "and table_name='transactions' and column_name='recorded_at'",
                String.class, EmptyMigrationTestInitializer.SCHEMA)).isEqualTo("timestamp with time zone");
        assertThat(sql.queryForObject(
                "select datetime_precision from information_schema.columns where table_schema=? "
                        + "and table_name='transactions' and column_name='recorded_at'",
                Integer.class, EmptyMigrationTestInitializer.SCHEMA)).isEqualTo(6);

        var rerun = Cf017PostgresSupport.flyway(EmptyMigrationTestInitializer.SCHEMA).migrate();
        assertThat(rerun.migrationsExecuted).isZero();
        assertThat(sql.queryForObject(
                "select count(*) from flyway_schema_history where success", Integer.class)).isEqualTo(14);
    }

    @Test
    void changedAppliedMigrationIsRejectedByChecksum(@TempDir Path alteredMigrations) throws IOException {
        copyMigration("V1__baseline_pre_temporal.sql", alteredMigrations);
        Path v2 = copyMigration("V2__adopt_temporal_metadata.sql", alteredMigrations);
        copyMigration("V3__account_opening_and_transaction_flow.sql", alteredMigrations);
        copyMigration("V4__card_invoice_integrity.sql", alteredMigrations);
        copyMigration("V5__investment_positions_and_goal_allocations.sql", alteredMigrations);
        copyMigration("V6__preserve_goal_purchase_facts.sql", alteredMigrations);
        copyMigration("V7__valuation_reference_and_audit.sql", alteredMigrations);
        copyMigration("V8__investment_corrections.sql", alteredMigrations);
        copyMigration("V9__payment_intent_receipt.sql", alteredMigrations);
        copyMigration("V10__financial_commands_and_partial_reversals.sql", alteredMigrations);
        copyMigration("V11__reporting_coverage_baselines.sql", alteredMigrations);
        copyMigration("V12__habit_goal_effect_identity.sql", alteredMigrations);
        copyMigration("V13__financial_creation_intent_receipts.sql", alteredMigrations);
        copyMigration("V14__goal_history_recorded_instant.sql", alteredMigrations);
        Files.writeString(v2, System.lineSeparator() + "SELECT 1;" + System.lineSeparator(),
                StandardOpenOption.APPEND);

        var altered = Cf017PostgresSupport.flyway(
                EmptyMigrationTestInitializer.SCHEMA,
                filesystemLocation(alteredMigrations)
        );
        assertThatThrownBy(altered::validate)
                .isInstanceOf(FlywayValidateException.class)
                .hasMessageContaining("checksum");
    }

    @Test
    void failedTransactionalMigrationIsNotMarkedAppliedAndCanRecover(@TempDir Path failingMigrations)
            throws IOException, Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_failure");
        copyMigration("V1__baseline_pre_temporal.sql", failingMigrations);
        var v1Only = Cf017PostgresSupport.flyway(schema, filesystemLocation(failingMigrations));
        assertThat(v1Only.migrate().migrationsExecuted).isOne();

        Files.writeString(failingMigrations.resolve("V2__adopt_temporal_metadata.sql"), """
                ALTER TABLE transactions ADD COLUMN should_rollback varchar(20);
                SELECT 1 / 0;
                """);
        var failing = Cf017PostgresSupport.flyway(schema, filesystemLocation(failingMigrations));
        assertThatThrownBy(failing::migrate).hasMessageContaining("V2__adopt_temporal_metadata.sql");

        try (var connection = Cf017PostgresSupport.connect(); var statement = connection.createStatement()) {
            try (var rows = statement.executeQuery(
                    "select count(*) from information_schema.columns where table_schema='" + schema
                            + "' and table_name='transactions' and column_name='should_rollback'")) {
                rows.next();
                assertThat(rows.getInt(1)).isZero();
            }
            try (var rows = statement.executeQuery(
                    "select count(*) from " + schema + ".flyway_schema_history where version='2'")) {
                rows.next();
                assertThat(rows.getInt(1)).isZero();
            }
        }

        var recovered = Cf017PostgresSupport.flyway(schema).migrate();
        assertThat(recovered.migrationsExecuted).isEqualTo(13);
        Cf017PostgresSupport.flyway(schema).validate();
    }

    @Test
    void canonicalTemporalIndexesAndOriginConstraintsArePresent() {
        String schema = EmptyMigrationTestInitializer.SCHEMA;
        String transactionIndex = sql.queryForObject(
                "select indexdef from pg_indexes where schemaname=? and indexname='idx_transactions_user_temporal_order'",
                String.class, schema);
        assertThat(transactionIndex)
                .contains("operation_time IS NULL")
                .contains("operation_time DESC")
                .contains("id DESC");
        assertThat(sql.queryForObject(
                "select count(*) from information_schema.table_constraints where constraint_schema=? "
                        + "and constraint_name in ('ck_transactions_time_origin', "
                        + "'ck_card_transactions_time_origin', 'ck_invest_transactions_date_origin')",
                Integer.class, schema)).isEqualTo(3);
    }

    @Test
    void cf018OpeningFlowConstraintsAndIndexesArePresent() {
        String schema = EmptyMigrationTestInitializer.SCHEMA;
        assertThat(sql.queryForObject(
                "select count(*) from information_schema.columns where table_schema=? "
                        + "and table_name='accounts' and column_name in "
                        + "('opening_balance','opening_date','opening_origin','opening_recorded_at')",
                Integer.class, schema)).isEqualTo(4);
        assertThat(sql.queryForObject(
                "select count(*) from information_schema.columns where table_schema=? "
                        + "and table_name='transactions' and column_name in "
                        + "('status','origin','due_date','settled_at','operation_id','transfer_direction',"
                        + "'counterparty_account_id','reversal_of_id','settlement_of_id','correction_of_id')",
                Integer.class, schema)).isEqualTo(10);
        assertThat(sql.queryForObject(
                "select count(*) from information_schema.table_constraints where constraint_schema=? "
                        + "and constraint_name in ('ck_accounts_opening_origin','ck_accounts_opening_metadata',"
                        + "'ck_transactions_status','ck_transactions_paid_status','ck_transactions_origin',"
                        + "'ck_transactions_transfer_direction','ck_transactions_transfer_metadata',"
                        + "'ck_transactions_settlement_metadata','ck_transactions_reversal_metadata',"
                        + "'ck_transactions_correction_metadata',"
                        + "'fk_transactions_counterparty_account',"
                        + "'fk_transactions_reversal','fk_transactions_settlement','fk_transactions_correction')",
                Integer.class, schema)).isEqualTo(14);
        assertThat(sql.queryForObject(
                "select count(*) from pg_indexes where schemaname=? and indexname in "
                        + "('uk_transactions_operation_direction','idx_transactions_reversal',"
                        + "'uk_transactions_correction_once','idx_transactions_operation',"
                        + "'idx_transactions_settlement','idx_transactions_user_realized')",
                Integer.class, schema)).isEqualTo(6);
    }

    @Test
    void syntheticOrderingPlanUsesCanonicalIndexWithoutClaimingProductionLatency() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_explain");
        Cf017PostgresSupport.flyway(schema).migrate();
        try (var connection = Cf017PostgresSupport.connect(); var statement = connection.createStatement()) {
            statement.execute("SET search_path TO " + schema);
            statement.execute("""
                    INSERT INTO users (id,nome,email,senha,dark_mode,privacy_mode)
                    VALUES ('71000000-0000-0000-0000-000000000001','Carga sintetica','load@example.test','hash',false,false)
                    """);
            statement.execute("""
                    INSERT INTO accounts (id,name,type,balance,is_archived,user_id)
                    VALUES ('72000000-0000-0000-0000-000000000001','Carga','CHECKING',0,false,
                            '71000000-0000-0000-0000-000000000001')
                    """);
            statement.execute("""
                    INSERT INTO transactions
                      (id,description,amount,date,is_paid,status,type,account_id,user_id,created_at,
                       operation_time,time_origin,recorded_at)
                    SELECT md5(i::text)::uuid, 'synthetic-' || i, 1.00,
                           date '2026-01-01' + (i % 365), false, 'PENDING', 'EXPENSE',
                           '72000000-0000-0000-0000-000000000001',
                           '71000000-0000-0000-0000-000000000001',
                           timestamp '2026-01-01 00:00:00',
                           CASE WHEN i % 5 = 0 THEN NULL ELSE time '12:00:00' END,
                           CASE WHEN i % 5 = 0 THEN NULL ELSE 'USER_INPUT' END,
                           timestamptz '2026-01-01 03:00:00Z'
                    FROM generate_series(1,20000) AS i
                    """);
            statement.execute("ANALYZE transactions");
            try (var rows = statement.executeQuery("""
                    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
                    SELECT id FROM transactions
                    WHERE user_id='71000000-0000-0000-0000-000000000001'
                    ORDER BY date DESC, (operation_time IS NULL), operation_time DESC, id DESC
                    LIMIT 50
                    """)) {
                StringBuilder plan = new StringBuilder();
                while (rows.next()) {
                    plan.append(rows.getString(1)).append(System.lineSeparator());
                }
                assertThat(plan.toString()).contains("idx_transactions_user_temporal_order");
                System.out.println("CF017_SYNTHETIC_EXPLAIN " + plan.toString().replace(System.lineSeparator(), " | "));
            }
            try (var rows = statement.executeQuery(
                    "select version,execution_time from flyway_schema_history where version in ('1','2') order by version")) {
                while (rows.next()) {
                    assertThat(rows.getInt("execution_time")).isGreaterThanOrEqualTo(0);
                    System.out.println("CF017_SYNTHETIC_MIGRATION_MS version=" + rows.getString("version")
                            + " executionTime=" + rows.getInt("execution_time"));
                }
            }
        }
    }

    private static Path copyMigration(String name, Path destination) throws IOException {
        Path target = destination.resolve(name);
        try (InputStream source = EmptyDatabaseMigrationIntegrationTest.class
                .getResourceAsStream("/db/migration/" + name)) {
            if (source == null) {
                throw new IllegalStateException("Migration resource not found: " + name);
            }
            Files.copy(source, target);
        }
        return target;
    }

    private static String filesystemLocation(Path path) {
        return "filesystem:" + path.toAbsolutePath().toString().replace('\\', '/');
    }
}
