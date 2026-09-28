-- CF-018: additive financial provenance and linked transaction flow.
-- Existing rows keep unknown origin; no description/category heuristic is used.
ALTER TABLE accounts
    ADD COLUMN opening_balance numeric(38,2),
    ADD COLUMN opening_date date,
    ADD COLUMN opening_origin varchar(32),
    ADD COLUMN opening_recorded_at timestamp(6) with time zone,
    ADD CONSTRAINT ck_accounts_opening_origin
        CHECK (opening_origin IS NULL OR opening_origin IN ('USER_PROVIDED', 'UNKNOWN')),
    ADD CONSTRAINT ck_accounts_opening_metadata
        CHECK (opening_origin IS NULL OR opening_origin = 'UNKNOWN'
            OR (opening_balance IS NOT NULL AND opening_date IS NOT NULL AND opening_recorded_at IS NOT NULL));

ALTER TABLE transactions
    ADD COLUMN status varchar(32),
    ADD COLUMN origin varchar(32),
    ADD COLUMN due_date date,
    ADD COLUMN settled_at timestamp(6) with time zone,
    ADD COLUMN operation_id uuid,
    ADD COLUMN transfer_direction varchar(32),
    ADD COLUMN counterparty_account_id uuid,
    ADD COLUMN reversal_of_id uuid,
    ADD COLUMN settlement_of_id uuid,
    ADD COLUMN correction_of_id uuid;

-- is_paid already expresses this historical distinction exactly. This is not
-- a financial-origin backfill and does not infer semantics from free text.
UPDATE transactions
SET status = CASE WHEN is_paid THEN 'SETTLED' ELSE 'PENDING' END;

ALTER TABLE transactions
    ALTER COLUMN status SET NOT NULL,
    ADD CONSTRAINT ck_transactions_status
        CHECK (status IN ('PENDING', 'PARTIALLY_SETTLED', 'FULFILLED', 'CANCELLED', 'SETTLED', 'REVERSED')),
    ADD CONSTRAINT ck_transactions_paid_status
        CHECK ((status IN ('PENDING', 'PARTIALLY_SETTLED', 'CANCELLED') AND is_paid = false)
            OR (status IN ('FULFILLED', 'SETTLED', 'REVERSED') AND is_paid = true)),
    ADD CONSTRAINT ck_transactions_origin
        CHECK (origin IS NULL OR origin IN (
            'USER', 'ACCOUNT_OPENING', 'TRANSFER', 'TRANSFER_FEE', 'SETTLEMENT', 'CORRECTION', 'REVERSAL', 'UNKNOWN'
        )),
    ADD CONSTRAINT ck_transactions_transfer_direction
        CHECK (transfer_direction IS NULL OR transfer_direction IN ('OUTBOUND', 'INBOUND')),
    ADD CONSTRAINT ck_transactions_transfer_metadata
        CHECK (origin IS DISTINCT FROM 'TRANSFER' OR (
            type = 'TRANSFER' AND operation_id IS NOT NULL AND transfer_direction IS NOT NULL
            AND counterparty_account_id IS NOT NULL AND counterparty_account_id <> account_id
        )),
    ADD CONSTRAINT fk_transactions_counterparty_account
        FOREIGN KEY (counterparty_account_id) REFERENCES accounts (id),
    ADD CONSTRAINT fk_transactions_reversal
        FOREIGN KEY (reversal_of_id) REFERENCES transactions (id),
    ADD CONSTRAINT fk_transactions_settlement
        FOREIGN KEY (settlement_of_id) REFERENCES transactions (id),
    ADD CONSTRAINT fk_transactions_correction
        FOREIGN KEY (correction_of_id) REFERENCES transactions (id),
    ADD CONSTRAINT ck_transactions_settlement_metadata
        CHECK ((origin = 'SETTLEMENT' AND settlement_of_id IS NOT NULL
                AND status IN ('SETTLED', 'REVERSED') AND type IN ('INCOME', 'EXPENSE')
                AND operation_id IS NULL)
            OR (origin IS DISTINCT FROM 'SETTLEMENT' AND settlement_of_id IS NULL)),
    ADD CONSTRAINT ck_transactions_reversal_metadata
        CHECK ((origin = 'REVERSAL' AND reversal_of_id IS NOT NULL AND status = 'SETTLED')
            OR (origin IS DISTINCT FROM 'REVERSAL' AND reversal_of_id IS NULL)),
    ADD CONSTRAINT ck_transactions_correction_metadata
        CHECK ((origin = 'CORRECTION' AND correction_of_id IS NOT NULL
                AND type IN ('INCOME', 'EXPENSE') AND operation_id IS NULL)
            OR (origin IS DISTINCT FROM 'CORRECTION' AND correction_of_id IS NULL));

CREATE UNIQUE INDEX uk_transactions_operation_direction
    ON transactions (operation_id, transfer_direction)
    WHERE origin = 'TRANSFER';

CREATE UNIQUE INDEX uk_transactions_reversal_once
    ON transactions (reversal_of_id)
    WHERE reversal_of_id IS NOT NULL;

CREATE UNIQUE INDEX uk_transactions_correction_once
    ON transactions (correction_of_id)
    WHERE correction_of_id IS NOT NULL;

CREATE INDEX idx_transactions_operation
    ON transactions (operation_id)
    WHERE operation_id IS NOT NULL;

CREATE INDEX idx_transactions_settlement
    ON transactions (settlement_of_id, status)
    WHERE settlement_of_id IS NOT NULL;

CREATE INDEX idx_transactions_user_realized
    ON transactions (user_id, status, type, date);
