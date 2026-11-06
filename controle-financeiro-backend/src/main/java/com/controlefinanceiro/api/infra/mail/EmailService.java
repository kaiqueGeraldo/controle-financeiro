package com.controlefinanceiro.api.infra.mail;

import com.controlefinanceiro.api.infra.operations.OperationsState;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final JsonMapper REQUEST_MAPPER = JsonMapper.builder().build();
    private static final MediaType JSON = MediaType.get("application/json");

    private final OkHttpClient client = new OkHttpClient.Builder()
            .followRedirects(false)
            .followSslRedirects(false)
            .retryOnConnectionFailure(false)
            .build();

    @Autowired private OperationsState operations;

    @Value("${api.resend.key}")
    private String apiKey;

    @Value("${api.resend.from}")
    private String fromEmail;

    @Async("emailTaskExecutor")
    public void sendTemplatedEmail(String to, String subject, String title, String bodyContent) {
        if (!operations.writersEnabled()) return;
        try {
            var payload = REQUEST_MAPPER.writeValueAsString(Map.of(
                    "from", "Controle Financeiro <" + fromEmail + ">",
                    "to", List.of(to),
                    "subject", subject,
                    "html", buildHtmlTemplate(title, bodyContent)));
            var request = new Request.Builder()
                    .url("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .post(RequestBody.create(payload, JSON))
                    .build();
            try (var response = client.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    log.info("Envio aceito pelo Resend.");
                } else {
                    log.warn("Falha no envio pelo Resend (status={}).", response.code());
                }
            }
        } catch (IOException | RuntimeException e) {
            log.error("Falha no envio pelo Resend (tipo={}).", e.getClass().getSimpleName());
        }
    }

    private String buildHtmlTemplate(String title, String body) {
        return """
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f4f4f5;">
            <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="100%%" style="max-width: 600px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; text-align: left;" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding: 32px; text-align: center; border-bottom: 1px solid #27272a; background-color: #09090b;">
                                    <h1 style="color: #10b981; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Controle Financeiro</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 32px;">
                                    <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">%s</h2>
                                    <div style="color: #a1a1aa; line-height: 1.6; font-size: 16px;">
                                        %s
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 24px; text-align: center; background-color: #09090b; border-top: 1px solid #27272a;">
                                    <p style="color: #52525b; margin: 0; font-size: 12px;">Feito com 💚 por Kaique</p>
                                    <p style="color: #52525b; margin: 4px 0 0 0; font-size: 12px;">© 2026 Todos os direitos reservados.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """.formatted(title, body);
    }
}
