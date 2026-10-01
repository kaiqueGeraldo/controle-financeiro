package com.controlefinanceiro.api.service.intent.internal;

import com.controlefinanceiro.api.domain.intent.internal.FinancialIntentReceipt;
import com.controlefinanceiro.api.domain.intent.internal.FinancialIntentReceiptRepository;
import com.controlefinanceiro.api.domain.intent.FinancialIntentReceiptDTO;
import com.controlefinanceiro.api.service.intent.FinancialIntents;
import com.controlefinanceiro.api.service.exception.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;
import java.util.*;

/** Owns transport identity only; financial rules remain in each application service. */
@Service
@RequiredArgsConstructor
public class PostgresFinancialIntents implements FinancialIntents {
    private final FinancialIntentReceiptRepository receipts;
    private final EntityManager entityManager;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    @Override
    public <T> T replay(UUID key, UUID ownerId, String kind, String fingerprint, Class<T> resultType) {
        if (key == null) return null;
        // Cross-kind reuse of a key is serialized too; no source is acquired before this lock.
        entityManager.createNativeQuery("select 1 from pg_advisory_xact_lock(hashtextextended(cast(?1 as text),0))")
                .setParameter(1,"financial-intent:"+key).getSingleResult();
        var previous=receipts.findById(key);
        if (previous.isEmpty()) return null;
        var receipt=previous.get();
        if (!receipt.getUserId().equals(ownerId) || !receipt.getKind().equals(kind)
                || !receipt.getFingerprint().equals(fingerprint))
            throw new OperationConflictException("Esta intenção já foi usada com outro conteúdo.");
        return json.readValue(receipt.getResultJson(),resultType);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    @Override
    public void complete(UUID key, UUID ownerId, String kind, String fingerprint, Object result) {
        if (key == null) return;
        receipts.saveAndFlush(new FinancialIntentReceipt(key,ownerId,kind,fingerprint,
                json.writeValueAsString(result),clock.instant()));
    }

    @Transactional(readOnly = true)
    @Override
    public FinancialIntentReceiptDTO recover(UUID key, UUID ownerId) {
        var receipt=receipts.findByIdAndUserId(key,ownerId)
                .orElseThrow(()->new ResourceNotFoundException("Intenção ainda não localizada."));
        return new FinancialIntentReceiptDTO(key,receipt.getKind(),receipt.getRecordedAt(),json.readTree(receipt.getResultJson()));
    }

}
