package com.controlefinanceiro.api.domain.card;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface CardPaymentRepository extends JpaRepository<CardPayment, UUID> {
    boolean existsByOperationId(UUID operationId);
    boolean existsByInvoiceCardId(UUID cardId);
    boolean existsByInvoiceIdAndAccountIdAndPaymentDateAndAmountAndPrepaymentAndOperationIdIsNull(
            UUID invoiceId, UUID accountId, LocalDate paymentDate, BigDecimal amount, boolean prepayment);
}
