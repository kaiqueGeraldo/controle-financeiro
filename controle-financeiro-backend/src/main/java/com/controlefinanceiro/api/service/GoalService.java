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
import com.controlefinanceiro.api.domain.investment.Investment;
import com.controlefinanceiro.api.domain.investment.InvestmentRepository;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.transaction.TransactionStatus;
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
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
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
    private GoalAllocationRepository allocationRepository;
    @Autowired
    private InvestmentRepository investmentRepository;
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
    @Autowired
    private Clock clock;

    @Transactional
    public GoalResponseDTO create(CreateGoalDTO data, User user) {
        log.info("Criando nova meta: {}", data.title());
        Goal goal = new Goal();
        goal.setTitle(data.title());
        goal.setTargetValue(data.targetValue());
        BigDecimal initial = data.initialProgress() == null ? BigDecimal.ZERO : data.initialProgress();
        if (initial.signum() < 0 || (data.type() == GoalType.MONETARY && initial.signum() != 0)) {
            throw new BusinessRuleException("Progresso monetário inicial exige destinação com fonte; progresso numérico não pode ser negativo.");
        }
        goal.setCurrentValue(initial);
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
        log.info("Registrando progresso/destinação na meta ID: {}. Valor: {}", goalId, data.amount());
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate today = now.toLocalDate();

        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado à meta");
        }

        if (data.amount() == null || data.amount().signum() <= 0) {
            throw new BusinessRuleException("O valor deve ser positivo.");
        }
        GoalAllocation allocation = null;
        if (goal.getType() == GoalType.MONETARY) {
            requireMoney(data.amount());
            if (!Boolean.TRUE.equals(goal.getAllocationReconciled())) {
                throw new BusinessRuleException("A posição monetária legada da meta requer reconciliação antes de nova destinação.");
            }
            if ((data.accountId() == null) == (data.investmentId() == null)) {
                throw new BusinessRuleException("Informe exatamente uma fonte: conta ou investimento.");
            }
            if (data.accountId() != null) {
                Account account = accountRepository.findOwnedForAllocation(data.accountId(), user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Conta de origem não encontrada"));
                account.requireActive();
                BigDecimal allocated = allocationRepository.sumByAccountId(account.getId());
                if (account.getBalance().max(BigDecimal.ZERO).subtract(allocated).compareTo(data.amount()) < 0) {
                    throw new BusinessRuleException("Disponível da conta insuficiente para destinação.");
                }
                allocation = allocationRepository.findByGoalIdAndAccountId(goalId, account.getId())
                        .orElseGet(() -> newAllocation(goal, account, null));
            } else {
                Investment investment = investmentRepository.findOwnedForAllocation(data.investmentId(), user.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Investimento de origem não encontrado"));
                BigDecimal value = investment.getTotalValue();
                if (value == null) {
                    throw new BusinessRuleException("Avaliação do investimento indisponível para nova destinação.");
                }
                BigDecimal allocated = allocationRepository.sumByInvestmentId(investment.getId());
                if (value.max(BigDecimal.ZERO).subtract(allocated).compareTo(data.amount()) < 0) {
                    throw new BusinessRuleException("Disponível do investimento insuficiente para destinação.");
                }
                allocation = allocationRepository.findByGoalIdAndInvestmentId(goalId, investment.getId())
                        .orElseGet(() -> newAllocation(goal, null, investment));
            }
            allocation.setAmount(allocation.getAmount().add(data.amount()));
            allocationRepository.save(allocation);
        } else if (data.accountId() != null || data.investmentId() != null) {
            throw new BusinessRuleException("Meta numérica não aceita fonte monetária.");
        }

        goal.setCurrentValue(goal.getCurrentValue().add(data.amount()));
        repository.save(goal);

        GoalHistory history = new GoalHistory();
        history.setGoal(goal);
        history.setAmount(data.amount());
        history.setNote(data.note() != null ? data.note() : (goal.getType() == GoalType.MONETARY ? "Aporte financeiro" : "Registro de progresso"));
        history.setDate(now.toLocalDateTime());
        if (allocation != null) history.setAllocationId(allocation.getId());
        historyRepository.save(history);

        log.info("Aporte na meta concluído com sucesso. Novo saldo da meta: {}", goal.getCurrentValue());
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), today.getYear()));
    }

    private static GoalAllocation newAllocation(Goal goal, Account account, Investment investment) {
        GoalAllocation allocation = new GoalAllocation();
        allocation.setGoal(goal);
        allocation.setAccount(account);
        allocation.setInvestment(investment);
        return allocation;
    }

    private static void requireMoney(BigDecimal amount) {
        if (amount == null || amount.scale() > 2 || amount.signum() < 0
                || amount.precision() - amount.scale() > 12) {
            throw new BusinessRuleException("Valor monetário deve ter centavos e até 12 dígitos inteiros.");
        }
    }

    @Transactional(readOnly = true)
    public List<GoalAllocationResponseDTO> listAllocations(UUID goalId, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Meta não encontrada");
        }
        List<GoalAllocation> all = allocationRepository.findAllOwnedWithSources(user.getId());
        Map<UUID, BigDecimal> byAccount = new HashMap<>();
        Map<UUID, BigDecimal> byInvestment = new HashMap<>();
        for (GoalAllocation allocation : all) {
            if (allocation.getAccount() != null) {
                byAccount.merge(allocation.getAccount().getId(), allocation.getAmount(), BigDecimal::add);
            } else {
                byInvestment.merge(allocation.getInvestment().getId(), allocation.getAmount(), BigDecimal::add);
            }
        }
        return all.stream().filter(a -> a.getGoal().getId().equals(goalId)).map(a -> {
            UUID accountId = a.getAccount() == null ? null : a.getAccount().getId();
            UUID investmentId = a.getInvestment() == null ? null : a.getInvestment().getId();
            BigDecimal value = accountId != null ? a.getAccount().getBalance() : a.getInvestment().getTotalValue();
            BigDecimal total = accountId != null ? byAccount.get(accountId) : byInvestment.get(investmentId);
            BigDecimal free = value == null ? null : value.subtract(total).max(BigDecimal.ZERO);
            BigDecimal deficit = value == null ? null : total.subtract(value.max(BigDecimal.ZERO)).max(BigDecimal.ZERO);
            return new GoalAllocationResponseDTO(a.getId(), accountId, investmentId,
                    a.getAmount(), value, total, free, deficit);
        }).toList();
    }

    @Transactional
    public void setAllocation(UUID goalId, SetGoalAllocationDTO data, User user) {
        Goal goal = ownedMonetaryGoal(goalId, user);
        requireMoney(data.amount());
        requireOneSource(data.accountId(), data.investmentId());
        Account account = data.accountId() == null ? null : accountRepository
                .findOwnedForAllocation(data.accountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        Investment investment = data.investmentId() == null ? null : investmentRepository
                .findOwnedForAllocation(data.investmentId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));
        GoalAllocation allocation = account != null
                ? allocationRepository.findByGoalIdAndAccountId(goalId, account.getId()).orElse(null)
                : allocationRepository.findByGoalIdAndInvestmentId(goalId, investment.getId()).orElse(null);
        BigDecimal previous = allocation == null ? BigDecimal.ZERO : allocation.getAmount();
        BigDecimal delta = data.amount().subtract(previous);
        if (delta.signum() == 0) return;
        if (delta.signum() > 0) ensureCapacity(account, investment, delta);
        if (allocation == null) allocation = newAllocation(goal, account, investment);
        allocation.setAmount(data.amount());
        allocationRepository.save(allocation);
        goal.setCurrentValue(goal.getCurrentValue().add(delta));
        repository.save(goal);
        recordAllocationChange(goal, allocation.getId(), delta, "Ajuste de destinação");
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now(clock).getYear()));
    }

    @Transactional
    public void moveAllocation(UUID goalId, MoveGoalAllocationDTO data, User user) {
        Goal goal = ownedMonetaryGoal(goalId, user);
        requireMoney(data.amount());
        if (data.amount().signum() == 0) throw new BusinessRuleException("Valor de movimentação deve ser positivo.");
        requireOneSource(data.accountId(), data.investmentId());
        GoalAllocation source = allocationRepository.findById(data.sourceAllocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Destinação de origem não encontrada"));
        if (!source.getGoal().getId().equals(goalId)) {
            throw new ResourceNotFoundException("Destinação de origem não encontrada");
        }
        UUID sourceAccountId = source.getAccount() == null ? null : source.getAccount().getId();
        UUID sourceInvestmentId = source.getInvestment() == null ? null : source.getInvestment().getId();
        String sourceKey = sourceAccountId != null ? "A" + sourceAccountId : "I" + sourceInvestmentId;
        String destinationKey = data.accountId() != null ? "A" + data.accountId() : "I" + data.investmentId();
        if (sourceKey.equals(destinationKey)) throw new BusinessRuleException("Origem e destino devem ser distintos.");

        // Ordem estável para evitar ciclos de lock entre duas movimentações simultâneas.
        if (sourceKey.compareTo(destinationKey) < 0) {
            lockSource(sourceAccountId, sourceInvestmentId, user);
            lockSource(data.accountId(), data.investmentId(), user);
        } else {
            lockSource(data.accountId(), data.investmentId(), user);
            lockSource(sourceAccountId, sourceInvestmentId, user);
        }
        if (source.getAmount().compareTo(data.amount()) < 0) {
            throw new BusinessRuleException("Destinação de origem insuficiente.");
        }
        Account destinationAccount = data.accountId() == null ? null : accountRepository.findById(data.accountId()).orElseThrow();
        Investment destinationInvestment = data.investmentId() == null ? null : investmentRepository.findById(data.investmentId()).orElseThrow();
        ensureCapacity(destinationAccount, destinationInvestment, data.amount());
        GoalAllocation destination = destinationAccount != null
                ? allocationRepository.findByGoalIdAndAccountId(goalId, destinationAccount.getId()).orElseGet(
                        () -> newAllocation(goal, destinationAccount, null))
                : allocationRepository.findByGoalIdAndInvestmentId(goalId, destinationInvestment.getId()).orElseGet(
                        () -> newAllocation(goal, null, destinationInvestment));
        source.setAmount(source.getAmount().subtract(data.amount()));
        destination.setAmount(destination.getAmount().add(data.amount()));
        allocationRepository.save(source);
        allocationRepository.save(destination);
        recordAllocationChange(goal, destination.getId(), BigDecimal.ZERO,
                "Destinação movida de " + sourceKey + " para " + destinationKey);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), LocalDate.now(clock).getYear()));
    }

    private Goal ownedMonetaryGoal(UUID goalId, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));
        if (!goal.getUser().getId().equals(user.getId())) throw new ResourceNotFoundException("Meta não encontrada");
        if (goal.getType() != GoalType.MONETARY || !Boolean.TRUE.equals(goal.getAllocationReconciled())) {
            throw new BusinessRuleException("Meta sem posição monetária reconciliada.");
        }
        return goal;
    }

    private static void requireOneSource(UUID accountId, UUID investmentId) {
        if ((accountId == null) == (investmentId == null)) {
            throw new BusinessRuleException("Informe exatamente uma fonte.");
        }
    }

    private void lockSource(UUID accountId, UUID investmentId, User user) {
        if (accountId != null) accountRepository.findOwnedForAllocation(accountId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        else investmentRepository.findOwnedForAllocation(investmentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));
    }

    private void ensureCapacity(Account account, Investment investment, BigDecimal increase) {
        if (account != null) account.requireActive();
        BigDecimal value = account != null ? account.getBalance() : investment.getTotalValue();
        if (value == null) throw new BusinessRuleException("Avaliação da fonte indisponível.");
        BigDecimal allocated = account != null ? allocationRepository.sumByAccountId(account.getId())
                : allocationRepository.sumByInvestmentId(investment.getId());
        if (value.max(BigDecimal.ZERO).subtract(allocated).compareTo(increase) < 0) {
            throw new BusinessRuleException("Disponível da fonte insuficiente para destinação.");
        }
    }

    private void recordAllocationChange(Goal goal, UUID allocationId, BigDecimal delta, String note) {
        GoalHistory change = new GoalHistory();
        change.setGoal(goal);
        change.setAllocationId(allocationId);
        change.setAmount(delta);
        change.setNote(note);
        change.setDate(ZonedDateTime.now(clock).toLocalDateTime());
        historyRepository.save(change);
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
        LocalDate today = LocalDate.now(clock);
        Goal goal = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }
        if (targetAccountId != null) {
            throw new BusinessRuleException("Excluir meta libera destinação sem transferir dinheiro; não informe conta de estorno.");
        }
        // A meta é uma intenção. Suas compras e seus fluxos bancários permanecem.
        historyRepository.deleteAll(historyRepository.findByGoalIdOrderByDateDesc(id));
        historyRepository.flush();
        allocationRepository.deleteAll(allocationRepository.findAllByGoalId(id));
        allocationRepository.flush();
        repository.delete(goal);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), today.getYear()));
    }

    @Transactional
    public void deleteHistory(UUID historyId, UUID targetAccountId, User user) {
        LocalDate today = LocalDate.now(clock);
        GoalHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("Registro não encontrado"));
        Goal goal = history.getGoal();
        if (!goal.getUser().getId().equals(user.getId())) {
            throw new BusinessRuleException("Acesso negado");
        }
        if (targetAccountId != null) {
            throw new BusinessRuleException("Desfazer destinação não credita conta; não informe destino.");
        }
        if (history.getAmount().signum() <= 0) {
            throw new BusinessRuleException("Ajuste/liberação registrada deve ser corrigida por nova destinação, não apagada.");
        }
        if (goal.getType() == GoalType.MONETARY) {
            if (history.getAllocationId() == null || !Boolean.TRUE.equals(goal.getAllocationReconciled())) {
                throw new BusinessRuleException("Histórico monetário legado exige reconciliação explícita.");
            }
            GoalAllocation allocation = allocationRepository.findById(history.getAllocationId())
                    .orElseThrow(() -> new BusinessRuleException("Destinação já liberada ou consumida."));
            if (!allocation.getGoal().getId().equals(goal.getId())
                    || allocation.getAmount().compareTo(history.getAmount()) < 0) {
                throw new BusinessRuleException("Destinação disponível insuficiente para desfazer este registro.");
            }
            allocation.setAmount(allocation.getAmount().subtract(history.getAmount()));
            allocationRepository.save(allocation);
        }
        if (goal.getCurrentValue().compareTo(history.getAmount()) < 0) {
            throw new BusinessRuleException("Progresso insuficiente para desfazer este registro.");
        }
        goal.setCurrentValue(goal.getCurrentValue().subtract(history.getAmount()));
        repository.save(goal);
        historyRepository.delete(history);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), today.getYear()));
    }

    @Transactional
    public GoalItemResponseDTO addItem(UUID goalId, CreateGoalItemDTO data, User user) {
        Goal goal = repository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");
        requireMoney(data.estimatedPrice());
        if (data.estimatedPrice().signum() == 0) throw new BusinessRuleException("Estimativa deve ser positiva.");

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
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        GoalItem item = itemRepository.findById(itemId).orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
        Goal goal = item.getGoal();

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");
        if (item.getStatus() != GoalItemStatus.PENDING) throw new BusinessRuleException("Este item já foi comprado ou estornado.");
        requireMoney(data.paidPrice());
        if (data.paidPrice().signum() == 0 || (data.accountId() != null && data.cardId() != null)) {
            throw new BusinessRuleException("Informe valor positivo e uma única fonte de pagamento.");
        }

        BigDecimal diferenca = data.paidPrice().subtract(item.getEstimatedPrice());
        goal.setTargetValue(goal.getTargetValue().add(diferenca));

        if (data.accountId() != null) {
            Account account = accountRepository.findOwnedForAllocation(data.accountId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conta de pagamento não encontrada"));
            BigDecimal reserved = allocationRepository.sumByAccountId(account.getId());
            if (data.allocationId() != null) {
                GoalAllocation allocation = allocationRepository.findById(data.allocationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Destinação não encontrada"));
                if (!allocation.getGoal().getId().equals(goal.getId()) || allocation.getAccount() == null
                        || !allocation.getAccount().getId().equals(account.getId())
                        || allocation.getAmount().compareTo(data.paidPrice()) < 0) {
                    throw new BusinessRuleException("Destinação insuficiente ou vinculada a outra fonte/meta.");
                }
                allocation.setAmount(allocation.getAmount().subtract(data.paidPrice()));
                allocationRepository.save(allocation);
                goal.setCurrentValue(goal.getCurrentValue().subtract(data.paidPrice()));
                item.setAllocationId(allocation.getId());
                item.setUsedGoalBalance(true);
            } else if (account.getBalance().subtract(reserved).compareTo(data.paidPrice()) < 0) {
                throw new BusinessRuleException("Disponível livre da conta insuficiente.");
            }
            if (account.getBalance().compareTo(data.paidPrice()) < 0) {
                throw new BusinessRuleException("Saldo da conta insuficiente.");
            }

            account.debit(data.paidPrice());
            accountRepository.save(account);

            Transaction tx = new Transaction();
            tx.setDescription("Compra Meta: " + item.getName());
            tx.setAmount(data.paidPrice());
            tx.setDate(today);
            tx.setCreatedAt(now.toLocalDateTime());
            tx.captureTemporal(null, now.toInstant(), tx.getCreatedAt());
            tx.setType(TransactionType.EXPENSE);
            tx.setOrigin(TransactionOrigin.GOAL_PURCHASE);
            tx.setGoalItemId(item.getId());
            tx.setAccount(account);
            tx.setPaid(true);
            tx.setUser(user);
            tx.setSystemManaged(true);
            Category catMeta = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName()).orElse(null);
            tx.setCategory(catMeta);

            Transaction savedTx = transactionRepository.save(tx);
            item.setBankTransactionId(savedTx.getId());
            if (data.allocationId() == null) item.setUsedGoalBalance(false);

        } else if (data.cardId() != null) {
            if (data.allocationId() != null) {
                throw new BusinessRuleException("Compra no cartão não consome destinação de conta.");
            }
            Category cat = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.METAS.getName())
                    .orElseThrow(() -> new BusinessRuleException("Categoria de Metas não encontrada."));

            int parcelas = (data.installments() != null && data.installments() > 0) ? data.installments() : 1;

            CreateCardTransactionDTO cardTx = new CreateCardTransactionDTO(
                    "Compra Meta: " + item.getName(),
                    data.paidPrice(),
                    today,
                    now.toLocalTime().toString(),
                    cat.getId(),
                    data.cardId(),
                    parcelas
            );

            UUID transactionId = creditCardService.createTransaction(cardTx, user);
            item.setCardTransactionId(transactionId);
            item.setUsedGoalBalance(false);

        } else {
            throw new BusinessRuleException("Compra exige conta ou cartão real; destinação não é custódia.");
        }

        item.setPaidPrice(data.paidPrice());
        item.setStatus(GoalItemStatus.PURCHASED);

        repository.save(goal);
        GoalItem savedItem = itemRepository.save(item);

        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), today.getYear()));

        return new GoalItemResponseDTO(savedItem);
    }

    @Transactional
    public void deleteItem(UUID itemId, User user) {
        LocalDate today = LocalDate.now(clock);
        GoalItem item = itemRepository.findById(itemId).orElseThrow();
        Goal goal = item.getGoal();

        if (!goal.getUser().getId().equals(user.getId())) throw new BusinessRuleException("Acesso negado");

        BigDecimal contribution = item.getPaidPrice() == null ? item.getEstimatedPrice() : item.getPaidPrice();
        goal.setTargetValue(goal.getTargetValue().subtract(contribution));
        if (goal.getTargetValue().compareTo(BigDecimal.ZERO) < 0) goal.setTargetValue(BigDecimal.ZERO);
        // Exclusão do checklist não cancela a compra já realizada.
        repository.save(goal);
        itemRepository.delete(item);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), today.getYear()));
    }

    @Transactional
    public void refundItem(UUID itemId, User user) {
        ZonedDateTime now = ZonedDateTime.now(clock);
        GoalItem item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            // A intenção pode ter sido excluída antes de o lojista reembolsar.
            Transaction purchase = transactionRepository.findGoalPurchase(itemId, user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Compra de item não encontrada"));
            refundBankPurchase(purchase.getId(), "Reembolso: " + purchase.getDescription(), user, now);
            eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), now.getYear()));
            return;
        }
        if (!item.getGoal().getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Item não encontrado");
        }
        if (item.getStatus() != GoalItemStatus.PURCHASED) {
            throw new BusinessRuleException("Compra já estornada ou ainda não realizada.");
        }
        if (item.getBankTransactionId() != null) {
            refundBankPurchase(item.getBankTransactionId(), "Reembolso Compra Meta: " + item.getName(), user, now);
        } else if (item.getCardTransactionId() != null) {
            creditCardService.refundPurchase(item.getCardTransactionId(), item.getPaidPrice(), now.toLocalDate(), null, user);
        } else {
            throw new BusinessRuleException("Compra sem origem financeira comprovada requer conciliação.");
        }
        item.setStatus(GoalItemStatus.REFUNDED);
        itemRepository.save(item);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), now.getYear()));
    }

    private void refundBankPurchase(UUID transactionId, String description, User user, ZonedDateTime now) {
        Transaction original = transactionRepository.findOwnedForUpdate(transactionId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Compra bancária não encontrada"));
        if (original.getStatus() != TransactionStatus.SETTLED
                || transactionRepository.existsByReversalOfId(original.getId())) {
            throw new BusinessRuleException("Compra já estornada.");
        }
        Account account = accountRepository.findOwnedForAllocation(original.getAccount().getId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta da compra não encontrada"));
        account.credit(original.getAmount());
        accountRepository.save(account);
        original.markReversed();
        transactionRepository.save(original);

        Transaction reversal = new Transaction();
        reversal.setDescription(description);
        reversal.setAmount(original.getAmount());
        reversal.setDate(now.toLocalDate());
        reversal.setCreatedAt(now.toLocalDateTime());
        reversal.captureTemporal(null, now.toInstant(), reversal.getCreatedAt());
        reversal.setType(TransactionType.EXPENSE);
        reversal.setPaid(true);
        reversal.setOrigin(TransactionOrigin.REVERSAL);
        reversal.setReversalOfId(original.getId());
        reversal.setAccount(account);
        reversal.setCategory(original.getCategory());
        reversal.setUser(user);
        reversal.setSystemManaged(true);
        transactionRepository.save(reversal);
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
