package com.controlefinanceiro.api.domain.card.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

public record InvoiceDetailsDTO(
        UUID id,
        Integer month,
        Integer year,
        String status, // OPEN, CLOSED, PAID, ROLLED
        BigDecimal totalAmount,
        BigDecimal payableAmount,
        BigDecimal carriedAmount,
        LocalDate dueDate,
        LocalDate closingDate,
        List<CardTransactionDTO> transactions
) {}
