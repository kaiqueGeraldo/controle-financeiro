package com.controlefinanceiro.api.domain.event;

import com.controlefinanceiro.api.domain.card.CreditCard;
import com.controlefinanceiro.api.domain.user.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InvoicePaymentRequestedEvent(
        UUID accountId,
        BigDecimal amount,
        LocalDate date,
        String time,
        String description,
        CreditCard card,
        User user
) {}