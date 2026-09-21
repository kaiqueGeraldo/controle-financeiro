package com.controlefinanceiro.api;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.MarketDataService;
import com.controlefinanceiro.api.support.PostgresTestContainerInitializer;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ContextConfiguration(initializers = PostgresTestContainerInitializer.class)
@Import(TemporalBrowserApiPostgresE2E.FixedClockConfiguration.class)
class TemporalBrowserApiPostgresE2E {

    private static final Instant FIXED_NOW = Instant.parse("2027-01-31T05:00:00Z");
    // Autenticação deliberadamente posterior à antiga expiração; calendário de negócio estável.
    private static final Instant AUTH_NOW = FIXED_NOW.plus(Duration.ofDays(2));
    private static final ZoneId PRODUCT_ZONE = ZoneId.of("America/Sao_Paulo");

    @LocalServerPort
    private int backendPort;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockitoBean
    private EmailService emailService;

    @MockitoBean
    private MarketDataService marketDataService;

    @Test
    void browserBffSpringAndPostgresKeepTheSameCivilDates() throws Exception {
        assertThat(System.getProperty("user.timezone")).isEqualTo("UTC");

        Path backendDirectory = Path.of(System.getProperty("user.dir")).toAbsolutePath();
        Path frontendDirectory = backendDirectory.resolveSibling("controle-financeiro-frontend");
        assertThat(frontendDirectory.resolve("node_modules/@playwright/test/cli.js")).isRegularFile();

        String namespace = "cf007-" + UUID.randomUUID().toString().substring(0, 8);
        Path exportDirectory = frontendDirectory
                .resolve("tests/artifacts/cf007")
                .resolve(namespace);
        Files.createDirectories(exportDirectory);
        Files.deleteIfExists(exportDirectory.resolve("sao-paulo.xlsx"));
        Files.deleteIfExists(exportDirectory.resolve("kiritimati.xlsx"));
        Path playwrightLog = exportDirectory.resolve("playwright.log");
        Files.deleteIfExists(playwrightLog);

        String selectedProject = System.getProperty("cf007.playwright.project");
        if (selectedProject != null) {
            assertThat(selectedProject).isIn("sao-paulo", "kiritimati");
        }
        List<String> command = new ArrayList<>(List.of(
                "node",
                "node_modules/@playwright/test/cli.js",
                "test",
                "--config",
                "tests/e2e/playwright.integrated.config.ts"
        ));
        if (selectedProject != null) {
            command.add("--project=chromium-desktop-" + selectedProject + "-cf007-v1");
        }
        ProcessBuilder playwright = new ProcessBuilder(command);
        playwright.directory(frontendDirectory.toFile());
        playwright.redirectErrorStream(true);
        playwright.redirectOutput(playwrightLog.toFile());
        playwright.environment().put("BACKEND_API_URL", "http://127.0.0.1:" + backendPort);
        playwright.environment().put("CF_TEST_BASE_URL", "http://127.0.0.1:3107");
        playwright.environment().put("CF_TEST_FIXED_NOW", FIXED_NOW.toString());
        playwright.environment().put("CF_E2E_AUTH_NOW", AUTH_NOW.toString());
        playwright.environment().put("CF_TEST_SEED", "cf007-v1");
        playwright.environment().put("CF_E2E_NAMESPACE", namespace);
        playwright.environment().put("CF_E2E_EXPORT_DIR", exportDirectory.toString());
        playwright.environment().put("PLAYWRIGHT_BROWSERS_PATH", "0");

        Process process = playwright.start();
        boolean completed = process.waitFor(12, TimeUnit.MINUTES);
        if (!completed) {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
            process.destroyForcibly();
        }

        assertThat(completed)
                .as("Playwright deve terminar sem sleep fixo e liberar os processos Next/Chromium")
                .isTrue();
        assertThat(process.exitValue())
                .as("fluxo Playwright integrado deve aprovar nos dois fusos.%n%s", Files.readString(playwrightLog))
                .isZero();

        List<String> keys = selectedProject == null
                ? List.of("sao-paulo", "kiritimati")
                : List.of(selectedProject);
        for (String key : keys) {
            String tag = namespace + "-" + key;
            assertTransactionPersistence(tag);
            assertCardPurchasePersistence(tag);
            assertInvestmentPersistence(tag, key);
            assertGoalPersistence(tag);
            assertHabitPersistence(tag);
            assertPlanningPersistence(tag);
            assertExport(exportDirectory.resolve(key + ".xlsx"), tag);
            for (String mode : List.of("ok", "read", "lost", "overlap")) {
                assertPaymentPersistence(namespace + "-pay-" + mode + "-" + (key.equals("sao-paulo") ? "sp" : "kir"));
            }
            assertThat(count("""
                    select count(*) from yearly_notes n join users u on u.id=n.user_id
                    where u.email like ? and n.content='rascunho posterior'
                    """, "%" + namespace + "-note-" + (key.equals("sao-paulo") ? "sp" : "kir") + "%"))
                    .as("R04: somente a segunda versão confirmada persiste no PostgreSQL").isEqualTo(1);
        }
    }

