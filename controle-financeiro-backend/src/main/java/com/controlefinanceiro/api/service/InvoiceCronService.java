package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardTransaction;
import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.card.Invoice;
import com.controlefinanceiro.api.domain.card.InvoiceRepository;
import com.controlefinanceiro.api.domain.card.InvoiceStatus;
import com.controlefinanceiro.api.infra.mail.EmailService;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class InvoiceCronService {

    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private CardTransactionRepository transactionRepository;
    @Autowired private EmailService emailService;
    @Autowired private TransactionTemplate transactionTemplate;

    @Scheduled(cron = "0 5 0 * * ?", zone = "America/Sao_Paulo")
    @SchedulerLock(name = "processInvoiceClosingLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void processInvoiceClosing() {
        log.info("CRON-INVOICE: A verificar fecho de faturas...");

        List<Invoice> openInvoices = invoiceRepository.findByStatusWithCardAndUser(InvoiceStatus.OPEN);
        LocalDate today = LocalDate.now();

        for (Invoice invoice : openInvoices) {
            try {
                int closingM = invoice.getCard().getClosingDay() > invoice.getCard().getDueDay() ? invoice.getMonth() - 1 : invoice.getMonth();
                int closingY = invoice.getYear();
                if (closingM == 0) {
                    closingM = 12;
                    closingY--;
                }

                int lastDay = LocalDate.of(closingY, closingM, 1).lengthOfMonth();
                LocalDate closingDate = LocalDate.of(closingY, closingM, Math.min(invoice.getCard().getClosingDay(), lastDay));

                if (!today.isBefore(closingDate)) {

                    // ISOLAMENTO DA TRANSAÇÃO: Apenas esta fatura vai à base de dados
                    BigDecimal total = transactionTemplate.execute(status -> {
                        log.info("CRON-INVOICE: A fechar fatura do cartão {} (Mês {}/{})", invoice.getCard().getName(), invoice.getMonth(), invoice.getYear());
                        invoice.setStatus(InvoiceStatus.CLOSED);
                        invoiceRepository.save(invoice);

                        return transactionRepository.findByInvoiceIdWithDetails(invoice.getId())
                                .stream().map(CardTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    });

                    // DISPARO DE E-MAIL SEGURO: Apenas chega aqui se o transactionTemplate comitar com sucesso na BD.
                    if (total != null) {
                        enviarEmailFechamento(invoice, total);
                    }
                }
            } catch (Exception e) {
                // ISOLAMENTO DE FALHA: Se esta fatura lançar um erro, regista-o no log e passa para o próximo cliente sem interromper o sistema!
                log.error("CRON-INVOICE: Erro ao tentar fechar a fatura ID {}", invoice.getId(), e);
            }
        }
        log.info("CRON-INVOICE: Verificação concluída com sucesso.");
    }

    private void enviarEmailFechamento(Invoice invoice, BigDecimal total) {
        String email = invoice.getCard().getUser().getEmail();
        String nome = invoice.getCard().getUser().getNome();

        String body = "<p>Olá, <strong>" + nome + "</strong>.</p>" +
                "<p>A fatura do seu cartão <strong>" + invoice.getCard().getName() + "</strong> acabou de fechar.</p>" +
                "<p style=\"font-size: 20px;\">Valor total: <strong style=\"color: #10b981;\">R$ " + total + "</strong></p>" +
                "<p>O vencimento está programado para o dia <strong>" + invoice.getCard().getDueDay() + "</strong>. " +
                "Acesse o aplicativo para realizar o pagamento e atualizar seu planejamento.</p>";

        emailService.sendTemplatedEmail(email, "Sua Fatura Fechou 💳", "Fatura Fechada", body);
    }
}