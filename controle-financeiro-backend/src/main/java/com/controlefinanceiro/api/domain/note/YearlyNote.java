package com.controlefinanceiro.api.domain.note;

import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "yearly_notes", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "note_year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class YearlyNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "note_year", nullable = false)
    private Integer year;

    @Column(columnDefinition = "TEXT")
    private String content;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}