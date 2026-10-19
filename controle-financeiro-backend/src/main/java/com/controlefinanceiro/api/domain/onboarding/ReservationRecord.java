package com.controlefinanceiro.api.domain.onboarding;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/** Protected inventory storage for SPEC-001 §5.1. No HTTP writer or inferred backfill.
 * CF-030 must validate evidence, attribution and inventory versions before populating it. */
@Entity
@Table(name="onboarding_reservation_records")
public class ReservationRecord {
    @Id private UUID id;
    @Column(name="user_id",nullable=false) private UUID userId;
    @Column(nullable=false) private long revision;
    @Column(nullable=false,columnDefinition="text") private String attribution;
    @Column(nullable=false,columnDefinition="text") private String evidence;
    @Column(name="recorded_at",nullable=false) private Instant recordedAt;
}
