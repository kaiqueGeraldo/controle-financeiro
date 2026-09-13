package com.controlefinanceiro.api.domain.planning.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** PUT parcial por compatibilidade com o consumidor existente; omissão preserva. */
@Getter
public class UpdatePlanItemDTO {
    @Pattern(regexp = "(?s).*\\S.*", message = "A descrição não pode ficar vazia")
    @Size(max = 255)
    private String description;
    @Positive private BigDecimal amount;
    private LocalDate dueDate;
    private UUID categoryId;
    @Getter(lombok.AccessLevel.NONE) private boolean categoryIdPresent;

    @JsonSetter(nulls = Nulls.FAIL)
    public void setDescription(String value) { description = value; }
    @JsonSetter(nulls = Nulls.FAIL)
    public void setAmount(BigDecimal value) { amount = value; }
    @JsonSetter(nulls = Nulls.FAIL)
    public void setDueDate(LocalDate value) { dueDate = value; }
    @JsonSetter
    public void setCategoryId(String value) {
        if (value != null && !value.matches("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")) {
            throw new IllegalArgumentException("Categoria inválida");
        }
        categoryId = value == null ? null : UUID.fromString(value);
        categoryIdPresent = true;
    }
    public boolean hasCategoryId() { return categoryIdPresent; }
    @JsonAnySetter
    public void rejectUnknown(String name, Object value) {
        throw new IllegalArgumentException("Campo não editável: " + name);
    }
}
