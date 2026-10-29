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
import java.util.UUID;

final class Cf017PostgresSupport {
    private static final String DATABASE_NAME = "cf_test_cf017_" + UUID.randomUUID().toString().replace("-", "");
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer(postgresImage())
            .withDatabaseName(DATABASE_NAME)
            .withUsername("cf017")
            .withPassword("cf017");

    private Cf017PostgresSupport() {
    }

    private static String postgresImage() {
        String major = System.getProperty("cf017.postgres.major", "16");
        if (!java.util.Set.of("16", "17").contains(major)) {
            throw new IllegalArgumentException("CF017 tests support only PostgreSQL 16/17; no external fallback");
        }
        return "postgres:" + major + "-alpine";
    }

    static synchronized void start() {
        if (!POSTGRES.isRunning()) {
            try {
                POSTGRES.start();
                verifyToolchain();
            } catch (RuntimeException exception) {
                throw new IllegalStateException(
                        "PostgreSQL descartavel CF-017 indisponivel; nenhum banco externo sera usado como fallback.",
                        exception
                );
            }
        }
        DisposablePostgresGuard.requireDisposable(POSTGRES.getJdbcUrl(), DATABASE_NAME);
    }

    private static void verifyToolchain() {
        try (var c = DriverManager.getConnection(POSTGRES.getJdbcUrl(), username(), password());
             var s = c.createStatement(); var r = s.executeQuery("SELECT current_setting('server_version_num')::int,version()")) {
            r.next();
            int major = r.getInt(1) / 10000;
            if (!Integer.toString(major).equals(System.getProperty("cf017.postgres.major", "16"))) {
                throw new IllegalStateException("Unexpected PostgreSQL server major");
            }
            System.out.println("CF017_SERVER " + r.getString(2) + " container=" + POSTGRES.getContainerId());
            for (String tool : java.util.List.of("psql", "pg_dump", "pg_restore")) {
                var result = POSTGRES.execInContainer(tool, "--version");
                if (result.getExitCode() != 0 || !result.getStdout().contains("(PostgreSQL) " + major + ".")) {
                    throw new IllegalStateException("Incompatible client " + tool);
                }
                System.out.println("CF017_CLIENT " + result.getStdout().trim());
            }
        } catch (Exception e) {
            throw new IllegalStateException("Disposable PostgreSQL toolchain verification failed", e);
        }
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
        try (Connection connection = connect()) {
            var report = com.controlefinanceiro.api.infra.migration.LegacyPreflight.inspect(connection, schema);
            if (!report.compatible()) throw new IllegalStateException(report.render());
        } catch (Exception exception) {
            throw new IllegalStateException("Preflight legado CF-017 recusou baseline", exception);
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

    private static final java.util.Set<String> CREATED_DATABASES = java.util.concurrent.ConcurrentHashMap.newKeySet();

    static String createRestoreDatabase() throws SQLException {
        String database = "cf_test_cf017_restore_" + UUID.randomUUID().toString().replace("-", "");
        try (var c = connect(); var s = c.createStatement()) {
            s.execute("CREATE DATABASE " + database);
        }
        CREATED_DATABASES.add(database);
        return database;
    }

    static String restoreDatabaseUrl(String database) {
        if (!CREATED_DATABASES.contains(database)) throw new IllegalArgumentException("Target not created by this test");
        String url = jdbcUrl().replace("/" + DATABASE_NAME, "/" + database);
        DisposablePostgresGuard.requireDisposable(url, database);
        return url;
    }

    static Connection connectRestore(String database) throws SQLException {
        return DriverManager.getConnection(restoreDatabaseUrl(database), username(), password());
    }

    static Container.ExecResult exec(String... command) {
        try {
            return POSTGRES.execInContainer(command);
        } catch (Exception exception) {
            throw new IllegalStateException("Comando de backup/restore falhou no PostgreSQL descartavel", exception);
        }
    }

    static void writeContainerTestFile(String filename, String contents) {
        if (!filename.matches("/tmp/cf017_[a-z0-9_]+\\.list")) throw new IllegalArgumentException("Not a test TOC path");
        POSTGRES.copyFileToContainer(org.testcontainers.images.builder.Transferable.of(contents.getBytes(java.nio.charset.StandardCharsets.UTF_8)), filename);
    }

    static void pauseServer() {
        POSTGRES.getDockerClient().pauseContainerCmd(POSTGRES.getContainerId()).exec();
    }

    static void resumeServer() {
        POSTGRES.getDockerClient().unpauseContainerCmd(POSTGRES.getContainerId()).exec();
    }
}
