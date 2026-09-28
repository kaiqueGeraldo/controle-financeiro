package com.controlefinanceiro.api.service.listener;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.card.CardPaymentRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.InvoicePaymentRequestedEvent;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.service.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import java.util.List;

@Slf4j
@Component
public class InvoiceBankOperationListener {

    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CardPaymentRepository paymentRepository;

    @EventListener
    public void onInvoicePaymentRequested(InvoicePaymentRequestedEvent event) {
        log.info("LISTENER: Processando débito bancário para pagamento do cartão {}", event.card().getName());

        Account account = accountRepository.findAllByIdForTransfer(List.of(event.accountId()), event.user().getId())
                .stream().findFirst().orElseThrow(() -> new ResourceNotFoundException("Conta de origem não encontrada"));

        account.debit(event.amount());
        accountRepository.save(account);

        Transaction bankTransaction = new Transaction();
        bankTransaction.setDescription(event.description() != null ? event.description() : "Pagamento Fatura " + event.card().getName());
        bankTransaction.setAmount(event.amount());
        bankTransaction.setDate(event.date());

        bankTransaction.setCreatedAt(event.date().atTime(event.time()));
        bankTransaction.captureTemporal(event.informedTime(), event.recordedAt(), bankTransaction.getCreatedAt());

        bankTransaction.setType(TransactionType.EXPENSE);
        bankTransaction.setAccount(account);
        bankTransaction.setPaid(true);
        bankTransaction.setUser(event.user());
        bankTransaction.setSystemManaged(true);
        bankTransaction.setOrigin(TransactionOrigin.INVOICE_PAYMENT);
        Category catFatura = categoryRepository.findByUserIdAndName(event.user().getId(), DefaultCategory.PAGAMENTO_FATURA.getName())
                .orElse(null);
        bankTransaction.setCategory(catFatura);

        bankTransaction = transactionRepository.save(bankTransaction);
        event.payment().setBankTransactionId(bankTransaction.getId());
        paymentRepository.save(event.payment());
    }
}
