package com.controlefinanceiro.api.domain.account;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
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

    @Column(name = "opening_balance")
    private BigDecimal openingBalance;

    @Column(name = "opening_date")
    private LocalDate openingDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "opening_origin")
    private OpeningBalanceOrigin openingOrigin;

    @Column(name = "opening_recorded_at")
    private Instant openingRecordedAt;

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

    public void open(BigDecimal amount,LocalDate date,Instant recordedAt,OpeningBalanceOrigin origin) {
        if(amount!=null)amount=amount.setScale(2,java.math.RoundingMode.UNNECESSARY);
        requireMoney(amount);
        balance=amount;openingBalance=amount;openingDate=date;openingRecordedAt=recordedAt;openingOrigin=origin;
    }

    public void credit(BigDecimal amount) {
        requireActive();
        requireMoney(amount);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("O valor do depósito deve ser maior que zero.");
        }
        BigDecimal result = this.balance.add(amount);
        requireMoney(result);
        this.balance = result;
    }

    public void debit(BigDecimal amount) {
        requireActive();
        requireMoney(amount);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("O valor do débito deve ser maior que zero.");
        }

        // Contas de "Dinheiro Físico" não podem ficar negativas
        if (this.type == AccountType.CASH && this.balance.compareTo(amount) < 0) {
            throw new BusinessRuleException("Saldo insuficiente na carteira para esta despesa.");
        }

        BigDecimal result = this.balance.subtract(amount);
        requireMoney(result);
        this.balance = result;
    }

    public void requireActive() {
        if (isArchived) throw new BusinessRuleException("Reative a conta antes de registrar nova movimentação.");
    }

    private static void requireMoney(BigDecimal value) {
        if (value == null || value.scale() > 2 || value.precision() - value.scale() > 12) {
            throw new BusinessRuleException("Valor ou saldo fora da faixa: até 12 dígitos inteiros e 2 casas decimais.");
        }
    }
}
