package com.controlefinanceiro.api.domain.card;

public enum InvoiceStatus {
    OPEN,   // Aberta
    CLOSED, // Fechada
    PAID,   // Paga
    ROLLED  // Encerrada com saldo ainda devido em ciclo posterior
}
