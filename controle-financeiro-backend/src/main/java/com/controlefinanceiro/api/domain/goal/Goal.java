package com.controlefinanceiro.api.domain.goal;

import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String category;
    private String icon;
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalType type;

    private String unit;

    @Column(nullable = false)
    private BigDecimal targetValue;

    @Column(nullable = false)
    private BigDecimal currentValue = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate deadline;

    @Column(name = "use_checklist", columnDefinition = "boolean default false")
    private Boolean useChecklist = false;

    private Integer orderIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<GoalHistory> history;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalItem> items;
}