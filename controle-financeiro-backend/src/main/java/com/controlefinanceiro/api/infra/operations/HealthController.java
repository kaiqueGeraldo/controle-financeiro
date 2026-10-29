package com.controlefinanceiro.api.infra.operations;

import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.LivenessState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Map;

/** Minimal public probes on the application port; no administrative surface. */
@RestController
public final class HealthController {
    private final ApplicationAvailability availability;
    private final OperationsState operations;
    private final DataSource dataSource;

    public HealthController(ApplicationAvailability availability, OperationsState operations, DataSource dataSource) {
        this.availability = availability;
        this.operations = operations;
        this.dataSource = dataSource;
    }

    @GetMapping("/ops/health/liveness")
    public ResponseEntity<Map<String, String>> liveness() {
        return response(availability.getLivenessState() == LivenessState.CORRECT);
    }

    @GetMapping("/ops/health/readiness")
    public ResponseEntity<Map<String, String>> readiness() {
        if (!operations.writersEnabled() || availability.getReadinessState() != ReadinessState.ACCEPTING_TRAFFIC) {
            return response(false);
        }
        // One bounded pool borrow + driver validation, no financial data or DDL.
        try (var connection = dataSource.getConnection()) {
            return response(connection.isValid(1));
        } catch (SQLException unavailable) {
            return response(false);
        }
    }

    private static ResponseEntity<Map<String, String>> response(boolean healthy) {
        return ResponseEntity.status(healthy ? 200 : 503).header("Cache-Control", "no-store")
                .body(Map.of("status", healthy ? "UP" : "DOWN"));
    }
}
