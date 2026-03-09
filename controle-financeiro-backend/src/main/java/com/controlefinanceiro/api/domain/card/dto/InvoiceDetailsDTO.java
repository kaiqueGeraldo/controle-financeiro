package com.controlefinanceiro.api.domain.card.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record InvoiceDetailsDTO(
        UUID id,
        Integer month,
        Integer year,
        String status, // OPEN, CLOSED, PAID
        BigDecimal totalAmount,
        List<CardTransactionDTO> transactions
) {}
