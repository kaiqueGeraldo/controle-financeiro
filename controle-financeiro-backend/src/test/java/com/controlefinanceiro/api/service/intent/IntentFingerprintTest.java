package com.controlefinanceiro.api.service.intent;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class IntentFingerprintTest {
    // Literal SHA-256 oracles calculated separately from the production canonicalizer.
    @Test void noFieldsNullAndEmptyStringKeepDistinctEncodings() {
        assertThat(IntentFingerprint.fingerprint()).isEqualTo("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        assertThat(IntentFingerprint.fingerprint((Object) null)).isEqualTo("45c04e339740c73c7e0959c8a5fa41ffcd9a166b343a2e7393e92c8964af0c36");
        assertThat(IntentFingerprint.fingerprint("")).isEqualTo("ba768b331fd86cec803be04e56ab2b3d4c0e98ef4ee4fcd4e72ad7cce61a1d1f");
    }

    @Test void decimalScaleAndScientificNotationKeepTheExistingFingerprint() {
        for (String value : new String[]{"1", "1.00000000", "1E+0"}) {
            assertThat(IntentFingerprint.fingerprint(new BigDecimal(value)))
                    .isEqualTo("d6b5915c46057bcb005f46f6433df65609dd3a7a57af75ac1a5a4a7c299ebffb");
        }
    }

    @Test void fieldBoundariesAndOrderRemainPartOfIdentity() {
        assertThat(IntentFingerprint.fingerprint("ab", "c")).isEqualTo("430fb1b4ac43316eca81fab27a1930ab8eff8fef6a1dc7903dce44bbc2790dc5");
        assertThat(IntentFingerprint.fingerprint("a", "bc")).isEqualTo("5310a58788781ab25d5ad7c3f85035824b4eb7bdfa394e0ac2186271472b5492");
    }

    @Test void unicodeLengthRemainsUtf16AndDigestRemainsUtf8() {
        assertThat(IntentFingerprint.fingerprint("😀", null, new BigDecimal("0.000")))
                .isEqualTo("7211025188e926f64ff8cb6663c65fd4c8f1e252b87b80e1cb76521c168d04a7");
    }
}
