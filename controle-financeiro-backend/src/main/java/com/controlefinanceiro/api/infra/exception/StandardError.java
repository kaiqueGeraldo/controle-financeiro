package com.controlefinanceiro.api.infra.exception;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record StandardError(
        Instant timestamp,
        Integer status,
        String error,
        String message,
        String path,
        Map<String, List<String>> fields
) {
    public StandardError(
            Instant timestamp,
            Integer status,
            String error,
            String message,
            String path) {
        this(timestamp, status, error, message, path, Map.of());
    }

    public StandardError {
        fields = fields == null ? Map.of() : Map.copyOf(fields);
    }
}
