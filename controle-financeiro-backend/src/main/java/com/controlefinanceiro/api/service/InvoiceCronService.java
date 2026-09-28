package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.card.CardTransaction;
import com.controlefinanceiro.api.domain.card.CardTransactionRepository;
import com.controlefinanceiro.api.domain.card.Invoice;
import com.controlefinanceiro.api.domain.card.InvoiceRepository;
import com.controlefinanceiro.api.domain.card.InvoiceStatus;
import com.controlefinanceiro.api.domain.card.CreditCardRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class InvoiceCronService {

    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private CreditCardRepository cardRepository;
    @Autowired private CardTransactionRepository transactionRepository;
    @Autowired private EmailService emailService;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private Clock clock;

    @Scheduled(cron = "0 5 0 * * ?", zone = "${app.temporal.product-zone}")
    @SchedulerLock(name = "processInvoiceClosingLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void processInvoiceClosing() {
        log.info("CRON-INVOICE: A verificar fecho de faturas...");

        List<Invoice> openInvoices = invoiceRepository.findByStatusWithCardAndUser(InvoiceStatus.OPEN);
        LocalDate today = LocalDate.now(clock);

        for (Invoice invoice : openInvoices) {
            try {
                if (invoice.getClosingDate() == null) {
                    log.warn("CRON-INVOICE: Fatura legada {} sem data de fechamento comprovada; requer conciliação", invoice.getId());
                    continue;
                }
                if (!today.isBefore(invoice.getClosingDate())) {

                    // ISOLAMENTO DA TRANSAÇÃO: Apenas esta fatura vai à base de dados
                    ClosingNotice notice = transactionTemplate.execute(status -> {
                        cardRepository.findByIdForUpdate(invoice.getCard().getId()).orElseThrow();
                        Invoice current = invoiceRepository.findByIdForUpdate(invoice.getId()).orElseThrow();
                        if (current.getStatus() != InvoiceStatus.OPEN) return null;
                        log.info("CRON-INVOICE: A fechar fatura do cartão {} (Mês {}/{})", current.getCard().getName(), current.getMonth(), current.getYear());
                        current.setStatus(InvoiceStatus.CLOSED);
                        invoiceRepository.save(current);

                        BigDecimal total = transactionRepository.findByInvoiceIdWithDetails(invoice.getId())
                                .stream().map(CardTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                        return new ClosingNotice(current.getCard().getUser().getEmail(),
                                current.getCard().getUser().getNome(), current.getCard().getName(),
                                current.getDueDate(), total);
                    });

                    // DISPARO DE E-MAIL SEGURO: Apenas chega aqui se o transactionTemplate comitar com sucesso na BD.
                    if (notice != null) {
                        enviarEmailFechamento(notice);
                    }
                }
            } catch (Exception e) {
                // ISOLAMENTO DE FALHA: Se esta fatura lançar um erro, regista-o no log e passa para o próximo cliente sem interromper o sistema!
                log.error("CRON-INVOICE: Erro ao tentar fechar a fatura ID {}", invoice.getId(), e);
            }
        }
        log.info("CRON-INVOICE: Verificação concluída com sucesso.");
    }

    private void enviarEmailFechamento(ClosingNotice notice) {
        String body = "<p>Olá, <strong>" + notice.name() + "</strong>.</p>" +
                "<p>A fatura do seu cartão <strong>" + notice.cardName() + "</strong> acabou de fechar.</p>" +
                "<p style=\"font-size: 20px;\">Valor total: <strong style=\"color: #10b981;\">R$ " + notice.total() + "</strong></p>" +
                "<p>O vencimento está programado para <strong>" + notice.dueDate() + "</strong>. " +
                "Acesse o aplicativo para realizar o pagamento e atualizar seu planejamento.</p>";

        emailService.sendTemplatedEmail(notice.email(), "Sua Fatura Fechou 💳", "Fatura Fechada", body);
    }

    private record ClosingNotice(String email, String name, String cardName, LocalDate dueDate, BigDecimal total) {}
}
