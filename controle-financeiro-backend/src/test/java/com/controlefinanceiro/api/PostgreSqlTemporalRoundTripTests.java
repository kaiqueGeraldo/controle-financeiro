package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.goal.GoalType;
import com.controlefinanceiro.api.domain.goal.dto.CreateGoalDTO;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.dto.TransactionResponseDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Import(PostgreSqlTemporalRoundTripTests.FixedClockConfiguration.class)
class PostgreSqlTemporalRoundTripTests extends PostgresIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private JsonMapper jsonMapper;

    @Autowired
    private Validator validator;

    @Test
    void civilDateAndProvidedWallTimeSurvivePostgresAndJacksonRoundTrip() {
        transactionTemplate.executeWithoutResult(status -> {
            User user = userRepository.save(user("round-trip@example.test"));
            Account account = accountRepository.save(account(user));
            Transaction transaction = new Transaction();
            transaction.setDescription("Operação temporal sintética");
            transaction.setAmount(new BigDecimal("10.00"));
            transaction.setDate(LocalDate.of(2024, 2, 29));
            transaction.setCreatedAt(LocalDateTime.of(2024, 2, 29, 23, 30, 45));
            transaction.setType(TransactionType.INCOME);
            transaction.setPaid(false);
            transaction.setAccount(account);
            transaction.setUser(user);

            Transaction saved = transactionRepository.save(transaction);
            entityManager.flush();
            entityManager.clear();

            Transaction reloaded = transactionRepository.findById(saved.getId()).orElseThrow();
            assertThat(reloaded.getDate()).isEqualTo(LocalDate.of(2024, 2, 29));
            assertThat(reloaded.getCreatedAt()).isEqualTo(LocalDateTime.of(2024, 2, 29, 23, 30, 45));

            String json = jsonMapper.writeValueAsString(new TransactionResponseDTO(reloaded));
            assertThat(json).contains("\"date\":\"2024-02-29\"");
            assertThat(json).contains("\"createdAt\":\"2024-02-29T23:30:45\"");
            status.setRollbackOnly();
        });

        assertThat(userRepository.findUserByEmail("round-trip@example.test")).isEmpty();
    }

    @Test
    @SuppressWarnings("unchecked")
    void syntheticSchemaKeepsCivilAndLegacyTemporalTypesDistinct() {
        List<Object[]> rows = entityManager.createNativeQuery("""
                select table_name, column_name, data_type
                  from information_schema.columns
                 where table_schema = current_schema()
                   and (table_name, column_name) in (
                       ('transactions', 'date'),
                       ('transactions', 'created_at'),
                       ('card_transactions', 'date'),
                       ('card_transactions', 'created_at'),
                       ('users', 'recovery_token_expiry'),
                       ('invest_transactions', 'date'),
                       ('goal_history', 'date')
                   )
                 order by table_name, column_name
                """).getResultList();

        assertThat(rows)
                .extracting(row -> row[0] + "." + row[1] + "=" + row[2])
                .containsExactly(
                        "card_transactions.created_at=timestamp without time zone",
                        "card_transactions.date=date",
                        "goal_history.date=timestamp without time zone",
                        "invest_transactions.date=timestamp without time zone",
                        "transactions.created_at=timestamp without time zone",
                        "transactions.date=date",
                        "users.recovery_token_expiry=timestamp without time zone"
                );
    }

    @Test
    void springValidationInjectsProductClockIntoDeadlineConstraint() {
        CreateGoalDTO dueToday = goalDue(LocalDate.of(2026, 9, 7));
        CreateGoalDTO dueTomorrow = goalDue(LocalDate.of(2026, 9, 8));

        assertThat(validator.validate(dueToday))
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("deadline"));
        assertThat(validator.validate(dueTomorrow))
                .noneMatch(violation -> violation.getPropertyPath().toString().equals("deadline"));
    }

    private static User user(String email) {
        User user = new User();
        user.setNome("Usuário temporal sintético");
        user.setEmail(email);
        user.setSenha("synthetic-hash-never-authenticated");
        return user;
    }

    private static Account account(User user) {
        Account account = new Account();
        account.setName("Conta temporal sintética");
        account.setType(AccountType.CHECKING);
        account.setBalance(BigDecimal.ZERO);
        account.setUser(user);
        return account;
    }

    private static CreateGoalDTO goalDue(LocalDate deadline) {
        return new CreateGoalDTO(
                "Meta temporal sintética",
                new BigDecimal("100.00"),
                deadline,
                "Teste",
                "target",
                "#000000",
                GoalType.MONETARY,
                false
        );
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClockConfiguration {

        @Bean
        @Primary
        Clock fixedProductClock() {
            return Clock.fixed(
                    Instant.parse("2026-09-08T02:59:59Z"),
                    ZoneId.of("America/Sao_Paulo")
            );
        }
    }
}
