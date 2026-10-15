package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.infra.migration.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.file.Path;
import java.util.Map;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.*;

class Cf017PreflightTest {
    record Case(String name, String sql, boolean compatible) { public String toString() { return name; } }
    static Stream<Case> risks() {
        return Stream.of(
            new Case("compatible-independent-fixture", "SELECT 1", true),
            new Case("generated-names-equivalent", "ALTER TABLE accounts RENAME CONSTRAINT accounts_user_id_fkey TO arbitrary_fk; ALTER INDEX accounts_pkey RENAME TO arbitrary_pk", true),
            new Case("extra-plain-index", "CREATE INDEX extra_account_name ON accounts(name)", true),
            new Case("missing-original-fk", "ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey", false),
            new Case("wrong-fk-target", "INSERT INTO categories(id,name,type,user_id) SELECT id,'Wrong target','EXPENSE',id FROM users; ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey; ALTER TABLE accounts ADD FOREIGN KEY(user_id) REFERENCES categories(id)", false),
            new Case("unvalidated-correct-fk", "ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey; ALTER TABLE accounts ADD FOREIGN KEY(user_id) REFERENCES users(id) NOT VALID", false),
            new Case("disabled-fk-triggers", "ALTER TABLE accounts DISABLE TRIGGER ALL", false),
            new Case("wrong-fk-action", "ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_fkey; ALTER TABLE accounts ADD FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE", false),
            new Case("money-scale", "ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(38,3)", false),
            new Case("temporal-type", "ALTER TABLE transactions ALTER COLUMN created_at TYPE timestamptz(6) USING created_at AT TIME ZONE 'UTC'", false),
            new Case("temporal-precision", "ALTER TABLE transactions ALTER COLUMN created_at TYPE timestamp(3)", false),
            new Case("nullability", "ALTER TABLE transactions ALTER COLUMN created_at DROP NOT NULL", false),
            new Case("default", "ALTER TABLE users ALTER COLUMN notif_contas SET DEFAULT false", false),
            new Case("missing-column", "ALTER TABLE users DROP COLUMN dashboard_config", false),
            new Case("missing-unique", "ALTER TABLE users DROP CONSTRAINT users_email_key", false),
            new Case("missing-pk", "ALTER TABLE goal_history DROP CONSTRAINT goal_history_pkey", false),
            new Case("additional-check", "ALTER TABLE accounts ADD CHECK(balance>=0)", false),
            new Case("missing-index", "DROP INDEX idx_accounts_user_order", false),
            new Case("different-predicate", "DROP INDEX idx_accounts_user_order; CREATE INDEX idx_accounts_user_order ON accounts(user_id,is_archived,order_index) WHERE NOT is_archived", false),
            new Case("different-expression", "DROP INDEX idx_categories_user_name; CREATE INDEX idx_categories_user_name ON categories(user_id,lower(name))", false),
            new Case("extra-table", "CREATE TABLE unknown_table(id integer)", false),
            new Case("extra-column", "ALTER TABLE users ADD unknown_column text", false),
            new Case("unexpected-sequence", "CREATE SEQUENCE unknown_sequence", false),
            new Case("partial-temporal-adoption", "ALTER TABLE transactions ADD recorded_at timestamptz", false)
        );
    }

