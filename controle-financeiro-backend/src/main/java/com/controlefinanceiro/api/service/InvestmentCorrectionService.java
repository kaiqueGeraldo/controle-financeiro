package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.account.*;
import com.controlefinanceiro.api.domain.event.UserFinancialDataChangedEvent;
import com.controlefinanceiro.api.domain.goal.GoalAllocationRepository;
import com.controlefinanceiro.api.domain.investment.*;
import com.controlefinanceiro.api.domain.investment.dto.CorrectInvestmentDTO;
import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Append-only economic corrections. Source locks match purchases: account, investment. */
@Service @RequiredArgsConstructor
public class InvestmentCorrectionService {
    @org.springframework.beans.factory.annotation.Autowired private FinancialInventoryGuard inventoryGuard;
    private final InvestmentRepository investments;
    private final InvestTransactionRepository operations;
    private final InvestmentCorrectionRepository corrections;
    private final AccountRepository accounts;
    private final TransactionRepository transactions;
    private final GoalAllocationRepository allocations;
    private final ApplicationEventPublisher events;
    private final InvestmentCostRevisionRepository costRevisions;
    private final Clock clock;

    @Transactional(readOnly=true)
    public List<InvestmentCorrection> history(UUID id, User user) {
        owned(id,user);
        return corrections.findByInvestmentIdOrderByRecordedAt(id);
    }

    @Transactional
    public InvestmentCorrection correct(UUID id, CorrectInvestmentDTO data, User user) {
        inventoryGuard.writer(user.getId());
        InvestTransaction original=operations.findById(id).orElseThrow(()->new ResourceNotFoundException("Operação não encontrada"));
        owned(original.getInvestment().getId(),user);
        if(original.getAccountId()==null || original.getSequenceNumber()==null)
            throw new BusinessRuleException("Sequência/fonte histórica desconhecida: reconciliação explícita necessária.");
        Account account=accounts.findOwnedForAllocation(original.getAccountId(),user.getId())
            .orElseThrow(()->new ResourceNotFoundException("Fonte não encontrada"));
        Investment investment=investments.findOwnedForAllocation(original.getInvestment().getId(),user.getId()).orElseThrow();
        List<InvestmentCorrection> prior=corrections.findByInvestmentIdOrderByRecordedAt(investment.getId());
        var retry=corrections.findByOperationId(data.operationId());
        if(retry.isPresent()) {
            InvestmentCorrection c=retry.get();
            if(same(c,id,data)) return c;
            throw new BusinessRuleException("Identificador já utilizado com outro conteúdo.");
        }
        if(prior.stream().anyMatch(c->c.getOriginalId().equals(id)))
            throw new BusinessRuleException("Operação já compensada. Consulte a correção registrada.");
        account.requireActive();
        validate(data,original);
        InvestmentCorrection correction=new InvestmentCorrection();
        correction.setInvestmentId(investment.getId()); correction.setOriginalId(id);
        correction.setOperationId(data.operationId()); correction.setAccountId(account.getId());
        correction.setEffectiveDate(data.date()); correction.setReason(data.reason());
        correction.setReturnedFees(data.returnedFees()); correction.setReplacementQuantity(data.replacementQuantity());
        correction.setReplacementPrice(data.replacementPrice()); correction.setReplacementFees(data.replacementFees());
        correction.setRecordedAt(clock.instant());

        List<InvestTransaction> chain=operations.findByInvestmentIdAndSequenceNumberIsNotNullOrderBySequenceNumber(investment.getId());
        Map<UUID,InvestmentCorrection> effective=prior.stream().collect(Collectors.toMap(InvestmentCorrection::getOriginalId,Function.identity()));
        Replay before=replay(investment,chain,effective);
        if(before.quantity().compareTo(investment.getQuantity())!=0 || !decimalEquals(before.cost(),investment.getTotalCost()))
            throw new BusinessRuleException("Posição diverge da cadeia comprovada; reconcilie antes de corrigir.");
        effective.put(id,correction);
        Replay after=replay(investment,chain,effective);
        BigDecimal remaining=investment.valueForQuantity(after.quantity());
        BigDecimal reserved=allocations.sumByInvestmentId(investment.getId());
        if(reserved.signum()>0 && (remaining==null || remaining.compareTo(reserved)<0))
            throw new BusinessRuleException("Correção exige liberação ou realocação da destinação.");
        range(after.quantity(),8); range(after.cost(),2); range(remaining,2);

        BigDecimal refunded=original.getTotalValue().add(original.getType()==InvestTransType.BUY
            ? data.returnedFees() : data.returnedFees().negate());
        BigDecimal replacementGross=data.replacementQuantity()==null ? BigDecimal.ZERO
            : data.replacementQuantity().multiply(data.replacementPrice()).setScale(2,RoundingMode.HALF_UP);
        BigDecimal replacementCash=data.replacementQuantity()==null ? BigDecimal.ZERO
            : original.getType()==InvestTransType.BUY ? replacementGross.add(data.replacementFees())
            : replacementGross.subtract(data.replacementFees());
        BigDecimal delta=original.getType()==InvestTransType.BUY ? refunded.subtract(replacementCash)
            : replacementCash.subtract(refunded);
        range(delta.abs(),2);
        if(original.getType()==InvestTransType.BUY && account.getBalance().add(delta)
                .compareTo(allocations.sumByAccountId(account.getId()))<0)
            throw new BusinessRuleException("Disponível livre insuficiente para a aquisição corrigida.");
        if(delta.signum()>0) account.credit(delta); else if(delta.signum()<0) account.debit(delta.negate());
        correction.setCashDelta(delta);
        correction.setRealizedDelta(after.result().subtract(before.result()));
        corrections.saveAndFlush(correction);
        for(Revision revision:after.revisions()) {
            InvestmentCostRevision audit=new InvestmentCostRevision();
            audit.setCorrectionId(correction.getId());audit.setTransactionId(revision.id());
            audit.setCostDelta(revision.cost());audit.setRealizedResult(revision.result());costRevisions.save(audit);
        }
        reverseBank(original,account,user,data,refunded);
        if(data.replacementQuantity()!=null) replacementBank(original,account,user,data,replacementGross,replacementCash);
        investment.setQuantityAndCost(after.quantity(),after.cost());
        // Replay changes the position, not the independent valuation declaration.
        // Keep TOTAL's original denominator and PRICE's modality/provenance.
        investment.resizeValuation();
        events.publishEvent(new UserFinancialDataChangedEvent(user.getId(),data.date().getYear()));
        return correction;
    }

