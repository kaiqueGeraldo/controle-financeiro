package com.controlefinanceiro.api.service.listener;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.InvoicePaymentRequestedEvent;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.service.exception.BusinessRuleException;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import com.controlefinanceiro.api.utils.DateUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

@Slf4j
@Component
public class InvoiceBankOperationListener {

    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private CategoryRepository categoryRepository;

    @EventListener
    public void onInvoicePaymentRequested(InvoicePaymentRequestedEvent event) {
        log.info("LISTENER: Processando débito bancário para pagamento do cartão {}", event.card().getName());

        Account account = accountRepository.findById(event.accountId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta de origem não encontrada"));

        if (!account.getUser().getId().equals(event.user().getId())) {
            throw new BusinessRuleException("A conta de origem não pertence ao usuário");
        }

        if (account.getBalance().compareTo(event.amount()) < 0) {
            throw new BusinessRuleException("Saldo insuficiente na conta para realizar o pagamento.");
        }

        account.debit(event.amount());
        accountRepository.save(account);

        Transaction bankTransaction = new Transaction();
        bankTransaction.setDescription(event.description() != null ? event.description() : "Pagamento Fatura " + event.card().getName());
        bankTransaction.setAmount(event.amount());
        bankTransaction.setDate(event.date());

        LocalTime time = DateUtil.getTimeOrDefault(event.time());
        bankTransaction.setCreatedAt(event.date().atTime(time));

        bankTransaction.setType(TransactionType.EXPENSE);
        bankTransaction.setAccount(account);
        bankTransaction.setPaid(true);
        bankTransaction.setUser(event.user());
        bankTransaction.setSystemManaged(true);
        Category catFatura = categoryRepository.findByUserIdAndName(event.user().getId(), DefaultCategory.PAGAMENTO_FATURA.getName())
                .orElse(null);
        bankTransaction.setCategory(catFatura);

        transactionRepository.save(bankTransaction);
    }
}