    private void assertPaymentPersistence(String tag) {
        assertThat(jdbcTemplate.queryForObject("select balance from accounts where name=?", java.math.BigDecimal.class, tag))
                .as("R03: débito único confirmado por SQL após navegador/reload").isEqualByComparingTo("900");
        assertThat(count("""
                select count(*) from transactions t join accounts a on a.id=t.account_id
                 where a.name=? and t.description='Pagamento de Fatura' and t.amount=100 and t.is_paid=true
                """, tag)).isEqualTo(1);
        assertThat(count("""
                select count(*) from invoices i join credit_cards c on c.id=i.card_id
                 where c.name=? and i.month=1 and i.year=2027 and i.status='PAID'
                """, tag)).isEqualTo(1);
        assertThat(count("""
                select count(*) from plan_items p join credit_cards c on c.id=p.card_id
                 where c.name=? and p.status='PAID' and p.amount=100
                """, tag)).isEqualTo(1);
    }

    private void assertTransactionPersistence(String tag) {
        assertThat(count("""
                select count(*)
                  from transactions t
                  join users u on u.id = t.user_id
                 where u.email like ?
                   and t.description = ?
                   and t.date = ?
                   and t.created_at = ?
                   and t.operation_time = time '08:15:00' and t.time_origin = 'USER_INPUT'
                   and t.recorded_at = timestamptz '2027-01-31 05:00:00+00'
                   and t.legacy_created_at_raw = timestamp '2027-01-30 23:30:00'
                """,
                "%" + tag + "%",
                tag + "-transacao",
                LocalDate.of(2027, 1, 29),
                LocalDateTime.of(2027, 1, 29, 8, 15)))
                .isEqualTo(1);

        assertThat(count("""
                select count(*)
                  from transactions t
                  join users u on u.id = t.user_id
                 where u.email like ?
                   and t.description = ?
                """,
                "%" + tag + "%",
                tag + "-rejeitada"))
                .as("HTTP 400 não pode persistir a transação adulterada")
                .isZero();
    }

    private void assertCardPurchasePersistence(String tag) {
        assertThat(count("""
                select count(*)
                  from card_transactions ct
                  join invoices i on i.id = ct.invoice_id
                  join credit_cards c on c.id = i.card_id
                  join users u on u.id = c.user_id
                 where u.email like ?
                   and ct.description = ?
                   and ct.date = ?
                   and ct.created_at = ?
                   and ct.operation_time = time '23:30:00' and ct.time_origin = 'USER_INPUT'
                   and ct.recorded_at = timestamptz '2027-01-31 05:00:00+00'
                """,
                "%" + tag + "%",
                tag + "-compra-cartao",
                LocalDate.of(2027, 1, 30),
                LocalDateTime.of(2027, 1, 30, 23, 30)))
                .isEqualTo(1);
    }

