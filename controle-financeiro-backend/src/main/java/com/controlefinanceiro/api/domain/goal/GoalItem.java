package com.controlefinanceiro.api.domain.goal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "goal_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class GoalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String suggestedModel;

    @Column(nullable = false)
    private BigDecimal estimatedPrice;

    private BigDecimal paidPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoalItemStatus status = GoalItemStatus.PENDING;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Column(name = "bank_transaction_id")
    private UUID bankTransactionId;

    @Column(name = "card_transaction_id")
    private UUID cardTransactionId;

    @Column(name = "used_goal_balance", columnDefinition = "boolean default false")
    private Boolean usedGoalBalance = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;
}