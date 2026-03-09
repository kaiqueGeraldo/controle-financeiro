package com.controlefinanceiro.api.domain.account;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @Column(nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;

    private String color;

    private boolean isArchived = false;

    @Column(name = "order_index", columnDefinition = "integer default 0")
    private Integer orderIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version;

    // --- LÓGICA DE DOMÍNIO ---

    public void credit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("O valor do depósito deve ser maior que zero.");
        }
        this.balance = this.balance.add(amount);
    }

    public void debit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("O valor do débito deve ser maior que zero.");
        }

        // Contas de "Dinheiro Físico" não podem ficar negativas
        if (this.type == AccountType.CASH && this.balance.compareTo(amount) < 0) {
            throw new BusinessRuleException("Saldo insuficiente na carteira para esta despesa.");
        }

        this.balance = this.balance.subtract(amount);
    }
}