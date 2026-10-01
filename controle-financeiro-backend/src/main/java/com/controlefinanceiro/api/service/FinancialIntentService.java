package com.controlefinanceiro.api.service;

import com.controlefinanceiro.api.domain.transaction.*;
import com.controlefinanceiro.api.domain.transaction.dto.FinancialIntentReceiptDTO;
import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.service.exception.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import tools.jackson.databind.json.JsonMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Clock;
import java.util.*;

/** Owns transport identity only; financial rules remain in each application service. */
@Service
@RequiredArgsConstructor
public class FinancialIntentService {
    public static final String TRANSACTION_CREATE = "TRANSACTION_CREATE";
    public static final String INVESTMENT_OPERATION = "INVESTMENT_OPERATION";
    private final FinancialIntentReceiptRepository receipts;
    private final EntityManager entityManager;
    private final JsonMapper json;
    private final Clock clock;

    @Transactional(propagation = Propagation.MANDATORY)
    public <T> T replay(UUID key, User user, String kind, String fingerprint, Class<T> resultType) {
        if (key == null) return null;
        // Cross-kind reuse of a key is serialized too; no source is acquired before this lock.
        entityManager.createNativeQuery("select 1 from pg_advisory_xact_lock(hashtextextended(cast(?1 as text),0))")
                .setParameter(1,"financial-intent:"+key).getSingleResult();
        var previous=receipts.findById(key);
        if (previous.isEmpty()) return null;
        var receipt=previous.get();
        if (!receipt.getUserId().equals(user.getId()) || !receipt.getKind().equals(kind)
                || !receipt.getFingerprint().equals(fingerprint))
            throw new OperationConflictException("Esta intenção já foi usada com outro conteúdo.");
        return json.readValue(receipt.getResultJson(),resultType);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void complete(UUID key, User user, String kind, String fingerprint, Object result) {
        if (key == null) return;
        receipts.saveAndFlush(new FinancialIntentReceipt(key,user.getId(),kind,fingerprint,
                json.writeValueAsString(result),clock.instant()));
    }

    @Transactional(readOnly = true)
    public FinancialIntentReceiptDTO recover(UUID key, User user) {
        var receipt=receipts.findByIdAndUserId(key,user.getId())
                .orElseThrow(()->new ResourceNotFoundException("Intenção ainda não localizada."));
        return new FinancialIntentReceiptDTO(key,receipt.getKind(),receipt.getRecordedAt(),json.readTree(receipt.getResultJson()));
    }

    public static String fingerprint(Object... fields) {
        var content=new StringBuilder();
        for (Object field:fields) {
            String value=field==null?null:field instanceof BigDecimal decimal
                    ?decimal.stripTrailingZeros().toPlainString():field.toString();
            content.append(value==null?"-1:":value.length()+":"+value);
        }
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content.toString().getBytes(StandardCharsets.UTF_8)));}
        catch (NoSuchAlgorithmException ex) {throw new IllegalStateException(ex);}
    }
}
