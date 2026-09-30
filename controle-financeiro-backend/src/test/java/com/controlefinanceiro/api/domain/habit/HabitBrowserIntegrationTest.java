package com.controlefinanceiro.api.domain.habit;

import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.nio.file.*;
import java.time.*;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(initializers = HabitSchemaInitializer.class)
class HabitBrowserIntegrationTest extends PostgresIntegrationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @MockitoBean Clock clock;

    @Test void browserBffSpringAndPostgresKeepDailyAndWeeklyNumericEffectsAfterReload() throws Exception {
        assertThat(System.getProperty("user.timezone")).isEqualTo("UTC");
        String instant = "2027-01-05T02:59:59Z";
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo"));
        when(clock.instant()).thenReturn(Instant.parse(instant));
        Path backend = Path.of(System.getProperty("user.dir")).toAbsolutePath();
        Path frontend = backend.resolveSibling("controle-financeiro-frontend");
        Path evidence = backend.resolve("../tasks/evidencias/CF-022/browser").normalize();
        Files.createDirectories(evidence);
        String namespace = "cf022-" + UUID.randomUUID().toString().substring(0, 8);
        var server = new ProcessBuilder("node", "node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3112");
        server.directory(frontend.toFile()); server.redirectErrorStream(true); server.redirectOutput(evidence.resolve("next.log").toFile());
        server.environment().put("BACKEND_API_URL", "http://127.0.0.1:" + port);
        server.environment().put("CF_E2E_SERVER_CLOCK", "1"); server.environment().put("CF_E2E_AUTH_NOW", instant);
        server.environment().put("NODE_OPTIONS", "--require ./tests/e2e/support/server-clock.cjs");
        Process next = server.start();
        try {
            var browser = new ProcessBuilder("node", backend.resolve("src/test/java/com/controlefinanceiro/api/domain/habit/browser.cjs").toString(),
                    frontend.toString(), evidence.toString(), namespace, instant);
            browser.directory(frontend.toFile()); browser.redirectErrorStream(true); browser.redirectOutput(evidence.resolve("playwright.log").toFile());
            browser.environment().put("PLAYWRIGHT_BROWSERS_PATH", "0");
            Process process = browser.start();
            boolean completed = process.waitFor(180, TimeUnit.SECONDS);
            if (!completed) { process.descendants().forEach(ProcessHandle::destroyForcibly); process.destroyForcibly(); }
            assertThat(completed).as("Browser process completed").isTrue();
            assertThat(process.exitValue()).as(Files.readString(evidence.resolve("playwright.log"))).isZero();
            assertThat(sql.queryForObject("""
                    select count(*) from habits h join users u on u.id=h.user_id
                    where u.email like ? and h.current_streak=0 and h.highest_streak=0
                    """, Integer.class, "%" + namespace + "%")).isEqualTo(4);
            assertThat(sql.queryForObject("""
                    select count(*) from habit_logs l join habits h on h.id=l.habit_id join users u on u.id=h.user_id
                    where u.email like ? and l.log_date='2027-01-04' and l.status='PENDING' and l.goal_history_id is null
                    """, Integer.class, "%" + namespace + "%")).isEqualTo(4);
            assertThat(sql.queryForObject("select count(*) from goals g join users u on u.id=g.user_id where u.email like ? and g.current_value=0",
                    Integer.class, "%" + namespace + "%")).isEqualTo(4);
            assertThat(sql.queryForObject("select count(*) from goal_history gh join goals g on g.id=gh.goal_id join users u on u.id=g.user_id where u.email like ?",
                    Integer.class, "%" + namespace + "%")).isZero();
        } finally { next.descendants().forEach(ProcessHandle::destroyForcibly); next.destroyForcibly(); }
    }
}