    private void assertInvestmentPersistence(String tag, String key) {
        String ticker = key.equals("kiritimati") ? "CF7KIR" : "CF7SP";
        assertThat(count("""
                select count(*)
                  from invest_transactions it
                  join investments i on i.id = it.investment_id
                  join users u on u.id = i.user_id
                 where u.email like ?
                   and i.ticker = ?
                   and it.type = 'BUY'
                   and it.date = ?
                   and it.operation_date = date '2027-01-30' and it.date_origin = 'USER_INPUT'
                """,
                "%" + tag + "%",
                ticker,
                LocalDateTime.of(2027, 1, 30, 0, 0)))
                .isEqualTo(1);

        assertThat(count("""
                select count(*)
                  from transactions t
                  join users u on u.id = t.user_id
                 where u.email like ?
                   and t.description = ?
                   and t.date = ?
                """,
                "%" + tag + "%",
                "Aporte: " + ticker,
                LocalDate.of(2027, 1, 30)))
                .as("efeito bancário da operação deve conservar o dia explícito")
                .isEqualTo(1);
    }

    private void assertGoalPersistence(String tag) {
        assertThat(count("""
                select count(*)
                  from goals g
                  join users u on u.id = g.user_id
                 where u.email like ?
                   and g.title = ?
                   and g.deadline = ?
                """,
                "%" + tag + "%",
                tag + "-meta",
                LocalDate.of(2027, 2, 2)))
                .isEqualTo(1);
    }

    private void assertHabitPersistence(String tag) {
        assertThat(count("""
                select count(*)
                  from habit_logs hl
                  join habits h on h.id = hl.habit_id
                  join users u on u.id = h.user_id
                 where u.email like ?
                   and h.name = ?
                   and hl.log_date = ?
                   and hl.status = 'COMPLETED'
                """,
                "%" + tag + "%",
                tag + "-habito",
                LocalDate.of(2027, 1, 31)))
                .isEqualTo(1);
    }

    private void assertExport(Path workbookPath, String tag) throws IOException {
        assertThat(workbookPath).isRegularFile();
        try (Workbook workbook = new XSSFWorkbook(Files.newInputStream(workbookPath))) {
            Sheet sheet = workbook.getSheet("Extrato Financeiro");
            assertThat(sheet).isNotNull();

            boolean found = false;
            for (Row row : sheet) {
                if (row.getCell(2) != null && (tag + "-transacao").equals(row.getCell(2).getStringCellValue())) {
                    assertThat(row.getCell(0).getStringCellValue()).isEqualTo("29/01/2027");
                    assertThat(row.getCell(1).getStringCellValue()).isEqualTo("08:15");
                    found = true;
                    break;
                }
            }
            assertThat(found)
                    .as("exportação deve conter a transação editada de %s", tag)
                    .isTrue();
        }
    }

    private void assertPlanningPersistence(String tag) {
        assertThat(count("""
                select count(*) from plan_items i join monthly_plans p on p.id=i.plan_id
                join users u on u.id=p.user_id where u.email like ? and i.description=?
                and i.due_date=? and i.amount=35.50 and i.status='SAVED' and p.month=1 and p.year=2027
                """, "%" + tag + "-planning%", tag + "-planning-editado", LocalDate.of(2027, 1, 29)))
                .as("P03: edição persiste na competência e preserva status").isEqualTo(1);
    }

    private int count(String sql, Object... arguments) {
        Integer result = jdbcTemplate.queryForObject(sql, Integer.class, arguments);
        return result == null ? 0 : result;
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClockConfiguration {

        @Bean
        static org.springframework.beans.factory.config.BeanPostProcessor testCredentialClock() {
            return new org.springframework.beans.factory.config.BeanPostProcessor() {
                @Override
                public Object postProcessBeforeInitialization(Object bean, String name) {
                    if (bean instanceof com.controlefinanceiro.api.infra.security.TokenService
                            || bean instanceof com.controlefinanceiro.api.service.AuthService) {
                        org.springframework.test.util.ReflectionTestUtils.setField(bean, "clock", Clock.fixed(AUTH_NOW, PRODUCT_ZONE));
                    }
                    return bean;
                }
            };
        }

        @Bean
        @Primary
        Clock fixedProductClock() {
            return Clock.fixed(FIXED_NOW, PRODUCT_ZONE);
        }
    }
}
