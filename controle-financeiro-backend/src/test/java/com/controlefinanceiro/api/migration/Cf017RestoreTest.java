package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.migration.*;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import java.nio.file.Path;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;

class Cf017RestoreTest {
    record Mutation(String name,String sql,String file) { public String toString() { return name; } }
    static Stream<Mutation> mutations() {
        return Stream.of(
            new Mutation("swap-with-same-total", "UPDATE transactions SET amount=CASE WHEN amount=10.01 THEN 20.02 ELSE 10.01 END", "transactions.rows"),
            new Mutation("raw-microsecond", "UPDATE transactions SET created_at=created_at+interval '1 microsecond'", "transactions.rows"),
            new Mutation("raw-preserved-field", "UPDATE transactions SET legacy_created_at_raw=created_at", "transactions.rows"),
            new Mutation("origin-null-vs-value", "UPDATE transactions SET time_origin='NOT_PROVIDED'", "transactions.rows"),
            new Mutation("relationship", "UPDATE transactions SET category_id=NULL", "transactions.rows"),
            new Mutation("balance", "UPDATE accounts SET balance=balance+0.01", "accounts.rows"),
            new Mutation("remove-check", "ALTER TABLE transactions DROP CONSTRAINT ck_transactions_time_origin", "catalog.txt"),
            new Mutation("change-check-literal", "ALTER TABLE transactions DROP CONSTRAINT ck_transactions_time_origin; ALTER TABLE transactions ADD CONSTRAINT ck_transactions_time_origin CHECK(time_origin IS NULL OR time_origin IN ('USER_INPUT','NOT_PROVIDED','FABRICATED'))", "catalog.txt"),
            new Mutation("unvalidated-check", "ALTER TABLE transactions DROP CONSTRAINT ck_transactions_time_origin; ALTER TABLE transactions ADD CONSTRAINT ck_transactions_time_origin CHECK(time_origin IS NULL OR time_origin IN ('USER_INPUT','NOT_PROVIDED')) NOT VALID", "catalog.txt"),
            new Mutation("remove-index", "DROP INDEX idx_transactions_user_temporal_order", "catalog.txt"),
            new Mutation("changed-index-expression", "DROP INDEX idx_transactions_user_temporal_order; CREATE INDEX idx_transactions_user_temporal_order ON transactions(user_id,date DESC,(operation_time IS NOT NULL),operation_time DESC,id DESC)", "catalog.txt"),
            new Mutation("history", "UPDATE flyway_schema_history SET checksum=0 WHERE version='14'", "flyway_schema_history.rows"),
            new Mutation("null-vs-empty", "UPDATE users SET recovery_token=''", "users.rows"),
            new Mutation("known-instant", "UPDATE goal_history SET recorded_at=recorded_at+interval '1 microsecond' WHERE recorded_at IS NOT NULL", "goal_history.rows"),
            new Mutation("delete-line", "DELETE FROM card_transactions WHERE amount=30.03", "card_transactions.rows")
        );
    }

