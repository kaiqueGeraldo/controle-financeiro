package com.controlefinanceiro.api.domain.temporal;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import java.util.Set;

/** These response-only fields must never be accepted as client-supplied evidence. */
public interface TemporalWriteRequest {
    Set<String> READ_ONLY = Set.of("recordedAt", "createdAt", "legacyCreatedAtRaw", "timeOrigin",
            "dateOrigin", "operationDate", "legacyDateRaw");

    @JsonAnySetter
    default void rejectTemporalMetadata(String field, Object value) {
        if (READ_ONLY.contains(field)) throw new com.controlefinanceiro.api.service.exception.InvalidFieldException(field, "Campo não editável: " + field);
    }
}
