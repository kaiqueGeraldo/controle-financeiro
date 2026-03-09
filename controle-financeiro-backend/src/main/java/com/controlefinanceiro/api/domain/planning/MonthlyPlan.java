package com.controlefinanceiro.api.domain.planning;

import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "monthly_plans", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "month", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class MonthlyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    private BigDecimal incomeForecast = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlanItem> items = new ArrayList<>();
}