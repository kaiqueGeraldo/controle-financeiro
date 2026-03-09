package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.card.CardTransaction;
import com.controlefinanceiro.api.domain.card.dto.CreateCardTransactionDTO;
import com.controlefinanceiro.api.domain.card.dto.CreditCardResponseDTO;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.goal.*;
import com.controlefinanceiro.api.domain.goal.dto.*;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.utils.DateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class GoalService {

    @Autowired
    private GoalRepository repository;
    @Autowired
    private GoalHistoryRepository historyRepository;
    @Autowired
    private GoalItemRepository itemRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private TransactionRepository transactionRepository;
    @Autowired
    private CreditCardService creditCardService;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Transactional
    public GoalResponseDTO create(CreateGoalDTO data, User user) {
        log.info("Criando nova meta: {}", data.title());
        Goal goal = new Goal();
        goal.setTitle(data.title());
        goal.setTargetValue(data.targetValue());
        goal.setCurrentValue(BigDecimal.ZERO);
        goal.setDeadline(data.deadline());
        goal.setCategory(data.category());
        goal.setIcon(data.icon());
        goal.setColor(data.color());
        goal.setType(data.type());
        boolean isChecklist = data.useChecklist() != null ? data.useChecklist() : false;
        goal.setUseChecklist(isChecklist);

        if (isChecklist) {
            goal.setTargetValue(BigDecimal.ZERO);
        } else {
            goal.setTargetValue(data.targetValue());
        }

        goal.setUser(user);

        Goal saved = repository.save(goal);
        return new GoalResponseDTO(saved);
    }

    public List<GoalResponseDTO> listAll(User user) {
        return repository.findAllByUserIdOrderByDeadlineAsc(user.getId())
                .stream()
                .map(GoalResponseDTO::new)
                .toList();
    }

    public List<GoalHistory> listHistory(UUID goalId, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        return historyRepository.findByGoalIdOrderByDateDesc(goalId);
    }

    @Transactional
    public void addValue(UUID goalId, GoalDepositDTO data, User user) {
        log.info("Iniciando aporte na meta ID: {}. Valor solicitado: {}", goalId, data.amount());

        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado à meta");
        }

        if (goal.getType() == GoalType.MONETARY) {
            if (data.accountId() == null) {
                throw new BusinessRuleException("Para metas financeiras, a conta de origem é obrigatória.");
            }

            Account account = accountRepository.findById(data.accountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de origem não encontrada"));

            if (!account.getUser().getId().equals(user.getId())) {
                throw new BusinessRuleException("A conta de origem não pertence ao usuário");
            }

            if (account.getBalance().compareTo(data.amount()) < 0) {
                log.warn("Tentativa de aporte bloqueada. Saldo insuficiente. Conta: {} (Saldo: {}), Valor Tentado: {}",
                        account.getName(), account.getBalance(), data.amount());

                throw new BusinessRuleException("Saldo insuficiente na conta " + account.getName() +
                        " para realizar este aporte. Saldo atual: " + account.getBalance());
            }

            log.info("Debitando valor {} da conta {}", data.amount(), account.getName());
            account.debit(data.amount());
            accountRepository.save(account);

            Transaction transaction = new Transaction();
            transaction.setDescription("Depósito na Meta: " + goal.getTitle());
            transaction.setAmount(data.amount());
            transaction.setDate(LocalDate.now());

            LocalTime time = DateUtil.getTimeOrDefault(data.time());
            transaction.setCreatedAt(LocalDate.now().atTime(time));

            transaction.setType(TransactionType.EXPENSE);
            transaction.setAccount(account);
            transaction.setPaid(true);
            transaction.setUser(user);
            transaction.setSystemManaged(true);

            Category catMeta = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName())
                    .orElseThrow(() -> new BusinessRuleException("Categoria de Metas não encontrada."));
            transaction.setCategory(catMeta);

            transactionRepository.save(transaction);
        }

        goal.setCurrentValue(goal.getCurrentValue().add(data.amount()));
        repository.save(goal);

        GoalHistory history = new GoalHistory();
        history.setGoal(goal);
        history.setAmount(data.amount());
        history.setNote(data.note() != null ? data.note() : (goal.getType() == GoalType.MONETARY ? "Aporte financeiro" : "Registro de progresso"));
        historyRepository.save(history);

        log.info("Aporte na meta concluído com sucesso. Novo saldo da meta: {}", goal.getCurrentValue());
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));
    }

    @Transactional
    public GoalResponseDTO update(UUID id, UpdateGoalDTO data, User user) {
        Goal goal = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");

        if (data.title() != null && !data.title().isBlank()) goal.setTitle(data.title());
        if (data.deadline() != null) goal.setDeadline(data.deadline());
        if (data.targetValue() != null) {
            if (data.targetValue().compareTo(BigDecimal.ZERO) <= 0)
                throw new BusinessRuleException("O valor alvo deve ser maior que zero.");
            goal.setTargetValue(data.targetValue());
        }

        Goal updatedGoal = repository.save(goal);
        return new GoalResponseDTO(updatedGoal);
    }

    @Transactional
    public void delete(UUID id, UUID targetAccountId, User user) {
        log.warn("Solicitação de exclusão da meta ID {}", id);
        Goal goal = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (goal.getItems() != null) {
            for (GoalItem item : goal.getItems()) {
                if (item.getStatus() == GoalItemStatus.PURCHASED && !Boolean.TRUE.equals(item.getUsedGoalBalance())) {
                    if (item.getBankTransactionId() != null) {
                        Transaction bankTx = transactionRepository.findById(item.getBankTransactionId()).orElse(null);
                        if (bankTx != null) {
                            Account acc = bankTx.getAccount();
                            acc.credit(bankTx.getAmount());
                            accountRepository.save(acc);
                            transactionRepository.delete(bankTx);
                        }
                    } else if (item.getCardTransactionId() != null) {
                        creditCardService.deleteTransaction(item.getCardTransactionId(), user);
                    }
                    goal.setCurrentValue(goal.getCurrentValue().subtract(item.getPaidPrice()));
                }
            }
        }

        if (goal.getType() == GoalType.MONETARY && goal.getCurrentValue().compareTo(BigDecimal.ZERO) > 0) {
            log.info("Meta possui saldo de {}. Iniciando processo de estorno.", goal.getCurrentValue());

            if (targetAccountId == null) {
                throw new BusinessRuleException("Esta meta possui saldo. Informe uma conta de destino para realizar o estorno antes de deletar.");
            }

            Account targetAccount = accountRepository.findById(targetAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de destino para estorno não encontrada"));

            if (!targetAccount.getUser().getId().equals(user.getId())) {
                throw new BusinessRuleException("A conta de destino não pertence ao usuário.");
            }

            BigDecimal valorEstorno = goal.getCurrentValue();

            log.info("Estornando {} para a conta {}", valorEstorno, targetAccount.getName());
            targetAccount.credit(valorEstorno);
            accountRepository.save(targetAccount);

            Transaction transaction = new Transaction();
            transaction.setDescription("Estorno de Meta: " + goal.getTitle());
            transaction.setAmount(valorEstorno);
            transaction.setDate(LocalDate.now());

            LocalTime time = DateUtil.getTimeOrDefault(LocalTime.now().toString());
            transaction.setCreatedAt(transaction.getDate().atTime(time));

            transaction.setType(TransactionType.INCOME);
            transaction.setAccount(targetAccount);
            transaction.setPaid(true);
            transaction.setUser(user);
            transaction.setSystemManaged(true);
            Category catMeta = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName()).orElse(null);
            transaction.setCategory(catMeta);

            transactionRepository.save(transaction);
        }

        repository.delete(goal);
        log.info("Meta excluída com sucesso.");
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));
    }

    @Transactional
    public void deleteHistory(UUID historyId, UUID targetAccountId, User user) {
        log.warn("Solicitação de exclusão de histórico/aporte ID {}", historyId);

        GoalHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado"));

        Goal goal = history.getGoal();

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }

        if (goal.getType() == GoalType.MONETARY) {
            log.info("Exclusão de registro monetário. Valor a estornar: {}", history.getAmount());

            if (targetAccountId == null) {
                throw new BusinessRuleException("Informe a conta de destino para estornar o valor de " + history.getAmount());
            }

            Account targetAccount = accountRepository.findById(targetAccountId)
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de destino não encontrada"));

            if (!targetAccount.getUser().getId().equals(user.getId())) {
                throw new BusinessRuleException("A conta de destino não pertence ao usuário");
            }

            log.info("Creditando estorno na conta {}", targetAccount.getName());
            targetAccount.credit(history.getAmount());
            accountRepository.save(targetAccount);

            Transaction transaction = new Transaction();
            transaction.setDescription("Estorno Aporte: " + goal.getTitle());
            transaction.setAmount(history.getAmount());
            transaction.setDate(LocalDate.now());

            LocalTime time = DateUtil.getTimeOrDefault(LocalTime.now().toString());
            transaction.setCreatedAt(transaction.getDate().atTime(time));

            transaction.setType(TransactionType.INCOME);
            transaction.setAccount(targetAccount);
            transaction.setPaid(true);
            transaction.setUser(user);
            transaction.setSystemManaged(true);
            Category catMeta = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName()).orElse(null);
            transaction.setCategory(catMeta);

            transactionRepository.save(transaction);
        }

        BigDecimal novoValor = goal.getCurrentValue().subtract(history.getAmount());
        if (novoValor.compareTo(BigDecimal.ZERO) < 0) novoValor = BigDecimal.ZERO;

        goal.setCurrentValue(novoValor);
        repository.save(goal);

        historyRepository.delete(history);
        log.info("Registro de histórico excluído e saldo da meta ajustado.");
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));
    }

    @Transactional
    public GoalItemResponseDTO addItem(UUID goalId, CreateGoalItemDTO data, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");

        GoalItem item = new GoalItem();
        item.setName(data.name());
        item.setSuggestedModel(data.suggestedModel());
        item.setEstimatedPrice(data.estimatedPrice());
        item.setStatus(GoalItemStatus.PENDING);

        int nextOrder = goal.getItems() != null ? goal.getItems().size() : 0;
        item.setOrderIndex(nextOrder);
        item.setGoal(goal);

        goal.setTargetValue(goal.getTargetValue().add(data.estimatedPrice()));
        repository.save(goal);
        GoalItem savedItem = itemRepository.save(item);

        return new GoalItemResponseDTO(savedItem);
    }

    @Transactional
    public GoalItemResponseDTO purchaseItem(UUID itemId, PurchaseGoalItemDTO data, User user) {
        GoalItem item = itemRepository.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
        Goal goal = item.getGoal();

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");
        if (item.getStatus() == GoalItemStatus.PURCHASED) throw new BusinessRuleException("Este item já foi comprado.");

        BigDecimal diferenca = data.paidPrice().subtract(item.getEstimatedPrice());
        goal.setTargetValue(goal.getTargetValue().add(diferenca));

        if (data.accountId() != null) {
            // PAGAMENTO VIA CONTA CORRENTE
            Account account = accountRepository.findById(data.accountId()).orElseThrow();
            if (account.getBalance().compareTo(data.paidPrice()) < 0)
                throw new BusinessRuleException("Saldo insuficiente.");

            account.debit(data.paidPrice());
            accountRepository.save(account);

            Transaction tx = new Transaction();
            tx.setDescription("Compra Meta: " + item.getName());
            tx.setAmount(data.paidPrice());
            tx.setDate(java.time.LocalDate.now());
            tx.setCreatedAt(java.time.LocalDateTime.now());
            tx.setType(TransactionType.EXPENSE);
            tx.setAccount(account);
            tx.setPaid(true);
            tx.setUser(user);
            tx.setSystemManaged(true);
            Category catMeta = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName()).orElse(null);
            tx.setCategory(catMeta);

            Transaction savedTx = transactionRepository.save(tx);
            item.setBankTransactionId(savedTx.getId());
            item.setUsedGoalBalance(false);
            goal.setCurrentValue(goal.getCurrentValue().add(data.paidPrice()));

        } else if (data.cardId() != null) {
            // PAGAMENTO VIA CARTÃO DE CRÉDITO
            Category cat = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName())
                    .orElseThrow(() -> new BusinessRuleException("Categoria de Metas não encontrada."));

            int parcelas = (data.installments() != null && data.installments() > 0) ? data.installments() : 1;

            CreateCardTransactionDTO cardTx = new CreateCardTransactionDTO(
                    "Compra Meta: " + item.getName(),
                    data.paidPrice(),
                    java.time.LocalDate.now(),
                    java.time.LocalTime.now().toString(),
                    cat.getId(),
                    data.cardId(),
                    parcelas
            );

            UUID transactionId = creditCardService.createTransaction(cardTx);
            item.setCardTransactionId(transactionId);
            item.setUsedGoalBalance(false);
            goal.setCurrentValue(goal.getCurrentValue().add(data.paidPrice()));

        } else {
            // PAGAMENTO VIA SALDO INTERNO DA META
            BigDecimal spentInGoal = goal.getItems().stream()
                    .filter(i -> i.getStatus() == GoalItemStatus.PURCHASED && Boolean.TRUE.equals(i.getUsedGoalBalance()))
                    .map(GoalItem::getPaidPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal availableInGoal = goal.getCurrentValue().subtract(spentInGoal);

            if (availableInGoal.compareTo(data.paidPrice()) < 0) {
                throw new BusinessRuleException("Saldo livre na meta é insuficiente (" + availableInGoal + ").");
            }

            item.setUsedGoalBalance(true);

            GoalHistory history = new GoalHistory();
            history.setGoal(goal);
            history.setAmount(BigDecimal.ZERO);
            history.setNote("Checklist: Comprou " + item.getName() + " (-R$ " + data.paidPrice() + ")");
            historyRepository.save(history);
        }

        item.setPaidPrice(data.paidPrice());
        item.setStatus(GoalItemStatus.PURCHASED);

        repository.save(goal);
        GoalItem savedItem = itemRepository.save(item);

        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));

        return new GoalItemResponseDTO(savedItem);
    }

    @Transactional
    public void deleteItem(UUID itemId, User user) {
        GoalItem item = itemRepository.findById(itemId).orElseThrow();
        Goal goal = item.getGoal();

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");

        goal.setTargetValue(goal.getTargetValue().subtract(item.getEstimatedPrice()));

        if (item.getStatus() == GoalItemStatus.PURCHASED) {
            if (!Boolean.TRUE.equals(item.getUsedGoalBalance())) {
                goal.setCurrentValue(goal.getCurrentValue().subtract(item.getPaidPrice()));

                if (item.getBankTransactionId() != null) {
                    Transaction bankTx = transactionRepository.findById(item.getBankTransactionId()).orElse(null);
                    if (bankTx != null) {
                        Account acc = bankTx.getAccount();
                        acc.credit(bankTx.getAmount());
                        accountRepository.save(acc);
                        transactionRepository.delete(bankTx);
                    }
                } else if (item.getCardTransactionId() != null) {
                    creditCardService.deleteTransaction(item.getCardTransactionId(), user);
                }
            }
        }

        if (goal.getTargetValue().compareTo(BigDecimal.ZERO) < 0) goal.setTargetValue(BigDecimal.ZERO);
        if (goal.getCurrentValue().compareTo(BigDecimal.ZERO) < 0) goal.setCurrentValue(BigDecimal.ZERO);

        repository.save(goal);
        itemRepository.delete(item);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now().getYear()));
    }

    @Transactional
    public void reorderItems(UUID goalId, java.util.List<UUID> itemIds, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");

        for (int i = 0; i < itemIds.size(); i++) {
            UUID id = itemIds.get(i);
            GoalItem item = itemRepository.findById(id).orElse(null);
            if (item != null && item.getGoal().getId().equals(goalId)) {
                item.setOrderIndex(i);
                itemRepository.save(item);
            }
        }
    }
}