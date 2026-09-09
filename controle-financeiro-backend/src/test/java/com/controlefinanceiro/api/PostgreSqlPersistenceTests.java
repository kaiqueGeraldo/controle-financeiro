package com.controlefinanceiro.api;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.verifyNoInteractions;

class PostgreSqlPersistenceTests extends PostgresIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Test
    void persistsAndReloadsUsingPostgresThenRollsBack() {
        String email = "persistencia-a@example.test";

        transactionTemplate.executeWithoutResult(status -> {
            User userA = user("Usuario A", email);
            Account accountA = account("Conta sintetica A", userA, "123.45");

            userRepository.save(userA);
            accountRepository.save(accountA);
            entityManager.flush();
            entityManager.clear();

            User reloaded = userRepository.findUserByEmail(email).orElseThrow();
            assertThat(accountRepository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(reloaded.getId()))
                    .extracting(Account::getName, Account::getBalance)
                    .containsExactly(tuple("Conta sintetica A", new BigDecimal("123.45")));

            status.setRollbackOnly();
        });

        assertThat(userRepository.findUserByEmail(email)).isEmpty();
    }

    @Test
    void queryForUserADoesNotExposeUserBFixture() {
        transactionTemplate.executeWithoutResult(status -> {
            User userA = userRepository.save(user("Usuario A isolado", "isolamento-a@example.test"));
            User userB = userRepository.save(user("Usuario B isolado", "isolamento-b@example.test"));
            accountRepository.saveAll(List.of(
                    account("Somente A", userA, "10.00"),
                    account("Somente B", userB, "999.99")
            ));
            entityManager.flush();
            entityManager.clear();

            assertThat(accountRepository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(userA.getId()))
                    .extracting(Account::getName)
                    .containsExactly("Somente A");
            assertThat(accountRepository.sumTotalBalanceByUserId(userA.getId()))
                    .isEqualByComparingTo("10.00");

            status.setRollbackOnly();
        });

        assertThat(userRepository.findUserByEmail("isolamento-a@example.test")).isEmpty();
        assertThat(userRepository.findUserByEmail("isolamento-b@example.test")).isEmpty();
        verifyNoInteractions(emailService, marketDataService);
    }

    private static User user(String name, String email) {
        User user = new User();
        user.setNome(name);
        user.setEmail(email);
        user.setSenha("synthetic-hash-never-authenticated");
        return user;
    }

    private static Account account(String name, User owner, String balance) {
        Account account = new Account();
        account.setName(name);
        account.setType(AccountType.CHECKING);
        account.setBalance(new BigDecimal(balance));
        account.setUser(owner);
        return account;
    }
}
