package com.controlefinanceiro.api.domain.card.dto;
import com.controlefinanceiro.api.domain.card.CardPayment;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

public record PaymentReceiptDTO(UUID id,UUID operationId,UUID accountId,UUID bankTransactionId,
                                BigDecimal amount,LocalDate date,Instant recordedAt) {
    public PaymentReceiptDTO(CardPayment p){this(p.getId(),p.getOperationId(),p.getAccountId(),p.getBankTransactionId(),p.getAmount(),p.getPaymentDate(),p.getCreatedAt());}
}
