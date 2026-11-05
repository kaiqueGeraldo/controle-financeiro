package com.controlefinanceiro.api.infra.operations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Immutable for the process lifetime. Release/freeze requires a drained restart. */
@Component
public record OperationsState(boolean writersEnabled, boolean jobsEnabled) {
    public OperationsState(@Value("${app.operations.writers-enabled:true}") boolean writersEnabled,
                           @Value("${app.operations.jobs-enabled:true}") boolean jobsEnabled) {
        this.writersEnabled = writersEnabled;
        this.jobsEnabled = writersEnabled && jobsEnabled;
    }
}
