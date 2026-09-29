package com.controlefinanceiro.api.utils;

import java.math.BigDecimal;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.deser.std.StdDeserializer;

/** Canonical decimal boundary for new contracts; scale/range remain domain rules. */
public final class DecimalStringDeserializer extends StdDeserializer<BigDecimal> {
    public DecimalStringDeserializer() { super(BigDecimal.class); }

    @Override
    public BigDecimal deserialize(JsonParser parser, DeserializationContext context) {
        if (!parser.hasToken(JsonToken.VALUE_STRING)
                || !parser.getString().matches("-?(0|[1-9][0-9]*)(\\.[0-9]+)?")) {
            return context.reportInputMismatch(BigDecimal.class, "Informe uma string decimal sem expoente ou separador de milhar.");
        }
        return new BigDecimal(parser.getString());
    }
}
