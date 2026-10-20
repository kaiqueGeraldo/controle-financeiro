package com.controlefinanceiro.api.domain.goal;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.investment.Investment;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "goal_allocations")
@Getter
@Setter
public class GoalAllocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investment_id")
    private Investment investment;

    @Column(nullable = false, precision = 38, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Version
    private Long version;

    private UUID reservationId;
}
