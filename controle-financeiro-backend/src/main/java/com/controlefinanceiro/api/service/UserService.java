package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.domain.user.dto.ChangePasswordDTO;
import com.controlefinanceiro.api.domain.user.dto.UpdatePreferencesDTO;
import com.controlefinanceiro.api.domain.user.dto.UpdateProfileDTO;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import com.controlefinanceiro.api.domain.event.UserFinancialDataDeletedEvent;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Slf4j
public class UserService {

    @Autowired private UserRepository repository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EntityManager entityManager;
    @Autowired private EmailService emailService;
    @Autowired private ApplicationEventPublisher events;

    @Transactional
    public User updateProfile(User user, UpdateProfileDTO data) {
        if (!user.getEmail().equals(data.email())) {
            if (repository.findUserByEmail(data.email()).isPresent()) {
                throw new BusinessRuleException("Este e-mail já está em uso por outra conta.");
            }
        }

        user.setNome(data.nome());
        user.setEmail(data.email());
        return repository.save(user);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordDTO data) {
        if (!passwordEncoder.matches(data.senhaAtual(), user.getSenha())) {
            throw new BusinessRuleException("A senha atual está incorreta.");
        }
        user.setSenha(passwordEncoder.encode(data.novaSenha()));
        repository.save(user);
    }

    @Transactional
    public User updatePreferences(User user, UpdatePreferencesDTO data) {
        if (data.darkMode() != null) user.setDarkMode(data.darkMode());
        if (data.privacyMode() != null) user.setPrivacyMode(data.privacyMode());
        if (data.notifContas() != null) user.setNotifContas(data.notifContas());
        if (data.notifSemanal() != null) user.setNotifSemanal(data.notifSemanal());
        if (data.dashboardConfig() != null) user.setDashboardConfig(data.dashboardConfig());
        return repository.save(user);
    }

