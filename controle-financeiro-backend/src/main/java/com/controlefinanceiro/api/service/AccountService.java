package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.account.OpeningBalanceOrigin;
import com.controlefinanceiro.api.domain.account.dto.AccountResponseDTO;
import com.controlefinanceiro.api.domain.account.dto.CreateAccountDTO;
import com.controlefinanceiro.api.domain.account.dto.UpdateAccountDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AccountService {

    @Autowired
    private AccountRepository repository;

    @Autowired
    private Clock clock;

    @Transactional
    public AccountResponseDTO create(CreateAccountDTO data, User user) {
        log.info("Criando nova conta para o usuário {}", user.getId());

        Account newAccount = new Account();
        newAccount.setName(data.name());
        newAccount.setType(data.type());
        newAccount.setColor(data.color());
        newAccount.setUser(user);

        BigDecimal initialBalance = data.initialBalance() != null ? data.initialBalance() : BigDecimal.ZERO;
        validateOpeningBalance(initialBalance);
        ZonedDateTime now = ZonedDateTime.now(clock);
        LocalDate openingDate = data.openingDate() != null ? data.openingDate() : now.toLocalDate();
        if (openingDate.isAfter(now.toLocalDate())) {
            throw new BusinessRuleException("A data-base da abertura não pode estar no futuro.");
        }
        newAccount.setBalance(initialBalance);
        newAccount.setOpeningBalance(initialBalance);
        newAccount.setOpeningDate(openingDate);
        newAccount.setOpeningOrigin(OpeningBalanceOrigin.USER_PROVIDED);
        newAccount.setOpeningRecordedAt(now.toInstant());

        Account savedAccount = repository.save(newAccount);

        return new AccountResponseDTO(savedAccount);
    }

    private void validateOpeningBalance(BigDecimal value) {
        try {
            value.setScale(2, java.math.RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new BusinessRuleException("O saldo inicial deve ter no máximo duas casas decimais.");
        }
        if (value.abs().compareTo(new BigDecimal("999999999999.99")) > 0) {
            throw new BusinessRuleException("O saldo inicial excede o limite monetário.");
        }
    }

    public List<AccountResponseDTO> listAll(User user) {
        return repository.findAllByUserIdAndIsArchivedFalseOrderByOrderIndexAsc(user.getId())
                .stream()
                .map(AccountResponseDTO::new)
                .toList();
    }

    @Transactional(readOnly=true)
    public com.controlefinanceiro.api.domain.account.dto.AccountPositionDTO position(User user) {
        var rows=repository.findAllByUserIdOrderByOrderIndexAsc(user.getId());
        BigDecimal total=BigDecimal.ZERO,checking=BigDecimal.ZERO,archived=BigDecimal.ZERO;
        for(var row:rows) {
            total=total.add(row.getBalance());
            if(row.getType()==com.controlefinanceiro.api.domain.account.AccountType.CHECKING || row.getType()==com.controlefinanceiro.api.domain.account.AccountType.CASH) checking=checking.add(row.getBalance());
            if(row.isArchived())archived=archived.add(row.getBalance());
        }
        var maximum=new BigDecimal("999999999999.99");
        boolean outside=total.abs().compareTo(maximum)>0 || checking.abs().compareTo(maximum)>0 || archived.abs().compareTo(maximum)>0;
        return new com.controlefinanceiro.api.domain.account.dto.AccountPositionDTO(LocalDate.now(clock),total.toPlainString(),checking.toPlainString(),archived.toPlainString(),outside,rows.stream().map(AccountResponseDTO::new).toList());
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
        Account account = repository.findOwnedForAllocation(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));

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
