package com.controlefinanceiro.api.domain.transaction;

public enum TransactionOrigin {
    USER,
    ACCOUNT_OPENING,
    TRANSFER,
    TRANSFER_FEE,
    SETTLEMENT,
    CORRECTION,
    REVERSAL,
    UNKNOWN
}