    @Transactional
    public void deleteAccount(User user) {
        UUID userId = user.getId();
        String emailToNotify = user.getEmail();
        String nameToNotify = user.getNome();

        entityManager.flush();
        // Serialize deletion of this identity. Source writers still retain their own locks/FKs.
        entityManager.createNativeQuery("SELECT id FROM users WHERE id = :userId FOR UPDATE")
                .setParameter("userId", userId).getSingleResult();
        rejectForeignLegacyLinks(userId);

        // Bulk statements follow the current FK graph, including unmapped legacy UUID links.
        // Every root is selected by owner; never follow a foreign reference to delete another root.
        for (String deletion : java.util.List.of(
                "DELETE FROM habit_logs WHERE habit_id IN (SELECT id FROM habits WHERE user_id=:userId)",
                "DELETE FROM habit_days WHERE habit_id IN (SELECT id FROM habits WHERE user_id=:userId)",
                "DELETE FROM habits WHERE user_id=:userId",
                "DELETE FROM goal_purchases WHERE user_id=:userId",
                "DELETE FROM goal_items WHERE goal_id IN (SELECT id FROM goals WHERE user_id=:userId)",
                "DELETE FROM goal_history WHERE goal_id IN (SELECT id FROM goals WHERE user_id=:userId)",
                "DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM goals WHERE user_id=:userId)",
                "DELETE FROM plan_items WHERE plan_id IN (SELECT id FROM monthly_plans WHERE user_id=:userId)",
                "DELETE FROM monthly_plans WHERE user_id=:userId",
                "DELETE FROM investment_cost_revisions WHERE correction_id IN (SELECT c.id FROM investment_corrections c JOIN investments i ON i.id=c.investment_id WHERE i.user_id=:userId)",
                "DELETE FROM investment_corrections WHERE investment_id IN (SELECT id FROM investments WHERE user_id=:userId)",
                "DELETE FROM investment_valuations WHERE investment_id IN (SELECT id FROM investments WHERE user_id=:userId)",
                "DELETE FROM invest_transactions WHERE investment_id IN (SELECT id FROM investments WHERE user_id=:userId)",
                "DELETE FROM investments WHERE user_id=:userId",
                "DELETE FROM goals WHERE user_id=:userId",
                "DELETE FROM card_payment_allocations WHERE payment_id IN (SELECT p.id FROM card_payments p JOIN invoices i ON i.id=p.invoice_id JOIN credit_cards c ON c.id=i.card_id WHERE c.user_id=:userId)",
                "DELETE FROM card_payments WHERE invoice_id IN (SELECT i.id FROM invoices i JOIN credit_cards c ON c.id=i.card_id WHERE c.user_id=:userId)",
                "DELETE FROM card_refunds WHERE card_id IN (SELECT id FROM credit_cards WHERE user_id=:userId)",
                "DELETE FROM card_transactions WHERE invoice_id IN (SELECT i.id FROM invoices i JOIN credit_cards c ON c.id=i.card_id WHERE c.user_id=:userId)",
                "DELETE FROM card_opening_batches WHERE card_id IN (SELECT id FROM credit_cards WHERE user_id=:userId)",
                "DELETE FROM invoices WHERE card_id IN (SELECT id FROM credit_cards WHERE user_id=:userId)",
                "DELETE FROM credit_cards WHERE user_id=:userId",
                "DELETE FROM financial_commands WHERE user_id=:userId",
                "DELETE FROM financial_intent_receipts WHERE user_id=:userId",
                "DELETE FROM transactions WHERE user_id=:userId",
                "DELETE FROM accounts WHERE user_id=:userId",
                "DELETE FROM categories WHERE user_id=:userId",
                "DELETE FROM yearly_notes WHERE user_id=:userId")) {
            entityManager.createNativeQuery(deletion).setParameter("userId", userId).executeUpdate();
        }
        // Bulk SQL bypasses managed entity collections. Do not flush stale parents afterwards.
        entityManager.clear();
        repository.deleteById(userId);
        repository.flush();
        events.publishEvent(new UserFinancialDataDeletedEvent(userId));

        String farewellBody = "<p>Olá, <strong>" + nameToNotify + "</strong>.</p>" +
                "<p>Confirmamos que sua conta e todos os seus dados financeiros, transações e histórico foram <strong>excluídos permanentemente</strong> de nossos servidores, conforme sua solicitação.</p>" +
                "<p>Foi um prazer ter você conosco na jornada em busca da independência financeira. Se um dia decidir voltar, estaremos de portas abertas!</p>" +
                "<p style=\"margin-top: 32px;\">Um abraço,<br><strong>Equipe Controle Financeiro</strong></p>";

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                try {
                    emailService.sendTemplatedEmail(emailToNotify, "Conta Excluída com Sucesso", "Até logo!", farewellBody);
                } catch (RuntimeException failure) {
                    // A rejected async submission cannot undo a committed deletion or report it as rolled back.
                    log.error("Não foi possível agendar a notificação após exclusão confirmada", failure);
                }
            }
        });
    }

    private void rejectForeignLegacyLinks(UUID userId) {
        // Existing SET NULL FKs and UUID-only legacy links would otherwise silently change/dangle foreign data.
        for (String query : java.util.List.of(
                "SELECT 1 FROM investments i JOIN goals g ON g.id=i.goal_id WHERE g.user_id=:userId AND i.user_id<>:userId",
                "SELECT 1 FROM habits h JOIN goals g ON g.id=h.goal_id WHERE g.user_id=:userId AND h.user_id<>:userId",
                "SELECT 1 FROM habit_logs l JOIN habits h ON h.id=l.habit_id JOIN goal_history gh ON gh.id=l.goal_history_id JOIN goals g ON g.id=gh.goal_id WHERE g.user_id=:userId AND h.user_id<>:userId",
                "SELECT 1 FROM goal_items gi JOIN goals g ON g.id=gi.goal_id WHERE g.user_id<>:userId AND (gi.bank_transaction_id IN (SELECT id FROM transactions WHERE user_id=:userId) OR gi.card_transaction_id IN (SELECT ct.id FROM card_transactions ct JOIN invoices i ON i.id=ct.invoice_id JOIN credit_cards c ON c.id=i.card_id WHERE c.user_id=:userId) OR gi.allocation_id IN (SELECT a.id FROM goal_allocations a JOIN goals own ON own.id=a.goal_id WHERE own.user_id=:userId))",
                "SELECT 1 FROM goal_history gh JOIN goals g ON g.id=gh.goal_id WHERE g.user_id<>:userId AND gh.allocation_id IN (SELECT a.id FROM goal_allocations a JOIN goals own ON own.id=a.goal_id WHERE own.user_id=:userId)",
                "SELECT 1 FROM card_refunds r JOIN credit_cards c ON c.id=r.card_id WHERE c.user_id<>:userId AND r.purchase_id IN (SELECT ct.purchase_id FROM card_transactions ct JOIN invoices i ON i.id=ct.invoice_id JOIN credit_cards own ON own.id=i.card_id WHERE own.user_id=:userId)")) {
            if (!entityManager.createNativeQuery(query).setParameter("userId", userId).setMaxResults(1).getResultList().isEmpty())
                throw new BusinessRuleException("Exclusão não realizada: existem vínculos herdados entre proprietários que exigem reconciliação.");
        }
    }
}