    private Replay replay(Investment investment,List<InvestTransaction> chain,Map<UUID,InvestmentCorrection> changes) {
        BigDecimal quantity=investment.getReplayQuantity(),cost=investment.getReplayCost(),result=BigDecimal.ZERO;
        if(quantity==null) throw new BusinessRuleException("Posição inicial da cadeia desconhecida.");
        List<Revision> revisions=new ArrayList<>();
        for(InvestTransaction tx:chain) {
            InvestmentCorrection correction=changes.get(tx.getId());
            if(correction!=null && (tx.getType()==InvestTransType.BUY || tx.getType()==InvestTransType.SELL))
                result=result.subtract(tx.getFees().subtract(correction.getReturnedFees()));
            if(correction!=null && correction.getReplacementQuantity()==null) {
                revisions.add(new Revision(tx.getId(),BigDecimal.ZERO,BigDecimal.ZERO)); continue;
            }
            BigDecimal units=correction==null?tx.getQuantity():correction.getReplacementQuantity();
            BigDecimal gross=correction==null?tx.getTotalValue():units.multiply(correction.getReplacementPrice()).setScale(2,RoundingMode.HALF_UP);
            BigDecimal fee=correction==null?tx.getFees():correction.getReplacementFees();
            BigDecimal removed=null,gain=null;
            if(tx.getType()==InvestTransType.BUY) {
                if(cost==null) throw new BusinessRuleException("Custo inicial desconhecido; reconciliação necessária.");
                quantity=quantity.add(units);cost=cost.add(gross).add(fee);removed=gross.add(fee);
            } else if(tx.getType()==InvestTransType.SELL) {
                if(quantity.compareTo(units)<0) throw new BusinessRuleException("Vendas dependentes excederiam a quantidade; informe aquisição substituta ou compense as vendas primeiro.");
                if(cost==null) throw new BusinessRuleException("Custo inicial desconhecido; reconciliação necessária.");
                removed=units.compareTo(quantity)==0?cost
                    : correction==null && tx.getMonetaryAmount()!=null && quantity.compareTo(tx.getBeforeQuantity())==0
                        ? cost.multiply(tx.getMonetaryAmount()).divide(tx.getBeforeValue(),2,RoundingMode.HALF_UP)
                        : cost.multiply(units).divide(quantity,2,RoundingMode.HALF_UP);
                quantity=quantity.subtract(units);cost=cost.subtract(removed);gain=gross.subtract(fee).subtract(removed);result=result.add(gain);
            }
            revisions.add(new Revision(tx.getId(),removed,gain));
        }
        return new Replay(quantity,cost,result,revisions);
    }

    private void reverseBank(InvestTransaction original,Account account,User user,CorrectInvestmentDTO data,BigDecimal cash) {
        Transaction source=original.getBankTransaction();
        if(source!=null) {
            BigDecimal managerial=(original.getType()==InvestTransType.DIVIDEND || original.getType()==InvestTransType.INTEREST)
                ?original.getTotalValue():cash;
            Transaction reversal=bank(account,user,data,managerial,cash,source.getType(),TransactionOrigin.REVERSAL);
            reversal.setReversalOfId(source.getId()); transactions.save(reversal);
        } else if(cash.signum()>0) {
            // A fully withheld sale had no bank receipt; undoing its gross is still an investment movement.
            transactions.save(bank(account,user,data,cash,cash,TransactionType.EXPENSE,TransactionOrigin.INVESTMENT_SELL));
        }
        if(original.getWithholdingTransactionId()!=null && data.returnedFees().signum()>0) {
            Transaction fee=bank(account,user,data,data.returnedFees(),BigDecimal.ZERO,TransactionType.EXPENSE,TransactionOrigin.REVERSAL);
            fee.setReversalOfId(original.getWithholdingTransactionId());transactions.save(fee);
        }
    }

