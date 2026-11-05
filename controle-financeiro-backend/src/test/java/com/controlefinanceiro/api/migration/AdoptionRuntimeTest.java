package com.controlefinanceiro.api.migration;

import com.controlefinanceiro.api.ControleFinanceiroApiApplication;
import com.controlefinanceiro.api.infra.migration.PgSchemaInventory;
import com.controlefinanceiro.api.infra.migration.RestoreSnapshot;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/** Real processes/HTTP/PostgreSQL. Optional preparation.jar exercises the actual packaged bytes. */
class AdoptionRuntimeTest {
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();
    private static final String PASSWORD = "Synthetic-password-123";
    private static final Path LOGS = Path.of("target", "adoption-processes");

    @ParameterizedTest
    @ValueSource(strings = {
            "spring.jpa.hibernate.ddl-auto=update", "spring.flyway.enabled=true",
            "spring.sql.init.mode=always", "spring.jpa.generate-ddl=true",
            "spring.jpa.properties.hibernate.hbm2ddl.auto=create",
            "spring.jpa.properties[hibernate.hbm2ddl.auto]=create",
            "spring.jpa.properties.jakarta.persistence.schema-generation.database.action=drop-and-create",
            "spring.jpa.properties.jakarta.persistence.schema-generation.database.action=none",
            "spring.jpa.properties.javax.persistence.schema-generation.database.action=none",
            "spring.jpa.properties[jakarta.persistence.schema-generation.database.action]=none",
            "app.operations.jobs-enabled=true"
    })
    void unsafeOverridesFailBeforeAnySchemaChange(String override, @TempDir Path temp) throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_unsafe");
        snapshot(schema, temp.resolve("before"));
        try (App app = new App(schema, false, false, List.of("--" + override), Map.of())) {
            assertThat(app.process.waitFor(40, TimeUnit.SECONDS)).isTrue();
            assertThat(app.process.exitValue()).isNotZero();
            assertThat(Files.readString(app.log)).contains("Unsafe adoption configuration");
        }
        snapshot(schema, temp.resolve("after"));
        assertThat(RestoreSnapshot.compare(temp.resolve("before"), temp.resolve("after"))).isEmpty();
    }

    @Test void remoteStyleEnvironmentOverrideAlsoFailsBeforeDdl(@TempDir Path temp) throws Exception {
        String schema = Cf017PostgresSupport.createSchema("cf017_env");
        snapshot(schema, temp.resolve("before"));
        try (App app = new App(schema, false, false, List.of(), Map.of("SPRING_JPA_HIBERNATE_DDL_AUTO", "update"))) {
            assertThat(app.process.waitFor(40, TimeUnit.SECONDS)).isTrue();
            assertThat(app.process.exitValue()).isNotZero();
            assertThat(Files.readString(app.log)).contains("Unsafe adoption configuration: spring.jpa.hibernate.ddl-auto");
        }
        snapshot(schema, temp.resolve("after"));
        assertThat(RestoreSnapshot.compare(temp.resolve("before"), temp.resolve("after"))).isEmpty();
    }

    @Test void emptyOrIncompatibleSchemaCannotStartOrMigrate(@TempDir Path temp) throws Exception {
        for (boolean migrated : List.of(false, true)) {
            String schema = Cf017PostgresSupport.createSchema("cf017_invalid");
            if (migrated) {
                Cf017PostgresSupport.flyway(schema).migrate();
                execute(schema, "ALTER TABLE accounts DROP COLUMN balance");
            }
            Path before = temp.resolve("before-" + migrated), after = temp.resolve("after-" + migrated);
            snapshot(schema, before);
            try (App app = new App(schema, true, false)) {
                assertThat(app.process.waitFor(40, TimeUnit.SECONDS)).isTrue();
                assertThat(app.process.exitValue()).isNotZero();
                assertThat(Files.readString(app.log)).contains("SchemaManagementException")
                        .contains(migrated ? "missing column [balance]" : "missing table [accounts]");
            }
            snapshot(schema, after);
            assertThat(RestoreSnapshot.compare(before, after)).isEmpty();
        }
    }

    @Test void maintenanceBlocksAllFunctionalIngressWithoutDatabaseEffects(@TempDir Path temp) throws Exception {
        String schema = migratedSchema();
        seedUser(schema, "10000000-0000-0000-0000-000000000001", "a@example.test");
        snapshot(schema, temp.resolve("before"));
        try (App app = new App(schema, false, false)) {
            app.awaitStatus("/ops/health/liveness", 200);
            assertThat(app.call("GET", "/ops/health/readiness", null, null).statusCode()).isEqualTo(503);
            String token = syntheticToken();
            var blockedWrite = app.call("POST", "/accounts",
                    "{\"name\":\"Must not persist\",\"type\":\"CHECKING\",\"initialBalance\":123.45}", token);
            long accounts = count(schema, "accounts");
            System.out.println("ADOPTION_BLOCKED_WRITE http=" + blockedWrite.statusCode() + " persistedAccounts=" + accounts);
            assertThat(blockedWrite.statusCode()).isEqualTo(503);
            assertThat(accounts).isZero();
            for (String path : List.of("/auth/login", "/auth/register", "/auth/recover-password", "/auth/reset-password",
                    "/accounts", "/transactions", "/cards", "/investments", "/goals", "/habits",
                    "/onboarding", "/planning?month=1&year=2026", "/ops", "/ops/health/readiness/extra")) {
                for (String method : List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")) {
                    var response = app.call(method, path,
                            "{\"email\":\"a@example.test\",\"nome\":\"Synthetic\",\"senha\":\"" + PASSWORD + "\"}", null);
                    assertThat(response.statusCode()).as(method + " " + path).isEqualTo(503);
                    assertThat(response.headers().firstValue("Retry-After")).contains("60");
                }
            }
            assertThat(Files.readString(app.log)).doesNotContain("MARKET: Iniciando");
        }
        snapshot(schema, temp.resolve("after"));
        assertThat(RestoreSnapshot.compare(temp.resolve("before"), temp.resolve("after"))).isEmpty();
    }

    @Test void releasedProcessPreservesAuthOwnershipAndEffectsThenCanFreezeAgain(@TempDir Path temp) throws Exception {
        String schema = migratedSchema();
        seedUser(schema, "10000000-0000-0000-0000-000000000001", "a@example.test");
        seedUser(schema, "10000000-0000-0000-0000-000000000002", "b@example.test");
        try (App app = new App(schema, true, false)) {
            app.awaitStatus("/ops/health/readiness", 200);
            assertThat(app.call("GET", "/accounts", null, null).statusCode()).isEqualTo(401);
            assertThat(app.call("GET", "/ops/admin", null, null).statusCode()).isEqualTo(401);
            var health = app.call("GET", "/ops/health/readiness", null, null);
            assertThat(health.body()).isEqualTo("{\"status\":\"UP\"}");
            String tokenA = app.login("a@example.test"), tokenB = app.login("b@example.test");
            var created = app.call("POST", "/accounts", "{\"name\":\"Only A\",\"type\":\"CHECKING\",\"initialBalance\":123.45}", tokenA);
            assertThat(created.statusCode()).as(created.body()).isEqualTo(200);
            String id = field(created.body(), "id");
            assertThat(app.call("GET", "/accounts", null, tokenA).body()).contains("Only A");
            assertThat(app.call("GET", "/accounts", null, tokenB).body()).doesNotContain("Only A");
            assertThat(app.call("DELETE", "/accounts/" + id, null, tokenB).statusCode()).isEqualTo(404);
            assertThat(app.call("GET", "/planning?month=1&year=2026", null, tokenA).statusCode()).isEqualTo(200);
            assertThat(count(schema, "monthly_plans")).isEqualTo(1);
            assertThat(count(schema, "accounts")).isEqualTo(1);
            assertThat(count(schema, "shedlock")).isZero();
        }
        snapshot(schema, temp.resolve("before-freeze"));
        try (App frozen = new App(schema, false, false)) {
            frozen.awaitStatus("/ops/health/liveness", 200);
            assertThat(frozen.call("POST", "/accounts", "{}", null).statusCode()).isEqualTo(503);
            assertThat(frozen.call("GET", "/planning?month=2&year=2026", null, null).statusCode()).isEqualTo(503);
        }
        snapshot(schema, temp.resolve("after-freeze"));
        assertThat(RestoreSnapshot.compare(temp.resolve("before-freeze"), temp.resolve("after-freeze"))).isEmpty();
    }

    @Test void enabledJobsActuallyRunButDisabledJobsLeaveNoLockOrSideEffect() throws Exception {
        String schema = migratedSchema();
        try (App app = new App(schema, true, true)) {
            app.awaitStatus("/ops/health/readiness", 200);
            long deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
            while (count(schema, "shedlock") == 0 && System.nanoTime() < deadline) Thread.sleep(50);
            assertThat(count(schema, "shedlock")).isEqualTo(1);
            assertThat(Files.readString(app.log)).contains("MARKET: Iniciando");
        }
    }

    @Test void readinessFailsWithinBudgetWhenDatabaseStopsAndRecoversWithoutRestart() throws Exception {
        String schema = migratedSchema();
        try (App app = new App(schema, true, false)) {
            app.awaitStatus("/ops/health/readiness", 200);
            Cf017PostgresSupport.pauseServer();
            try {
                long started = System.nanoTime();
                var response = app.call("GET", "/ops/health/readiness", null, syntheticToken());
                long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
                assertThat(response.statusCode()).isEqualTo(503);
                assertThat(response.body()).isEqualTo("{\"status\":\"DOWN\"}");
                assertThat(elapsedMs).isLessThan(5000);
                assertThat(app.call("GET", "/ops/health/liveness", null, syntheticToken()).statusCode()).isEqualTo(200);
                System.out.println("ADOPTION_DB_UNAVAILABLE readiness503=true liveness200=true elapsedMs=" + elapsedMs);
            } finally { Cf017PostgresSupport.resumeServer(); }
            app.awaitStatus("/ops/health/readiness", 200);
            System.out.println("ADOPTION_DB_RECOVERY sameProcess=true readiness200=true");
        }
    }

    private static String migratedSchema() {
        String schema = Cf017PostgresSupport.createSchema("cf017_runtime");
        Cf017PostgresSupport.flyway(schema).migrate();
        return schema;
    }
    private static String syntheticToken() {
        return com.auth0.jwt.JWT.create().withIssuer("controle-financeiro-api")
                .withSubject("a@example.test").withClaim("id", "10000000-0000-0000-0000-000000000001")
                .withExpiresAt(java.time.Instant.now().plusSeconds(600))
                .sign(com.auth0.jwt.algorithms.Algorithm.HMAC256("synthetic-adoption-secret-at-least-32-chars"));
    }
    private static void snapshot(String schema, Path path) throws Exception {
        try (var c = Cf017PostgresSupport.connect()) {
            PgSchemaInventory.beginReadOnly(c, schema); RestoreSnapshot.capture(c, path);
        }
    }
    private static void execute(String schema, String sql) throws Exception {
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement()) {
            s.execute("SET search_path TO " + schema); s.execute(sql);
        }
    }
    private static long count(String schema, String table) throws Exception {
        try (var c = Cf017PostgresSupport.connect(); var s = c.createStatement();
             var r = s.executeQuery("SELECT count(*) FROM " + schema + "." + table)) {
            r.next(); return r.getLong(1);
        }
    }
    private static void seedUser(String schema, String id, String email) throws Exception {
        try (var c = Cf017PostgresSupport.connect(); var s = c.prepareStatement("INSERT INTO " + schema
                + ".users(id,nome,email,senha,dark_mode,privacy_mode,notif_contas,notif_semanal) VALUES (?::uuid,'Synthetic',?,?,false,false,false,false)")) {
            s.setString(1, id); s.setString(2, email); s.setString(3, new BCryptPasswordEncoder().encode(PASSWORD)); s.executeUpdate();
        }
    }
    private static String field(String json, String name) throws Exception {
        return new com.fasterxml.jackson.databind.ObjectMapper().readTree(json).get(name).asText();
    }

    static final class App implements AutoCloseable {
        final Process process;
        final Path log;
        int port;
        final String containerName;
        App(String schema, boolean writers, boolean jobs) throws Exception { this(schema, writers, jobs, List.of(), Map.of()); }
        App(String schema, boolean writers, boolean jobs, List<String> overrides, Map<String, String> envOverrides) throws Exception {
            // Let Tomcat/Docker reserve the actual listener. Closing a temporary
            // ServerSocket left a TOCTOU window for unrelated processes/clients.
            port = 0;
            Files.createDirectories(LOGS); log = LOGS.resolve(UUID.randomUUID() + ".log");
            var command = new ArrayList<String>();
            String jar = System.getProperty("preparation.jar");
            String image = System.getProperty("preparation.image");
            containerName = image == null ? null : "cf-adoption-" + UUID.randomUUID();
            var config = new HashMap<>(Map.of("SPRING_DATASOURCE_URL", Cf017PostgresSupport.schemaJdbcUrl(schema) + "&connectTimeout=2&socketTimeout=2",
                    "SPRING_DATASOURCE_USERNAME", Cf017PostgresSupport.username(), "SPRING_DATASOURCE_PASSWORD", Cf017PostgresSupport.password(),
                    "JWT_SECRET", "synthetic-adoption-secret-at-least-32-chars", "BRAPI_TOKEN", "synthetic-unused",
                    "RESEND_API_KEY", "synthetic-unused", "EMAIL_RESEND", "no-reply@example.test", "FRONT_URL", "http://localhost"));
            config.putAll(envOverrides);
            if (image == null) {
                command.addAll(List.of(Path.of(System.getProperty("java.home"), "bin", "java").toString(), "-Xmx384m"));
                if (jar == null) command.addAll(List.of("-cp", System.getProperty("java.class.path"), ControleFinanceiroApiApplication.class.getName()));
                else command.addAll(List.of("-jar", Path.of(jar).toAbsolutePath().toString()));
            } else {
                if (!image.matches("sha256:[a-f0-9]{64}")) throw new IllegalArgumentException("Use the locally built image ID");
                config.computeIfPresent("SPRING_DATASOURCE_URL", (key, url) -> url.replace("//localhost:", "//host.docker.internal:"));
                command.addAll(List.of("docker", "run", "--rm", "--name", containerName,
                        "--label", "cf.preparation.adoption=true", "-p", "127.0.0.1::8080"));
                config.forEach((key, value) -> command.addAll(List.of("--env", key + "=" + value)));
                command.add(image);
            }
            var arguments = new java.util.LinkedHashMap<String, String>();
            arguments.put("spring.profiles.active", "adoption");
            arguments.put("server.port", Integer.toString(image == null ? 0 : 8080));
            arguments.put("app.operations.writers-enabled", Boolean.toString(writers));
            arguments.put("app.operations.jobs-enabled", Boolean.toString(jobs));
            for (String override : overrides) {
                String[] parts = override.substring(2).split("=", 2);
                arguments.put(parts[0], parts[1]);
            }
            arguments.forEach((key, value) -> command.add("--" + key + "=" + value));
            var builder = new ProcessBuilder(command).redirectErrorStream(true).redirectOutput(log.toFile());
            var env = builder.environment();
            env.keySet().removeIf(key -> key.startsWith("SPRING_") || key.startsWith("DB_") || key.startsWith("FLYWAY_") || key.equals("JAVA_TOOL_OPTIONS"));
            env.putAll(config);
            process = builder.start();
            System.out.println("ADOPTION_PROCESS mode=" + (image != null ? "image" : jar == null ? "classes" : "jar") + " pid=" + process.pid() + " log=" + log);
        }
        HttpResponse<String> call(String method, String path, String body, String token) throws Exception {
            var request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path)).timeout(Duration.ofSeconds(8))
                    .header("Content-Type", "application/json").method(method, body == null || method.equals("HEAD")
                            ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
            if (token != null) request.header("Authorization", "Bearer " + token);
            return HTTP.send(request.build(), HttpResponse.BodyHandlers.ofString());
        }
        void awaitStatus(String path, int expected) throws Exception {
            long deadline = System.nanoTime() + Duration.ofSeconds(40).toNanos();
            while (process.isAlive() && System.nanoTime() < deadline) {
                try {
                    if (port == 0) discoverBoundPort();
                    if (port != 0 && call("GET", path, null, null).statusCode() == expected) return;
                }
                catch (java.io.IOException starting) { /* Port not accepting connections yet. */ }
                Thread.sleep(100);
            }
            throw new AssertionError("Expected HTTP " + expected + " at " + path + "; process log: " + Files.readString(log));
        }
        private void discoverBoundPort() throws Exception {
            var bound = java.util.regex.Pattern.compile("Tomcat started on port (\\d+)").matcher(Files.readString(log));
            if (!bound.find()) return;
            if (containerName == null) port = Integer.parseInt(bound.group(1));
            else {
                var mapping = new ProcessBuilder("docker", "port", containerName, "8080/tcp").redirectErrorStream(true).start();
                assertThat(mapping.waitFor(5, TimeUnit.SECONDS)).isTrue();
                assertThat(mapping.exitValue()).isZero();
                String address = new String(mapping.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8).trim();
                assertThat(address).startsWith("127.0.0.1:");
                port = Integer.parseInt(address.substring(address.lastIndexOf(':') + 1));
            }
        }
        String login(String email) throws Exception {
            var response = call("POST", "/auth/login", "{\"email\":\"" + email + "\",\"senha\":\"" + PASSWORD + "\"}", null);
            assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
            return field(response.body(), "token");
        }
        @Override public void close() throws Exception {
            if (containerName != null && process.isAlive()) {
                var stop = new ProcessBuilder("docker", "stop", "--time", "10", containerName).redirectErrorStream(true)
                        .redirectOutput(ProcessBuilder.Redirect.DISCARD).start();
                assertThat(stop.waitFor(20, TimeUnit.SECONDS)).isTrue();
                assertThat(stop.exitValue()).isZero();
            }
            if (containerName != null || port == 0 || !System.getProperty("os.name").startsWith("Windows")) {
                process.destroy();
                if (!process.waitFor(10, TimeUnit.SECONDS)) { process.destroyForcibly(); assertThat(process.waitFor(5, TimeUnit.SECONDS)).isTrue(); }
                return;
            }
            long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
            process.destroy();
            if (!process.waitFor(Math.max(0, deadline - System.nanoTime()), TimeUnit.NANOSECONDS)) {
                deadline = System.nanoTime() + Duration.ofSeconds(5).toNanos();
                process.destroyForcibly();
                assertThat(process.waitFor(Math.max(0, deadline - System.nanoTime()), TimeUnit.NANOSECONDS)).isTrue();
            }
            AdoptionNativeSockets.awaitReleased(process.pid(), port, deadline);
        }
    }
}
