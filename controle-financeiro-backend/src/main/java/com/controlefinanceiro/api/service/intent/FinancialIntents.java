package com.controlefinanceiro.api.service.intent;

import com.controlefinanceiro.api.domain.intent.FinancialIntentReceiptDTO;

import java.util.UUID;

/**
 * Durable identity for creation, shared by transaction and investment use cases.
 * Writers must call replay before acquiring sources, then complete with the original
 * response in the same enclosing transaction. Both calls require that transaction,
 * even for a null key. A null key opts out of receipts; a null replay means no receipt.
 * Reuse with another owner, kind or fingerprint conflicts. Recovery is owner-scoped
 * and returns the committed snapshot, never a projection of the current ledger.
 */
public interface FinancialIntents {
    /** Reserve the shared identity namespace before preparing an operation. Enclosing transaction required. */
    void lock(UUID key);
    String ONBOARDING_COMPLETE = "ONBOARDING_COMPLETE";
    String TRANSACTION_CREATE = "TRANSACTION_CREATE";
    String INVESTMENT_OPERATION = "INVESTMENT_OPERATION";

    <T> T replay(UUID key, UUID ownerId, String kind, String fingerprint, Class<T> resultType);

    void complete(UUID key, UUID ownerId, String kind, String fingerprint, Object result);

    FinancialIntentReceiptDTO recover(UUID key, UUID ownerId);
}
