package com.controlefinanceiro.api.infra.operations;

import com.controlefinanceiro.api.infra.mail.EmailService;
import okhttp3.Call;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class EmailMaintenanceTest {
    @Test
    void closedWritersMakeNoExternalCallAndNormalModeStillSends() throws Exception {
        var email = new EmailService();
        ReflectionTestUtils.setField(email, "operations", new OperationsState(false, false));
        ReflectionTestUtils.setField(email, "apiKey", "synthetic-only");
        ReflectionTestUtils.setField(email, "fromEmail", "no-reply@example.test");
        var client = mock(OkHttpClient.class);
        ReflectionTestUtils.setField(email, "client", client);

        email.sendTemplatedEmail("synthetic@example.test", "subject", "title", "body");
        verifyNoInteractions(client);

        var call = mock(Call.class);
        when(client.newCall(any(Request.class))).thenAnswer(invocation -> {
            Request request = invocation.getArgument(0);
            when(call.execute()).thenReturn(new Response.Builder().request(request).protocol(Protocol.HTTP_1_1)
                    .code(204).message("synthetic").build());
            return call;
        });
        ReflectionTestUtils.setField(email, "operations", new OperationsState(true, false));
        email.sendTemplatedEmail("synthetic@example.test", "subject", "title", "body");
        verify(call).execute();
    }
}
