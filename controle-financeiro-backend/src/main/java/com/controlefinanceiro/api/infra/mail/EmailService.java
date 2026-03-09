package com.controlefinanceiro.api.infra.mail;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.SendEmailRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Value("${api.resend.key}")
    private String apiKey;

    @Value("${api.resend.from}")
    private String fromEmail;

    @Async("emailTaskExecutor")
    public void sendTemplatedEmail(String to, String subject, String title, String bodyContent) {
        log.info("Iniciando envio de e-mail com template para: {}", to);

        String htmlTemplate = buildHtmlTemplate(title, bodyContent);

        Resend resend = new Resend(apiKey);
        SendEmailRequest sendEmailRequest = SendEmailRequest.builder()
                .from("Controle Financeiro <" + fromEmail + ">")
                .to(to)
                .subject(subject)
                .html(htmlTemplate)
                .build();

        try {
            resend.emails().send(sendEmailRequest);
            log.info("E-mail enviado com sucesso para: {}", to);
        } catch (ResendException e) {
            log.error("Falha ao enviar e-mail via Resend para {}. Erro: {}", to, e.getMessage(), e);
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