    @ParameterizedTest(name="{0}") @MethodSource("risks")
    void matrixIsReadOnlyAndFailedGateCannotReachBaseline(Case scenario, @TempDir Path temp) throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_matrix");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET search_path TO " + schema);
            s.execute(scenario.sql());
        }
        snapshot(schema,temp.resolve("before"));
        var output = new ByteArrayOutputStream();
        int code = DatabaseVerificationCli.run(new String[]{"preflight",schema,Cf017PostgresSupport.databaseName()},
                environment(),new PrintStream(output));
        assertThat(code).as(output.toString()).isEqualTo(scenario.compatible() ? 0 : 2);
        var second = new ByteArrayOutputStream();
        assertThat(DatabaseVerificationCli.run(new String[]{"preflight",schema,Cf017PostgresSupport.databaseName()},
                environment(),new PrintStream(second))).isEqualTo(code);
        assertThat(second.toString()).isEqualTo(output.toString());
        snapshot(schema,temp.resolve("after"));
        assertThat(RestoreSnapshot.compare(temp.resolve("before"),temp.resolve("after"))).isEmpty();
        // This is the only wrapper in the harness. Never baseline on nonzero exit.
        if (code == 0) {
            assertThat(Cf017PostgresSupport.flyway(schema).baseline().successfullyBaselined).isTrue();
            assertThat(Cf017PostgresSupport.flyway(schema).migrate().migrationsExecuted).isEqualTo(13);
        } else {
            try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement();
                 var r = s.executeQuery("SELECT to_regclass('" + schema + ".flyway_schema_history')")) {
                r.next();
                assertThat(r.getString(1)).isNull();
            }
        }
        System.out.println("CF017_PREFLIGHT case=" + scenario.name() + " exit=" + code + " readonly=true");
    }

    @Test void emptyManagedAndUnexpectedHistoryAreNotLegacy() throws Exception {
        String empty = Cf017PostgresSupport.createSchema("cf017_empty_gate");
        assertThat(code(empty)).isEqualTo(2);
        Cf017PostgresSupport.flyway(empty).migrate();
        assertThat(code(empty)).isEqualTo(2);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("UPDATE " + empty + ".flyway_schema_history SET success=false WHERE version='14'");
        }
        assertThat(code(empty)).isEqualTo(2);
        String partial = Cf017PostgresSupport.createSchema("cf017_partial_history");
        Cf017PostgresSupport.loadLegacyFixture(partial);
        Cf017PostgresSupport.flyway(partial).baseline();
        assertThat(code(partial)).isEqualTo(2);
    }

    @Test void cliProcessReturnsNonzeroAndRejectsWrongDatabase() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_cli_exit");
        var process = new ProcessBuilder(Path.of(System.getProperty("java.home"),"bin","java").toString(),
                "-cp",System.getProperty("java.class.path"),DatabaseVerificationCli.class.getName(),
                "preflight",schema,Cf017PostgresSupport.databaseName()).redirectErrorStream(true);
        process.environment().putAll(environment());
        var child = process.start();
        String output = new String(child.getInputStream().readAllBytes(),java.nio.charset.StandardCharsets.UTF_8);
        assertThat(child.waitFor()).as(output).isEqualTo(2);
        assertThat(DatabaseVerificationCli.run(new String[]{"preflight",schema,"wrong_database"},environment(),
                new PrintStream(new ByteArrayOutputStream()))).isEqualTo(3);
    }

    @Test void unknownExecutableAndTypeObjectsRequireReview() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_unknown");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("CREATE TYPE " + schema + ".extra_enum AS ENUM ('ONE','TWO')");
        }
        assertThat(code(schema)).isEqualTo(2);
    }

    @Test void verificationTransactionRejectsWritesAtTheDatabase() throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_readonly");
        Cf017PostgresSupport.loadLegacyFixture(schema);
        try (var c = Cf017PostgresSupport.connect()) {
            assertThat(LegacyPreflight.inspect(c,schema).compatible()).isTrue();
            try (var s = c.createStatement()) {
                assertThatThrownBy(() -> s.execute("UPDATE users SET nome='must not persist'"))
                        .isInstanceOf(java.sql.SQLException.class)
                        .extracting(e -> ((java.sql.SQLException)e).getSQLState()).isEqualTo("25006");
            }
        }
    }

    static Map<String,String> environment() {
        return Map.of("CF017_JDBC_URL",Cf017PostgresSupport.jdbcUrl(),"CF017_DB_USER",Cf017PostgresSupport.username(),
                "CF017_DB_PASSWORD",Cf017PostgresSupport.password());
    }
    static int code(String schema) {
        return DatabaseVerificationCli.run(new String[]{"preflight",schema,Cf017PostgresSupport.databaseName()},
                environment(),new PrintStream(new ByteArrayOutputStream()));
    }
    static void snapshot(String schema,Path path) throws Exception {
        try (var c = Cf017PostgresSupport.connect()) {
            PgSchemaInventory.beginReadOnly(c,schema);
            RestoreSnapshot.capture(c,path);
        }
    }
}
