package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalHistory;
import com.controlefinanceiro.api.domain.goal.GoalHistoryRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentResponseDTO;
import com.controlefinanceiro.api.domain.investment.dto.UpdateBalanceDTO;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class InvestmentService {

    @Autowired private InvestmentRepository investmentRepository;
    @Autowired private InvestTransactionRepository investTransactionRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private GoalRepository goalRepository;
    @Autowired private GoalHistoryRepository goalHistoryRepository;
    @Autowired private ApplicationEventPublisher eventPublisher;
    @Autowired private CategoryRepository categoryRepository;

    public List<InvestmentResponseDTO> listAll(User user) {
        return investmentRepository.findAllByUserId(user.getId())
                .stream()
                .map(InvestmentResponseDTO::new)
                .toList();
    }

    public List<InvestTransaction> getHistory(UUID investmentId, User user) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        return investTransactionRepository.findAllByInvestmentIdOrderByDateDesc(investmentId);
    }

    @Transactional
    public InvestmentResponseDTO create(CreateInvestmentDTO data, User user) {
        log.info("SERVICE: Iniciando criação de ativo '{}' ({}) para usuário {}", data.ticker(), data.type(), user.getEmail());

        Investment investment = new Investment();
        investment.setTicker(data.ticker().toUpperCase());
        investment.setName(data.name());
        investment.setType(data.type());
        investment.setUser(user);

        if (data.goalId() != null) {
            log.info("SERVICE: Vinculando ativo '{}' à Meta ID {}", data.ticker(), data.goalId());
            Goal goal = goalRepository.findById(data.goalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

            if (!goal.getUser().getId().equals(user.getId())) {
                throw new BusinessRuleException("A meta informada não pertence ao usuário.");
            }
            investment.setGoal(goal);
        }

        Investment saved = investmentRepository.save(investment);
        log.info("SERVICE: Ativo criado com sucesso. ID: {}", saved.getId());
        return new InvestmentResponseDTO(saved);
    }

    @Transactional
    public void performOperation(InvestmentOperationDTO data, User user) {
        log.info("SERVICE: Processando operação de {} no ativo ID {}", data.type(), data.investmentId());

        Investment investment = investmentRepository.findById(data.investmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        Account account = accountRepository.findById(data.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("A conta bancária não pertence ao usuário.");
        }

        switch (data.type()) {
            case BUY -> processBuy(investment, data, account, user);
            case SELL -> processSell(investment, data, account, user);
            case DIVIDEND, INTEREST -> processDividend(investment, data, account, user);
        }

        if (data.type() == InvestTransType.BUY || data.type() == InvestTransType.SELL) {
            investment.setCurrentPrice(data.price());
            investmentRepository.save(investment);
            updateLinkedGoal(investment);
        }

        log.info("SERVICE: Operação finalizada com sucesso.");
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), data.date().getYear()));
    }

    private void processBuy(Investment investment, InvestmentOperationDTO data, Account account, User user) {
        log.info("SERVICE: Executando lógica de COMPRA.");

        BigDecimal fees = data.fees() != null ? data.fees() : BigDecimal.ZERO;
        BigDecimal grossValue = data.quantity().multiply(data.price());
        BigDecimal totalCost = grossValue.add(fees);

        if (account.getBalance().compareTo(totalCost) < 0) {
            log.error("SERVICE: Saldo insuficiente. Conta: {}, Necessário: {}", account.getBalance(), totalCost);
            throw new BusinessRuleException("Saldo insuficiente na conta para realizar o investimento.");
        }

        account.debit(totalCost);
        accountRepository.save(account);

        Transaction bankTx = createBankTransaction(account, totalCost, TransactionType.EXPENSE, "Aporte: " + investment.getTicker(), user, DefaultCategory.APORTE_INVESTIMENTO.getName());

        BigDecimal currentTotalCost = investment.getQuantity().multiply(investment.getAveragePrice());
        BigDecimal newQuantity = investment.getQuantity().add(data.quantity());

        if (newQuantity.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal newPM = currentTotalCost.add(totalCost).divide(newQuantity, 10, RoundingMode.HALF_UP);
            investment.setAveragePrice(newPM);
        }
        investment.setQuantity(newQuantity);

        createInvestTransaction(investment, InvestTransType.BUY, data, bankTx);
        syncToGoalHistory(investment, totalCost, "Aporte em " + investment.getTicker());
    }

    private void processSell(Investment investment, InvestmentOperationDTO data, Account account, User user) {
        log.info("SERVICE: Executando lógica de VENDA.");

        if (investment.getQuantity().compareTo(data.quantity()) < 0) {
            throw new BusinessRuleException("Quantidade insuficiente de ativos para venda.");
        }

        BigDecimal fees = data.fees() != null ? data.fees() : BigDecimal.ZERO;
        BigDecimal grossValue = data.quantity().multiply(data.price());
        BigDecimal netValue = grossValue.subtract(fees);

        if (netValue.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("As taxas da operação não podem ser maiores que o valor bruto da venda.");
        }

        account.credit(netValue);
        accountRepository.save(account);

        Transaction bankTx = createBankTransaction(account, netValue, TransactionType.INCOME, "Resgate: " + investment.getTicker(), user, DefaultCategory.RESGATE_INVESTIMENTO.getName());
        investment.setQuantity(investment.getQuantity().subtract(data.quantity()));

        createInvestTransaction(investment, InvestTransType.SELL, data, bankTx);
    }

    private void processDividend(Investment investment, InvestmentOperationDTO data, Account account, User user) {
        log.info("SERVICE: Processando recebimento de proventos.");

        BigDecimal fees = data.fees() != null ? data.fees() : BigDecimal.ZERO;
        BigDecimal grossValue = data.quantity().multiply(data.price());
        BigDecimal netValue = grossValue.subtract(fees);

        account.credit(netValue);
        accountRepository.save(account);

        Transaction bankTx = createBankTransaction(account, netValue, TransactionType.INCOME, "Proventos: " + investment.getTicker(), user, DefaultCategory.RESGATE_INVESTIMENTO.getName());
        createInvestTransaction(investment, data.type(), data, bankTx);
    }

    private void syncToGoalHistory(Investment investment, BigDecimal amount, String note) {
        if (investment.getGoal() != null) {
            GoalHistory history = new GoalHistory();
            history.setGoal(investment.getGoal());
            history.setAmount(amount);
            history.setNote(note);
            goalHistoryRepository.save(history);
        }
    }

    private void updateLinkedGoal(Investment investment) {
        if (investment.getGoal() != null) {
            Goal goal = investment.getGoal();
            log.info("SERVICE: Atualizando meta vinculada: '{}' (ID: {})", goal.getTitle(), goal.getId());

            BigDecimal totalCurrentValue = investmentRepository.sumValueByGoalId(goal.getId());
            log.debug("SERVICE: Novo saldo calculado para a meta: {}", totalCurrentValue);

            goal.setCurrentValue(totalCurrentValue);
            goalRepository.save(goal);
        } else {
            log.debug("SERVICE: Este ativo não possui meta vinculada. Nenhuma atualização de meta necessária.");
        }
    }

    @Transactional
    public void updateBalance(UpdateBalanceDTO data, User user) {
        Investment investment = investmentRepository.findById(data.investmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        BigDecimal currentBalance = investment.getQuantity(); // Ex: 1000
        BigDecimal newBalance = data.newBalance();           // Ex: 1050
        BigDecimal diff = newBalance.subtract(currentBalance); // 50

        if (diff.compareTo(BigDecimal.ZERO) > 0) {
            log.info("SERVICE: Rendimento detectado: +{}", diff);

            // PM = (QtdAntiga * PMAntigo) / NovaQtd
            BigDecimal oldTotalCost = investment.getQuantity().multiply(investment.getAveragePrice());

            if (newBalance.compareTo(BigDecimal.ZERO) > 0) {
                if (oldTotalCost.compareTo(BigDecimal.ZERO) == 0) {
                    investment.setAveragePrice(BigDecimal.ONE);
                } else {
                    BigDecimal newPM = oldTotalCost.divide(newBalance, 10, RoundingMode.HALF_UP);
                    investment.setAveragePrice(newPM);
                }
            }

            investment.setQuantity(newBalance);
            investmentRepository.save(investment);

            InvestTransaction t = new InvestTransaction();
            t.setInvestment(investment);
            t.setType(InvestTransType.INTEREST);
            t.setDate(LocalDateTime.now());
            t.setQuantity(diff);
            t.setPrice(BigDecimal.ONE);
            t.setTotalValue(diff);
            investTransactionRepository.save(t);

            updateLinkedGoal(investment);
        } else if (diff.compareTo(BigDecimal.ZERO) < 0) {
            investment.setQuantity(newBalance);
            investmentRepository.save(investment);
            updateLinkedGoal(investment);
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));
        }
    }

    @Transactional
    public void deleteInvestment(UUID id, User user) {
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        Goal goal = investment.getGoal();
        List<InvestTransaction> history = investTransactionRepository.findAllByInvestmentIdOrderByDateDesc(id);

        for (InvestTransaction tx : history) {
            Transaction bankTx = tx.getBankTransaction();
            if (bankTx != null) {
                Account acc = bankTx.getAccount();
                if (bankTx.getType() == TransactionType.EXPENSE) {
                    acc.credit(bankTx.getAmount());
                } else {
                    acc.debit(bankTx.getAmount());
                }
                accountRepository.save(acc);
                transactionRepository.delete(bankTx);
            }
        }

        investTransactionRepository.deleteAll(history);
        investmentRepository.delete(investment);

        if (goal != null) updateLinkedGoal(investment);
    }

    @Transactional
    public void deleteTransaction(UUID transactionId, User user) {
        InvestTransaction tx = investTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));

        Investment inv = tx.getInvestment();
        if (!inv.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        Transaction bankTx = tx.getBankTransaction();
        if (bankTx != null) {
            Account acc = bankTx.getAccount();
            if (bankTx.getType() == TransactionType.EXPENSE) {
                acc.credit(bankTx.getAmount());
            } else {
                acc.debit(bankTx.getAmount());
            }
            accountRepository.save(acc);
            transactionRepository.delete(bankTx);
        }

        if (tx.getType() == InvestTransType.BUY || tx.getType() == InvestTransType.INTEREST) {
            inv.setQuantity(inv.getQuantity().subtract(tx.getQuantity()));
        } else if (tx.getType() == InvestTransType.SELL) {
            inv.setQuantity(inv.getQuantity().add(tx.getQuantity()));
        }

        if (inv.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            inv.setQuantity(BigDecimal.ZERO);
        }

        investTransactionRepository.delete(tx);
        investmentRepository.save(inv);

        if (inv.getGoal() != null) updateLinkedGoal(inv);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), tx.getDate().getYear()));
    }

    private void createInvestTransaction(Investment investment, InvestTransType type, InvestmentOperationDTO data, Transaction bankTx) {
        InvestTransaction t = new InvestTransaction();
        t.setInvestment(investment);
        t.setType(type);
        t.setDate(data.date().atStartOfDay());
        t.setQuantity(data.quantity());
        t.setPrice(data.price());
        t.setFees(data.fees() != null ? data.fees() : BigDecimal.ZERO);
        t.setTotalValue(data.quantity().multiply(data.price()));
        t.setBankTransaction(bankTx);
        investTransactionRepository.save(t);
    }

    private Transaction createBankTransaction(Account account, BigDecimal amount, TransactionType type, String desc, User user, String categoryName) {
        Category category = categoryRepository.findByUserIdAndName(user.getId(), categoryName).orElse(null);
        Transaction t = new Transaction();
        t.setAccount(account);
        t.setAmount(amount);
        t.setType(type);
        t.setDescription(desc);
        t.setDate(java.time.LocalDate.now());
        t.setCreatedAt(LocalDateTime.now());
        t.setPaid(true);
        t.setUser(user);
        t.setSystemManaged(true);
        t.setCategory(category);
        return transactionRepository.save(t);
    }
}