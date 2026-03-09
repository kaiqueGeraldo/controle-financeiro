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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    @Autowired private UserRepository repository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EntityManager entityManager;
    @Autowired private EmailService emailService;

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
    @CacheEvict(value = "annualSummary", allEntries = true)
    public void deleteAccount(User user) {
        UUID userId = user.getId();
        String emailToNotify = user.getEmail();
        String nameToNotify = user.getNome();

        // 1. Hábitos
        entityManager.createQuery("DELETE FROM HabitLog hl WHERE hl.habit.id IN (SELECT h.id FROM Habit h WHERE h.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Habit h WHERE h.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        // 2. Metas
        entityManager.createQuery("DELETE FROM GoalItem gi WHERE gi.goal.id IN (SELECT g.id FROM Goal g WHERE g.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM GoalHistory gh WHERE gh.goal.id IN (SELECT g.id FROM Goal g WHERE g.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Goal g WHERE g.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        // 3. Cartões de Crédito
        entityManager.createQuery("DELETE FROM CardTransaction ct WHERE ct.invoice.id IN (SELECT i.id FROM Invoice i WHERE i.card.id IN (SELECT c.id FROM CreditCard c WHERE c.user.id = :userId))")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Invoice i WHERE i.card.id IN (SELECT c.id FROM CreditCard c WHERE c.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM CreditCard c WHERE c.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        // 4. Planejamentos Mensais
        entityManager.createQuery("DELETE FROM PlanItem p WHERE p.plan.id IN (SELECT m.id FROM MonthlyPlan m WHERE m.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM MonthlyPlan m WHERE m.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        // 5. Investimentos
        entityManager.createQuery("DELETE FROM InvestTransaction it WHERE it.investment.id IN (SELECT i.id FROM Investment i WHERE i.user.id = :userId)")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Investment i WHERE i.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        // 6. Transações Gerais e Entidades Base
        entityManager.createQuery("DELETE FROM Transaction t WHERE t.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Account a WHERE a.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM Category c WHERE c.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();
        entityManager.createQuery("DELETE FROM YearlyNote y WHERE y.user.id = :userId")
                .setParameter("userId", userId).executeUpdate();

        repository.delete(user);

        String farewellBody = "<p>Olá, <strong>" + nameToNotify + "</strong>.</p>" +
                "<p>Confirmamos que sua conta e todos os seus dados financeiros, transações e histórico foram <strong>excluídos permanentemente</strong> de nossos servidores, conforme sua solicitação.</p>" +
                "<p>Foi um prazer ter você conosco na jornada em busca da independência financeira. Se um dia decidir voltar, estaremos de portas abertas!</p>" +
                "<p style=\"margin-top: 32px;\">Um abraço,<br><strong>Equipe Controle Financeiro</strong></p>";

        emailService.sendTemplatedEmail(emailToNotify, "Conta Excluída com Sucesso", "Até logo!", farewellBody);
    }
}