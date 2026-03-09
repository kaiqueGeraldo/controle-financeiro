package com.controlefinanceiro.api.domain.event;

import com.controlefinanceiro.api.domain.card.Invoice;

public record InvoiceChangedEvent(Invoice invoice) {}