    private void replacementBank(InvestTransaction original,Account account,User user,CorrectInvestmentDTO data,BigDecimal gross,BigDecimal cash) {
        TransactionOrigin origin=switch(original.getType()) {
            case BUY -> TransactionOrigin.INVESTMENT_BUY;
            case SELL -> TransactionOrigin.INVESTMENT_SELL;
            default -> TransactionOrigin.INVESTMENT_DIVIDEND;
        };
        boolean dividend=origin==TransactionOrigin.INVESTMENT_DIVIDEND;
        Transaction replacement=bank(account,user,data,dividend?gross:cash,cash,
            original.getType()==InvestTransType.BUY?TransactionType.EXPENSE:TransactionType.INCOME,origin);
        if(original.getBankTransaction()!=null) {
            replacement.setOrigin(TransactionOrigin.CORRECTION);
            replacement.setCorrectionOfId(original.getBankTransaction().getId());
        }
        transactions.save(replacement);
        if(dividend && data.replacementFees().signum()>0)
            transactions.save(bank(account,user,data,data.replacementFees(),BigDecimal.ZERO,TransactionType.EXPENSE,TransactionOrigin.INVESTMENT_FEE));
    }

    private Transaction bank(Account account,User user,CorrectInvestmentDTO data,BigDecimal amount,BigDecimal cash,TransactionType type,TransactionOrigin origin) {
        Transaction tx=new Transaction();tx.setUser(user);tx.setAccount(account);tx.setAmount(amount);tx.setCashAmount(cash);
        tx.setDate(data.date());tx.setCreatedAt(data.date().atStartOfDay());tx.captureTemporal(null,clock.instant(),tx.getCreatedAt());
        tx.setPaid(true);tx.setSystemManaged(true);tx.setType(type);tx.setOrigin(origin);
        String description="Compensação de investimento: "+data.reason();
        tx.setDescription(description.substring(0,Math.min(255,description.length())));return tx;
    }
    private void owned(UUID id,User user) {
        if(!investments.existsByIdAndUserId(id,user.getId())) throw new ResourceNotFoundException("Investimento não encontrado");
    }
    private static void validate(CorrectInvestmentDTO data,InvestTransaction original) {
        if(data.operationId()==null || data.date()==null || data.reason()==null || data.reason().isBlank() || data.reason().length()>500)
            throw new BusinessRuleException("Compensação exige identificação, data e motivo.");
        range(data.returnedFees(),2);
        if(data.returnedFees()==null || data.returnedFees().compareTo(original.getFees())>0)
            throw new BusinessRuleException("Taxa devolvida excede a taxa original.");
        if(data.replacementQuantity()!=null) {
            range(data.replacementQuantity(),8);range(data.replacementPrice(),8);range(data.replacementFees(),2);
            if(data.replacementQuantity().signum()==0 || data.replacementPrice()==null || data.replacementPrice().signum()==0 || data.replacementFees()==null)
                throw new BusinessRuleException("Substituição exige quantidade/preço positivos e taxas.");
            BigDecimal gross=data.replacementQuantity().multiply(data.replacementPrice()).setScale(2,RoundingMode.HALF_UP);
            range(gross,2);
            if(gross.signum()==0 || (original.getType()!=InvestTransType.BUY && data.replacementFees().compareTo(gross)>0))
                throw new BusinessRuleException("Bruto inválido ou taxas superiores ao bruto.");
        } else if(data.replacementPrice()!=null || data.replacementFees()!=null)
            throw new BusinessRuleException("Substituição incompleta.");
    }
    private static void range(BigDecimal v,int scale) {
        if(v!=null && (v.signum()<0 || v.scale()>scale || v.precision()-v.scale()>12))
            throw new BusinessRuleException("Valor fora da faixa ou precisão permitida.");
    }
    private static boolean decimalEquals(BigDecimal a,BigDecimal b){return a==null?b==null:b!=null&&a.compareTo(b)==0;}
    private static boolean same(InvestmentCorrection c,UUID id,CorrectInvestmentDTO d) {
        return c.getOriginalId().equals(id)&&c.getEffectiveDate().equals(d.date())&&c.getReason().equals(d.reason())
            &&decimalEquals(c.getReturnedFees(),d.returnedFees())&&decimalEquals(c.getReplacementQuantity(),d.replacementQuantity())
            &&decimalEquals(c.getReplacementPrice(),d.replacementPrice())&&decimalEquals(c.getReplacementFees(),d.replacementFees());
    }
    private record Revision(UUID id,BigDecimal cost,BigDecimal result){}
    private record Replay(BigDecimal quantity,BigDecimal cost,BigDecimal result,List<Revision> revisions){}
}
