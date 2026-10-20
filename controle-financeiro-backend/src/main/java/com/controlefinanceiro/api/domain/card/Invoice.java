package com.controlefinanceiro.api.domain.card;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.type.descriptor.jdbc.LocalDateJdbcType;

import java.util.UUID;
import java.time.LocalDate;

@Entity
@Table(name = "invoices", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"card_id", "month", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "closing_date")
    @JdbcType(LocalDateJdbcType.class)
    private LocalDate closingDate;

    @Column(name = "due_date")
    @JdbcType(LocalDateJdbcType.class)
    private LocalDate dueDate;

    @JdbcType(LocalDateJdbcType.class)
    private LocalDate dueDateOverride;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", nullable = false)
    private CreditCard card;

    public LocalDate getDueDate() {return dueDateOverride==null?dueDate:dueDateOverride;}
}
