package com.controlefinanceiro.api.service.intent;

import com.controlefinanceiro.api.domain.investment.dto.InvestTransactionResponseDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.service.Cf024SchemaInitializer;
import com.controlefinanceiro.api.service.exception.OperationConflictException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.support.PostgresIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@ContextConfiguration(initializers = Cf024SchemaInitializer.class)
class FinancialIntentsIntegrationTest extends PostgresIntegrationTest {
    private static final String FINGERPRINT = "a".repeat(64);
    private static final String SNAPSHOT = """
            {"id":"00000000-0000-0000-0000-000000000027","type":"BUY","date":"2026-09-07",
             "quantity":2.00000000,"price":100.00,"totalValue":200.00,"fees":0.00,
             "costDelta":200.00,"realizedResult":null,"dateOrigin":"USER_PROVIDED",
             "legacyDateRaw":"2026-09-07T12:00:00"}
            """;
    @Autowired FinancialIntents intents;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate sql;
    @Autowired TransactionTemplate transaction;
    @Autowired JsonMapper json;
    UUID owner;

    @BeforeEach void owner() {
        var user = new User();
        user.setNome("CF027 synthetic"); user.setEmail(UUID.randomUUID() + "@example.invalid"); user.setSenha("synthetic");
        owner = users.save(user).getId();
    }

    @Test void writersRequireEnclosingTransactionEvenWhenTheKeyIsAbsent() {
        for (UUID key : new UUID[]{UUID.randomUUID(), null}) {
            assertThatThrownBy(() -> intents.replay(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, InvestTransactionResponseDTO.class))
                    .isInstanceOf(IllegalTransactionStateException.class);
            assertThatThrownBy(() -> intents.complete(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, json.readTree(SNAPSHOT)))
                    .isInstanceOf(IllegalTransactionStateException.class);
        }
        assertThat(receiptCount()).isZero();
    }

    @Test void absentKeyDoesNotAcquireIntentLockOrPersistReceipt() {
        transaction.executeWithoutResult(status -> {
            assertThat(advisoryLocks()).isZero();
            assertThat(intents.replay(null, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, InvestTransactionResponseDTO.class)).isNull();
            intents.complete(null, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, json.readTree(SNAPSHOT));
            assertThat(advisoryLocks()).isZero();
        });
        assertThat(receiptCount()).isZero();
    }

    @Test void completionAndAdvisoryLockBelongToTheEnclosingTransaction() {
        var key = UUID.randomUUID();
        transaction.executeWithoutResult(status -> {
            assertThat(intents.replay(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, InvestTransactionResponseDTO.class)).isNull();
            assertThat(advisoryLocks()).isEqualTo(1);
            intents.complete(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, json.readTree(SNAPSHOT));
            assertThat(receiptCount()).isEqualTo(1);
            status.setRollbackOnly();
        });
        assertThat(receiptCount()).isZero();
        assertThatThrownBy(() -> intents.recover(key, owner)).isInstanceOf(ResourceNotFoundException.class);
        transaction.executeWithoutResult(status -> {
            assertThat(advisoryLocks()).isZero();
            assertThat(intents.replay(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, InvestTransactionResponseDTO.class)).isNull();
            intents.complete(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, json.readTree(SNAPSHOT));
        });
        assertThat(receiptCount()).isEqualTo(1);
        assertThat(intents.recover(key, owner).result()).isEqualTo(json.readTree(SNAPSHOT));
    }

    @Test void preexistingReceiptKeepsSnapshotTimestampOwnerAndConflictSemantics() {
        var key = UUID.randomUUID();
        var recordedAt = Instant.parse("2026-09-30T15:00:00.123456Z");
        sql.update("insert into financial_intent_receipts(id,user_id,kind,fingerprint,result_json,recorded_at) values(?,?,?,?,?,?)",
                key, owner, "INVESTMENT_OPERATION", FINGERPRINT, SNAPSHOT, java.sql.Timestamp.from(recordedAt));
        var recovered = intents.recover(key, owner);
        assertThat(recovered.operationId()).isEqualTo(key);
        assertThat(recovered.kind()).isEqualTo("INVESTMENT_OPERATION");
        assertThat(recovered.recordedAt()).isEqualTo(recordedAt);
        assertThat(recovered.result()).isEqualTo(json.readTree(SNAPSHOT));
        var replay = transaction.execute(status -> intents.replay(key, owner, FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT, InvestTransactionResponseDTO.class));
        assertThat(replay.id()).isEqualTo(UUID.fromString("00000000-0000-0000-0000-000000000027"));
        assertThat(replay.totalValue()).isEqualByComparingTo("200.00");
        assertThat(json.readTree(json.writeValueAsString(replay))).isEqualTo(json.readTree(SNAPSHOT));
        assertThatThrownBy(() -> intents.recover(key, UUID.randomUUID())).isInstanceOf(ResourceNotFoundException.class);
        assertConflict(key, UUID.randomUUID(), FinancialIntents.INVESTMENT_OPERATION, FINGERPRINT);
        assertConflict(key, owner, FinancialIntents.TRANSACTION_CREATE, FINGERPRINT);
        assertConflict(key, owner, FinancialIntents.INVESTMENT_OPERATION, "b".repeat(64));
        assertThat(sql.queryForObject("select result_json from financial_intent_receipts where id=?", String.class, key)).isEqualTo(SNAPSHOT);
        assertThat(receiptCount()).isEqualTo(1);
    }

    private void assertConflict(UUID key, UUID ownerId, String kind, String fingerprint) {
        assertThatThrownBy(() -> transaction.execute(status -> intents.replay(key, ownerId, kind, fingerprint, InvestTransactionResponseDTO.class)))
                .isInstanceOf(OperationConflictException.class).hasMessage("Esta intenção já foi usada com outro conteúdo.");
    }

    private int receiptCount() {
        return sql.queryForObject("select count(*) from financial_intent_receipts where user_id=?", Integer.class, owner);
    }

    private int advisoryLocks() {
        return sql.queryForObject("select count(*) from pg_locks where pid=pg_backend_pid() and locktype='advisory'", Integer.class);
    }
}
