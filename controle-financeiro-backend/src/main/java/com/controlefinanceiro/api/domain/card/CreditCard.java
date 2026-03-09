package com.controlefinanceiro.api.domain.card;

import com.controlefinanceiro.api.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "credit_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class CreditCard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "last_4_digits", length = 4)
    private String last4Digits;

    private String color;
    private String brand;

    @Column(name = "card_limit", nullable = false)
    private BigDecimal limit;

    @Column(nullable = false)
    private Integer closingDay;

    @Column(nullable = false)
    private Integer dueDay;

    private Integer orderIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}