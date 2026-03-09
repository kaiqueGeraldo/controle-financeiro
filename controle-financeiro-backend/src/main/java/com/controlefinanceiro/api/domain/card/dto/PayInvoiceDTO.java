package com.controlefinanceiro.api.domain.card.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PayInvoiceDTO(
        @NotNull(message = "O ID da conta de origem é obrigatório")
        UUID accountId,

        @NotNull(message = "O valor do pagamento é obrigatório")
        @Positive(message = "O valor deve ser positivo")
        BigDecimal amount,

        @NotNull(message = "A data do pagamento é obrigatória")
        LocalDate date,

        String time,

        @NotNull(message = "O mês da fatura é obrigatório")
        Integer month,

        @NotNull(message = "O ano da fatura é obrigatório")
        Integer year,

        String description, // (ex: "Pagamento parcial")

        // Se for TRUE, abate o valor na fatura atual como crédito.
        // Se for FALSE, marca a fatura como PAGA (fechamento).
        @NotNull(message = "Defina se é um adiantamento ou pagamento final")
        Boolean isPrepayment
) {}