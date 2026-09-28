package com.controlefinanceiro.api.domain.transaction;

public enum TransactionStatus {
    PENDING,
    PARTIALLY_SETTLED,
    FULFILLED,
    CANCELLED,
    SETTLED,
    REVERSED
}
