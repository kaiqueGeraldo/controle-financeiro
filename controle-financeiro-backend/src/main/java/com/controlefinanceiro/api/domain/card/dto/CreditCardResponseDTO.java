package com.controlefinanceiro.api.domain.card.dto;

import com.controlefinanceiro.api.domain.card.CreditCard;
import java.math.BigDecimal;
import java.util.UUID;

public record CreditCardResponseDTO(
        UUID id,
        String name,
        String last4Digits,
        String color,
        String brand,
        BigDecimal limit,
        Integer closingDay,
        Integer dueDay
) {
    public CreditCardResponseDTO(CreditCard c) {
        this(c.getId(), c.getName(), c.getLast4Digits(), c.getColor(), c.getBrand(),
                c.getLimit(), c.getClosingDay(), c.getDueDay());
    }
}