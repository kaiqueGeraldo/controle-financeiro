package com.controlefinanceiro.api.infra.security;

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

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(initializers=IsolationSchemaInitializer.class)
class UserIsolationBrowserIntegrationTest extends PostgresIntegrationTest {
    @LocalServerPort int port;
    @Autowired JdbcTemplate sql;
    @MockitoBean Clock clock;
    @Test void loginLogoutAccountSwitchAndReloadUseRealBffAndPostgres() throws Exception {
        String instant="2026-09-30T15:00:00Z";
        when(clock.getZone()).thenReturn(ZoneId.of("America/Sao_Paulo")); when(clock.instant()).thenReturn(Instant.parse(instant));
        Path backend=Path.of(System.getProperty("user.dir")).toAbsolutePath();
        Path frontend=backend.resolveSibling("controle-financeiro-frontend");
        Path evidence=backend.resolve("../tasks/evidencias/CF-023/browser/"+System.getProperty("cf023.run","candidate")).normalize();
        Files.createDirectories(evidence);
        String namespace="cf023-"+UUID.randomUUID().toString().substring(0,8);
        var server=new ProcessBuilder("node","node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port","3113");
        server.directory(frontend.toFile());server.redirectErrorStream(true);server.redirectOutput(evidence.resolve("next.log").toFile());
        server.environment().put("BACKEND_API_URL","http://127.0.0.1:"+port);
        server.environment().put("CF_E2E_SERVER_CLOCK","1");server.environment().put("CF_E2E_AUTH_NOW",instant);
        server.environment().put("NODE_OPTIONS","--require ./tests/e2e/support/server-clock.cjs");
        Process next=server.start();
        try {
            var runner=new ProcessBuilder("node",backend.resolve("src/test/java/com/controlefinanceiro/api/infra/security/browser.cjs").toString(),frontend.toString(),evidence.toString(),namespace,instant);
            runner.directory(frontend.toFile());runner.redirectErrorStream(true);runner.redirectOutput(evidence.resolve("playwright.log").toFile());
            runner.environment().put("PLAYWRIGHT_BROWSERS_PATH","0");
            Process browser=runner.start();boolean completed=browser.waitFor(180,TimeUnit.SECONDS);
            if(!completed){browser.descendants().forEach(ProcessHandle::destroyForcibly);browser.destroyForcibly();}
            assertThat(completed).as("Browser completed").isTrue();
            assertThat(browser.exitValue()).as(Files.readString(evidence.resolve("playwright.log"))).isZero();
            assertThat(sql.queryForList("select balance from accounts where name like ? order by name",java.math.BigDecimal.class,namespace+"-ACCOUNT-%"))
                    .containsExactly(new java.math.BigDecimal("1000.00"),new java.math.BigDecimal("2300.00"));
            assertThat(sql.queryForObject("select count(distinct user_id) from accounts where name like ?",Integer.class,namespace+"-ACCOUNT-%")).isEqualTo(2);
        } finally {next.descendants().forEach(ProcessHandle::destroyForcibly);next.destroyForcibly();}
    }
}
