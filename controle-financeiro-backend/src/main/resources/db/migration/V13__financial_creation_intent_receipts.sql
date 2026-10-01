-- Additive transport receipt; does not infer intentions for historical writes.
-- Result is an immutable DTO snapshot, not a live cross-domain entity reference.
CREATE TABLE financial_intent_receipts (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind varchar(32) NOT NULL,
    fingerprint varchar(64) NOT NULL,
    result_json text NOT NULL,
    recorded_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT ck_financial_intent_kind CHECK (kind IN ('TRANSACTION_CREATE', 'INVESTMENT_OPERATION')),
    CONSTRAINT ck_financial_intent_fingerprint CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
    CONSTRAINT ck_financial_intent_result CHECK (jsonb_typeof(result_json::jsonb) = 'object')
);
CREATE INDEX idx_financial_intent_owner ON financial_intent_receipts(user_id);
