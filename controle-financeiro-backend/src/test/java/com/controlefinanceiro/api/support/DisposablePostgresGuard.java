package com.controlefinanceiro.api.support;

import java.net.URI;
import java.util.Set;

final class DisposablePostgresGuard {

    private static final String JDBC_PREFIX = "jdbc:";
    private static final Set<String> LOOPBACK_HOSTS = Set.of("localhost", "127.0.0.1", "[::1]", "::1");

    private DisposablePostgresGuard() {
    }

    static void requireDisposable(String jdbcUrl, String expectedDatabaseName) {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:postgresql://")) {
            throw unsafe(jdbcUrl, "somente jdbc:postgresql e permitido");
        }
        if (expectedDatabaseName == null || !expectedDatabaseName.startsWith("cf_test_")) {
            throw unsafe(jdbcUrl, "o nome esperado nao identifica um banco efemero da CF-002");
        }

        URI uri;
        try {
            uri = URI.create(jdbcUrl.substring(JDBC_PREFIX.length()));
        } catch (IllegalArgumentException exception) {
            throw unsafe(jdbcUrl, "URL JDBC invalida");
        }

        String databaseName = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        if (!LOOPBACK_HOSTS.contains(uri.getHost()) || !expectedDatabaseName.equals(databaseName)) {
            throw unsafe(jdbcUrl, "host loopback e nome efemero exato sao obrigatorios");
        }
    }

    private static IllegalStateException unsafe(String jdbcUrl, String reason) {
        return new IllegalStateException(
                "Banco recusado pelo perfil de teste: " + reason + ". URL recebida: " + jdbcUrl
        );
    }
}
