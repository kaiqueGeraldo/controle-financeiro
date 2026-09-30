package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.Account;
import com.controlefinanceiro.api.domain.account.AccountRepository;
import com.controlefinanceiro.api.domain.category.Category;
import com.controlefinanceiro.api.domain.category.CategoryRepository;
import com.controlefinanceiro.api.domain.category.DefaultCategory;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.goal.Goal;
import com.controlefinanceiro.api.domain.goal.GoalAllocationRepository;
import com.controlefinanceiro.api.domain.goal.GoalRepository;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.CreateInvestmentDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentOperationDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestmentResponseDTO;
import com.controlefinanceiro.api.domain.investment.dto.InvestTransactionResponseDTO;
import com.controlefinanceiro.api.domain.investment.dto.UpdateBalanceDTO;
import com.controlefinanceiro.api.domain.transaction.Transaction;
import com.controlefinanceiro.api.domain.transaction.TransactionRepository;
import com.controlefinanceiro.api.domain.transaction.TransactionType;
import com.controlefinanceiro.api.domain.transaction.TransactionOrigin;
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
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
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
    @Autowired private GoalAllocationRepository allocationRepository;
    @Autowired private ApplicationEventPublisher eventPublisher;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private Clock clock;
    @Autowired private InvestmentValuationRepository valuationRepository;

    public List<InvestmentResponseDTO> listAll(User user) {
        return investmentRepository.findAllByUserId(user.getId())
                .stream()
                .map(InvestmentResponseDTO::new)
                .toList();
    }

    public List<InvestTransactionResponseDTO> getHistory(UUID investmentId, User user) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        if (!investment.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Investimento não encontrado");
        }

        return investTransactionRepository.findHistory(investmentId)
                .stream()
                .map(InvestTransactionResponseDTO::new)
                .toList();
    }

    @Transactional
    public InvestmentResponseDTO create(CreateInvestmentDTO data, User user) {
        log.info("SERVICE: Iniciando criação de ativo '{}' ({}) para usuário {}", data.ticker(), data.type(), user.getEmail());

        Investment investment = new Investment();
        investment.setReportingKnownFrom(LocalDate.now(clock));
        investment.setTicker(data.ticker().toUpperCase());
        investment.setName(data.name());
        investment.setType(data.type());
        investment.setUser(user);

        BigDecimal quantity = data.openingQuantity() == null ? BigDecimal.ZERO : data.openingQuantity();
        requireQuantity(quantity, false);
        if (data.openingCost() != null) requireMoney(data.openingCost(), false);
        if (data.openingValue() != null) requireMoney(data.openingValue(), false);
        if (quantity.signum() == 0 && ((data.openingCost() != null && data.openingCost().signum() != 0)
                || (data.openingValue() != null && data.openingValue().signum() != 0))) {
            throw new BusinessRuleException("Posição sem quantidade não pode ter custo ou valor positivo.");
        }
        if (data.openingValue() != null && (data.valuationDate() == null
                || data.valuationSource() == null || data.valuationSource().isBlank())) {
            throw new BusinessRuleException("Avaliação inicial exige data e origem.");
        }
        investment.setQuantity(quantity);
        investment.setTotalCost(data.openingCost() != null ? data.openingCost()
                : quantity.signum() == 0 ? BigDecimal.ZERO : null);
        if (data.openingValue() != null) {
            investment.evaluateTotal(data.openingValue(), data.valuationDate(), data.valuationSource());
        }

        if (data.goalId() != null) {
            log.info("SERVICE: Vinculando ativo '{}' à Meta ID {}", data.ticker(), data.goalId());
            Goal goal = goalRepository.findById(data.goalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada"));

            if (!goal.getUser().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Meta não encontrada");
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
        ZonedDateTime now = ZonedDateTime.now(clock);

        // Same global source order as allocation moves: account before investment.
        Account account = accountRepository.findOwnedForAllocation(data.accountId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Conta não encontrada"));
        account.requireActive();
        Investment investment = investmentRepository.findOwnedForAllocation(data.investmentId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));

        boolean monetaryRedemption = data.amount() != null;
        if (monetaryRedemption) {
            if (data.type() != InvestTransType.SELL || (investment.getType() != InvestType.FIXED_INCOME
                    && investment.getType() != InvestType.TREASURY))
                throw new BusinessRuleException("Resgate monetário exige posição de renda fixa.");
            requireMoney(data.amount(), true);
            BigDecimal value = investment.getValuationAmount();
            if (value == null || value.signum() <= 0 || data.amount().compareTo(value) > 0)
                throw new BusinessRuleException("Avaliação insuficiente ou desconhecida para resgate.");
            BigDecimal units = data.amount().compareTo(value) == 0 ? investment.getQuantity()
                    : investment.getQuantity().multiply(data.amount()).divide(value, 8, RoundingMode.HALF_UP);
            requireQuantity(units, true);
            if (data.amount().compareTo(value) < 0 && units.compareTo(investment.getQuantity()) >= 0)
                throw new BusinessRuleException("Resgate parcial não representável na precisão de quantidade; informe um valor menor ou o resgate total.");
            // The monetary command is authoritative; price is descriptive for the receipt.
            data = new InvestmentOperationDTO(data.investmentId(),data.type(),units,
                    data.amount().divide(units,8,RoundingMode.HALF_UP),data.fees(),data.date(),data.accountId(),data.amount());
        }
        requireQuantity(data.quantity(), true);
        if (!monetaryRedemption) requirePrice(data.price());
        BigDecimal fees = data.fees() == null ? BigDecimal.ZERO : data.fees();
        requireMoney(fees, false);
        BigDecimal gross = monetaryRedemption ? data.amount() : data.quantity().multiply(data.price()).setScale(2, RoundingMode.HALF_UP);
        requireMoney(gross, true);
        if (fees.compareTo(gross) > 0 && data.type() != InvestTransType.BUY) {
            throw new BusinessRuleException("Taxa não pode exceder o bruto da operação.");
        }

        if (investment.getReplayQuantity() == null) {
            investment.setReplayQuantity(investment.getQuantity());
            investment.setReplayCost(investment.getTotalCost());
        }
        BigDecimal beforeQuantity = investment.getQuantity();
        BigDecimal beforeValue = investment.getValuationAmount();
        InvestTransaction recorded = switch (data.type()) {
            case BUY -> processBuy(investment, data, account, user, now, gross, fees);
            case SELL -> processSell(investment, data, account, user, now, gross, fees);
            case DIVIDEND, INTEREST -> processDividend(investment, data, account, user, now, gross, fees);
        };

        recorded.setBeforeQuantity(beforeQuantity);
        recorded.setBeforeValue(beforeValue);
        recorded.setMonetaryAmount(data.amount());
        recorded.setAccountId(account.getId());
        recorded.setRecordedAt(now.toInstant());
        investment.setOperationSequence(investment.getOperationSequence() + 1);
        recorded.setSequenceNumber(investment.getOperationSequence());
        investmentRepository.save(investment);

        log.info("SERVICE: Operação finalizada com sucesso.");
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), data.date().getYear()));
    }

    private InvestTransaction processBuy(Investment investment, InvestmentOperationDTO data, Account account,
                            User user, ZonedDateTime now, BigDecimal gross, BigDecimal fees) {
        if (investment.getQuantity().signum() > 0 && investment.getTotalCost() == null) {
            throw new BusinessRuleException("Custo da posição legada requer reconciliação antes de nova compra.");
        }
        BigDecimal currentCost = investment.getTotalCost() == null ? BigDecimal.ZERO : investment.getTotalCost();
        BigDecimal totalCost = gross.add(fees);
        requireMoney(totalCost, true);
        BigDecimal free = account.getBalance().subtract(allocationRepository.sumByAccountId(account.getId()));
        if (free.compareTo(totalCost) < 0) {
            throw new BusinessRuleException("Disponível livre da conta insuficiente para investimento.");
        }
        account.debit(totalCost);
        accountRepository.save(account);
        Transaction bankTx = createBankTransaction(account, totalCost, TransactionType.EXPENSE,
                "Aporte: " + investment.getTicker(), user, DefaultCategory.APORTE_INVESTIMENTO.getName(), data.date(), now,
                TransactionOrigin.INVESTMENT_BUY);
        BigDecimal newQuantity = investment.getQuantity().add(data.quantity());
        BigDecimal newCost = currentCost.add(totalCost);
        requireQuantity(newQuantity, false);
        requireMoney(newCost, false);
        investment.setQuantityAndCost(newQuantity, newCost);
        investment.resizeValuation();
        return createInvestTransaction(investment, InvestTransType.BUY, data, bankTx, gross, totalCost, null);
    }

    private InvestTransaction processSell(Investment investment, InvestmentOperationDTO data, Account account,
                             User user, ZonedDateTime now, BigDecimal gross, BigDecimal fees) {
        log.info("SERVICE: Executando lógica de VENDA.");

        if (investment.getQuantity().compareTo(data.quantity()) < 0) {
            throw new BusinessRuleException("Quantidade insuficiente de ativos para venda.");
        }

        BigDecimal netValue = gross.subtract(fees);
        BigDecimal newQuantity = investment.getQuantity().subtract(data.quantity());
        BigDecimal costRemoved = null;
        BigDecimal result = null;
        if (investment.getTotalCost() != null) {
            costRemoved = newQuantity.signum() == 0 ? investment.getTotalCost()
                    : data.amount() != null ? investment.getTotalCost().multiply(data.amount())
                            .divide(investment.getValuationAmount(), 2, RoundingMode.HALF_UP)
                    : investment.getTotalCost().multiply(data.quantity()).divide(investment.getQuantity(), 2, RoundingMode.HALF_UP);
            result = netValue.subtract(costRemoved);
        }
        BigDecimal remainingValue = data.amount() != null ? investment.getValuationAmount().subtract(data.amount())
                : investment.valueForQuantity(newQuantity);
        BigDecimal reserved = allocationRepository.sumByInvestmentId(investment.getId());
        if (reserved.signum() > 0 && (remainingValue == null || remainingValue.compareTo(reserved) < 0)) {
            throw new BusinessRuleException("Venda exige liberação ou realocação da destinação do investimento.");
        }
        Transaction bankTx = null;
        if (netValue.signum() > 0) {
            account.credit(netValue);
            accountRepository.save(account);
            bankTx = createBankTransaction(account, netValue, TransactionType.INCOME,
                    "Resgate: " + investment.getTicker(), user, DefaultCategory.RESGATE_INVESTIMENTO.getName(), data.date(), now,
                    TransactionOrigin.INVESTMENT_SELL);
        }
        investment.setQuantityAndCost(newQuantity,
                costRemoved == null ? null : investment.getTotalCost().subtract(costRemoved));
        investment.resizeValuation();
        if (data.amount() != null) investment.evaluateTotal(remainingValue, investment.getValuationDate(), investment.getValuationSource());
        return createInvestTransaction(investment, InvestTransType.SELL, data, bankTx, gross, costRemoved, result);
    }

    private InvestTransaction processDividend(Investment investment, InvestmentOperationDTO data, Account account,
                                 User user, ZonedDateTime now, BigDecimal gross, BigDecimal fees) {
        BigDecimal net = gross.subtract(fees);
        if (net.signum() > 0) {
            account.credit(net);
            accountRepository.save(account);
        }
        Transaction income = createBankTransaction(account, gross, TransactionType.INCOME,
                "Proventos: " + investment.getTicker(), user, DefaultCategory.RESGATE_INVESTIMENTO.getName(), data.date(), now,
                TransactionOrigin.INVESTMENT_DIVIDEND);
        income.setCashAmount(net);
        transactionRepository.save(income);
        UUID withholdingId = null;
        if (fees.signum() > 0) {
            Transaction withholding = createBankTransaction(account, fees, TransactionType.EXPENSE,
                    "Retenção de proventos: " + investment.getTicker(), user, DefaultCategory.APORTE_INVESTIMENTO.getName(), data.date(), now,
                    TransactionOrigin.INVESTMENT_FEE);
            withholding.setCashAmount(BigDecimal.ZERO);
            transactionRepository.save(withholding);
            withholdingId = withholding.getId();
        }
        InvestTransaction recorded = createInvestTransaction(investment, data.type(), data, income, gross, null, null);
        recorded.setWithholdingTransactionId(withholdingId);
        return recorded;
    }

    @Transactional
    public void updateBalance(UpdateBalanceDTO data, User user) {
        ZonedDateTime now = ZonedDateTime.now(clock);
        Investment investment = investmentRepository.findOwnedForAllocation(data.investmentId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));
        requireMoney(data.newBalance(), false);
        if (investment.getQuantity().signum() == 0 && data.newBalance().signum() > 0)
            throw new BusinessRuleException("Posição sem quantidade não pode ter avaliação positiva.");
        if (data.date() == null || data.source() == null || data.source().isBlank()
                || data.reason() == null || data.reason().isBlank() || data.reason().length() > 500 || data.source().length() > 255)
            throw new BusinessRuleException("Avaliação exige data, origem e motivo.");
        investment.evaluateTotal(data.newBalance(), data.date(), data.source());
        InvestmentValuation audit = new InvestmentValuation();
        audit.setInvestmentId(investment.getId()); audit.setAmount(data.newBalance());
        audit.setValuationDate(data.date()); audit.setSource(data.source()); audit.setReason(data.reason());
        audit.setRecordedAt(now.toInstant()); valuationRepository.save(audit);
        investmentRepository.save(investment);
        eventPublisher.publishEvent(new UserFinancialDataChangedEvent(user.getId(), now.getYear()));
    }

    @Transactional
    public void deleteInvestment(UUID id, User user) {
        Investment investment = investmentRepository.findOwnedForAllocation(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Investimento não encontrado"));
        if (investment.getQuantity().signum() != 0 || (investment.getValuationAmount() != null
                && investment.getValuationAmount().signum() != 0)
                || allocationRepository.sumByInvestmentId(id).signum() != 0
                || investTransactionRepository.existsByInvestmentId(id)) {
            throw new BusinessRuleException("Posição ou histórico existente: arquivamento/correção explícita é necessário.");
        }
        investmentRepository.delete(investment);
    }

    @Transactional
    public void deleteTransaction(UUID transactionId, User user) {
        InvestTransaction tx = investTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada"));
        Investment inv = tx.getInvestment();
        if (!inv.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Transação não encontrada");
        }
        throw new BusinessRuleException("Operação realizada exige compensação rastreável; exclusão simples não é permitida.");
    }

    private InvestTransaction createInvestTransaction(Investment investment, InvestTransType type, InvestmentOperationDTO data,
                                         Transaction bankTx, BigDecimal gross, BigDecimal costDelta, BigDecimal realizedResult) {
        InvestTransaction t = new InvestTransaction();
        t.setInvestment(investment);
        t.setType(type);
        t.setDate(data.date().atStartOfDay());
        t.setOperationDate(data.date());
        t.setDateOrigin(com.controlefinanceiro.api.domain.temporal.DateOrigin.USER_INPUT);
        t.setQuantity(data.quantity());
        t.setPrice(data.price());
        t.setFees(data.fees() != null ? data.fees() : BigDecimal.ZERO);
        t.setTotalValue(gross);
        t.setCostDelta(costDelta);
        t.setRealizedResult(realizedResult);
        t.setBankTransaction(bankTx);
        return investTransactionRepository.save(t);
    }

    private static void requireMoney(BigDecimal amount, boolean positive) {
        if (amount == null || (positive ? amount.signum() <= 0 : amount.signum() < 0)
                || amount.scale() > 2 || amount.precision() - amount.scale() > 12) {
            throw new BusinessRuleException("Valor monetário inválido: centavos e até 12 dígitos inteiros.");
        }
    }

    private static void requireQuantity(BigDecimal quantity, boolean positive) {
        if (quantity == null || (positive ? quantity.signum() <= 0 : quantity.signum() < 0)
                || quantity.scale() > 8 || quantity.precision() - quantity.scale() > 12) {
            throw new BusinessRuleException("Quantidade inválida: até oito casas e 12 dígitos inteiros.");
        }
    }

    private static void requirePrice(BigDecimal price) {
        if (price == null || price.signum() <= 0 || price.scale() > 8
                || price.precision() - price.scale() > 12) {
            throw new BusinessRuleException("Preço inválido: até oito casas e 12 dígitos inteiros.");
        }
    }

    private Transaction createBankTransaction(Account account, BigDecimal amount, TransactionType type, String desc,
                                              User user, String categoryName, LocalDate operationDate,
                                              ZonedDateTime now, TransactionOrigin origin) {
        Category category = categoryRepository.findByUserIdAndName(user.getId(), categoryName).orElse(null);
        Transaction t = new Transaction();
        t.setAccount(account);
        t.setAmount(amount);
        t.setType(type);
        t.setDescription(desc);
        t.setDate(operationDate);
        t.setCreatedAt(operationDate.atTime(now.toLocalTime()));
        t.captureTemporal(null, now.toInstant(), t.getCreatedAt());
        t.setPaid(true);
        t.setOrigin(origin);
        t.setUser(user);
        t.setSystemManaged(true);
        t.setCategory(category);
        return transactionRepository.save(t);
    }
}
