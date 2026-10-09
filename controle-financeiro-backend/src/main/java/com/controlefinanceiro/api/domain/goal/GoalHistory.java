package com.controlefinanceiro.api.domain.goal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "goal_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class GoalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Writers supply the product Clock explicitly; generation used to overwrite it.
    private LocalDateTime date;

    // Null means unknown provenance. Never infer an instant from the legacy date.
    @Column(name = "recorded_at", updatable = false)
    private Instant recordedAt;

    public void recordAt(ZonedDateTime now) {
        recordedAt = now.toInstant().truncatedTo(ChronoUnit.MICROS);
        date = now.toLocalDateTime().truncatedTo(ChronoUnit.MICROS);
    }

    @Column(nullable = false)
    private BigDecimal amount;

    private String note;

    @Column(name = "allocation_id")
    private UUID allocationId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private EvolutionProtocol protocol;
}
