package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.support.DisposablePostgresGuard;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.containers.Container;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Set;
import java.util.UUID;

final class Cf017PostgresSupport {
    private static final String DATABASE_NAME = "cf_test_cf017_" + UUID.randomUUID().toString().replace("-", "");
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName(DATABASE_NAME)
            .withUsername("cf017")
            .withPassword("cf017");

    private Cf017PostgresSupport() {
    }

    static synchronized void start() {
        if (!POSTGRES.isRunning()) {
            try {
                POSTGRES.start();
            } catch (RuntimeException exception) {
                throw new IllegalStateException(
                        "PostgreSQL descartavel CF-017 indisponivel; nenhum banco externo sera usado como fallback.",
                        exception
                );
            }
        }
        DisposablePostgresGuard.requireDisposable(POSTGRES.getJdbcUrl(), DATABASE_NAME);
    }

    static String createSchema(String prefix) {
        start();
        String schema = prefix + "_" + UUID.randomUUID().toString().replace("-", "");
        try (Connection connection = connect(); Statement statement = connection.createStatement()) {
            statement.execute("CREATE SCHEMA " + schema);
        } catch (SQLException exception) {
            throw new IllegalStateException("Nao foi possivel criar schema descartavel " + schema, exception);
        }
        return schema;
    }

    static void loadLegacyFixture(String schema) {
        try (Connection connection = connect(); Statement statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            statement.execute("SET LOCAL search_path TO " + schema);
            ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/legacy/cf017-v1-fixture.sql"));
            connection.commit();
        } catch (SQLException exception) {
            throw new IllegalStateException("Fixture legada CF-017 falhou em " + schema, exception);
        }
    }

    static Flyway flyway(String schema, String... locations) {
        return Flyway.configure()
                .dataSource(jdbcUrl(), username(), password())
                .defaultSchema(schema)
                .schemas(schema)
                .locations(locations)
                .baselineVersion(MigrationVersion.fromVersion("1"))
                .baselineDescription("CF-017 legacy pre-temporal schema")
                .baselineOnMigrate(false)
                .cleanDisabled(true)
                .outOfOrder(false)
                .validateMigrationNaming(true)
                .load();
    }

    static Flyway flyway(String schema) {
        return flyway(schema, "classpath:db/migration");
    }

    static void assertLegacyV1Preflight(String schema) {
        Set<String> expectedTables = Set.of(
                "accounts", "card_transactions", "categories", "credit_cards", "goal_history",
                "goal_items", "goals", "habit_days", "habit_logs", "habits", "invest_transactions",
                "investments", "invoices", "monthly_plans", "plan_items", "shedlock", "transactions",
                "users", "yearly_notes"
        );
        try (Connection connection = connect(); Statement statement = connection.createStatement()) {
            var tables = new java.util.HashSet<String>();
            try (var rows = statement.executeQuery(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema='" + schema + "'")) {
                while (rows.next()) {
                    tables.add(rows.getString(1));
                }
            }
            if (!tables.equals(expectedTables)) {
                throw new IllegalStateException("Schema legado nao corresponde a V1. esperado="
                        + expectedTables + ", encontrado=" + tables);
            }
            assertColumn(statement, schema, "transactions", "amount", "numeric", 38, 2, false);
            assertColumn(statement, schema, "transactions", "created_at", "timestamp without time zone", null, null, false);
            assertColumn(statement, schema, "card_transactions", "created_at", "timestamp without time zone", null, null, false);
            assertColumn(statement, schema, "invest_transactions", "date", "timestamp without time zone", null, null, false);
            for (String column : Set.of("operation_time", "time_origin", "recorded_at", "legacy_created_at_raw")) {
                assertColumnAbsent(statement, schema, "transactions", column);
                assertColumnAbsent(statement, schema, "card_transactions", column);
            }
            assertColumnAbsent(statement, schema, "invest_transactions", "operation_date");
            assertColumnAbsent(statement, schema, "invest_transactions", "date_origin");
            if (tableExists(statement, schema, "flyway_schema_history")) {
                throw new IllegalStateException("Schema ja possui historico Flyway; baseline legado seria incorreto");
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Preflight legado CF-017 falhou", exception);
        }
    }

    private static void assertColumn(
            Statement statement,
            String schema,
            String table,
            String column,
            String dataType,
            Integer precision,
            Integer scale,
            boolean nullable
    ) throws SQLException {
        String sql = "SELECT data_type,numeric_precision,numeric_scale,is_nullable FROM information_schema.columns "
                + "WHERE table_schema='" + schema + "' AND table_name='" + table + "' AND column_name='" + column + "'";
        try (var rows = statement.executeQuery(sql)) {
            if (!rows.next()) {
                throw new IllegalStateException("Coluna obrigatoria ausente: " + table + "." + column);
            }
            if (!dataType.equals(rows.getString("data_type"))
                    || precision != null && !precision.equals((Integer) rows.getObject("numeric_precision"))
                    || scale != null && !scale.equals((Integer) rows.getObject("numeric_scale"))
                    || nullable != "YES".equals(rows.getString("is_nullable"))) {
                throw new IllegalStateException("Tipo/nulabilidade divergente em " + table + "." + column);
            }
        }
    }

    private static void assertColumnAbsent(Statement statement, String schema, String table, String column)
            throws SQLException {
        try (var rows = statement.executeQuery(
                "SELECT count(*) FROM information_schema.columns WHERE table_schema='" + schema
                        + "' AND table_name='" + table + "' AND column_name='" + column + "'")) {
            rows.next();
            if (rows.getInt(1) != 0) {
                throw new IllegalStateException("Coluna temporal ja existe antes da baseline: " + table + "." + column);
            }
        }
    }

    private static boolean tableExists(Statement statement, String schema, String table) throws SQLException {
        try (var rows = statement.executeQuery(
                "SELECT to_regclass('" + schema + "." + table + "') IS NOT NULL")) {
            rows.next();
            return rows.getBoolean(1);
        }
    }

    static Connection connect() throws SQLException {
        return DriverManager.getConnection(jdbcUrl(), username(), password());
    }

    static String schemaJdbcUrl(String schema) {
        String url = jdbcUrl();
        return url + (url.contains("?") ? "&" : "?") + "currentSchema=" + schema;
    }

    static String jdbcUrl() {
        start();
        return POSTGRES.getJdbcUrl();
    }

    static String username() {
        return POSTGRES.getUsername();
    }

    static String password() {
        return POSTGRES.getPassword();
    }

    static String databaseName() {
        return DATABASE_NAME;
    }

    static Container.ExecResult exec(String... command) {
        try {
            return POSTGRES.execInContainer(command);
        } catch (Exception exception) {
            throw new IllegalStateException("Comando de backup/restore falhou no PostgreSQL descartavel", exception);
        }
    }
}
