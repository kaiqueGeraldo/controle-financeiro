package com.controlefinanceiro.api.domain.transaction.dto;

import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.validation.WallTime;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class UpdateTransactionDTO implements com.controlefinanceiro.api.domain.temporal.TemporalWriteRequest {
    private String description;
    @Positive(message = "O valor deve ser positivo")
    @Digits(integer = 12, fraction = 2, message = "O valor deve ter até 12 dígitos inteiros e 2 casas decimais")
    private BigDecimal amount;
    private LocalDate date;
    @WallTime private String time;
    private boolean timePresent;
    private TransactionType type;
    private UUID accountId;
    private UUID categoryId;
    private Boolean isPaid;

    public String description() { return description; }
    public BigDecimal amount() { return amount; }
    public LocalDate date() { return date; }
    public String time() { return time; }
    public boolean hasTime() { return timePresent; }
    public TransactionType type() { return type; }
    public UUID accountId() { return accountId; }
    public UUID categoryId() { return categoryId; }
    public Boolean isPaid() { return isPaid; }

    public void setDescription(String value) { description = value; }
    public void setAmount(BigDecimal value) { amount = value; }
    @com.fasterxml.jackson.annotation.JsonSetter(nulls = com.fasterxml.jackson.annotation.Nulls.FAIL)
    public void setDate(LocalDate value) { date = value; }
    @com.fasterxml.jackson.annotation.JsonSetter
    public void setTime(String value) { time = value; timePresent = true; }
    public void setType(TransactionType value) { type = value; }
    public void setAccountId(UUID value) { accountId = value; }
    public void setCategoryId(UUID value) { categoryId = value; }
    @com.fasterxml.jackson.annotation.JsonSetter("isPaid")
    public void setPaid(Boolean value) { isPaid = value; }
}
