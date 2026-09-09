package com.controlefinanceiro.api.utils;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.deser.std.StdDeserializer;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

final class StrictLocalDateDeserializer extends StdDeserializer<LocalDate> {

    private static final Pattern CIVIL_DATE_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");
    private static final String INVALID_DATE_MESSAGE =
            "Data civil inválida. Use YYYY-MM-DD com ano entre 0001 e 9999.";

    StrictLocalDateDeserializer() {
        super(LocalDate.class);
    }

    @Override
    public LocalDate deserialize(JsonParser parser, DeserializationContext context) throws JacksonException {
        if (!parser.hasToken(JsonToken.VALUE_STRING)) {
            return context.reportInputMismatch(LocalDate.class, INVALID_DATE_MESSAGE);
        }

        String rawValue = parser.getString();
        if (!CIVIL_DATE_PATTERN.matcher(rawValue).matches()) {
            throw context.weirdStringException(rawValue, LocalDate.class, INVALID_DATE_MESSAGE);
        }

        try {
            LocalDate parsed = LocalDate.parse(rawValue);
            if (parsed.getYear() < 1 || parsed.getYear() > 9999) {
                throw context.weirdStringException(rawValue, LocalDate.class, INVALID_DATE_MESSAGE);
            }
            return parsed;
        } catch (DateTimeParseException exception) {
            throw context.weirdStringException(rawValue, LocalDate.class, INVALID_DATE_MESSAGE);
        }
    }
}
