package com.controlefinanceiro.api.infra.operations;

import com.controlefinanceiro.api.infra.mail.EmailService;
import com.resend.Resend;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class EmailMaintenanceTest {
    @Test void closedWritersNeverConstructAnExternalClientAndNormalModeStillSends() throws Exception {
        var email = new EmailService();
        ReflectionTestUtils.setField(email, "operations", new OperationsState(false, false));
        ReflectionTestUtils.setField(email, "apiKey", "synthetic-only");
        ReflectionTestUtils.setField(email, "fromEmail", "no-reply@example.test");
        try (var clients = mockConstruction(Resend.class, withSettings().defaultAnswer(RETURNS_DEEP_STUBS))) {
            email.sendTemplatedEmail("synthetic@example.test", "subject", "title", "body");
            assertThat(clients.constructed()).isEmpty();
            ReflectionTestUtils.setField(email, "operations", new OperationsState(true, false));
            email.sendTemplatedEmail("synthetic@example.test", "subject", "title", "body");
            assertThat(clients.constructed()).hasSize(1);
            verify(clients.constructed().getFirst().emails()).send(any(com.resend.services.emails.model.SendEmailRequest.class));
        }
    }
}
