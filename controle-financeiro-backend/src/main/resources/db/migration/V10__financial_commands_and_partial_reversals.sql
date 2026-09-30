-- Multiple partial reversals are protected by a locked remaining amount and
-- one receipt per intent, rather than the old one-reversal-per-original limit.
DROP INDEX uk_transactions_reversal_once;
CREATE INDEX idx_transactions_reversal ON transactions(reversal_of_id) WHERE reversal_of_id IS NOT NULL;
ALTER TABLE transactions ADD COLUMN realization_of_id uuid REFERENCES transactions(id),
    ADD COLUMN reason varchar(500),
    ADD CONSTRAINT ck_transactions_realization CHECK (realization_of_id IS NULL OR
        (origin IN ('TRANSFER','TRANSFER_FEE') AND operation_id IS NOT NULL AND status IN ('SETTLED','REVERSED')));
CREATE UNIQUE INDEX uk_transactions_realization ON transactions(realization_of_id) WHERE realization_of_id IS NOT NULL;
CREATE TABLE financial_commands (
    id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
    original_id uuid NOT NULL REFERENCES transactions(id), kind varchar(32) NOT NULL,
    fingerprint varchar(64) NOT NULL, transaction_id uuid NOT NULL REFERENCES transactions(id),
    recorded_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT ck_financial_commands_kind CHECK (kind IN ('SETTLE','REVERSE','REALIZE_TRANSFER'))
);
