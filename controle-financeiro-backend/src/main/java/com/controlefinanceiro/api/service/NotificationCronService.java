package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.planning.PlanItem;
import com.controlefinanceiro.api.domain.planning.PlanItemRepository;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
public class NotificationCronService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PlanItemRepository planItemRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private EmailService emailService;

    // Roda todos os dias às 08:00h
    @Scheduled(cron = "0 0 8 * * ?", zone = "America/Sao_Paulo")
    @SchedulerLock(name = "notifyUpcomingBillsLock", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    public void notifyUpcomingBills() {
        log.info("CRON: Iniciando verificação de contas a vencer para amanhã...");
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<User> usersToNotify = userRepository.findByNotifContasTrue();

        for (User user : usersToNotify) {
            List<PlanItem> pendingItems = planItemRepository.findPendingByUserIdAndDate(user.getId(), tomorrow);

            if (!pendingItems.isEmpty()) {
                StringBuilder itemsHtml = new StringBuilder("<ul style=\"color: #a1a1aa;\">");
                BigDecimal total = BigDecimal.ZERO;

                for (PlanItem item : pendingItems) {
                    itemsHtml.append("<li>").append(item.getDescription())
                            .append(" - R$ ").append(item.getAmount()).append("</li>");
                    total = total.add(item.getAmount());
                }
                itemsHtml.append("</ul>");

                String body = "<p>Olá, <strong>" + user.getNome() + "</strong>!</p>" +
                        "<p>Lembramos que você tem pagamentos programados para <strong>amanhã (" + tomorrow.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")) + ")</strong>.</p>" +
                        itemsHtml.toString() +
                        "<p><strong>Total a pagar: R$ " + total + "</strong></p>" +
                        "<p>Acesse o aplicativo para registrar o pagamento e manter seu planejamento em dia.</p>";

                emailService.sendTemplatedEmail(user.getEmail(), "Lembrete: Contas a vencer amanhã \u23F0", "Contas a Vencer", body);
            }
        }
        log.info("CRON: Verificação de contas a vencer finalizada.");
    }

    // Roda toda Segunda-feira às 08:00h
    @Scheduled(cron = "0 0 8 * * MON", zone = "America/Sao_Paulo")
    public void sendWeeklySummary() {
        log.info("CRON: Iniciando envio do resumo semanal...");
        List<User> usersToNotify = userRepository.findByNotifSemanalTrue();

        LocalDate lastMonday = LocalDate.now().minusDays(7);
        LocalDate lastSunday = LocalDate.now().minusDays(1);

        for (User user : usersToNotify) {
            List<Transaction> weeklyTransactions = transactionRepository.findByUserIdAndDateBetween(user.getId(), lastMonday, lastSunday);

            BigDecimal totalIn = weeklyTransactions.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalOut = weeklyTransactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal balance = totalIn.subtract(totalOut);
            String balanceColor = balance.compareTo(BigDecimal.ZERO) >= 0 ? "#10b981" : "#f43f5e";

            String body = "<p>Olá, <strong>" + user.getNome() + "</strong>!</p>" +
                    "<p>Aqui está o resumo da sua movimentação financeira da última semana (" +
                    lastMonday.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM")) + " a " +
                    lastSunday.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM")) + "):</p>" +

                    "<ul style=\"list-style: none; padding: 0;\">" +
                    "   <li style=\"margin-bottom: 8px;\">📈 <strong>Entradas:</strong> <span style=\"color: #10b981;\">R$ " + totalIn + "</span></li>" +
                    "   <li style=\"margin-bottom: 8px;\">📉 <strong>Saídas:</strong> <span style=\"color: #f43f5e;\">R$ " + totalOut + "</span></li>" +
                    "</ul>" +

                    "<p style=\"font-size: 18px;\">Balanço da semana: <strong style=\"color: " + balanceColor + ";\">R$ " + balance + "</strong></p>" +

                    "<p style=\"margin-top: 24px; color: #a1a1aa; font-size: 14px;\">Continue acompanhando seus gastos no aplicativo para manter o controle absoluto do seu dinheiro.</p>";

            emailService.sendTemplatedEmail(user.getEmail(), "Seu Resumo Semanal \uD83D\uDCCA", "Resumo da Semana", body);
        }

        log.info("CRON: Resumo semanal finalizado.");
    }
}