package com.controlefinanceiro.api.domain.temporal;

import jakarta.persistence.*;
import lombok.Getter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/** Explicit metadata for new writes. Null provenance on existing rows means unknown. */
@MappedSuperclass
@Getter
public abstract class OperationTemporal {
    @Column(name = "operation_time")
    private LocalTime time;
    @Enumerated(EnumType.STRING)
    @Column(name = "time_origin")
    private TimeOrigin timeOrigin;
    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt;
    @Column(name = "legacy_created_at_raw")
    private LocalDateTime legacyCreatedAtRaw;

    public void captureTemporal(LocalTime informedTime, Instant instant, LocalDateTime legacyValue) {
        if (recordedAt != null) throw new IllegalStateException("Registro temporal já capturado");
        recordedAt = Objects.requireNonNull(instant).truncatedTo(ChronoUnit.MICROS);
        changeInformedTime(informedTime);
        preserveLegacyValue(legacyValue);
    }

    public void changeInformedTime(LocalTime value) {
        time = value;
        timeOrigin = value == null ? TimeOrigin.NOT_PROVIDED : TimeOrigin.USER_INPUT;
    }

    public void preserveLegacyValue(LocalDateTime value) {
        if (legacyCreatedAtRaw == null) legacyCreatedAtRaw = value;
    }
}
