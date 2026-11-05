package com.controlefinanceiro.api;

import com.controlefinanceiro.api.support.BrowserEvidence;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.*;

/** Failure preservation contract; explicitly selected, outside mandatory identities. */
class Pr3BrowserEvidenceProbe {
    @TempDir Path runtime;
    @Test void separateOwnersAndRejectOverwriteOrCheckoutOutput() throws Exception {
        String previous=System.getProperty("cf.browser.evidence");
        try {
            System.setProperty("cf.browser.evidence",runtime.toString());
            var first=BrowserEvidence.directory(Cf014HistoryReviewTest.class,runtime);
            var second=BrowserEvidence.directory(Cf014HistoryDiagnosticTest.class,runtime);
            assertThat(first).isNotEqualTo(second);
            assertThatThrownBy(()->BrowserEvidence.directory(Cf014HistoryReviewTest.class,runtime))
                    .isInstanceOf(java.nio.file.FileAlreadyExistsException.class);
            System.setProperty("cf.browser.evidence",Path.of(System.getProperty("user.dir"),"target/private-browser").toString());
            assertThatThrownBy(()->BrowserEvidence.directory(Cf014HistoryReviewTest.class,runtime))
                    .isInstanceOf(IllegalArgumentException.class);
        } finally {
            if(previous==null)System.clearProperty("cf.browser.evidence");else System.setProperty("cf.browser.evidence",previous);
        }
    }
}
