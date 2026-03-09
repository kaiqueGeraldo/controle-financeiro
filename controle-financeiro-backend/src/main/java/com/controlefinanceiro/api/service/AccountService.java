package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.dto.AccountResponseDTO;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.account.dto.UpdateAccountDTO;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AccountService {

    @Autowired
    private AccountRepository repository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional
    public AccountResponseDTO create(CreateAccountDTO data, User user) {
        log.info("Criando nova conta para o usuário {}", user.getId());

        Account newAccount = new Account();
        newAccount.setName(data.name());
        newAccount.setType(data.type());
        newAccount.setColor(data.color());
        newAccount.setUser(user);

        BigDecimal initialBalance = data.initialBalance() != null ? data.initialBalance() : BigDecimal.ZERO;
        newAccount.setBalance(initialBalance);

        Account savedAccount = repository.save(newAccount);

        if (initialBalance.compareTo(BigDecimal.ZERO) > 0) {
            log.info("Gerando transação de ajuste para saldo inicial da conta {}", savedAccount.getId());

            Transaction initialTx = new Transaction();
            initialTx.setDescription("Saldo Inicial - " + savedAccount.getName());
            initialTx.setAmount(initialBalance);
            initialTx.setType(TransactionType.INCOME);
            initialTx.setDate(LocalDate.now());
            initialTx.setCreatedAt(LocalDateTime.now());
            initialTx.setPaid(true);
            initialTx.setAccount(savedAccount);
            initialTx.setUser(user);
            initialTx.setSystemManaged(true);

            Category catAjuste = categoryRepository.findByUserIdAndName(user.getId(), DefaultCategory.AJUSTE_SALDO.getName()).orElse(null);
            initialTx.setCategory(catAjuste);

            transactionRepository.save(initialTx);
        }

        return new AccountResponseDTO(savedAccount);
    }

    public List<AccountResponseDTO> listAll(User user) {
        return repository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(user.getId())
                .stream()
                .map(AccountResponseDTO::new)
                .toList();
    }

    public Account findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> {
            log.warn("Busca por conta inexistente: ID {}", id);
            return new ResourceNotFoundException("Conta não encontrada");
        });
    }

    public AccountResponseDTO update(UUID id, UpdateAccountDTO data, User user) {
        log.info("Atualizando dados da conta ID {}", id);
        Account account = findById(id);

        if (!account.getUser().getId().equals(user.getId())) {
            log.error("Acesso negado: Usuário {} tentou alterar conta {}", user.getId(), id);
            throw new BusinessRuleException("Acesso negado");
        }

        account.setName(data.name());
        account.setType(data.type());
        account.setColor(data.color());

        Account updatedAccount = repository.save(account);
        return new AccountResponseDTO(updatedAccount);
    }

    @Transactional
    public void delete(UUID id, User user) {
        log.info("Solicitação de exclusão (arquivamento) da conta ID {}", id);
        Account account = findById(id);

        if (!account.getUser().getId().equals(user.getId())) {
            log.error("Acesso negado no arquivamento: Usuário {} -> Conta {}", user.getId(), id);
            throw new BusinessRuleException("Acesso negado");
        }

        if (account.isArchived()) {
            throw new BusinessRuleException("Esta conta já se encontra arquivada.");
        }

        account.setArchived(true);
        repository.save(account);

        log.info("Conta arquivada com sucesso. Histórico preservado.");
    }

    @Transactional
    public void reorder(List<UUID> orderedIds, User user) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Account account = repository.findById(orderedIds.get(i)).orElse(null);
            if (account != null && account.getUser().getId().equals(user.getId())) {
                account.setOrderIndex(i);
                repository.save(account);
            }
        }
    }
}