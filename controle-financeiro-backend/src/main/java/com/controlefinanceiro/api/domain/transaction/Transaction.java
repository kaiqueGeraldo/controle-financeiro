package com.controlefinanceiro.api.domain.transaction;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Transaction extends com.controlefinanceiro.api.domain.temporal.OperationTemporal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private BigDecimal amount;
    @Column(precision = 38, scale = 2)
    private BigDecimal cashAmount;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "settled_at")
    private Instant settledAt;

    private boolean isPaid = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.SETTLED;

    @Enumerated(EnumType.STRING)
    private TransactionOrigin origin = TransactionOrigin.UNKNOWN;

    @Column(name = "operation_id")
    private UUID operationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transfer_direction")
    private TransferDirection transferDirection;

    @Column(name = "counterparty_account_id")
    private UUID counterpartyAccountId;

    @Column(name = "reversal_of_id")
    private UUID reversalOfId;

    @Column(name = "settlement_of_id")
    private UUID settlementOfId;

    @Column(name = "correction_of_id")
    private UUID correctionOfId;

    @Column(name = "goal_item_id")
    private UUID goalItemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_system_managed", columnDefinition = "boolean default false")
    private boolean isSystemManaged = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public void setPaid(boolean paid) {
        this.isPaid = paid;
        this.status = paid ? TransactionStatus.SETTLED : TransactionStatus.PENDING;
    }

    public void markReversed() {
        if (status != TransactionStatus.SETTLED) {
            throw new IllegalStateException("Somente uma transação liquidada pode ser estornada.");
        }
        status = TransactionStatus.REVERSED;
        isPaid = true;
    }

    public void markForecastSettlement(BigDecimal settledAmount) {
        if (settledAmount == null || settledAmount.signum() < 0
                || settledAmount.compareTo(amount) > 0) {
            throw new IllegalArgumentException("O valor liquidado deve estar entre zero e o valor previsto.");
        }
        if (settledAmount.signum() == 0) {
            status = TransactionStatus.PENDING;
            isPaid = false;
        } else if (settledAmount.compareTo(amount) < 0) {
            status = TransactionStatus.PARTIALLY_SETTLED;
            isPaid = false;
        } else {
            status = TransactionStatus.FULFILLED;
            isPaid = true;
        }
    }

    public void cancelForecast() {
        if (status != TransactionStatus.PENDING && status != TransactionStatus.PARTIALLY_SETTLED) {
            throw new IllegalStateException("Somente uma previsão aberta pode ser cancelada.");
        }
        status = TransactionStatus.CANCELLED;
        isPaid = false;
    }

    public boolean isRealized() {
        return status == TransactionStatus.SETTLED || status == TransactionStatus.REVERSED;
    }
}
