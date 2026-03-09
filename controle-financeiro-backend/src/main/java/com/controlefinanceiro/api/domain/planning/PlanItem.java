package com.controlefinanceiro.api.domain.planning;

import com.controlefinanceiro.api.domain.card.CreditCard;
import com.controlefinanceiro.api.domain.category.Category;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class PlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "order_index")
    private Integer orderIndex = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanItemStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private MonthlyPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id")
    private CreditCard card;
}