package com.controlefinanceiro.api.domain.habit;

import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private String color;

    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    @Column(name = "highest_streak", nullable = false)
    private Integer highestStreak = 0;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HabitFrequency frequency = HabitFrequency.DAILY;

    @ElementCollection(targetClass = DayOfWeek.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "habit_days", joinColumns = @JoinColumn(name = "habit_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week")
    private Set<DayOfWeek> specificDays = new HashSet<>();

    @Column(name = "weekly_goal")
    private Integer weeklyGoal;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id")
    private Goal goal;

    @OneToMany(mappedBy = "habit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HabitLog> logs;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @JsonProperty("goalId")
    public UUID getGoalId() {
        return this.goal != null ? this.goal.getId() : null;
    }
}