package com.controlefinanceiro.api.service.intent;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** DEC-10 canonical encoding; callers retain responsibility for financial defaults/field order. */
public final class IntentFingerprint {
    private IntentFingerprint() {}

    public static String fingerprint(Object... fields) {
        var content=new StringBuilder();
        for (Object field:fields) {
            String value=field==null?null:field instanceof BigDecimal decimal
                    ?decimal.stripTrailingZeros().toPlainString():field.toString();
            content.append(value==null?"-1:":value.length()+":"+value);
        }
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.toString().getBytes(StandardCharsets.UTF_8)));}
        catch (NoSuchAlgorithmException ex) {throw new IllegalStateException(ex);}
    }
}
