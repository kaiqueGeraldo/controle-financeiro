package com.controlefinanceiro.api.utils;

import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.deser.std.StdDeserializer;

/** No truncation or string coercion for JSON calendar coordinates. */
public final class StrictIntegerDeserializer extends StdDeserializer<Integer> {
    public StrictIntegerDeserializer() { super(Integer.class); }

    @Override
    public Integer deserialize(JsonParser parser, DeserializationContext context) {
        if (!parser.hasToken(JsonToken.VALUE_NUMBER_INT)) {
            return context.reportInputMismatch(Integer.class, "Informe um número inteiro.");
        }
        return parser.getIntValue();
    }
}
