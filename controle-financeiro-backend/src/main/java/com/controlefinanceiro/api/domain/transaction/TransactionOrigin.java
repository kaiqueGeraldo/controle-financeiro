package com.controlefinanceiro.api.domain.transaction;

public enum TransactionOrigin {
    USER,
    ACCOUNT_OPENING,
    TRANSFER,
    TRANSFER_FEE,
    SETTLEMENT,
    CORRECTION,
    REVERSAL,
    INVOICE_PAYMENT,
    INVESTMENT_BUY,
    INVESTMENT_SELL,
    INVESTMENT_DIVIDEND,
    INVESTMENT_FEE,
    GOAL_PURCHASE,
    UNKNOWN
}
