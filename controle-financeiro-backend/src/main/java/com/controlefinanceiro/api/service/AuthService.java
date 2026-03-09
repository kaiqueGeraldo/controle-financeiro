package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.AccountType;
import com.controlefinanceiro.api.domain.auth.dto.*;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.UserRepository;
import com.controlefinanceiro.api.infra.mail.EmailService;
import com.controlefinanceiro.api.infra.security.TokenService;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private EmailService emailService;

    @Transactional
    public void register(RegisterRequestDTO data) {
        log.info("Tentativa de registro de novo usuário: {}", data.email());

        if (userRepository.findByEmail(data.email()) != null) {
            log.warn("Tentativa de registro falhou: E-mail {} já existe.", data.email());
            throw new BusinessRuleException("E-mail já cadastrado");
        }

        String encryptedPassword = passwordEncoder.encode(data.senha());
        User newUser = new User();
        newUser.setNome(data.nome());
        newUser.setEmail(data.email());
        newUser.setSenha(encryptedPassword);

        User savedUser = userRepository.save(newUser);

        this.criarCategoriasPadrao(savedUser);
        this.criarCarteiraFisicaPadrao(savedUser);

        log.info("Usuário registrado com sucesso: ID {}", savedUser.getId());

        String welcomeBody = "<p>Bem-vindo(a) ao <strong>Controle Financeiro</strong>!</p>" +
                "<p>Estamos muito felizes em ter você conosco. Nossa plataforma foi desenhada com carinho para te dar controle total sobre o seu dinheiro, ajudando você a tomar as melhores decisões e a alcançar a sua independência financeira.</p>" +
                "<p>Aqui estão algumas coisas que você já pode começar a fazer:</p>" +
                "<ul style=\"padding-left: 20px; color: #a1a1aa;\">" +
                "   <li style=\"margin-bottom: 8px;\">Lançar suas primeiras receitas e despesas</li>" +
                "   <li style=\"margin-bottom: 8px;\">Cadastrar seus cartões de crédito e faturas</li>" +
                "   <li style=\"margin-bottom: 8px;\">Criar metas para os seus grandes sonhos</li>" +
                "</ul>" +
                "<p style=\"margin-top: 32px;\">Prepare-se para mudar sua vida financeira para melhor.<br>Um abraço,<br><strong>Equipe Controle Financeiro</strong></p>";

        emailService.sendTemplatedEmail(savedUser.getEmail(), "Bem-vindo ao Controle Financeiro \uD83D\uDE80", "Olá, " + savedUser.getNome() + "!", welcomeBody);
    }

    public LoginResponseDTO login(LoginRequestDTO data) {
        log.debug("Processando login para: {}", data.email());
        User user = (User) userRepository.findByEmail(data.email());

        if (user == null || !passwordEncoder.matches(data.senha(), user.getSenha())) {
            log.warn("Falha de login (credenciais inválidas): {}", data.email());
            throw new BusinessRuleException("E-mail ou senha inválidos");
        }

        String token = tokenService.generateToken(user);
        log.info("Login efetuado com sucesso: {}", user.getEmail());

        return new LoginResponseDTO(token, user.getNome(), user.getEmail());
    }

    public void recoverPassword(String email) {
        log.info("Solicitação de recuperação de senha para: {}", email);
        User user = (User) userRepository.findByEmail(email);

        if (user == null) {
            log.warn("Recuperação solicitada para e-mail inexistente: {}", email);
            return;
        }

        String token = generateSecureToken();

        user.setRecoveryToken(token);
        user.setRecoveryTokenExpiry(LocalDateTime.now().plusMinutes(10));
        user.setResetAttempts(0);
        userRepository.save(user);

        log.info("Token de recuperação gerado para usuário ID {}. Enviando e-mail...", user.getId());

        String body = "<p>Olá, <strong>" + user.getNome() + "</strong>.</p>" +
                "<p>Você solicitou a recuperação de senha. Use o código de verificação abaixo no aplicativo:</p>" +
                "<div style=\"background-color: #09090b; border: 1px solid #10b981; color: #10b981; font-size: 28px; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; margin: 32px 0; letter-spacing: 8px;\">" + token + "</div>" +
                "<p style=\"font-size: 14px;\">Este código expira em 10 minutos. Se você não solicitou esta alteração, recomendamos que altere sua senha por segurança.</p>";

        emailService.sendTemplatedEmail(email, "Recuperação de Senha - Controle Financeiro", "Recuperação de Senha", body);
    }

    public void resetPassword(ResetPasswordDTO data) {
        log.info("Tentativa de reset de senha solicitada para o e-mail: {}", data.email());

        User user = (User) userRepository.findByEmail(data.email());
        if (user == null) {
            throw new BusinessRuleException("Usuário não encontrado.");
        }

        if (user.getRecoveryToken() == null || user.getRecoveryTokenExpiry() == null) {
            throw new BusinessRuleException("Nenhuma solicitação de recuperação ativa para este usuário.");
        }

        if (user.getRecoveryTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("O código expirou. Solicite um novo envio.");
        }

        if (!user.getRecoveryToken().equals(data.token())) {
            user.setResetAttempts(user.getResetAttempts() + 1);

            if (user.getResetAttempts() >= 3) {
                user.setRecoveryToken(null);
                user.setRecoveryTokenExpiry(null);
                user.setResetAttempts(0);
                userRepository.save(user);
                log.warn("Múltiplas tentativas falhas. Token invalidado por segurança para o usuário {}", user.getEmail());
                throw new BusinessRuleException("Múltiplas tentativas incorretas. Por segurança, o código foi invalidado. Solicite um novo envio.");
            }

            userRepository.save(user);
            throw new BusinessRuleException("Código inválido. Você tem " + (3 - user.getResetAttempts()) + " tentativa(s) restante(s).");
        }

        String newEncryptedPassword = passwordEncoder.encode(data.novaSenha());
        user.setSenha(newEncryptedPassword);
        user.setRecoveryToken(null);
        user.setRecoveryTokenExpiry(null);
        user.setResetAttempts(0);

        userRepository.save(user);
        log.info("Senha alterada com sucesso para o usuário {}", user.getId());
    }

    // --- Métodos Auxiliares ---
    private void criarCarteiraFisicaPadrao(User user) {
        Account carteira = new Account();
        carteira.setName("Carteira Física");
        carteira.setType(AccountType.CASH);
        carteira.setBalance(BigDecimal.ZERO);
        carteira.setColor("#10b981");
        carteira.setUser(user);

        accountRepository.save(carteira);
        log.info("Carteira física padrão gerada com sucesso para o usuário: {}", user.getId());
    }

    private void criarCategoriasPadrao(User user) {
        List<Category> categorias = java.util.Arrays.stream(DefaultCategory.values())
                .map(dc -> {
                    Category c = new Category();
                    c.setName(dc.getName());
                    c.setIcon(dc.getIcon());
                    c.setColor(dc.getColor());
                    c.setType(dc.getType());
                    c.setSystemReserved(dc.isSystemReserved());
                    c.setUser(user);
                    return c;
                })
                .collect(java.util.stream.Collectors.toList());

        categoryRepository.saveAll(categorias);
    }

    private String generateSecureToken() {
        SecureRandom secureRandom = new SecureRandom();
        int number = secureRandom.nextInt(1000000);
        return String.format("%06d", number);
    }
}