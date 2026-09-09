package com.controlefinanceiro.api.support;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DisposablePostgresGuardTest {

    @Test
    void acceptsOnlyTheExpectedLoopbackDatabase() {
        assertThatCode(() -> DisposablePostgresGuard.requireDisposable(
                "jdbc:postgresql://127.0.0.1:49152/cf_test_a1b2c3",
                "cf_test_a1b2c3"
        )).doesNotThrowAnyException();
    }

    @Test
    void rejectsAProductionLikeHost() {
        assertThatThrownBy(() -> DisposablePostgresGuard.requireDisposable(
                "jdbc:postgresql://production.example.com:5432/cf_test_a1b2c3",
                "cf_test_a1b2c3"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Banco recusado pelo perfil de teste");
    }

    @Test
    void rejectsTheLocalDevelopmentDatabase() {
        assertThatThrownBy(() -> DisposablePostgresGuard.requireDisposable(
                "jdbc:postgresql://localhost:5432/financas_db",
                "cf_test_a1b2c3"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("nome efemero exato");
    }

    @Test
    void rejectsNonPostgresConnections() {
        assertThatThrownBy(() -> DisposablePostgresGuard.requireDisposable(
                "jdbc:h2:mem:cf_test_a1b2c3",
                "cf_test_a1b2c3"
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("somente jdbc:postgresql");
    }
}
