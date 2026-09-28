package com.controlefinanceiro.api.domain.card.dto;

import com.controlefinanceiro.api.domain.validation.WallTime;
import com.controlefinanceiro.api.utils.StrictIntegerDeserializer;
import tools.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
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

        @WallTime String time,

        @NotNull(message = "O mês da fatura é obrigatório")
        @Min(1) @Max(12) @JsonDeserialize(using = StrictIntegerDeserializer.class)
        Integer month,

        @NotNull(message = "O ano da fatura é obrigatório")
        @Min(1) @Max(9999) @JsonDeserialize(using = StrictIntegerDeserializer.class)
        Integer year,

        String description, // (ex: "Pagamento parcial")

        // TRUE abate dívida sem encerrar o ciclo; FALSE encerra como PAID ou ROLLED.
        @NotNull(message = "Defina se é um adiantamento ou pagamento final")
        Boolean isPrepayment,

        UUID operationId
) implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    public PayInvoiceDTO(UUID accountId, BigDecimal amount, LocalDate date, String time,
                         Integer month, Integer year, String description, Boolean isPrepayment) {
        this(accountId, amount, date, time, month, year, description, isPrepayment, null);
    }
}