    @Test void realCustomDumpRestoresLegacyV1IntoFreshDatabase(@TempDir Path temp) throws Exception {
        String schema = legacy();
        String database = roundTrip(schema,temp);
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            assertThat(LegacyPreflight.inspect(c,schema).compatible()).isTrue();
        }
    }

    @Test void realCustomDumpRestoresCurrentV14AndFlywayRemainsStable(@TempDir Path temp) throws Exception {
        String schema = upgraded();
        String database = roundTrip(schema,temp);
        var flyway = Flyway.configure().dataSource(Cf017PostgresSupport.restoreDatabaseUrl(database),
                Cf017PostgresSupport.username(),Cf017PostgresSupport.password()).schemas(schema).defaultSchema(schema)
                .baselineOnMigrate(false).cleanDisabled(true).load();
        flyway.validate();
        assertThat(flyway.migrate().migrationsExecuted).isZero();
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("14");
    }

    @ParameterizedTest(name="{0}") @MethodSource("mutations")
    void isolatedChangesAreDetectedAndFinalStateIsIntact(Mutation mutation,@TempDir Path temp) throws Exception {
        String schema = upgraded();
        // Every mutation is applied to an actual restored target, never to the source.
        String database = roundTrip(schema,temp);
        try (var c = Cf017PostgresSupport.connectRestore(database); var s = c.createStatement()) {
            c.setAutoCommit(false);
            s.execute("SET LOCAL search_path TO " + schema);
            s.execute(mutation.sql());
            if (mutation.name().equals("swap-with-same-total")) {
                try (var r = s.executeQuery("SELECT sum(amount) FROM transactions")) {
                    r.next();
                    assertThat(r.getBigDecimal(1)).isEqualByComparingTo("30.03");
                }
            }
            c.commit();
        }
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("mutated"));
        }
        var differences = RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("mutated"));
        assertThat(differences).anyMatch(line -> line.startsWith(mutation.file()));
        // Preserve a new pristine final destination after the counterproof, no destructive restore.
        String finalDatabase = restoreDump(schema);
        try (var c = Cf017PostgresSupport.connectRestore(finalDatabase)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("final"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("final"))).isEmpty();
        if (mutation.name().equals("swap-with-same-total")) {
            preserveProof(temp.resolve("before"),"cf017-restore-proof-before");
            preserveProof(temp.resolve("final"),"cf017-restore-proof-final");
        }
        System.out.println("CF017_RESTORE mutation=" + mutation.name() + " detected=" + differences + " final=EQUIVALENT");
    }

    @Test void sequenceIdentityAndDuplicateRowsArePreservedAndSequenceDriftIsDetected(@TempDir Path temp) throws Exception {
        String schema = legacy();
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET search_path TO " + schema);
            s.execute("CREATE TABLE sequence_probe(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, value numeric(38,8))");
            s.execute("INSERT INTO sequence_probe(value) VALUES(123456789012345678901234567890.12345678),(NULL)");
            s.execute("CREATE TABLE multiset_probe(value text,raw_json jsonb,instant timestamptz(6),civil date)");
            s.execute("INSERT INTO multiset_probe VALUES ('a'||chr(9)||'b','{\"n\":1.00}', '2026-01-01 00:00:00.123456-03','2026-01-01'),('a'||chr(9)||'b','{\"n\":1.00}', '2026-01-01 00:00:00.123456-03','2026-01-01')");
        }
        String database = roundTrip(schema,temp);
        try (var c = Cf017PostgresSupport.connectRestore(database); var s = c.createStatement()) {
            s.execute("SELECT setval('" + schema + ".sequence_probe_id_seq',1,false)");
        }
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("mutated"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("mutated")))
                .anyMatch(line -> line.startsWith("sequences.txt"));
        String finalDatabase = restoreDump(schema);
        try (var c = Cf017PostgresSupport.connectRestore(finalDatabase)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("final"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("final"))).isEmpty();
    }

    @Test void timezoneDoesNotChangeSnapshotAndPartialOutputIsRefused(@TempDir Path temp) throws Exception {
        String schema = upgraded();
        Cf017PreflightTest.snapshot(schema,temp.resolve("utc"));
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET timezone TO 'Pacific/Kiritimati'");
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("other"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("utc"),temp.resolve("other"))).isEmpty();
        java.nio.file.Files.createDirectory(temp.resolve("partial"));
        assertThatThrownBy(() -> RestoreSnapshot.compare(temp.resolve("utc"),temp.resolve("partial")))
                .hasMessageContaining("Incomplete");
    }

    @Test void exportedSnapshotMatchesDumpDespiteLaterCommittedRowWrite(@TempDir Path temp) throws Exception {
        roundTrip(upgraded(),temp,true);
    }

    @Test void failedRestoreHasNonzeroExitAndRollsBackPartialWork(@TempDir Path temp) throws Exception {
        String schema = legacy();
        roundTrip(schema,temp);
        String database = Cf017PostgresSupport.createRestoreDatabase();
        try (var c = Cf017PostgresSupport.connectRestore(database); var s = c.createStatement()) {
            s.execute("CREATE SCHEMA " + schema);
            s.execute("CREATE TABLE " + schema + ".users(id integer PRIMARY KEY)");
        }
        // Omit only CREATE SCHEMA from the TOC so failure happens at users, after
        // earlier table DDL has run. The rollback must remove that partial DDL.
        var toc = Cf017PostgresSupport.exec("pg_restore","--list","/tmp/" + schema + ".dump");
        assertThat(toc.getExitCode()).isZero();
        String list = toc.getStdout().lines().filter(line -> !line.contains(" SCHEMA - "))
                .collect(java.util.stream.Collectors.joining("\n")) + "\n";
        assertThat(list).doesNotContain(" SCHEMA - ").contains(" TABLE " + schema + " accounts ");
        String listPath = "/tmp/" + schema + ".list";
        Cf017PostgresSupport.writeContainerTestFile(listPath,list);
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("conflict-before"));
        }
        var result = Cf017PostgresSupport.exec("pg_restore","-U",Cf017PostgresSupport.username(),"-d",database,
                "--exit-on-error","--single-transaction","--no-owner","--no-privileges","--use-list=" + listPath,"/tmp/" + schema + ".dump");
        assertThat(result.getExitCode()).isNotZero();
        assertThat(result.getStderr()).contains("already exists");
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("conflict-after"));
        }
        assertThat(RestoreSnapshot.compare(temp.resolve("conflict-before"),temp.resolve("conflict-after"))).isEmpty();
        System.out.println("CF017_RESTORE_FAILURE exit=" + result.getExitCode() + " targetUnchanged=true");
    }

    static String roundTrip(String schema,Path temp) throws Exception {
        return roundTrip(schema,temp,false);
    }

    private static String roundTrip(String schema,Path temp,boolean concurrentWriter) throws Exception {
        try (var c = Cf017PostgresSupport.connect()) {
            PgSchemaInventory.beginReadOnly(c,schema);
            String snapshot;
            try (var s = c.createStatement(); var r = s.executeQuery("SELECT pg_export_snapshot()")) {
                r.next(); snapshot = r.getString(1);
            }
            RestoreSnapshot.capture(c,temp.resolve("before"));
            if (concurrentWriter) {
                try (var writer = Cf017PostgresSupport.connect(); var s = writer.createStatement()) {
                    s.execute("UPDATE " + schema + ".accounts SET balance=balance+1.00");
                }
            }
            var dump = Cf017PostgresSupport.exec("pg_dump","-U",Cf017PostgresSupport.username(),
                    "-d",Cf017PostgresSupport.databaseName(),"--schema=" + schema,"--format=custom",
                    "--snapshot=" + snapshot,"--file=/tmp/" + schema + ".dump");
            assertThat(dump.getExitCode()).as(dump.getStderr()).isZero();
            assertThat(dump.getStderr()).isEmpty();
            var checksum = Cf017PostgresSupport.exec("sha256sum","/tmp/" + schema + ".dump");
            var size = Cf017PostgresSupport.exec("stat","-c","%s","/tmp/" + schema + ".dump");
            assertThat(checksum.getExitCode()).isZero();
            assertThat(size.getExitCode()).isZero();
            System.out.println("CF017_DUMP " + checksum.getStdout().trim() + " bytes=" + size.getStdout().trim());
        }
        String database = restoreDump(schema);
        try (var c = Cf017PostgresSupport.connectRestore(database)) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,temp.resolve("after"));
        }
        var comparison = RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("after"));
        if (!comparison.isEmpty()) {
            java.nio.file.Files.copy(temp.resolve("before/catalog.txt"),Path.of("target/restore-before-catalog.txt"),java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            java.nio.file.Files.copy(temp.resolve("after/catalog.txt"),Path.of("target/restore-after-catalog.txt"),java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
        assertThat(comparison).isEmpty();
        System.out.println("CF017_ROUNDTRIP schema=" + schema + " target=" + database + " result=EQUIVALENT");
        return database;
    }

    private static String restoreDump(String schema) throws Exception {
        String database = Cf017PostgresSupport.createRestoreDatabase();
        Cf017PostgresSupport.restoreDatabaseUrl(database); // verifies ownership and disposable guard
        var restore = Cf017PostgresSupport.exec("pg_restore","-U",Cf017PostgresSupport.username(),"-d",database,
                "--exit-on-error","--single-transaction","--no-owner","--no-privileges","/tmp/" + schema + ".dump");
        assertThat(restore.getExitCode()).as(restore.getStderr()).isZero();
        assertThat(restore.getStderr()).isEmpty();
        return database;
    }

    private static void preserveProof(Path source,String name) throws Exception {
        Path destination = Path.of("target",name);
        java.nio.file.Files.createDirectories(destination);
        try (var files = java.nio.file.Files.list(source)) {
            for (Path file : files.toList()) java.nio.file.Files.copy(file,destination.resolve(file.getFileName()),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private static String legacy() {
        String schema = Cf017PostgresSupport.createSchema("cf017_restore_matrix");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        Cf017PostgresSupport.assertLegacyV1Preflight(schema);
        return schema;
    }
    private static String upgraded() throws Exception {
        String schema = legacy();
        Cf017PostgresSupport.flyway(schema).baseline();
        Cf017PostgresSupport.flyway(schema).migrate();
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET search_path TO " + schema);
            org.springframework.jdbc.datasource.init.ScriptUtils.executeSqlScript(c,
                    new org.springframework.core.io.ClassPathResource("db/legacy/cf017-restore-v14-data.sql"));
        }
        return schema;
    }
}
