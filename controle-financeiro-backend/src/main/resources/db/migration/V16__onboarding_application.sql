-- Local foundation only. No legacy default-account identity or historical facts inferred.
ALTER TABLE accounts ADD CONSTRAINT uk_accounts_owner_id UNIQUE(user_id,id);
CREATE TABLE onboarding_default_accounts (
    user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_id uuid NOT NULL UNIQUE,
    recorded_at timestamptz NOT NULL,
    FOREIGN KEY(user_id,account_id) REFERENCES accounts(user_id,id)
);
CREATE TABLE onboarding_preparations (
    operation_id uuid PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    draft_version bigint NOT NULL CHECK (draft_version>=1),
    state varchar(16) NOT NULL CHECK (state IN ('PREPARED','CANCELLED','COMPLETED')),
    content_hash varchar(64) NOT NULL,
    prepared_json text NOT NULL,
    prepared_at timestamptz NOT NULL,
    cancelled_version bigint,
    UNIQUE(session_id,operation_id)
);
CREATE UNIQUE INDEX uk_onboarding_pending ON onboarding_preparations(session_id) WHERE state='PREPARED';
CREATE UNIQUE INDEX uk_onboarding_completed ON onboarding_preparations(session_id) WHERE state='COMPLETED';
CREATE INDEX idx_onboarding_preparation_owner ON onboarding_preparations(user_id);
CREATE TABLE onboarding_reservation_history (
    id uuid PRIMARY KEY,
    reservation_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revision bigint NOT NULL,
    previous_json text NOT NULL,
    declaration_json text NOT NULL,
    recorded_at timestamptz NOT NULL,
    UNIQUE(reservation_id,revision)
);
CREATE INDEX idx_onboarding_reservation_history_owner ON onboarding_reservation_history(user_id);
CREATE TABLE onboarding_application_items (
    session_id uuid NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
    temp_id uuid NOT NULL,
    kind varchar(20) NOT NULL,
    resource_id uuid NOT NULL,
    action varchar(24) NOT NULL,
    PRIMARY KEY(session_id,temp_id)
);
ALTER TABLE investments ALTER COLUMN ticker DROP NOT NULL;
ALTER TABLE investments ALTER COLUMN quantity DROP NOT NULL;
ALTER TABLE investments ALTER COLUMN average_price DROP NOT NULL;
ALTER TABLE investments ADD COLUMN position_mode varchar(16) NOT NULL DEFAULT 'UNIT',
    ADD COLUMN institution varchar(100), ADD COLUMN acquisition_date date,
    ADD COLUMN historical_source varchar(200), ADD COLUMN opening_recorded_at timestamptz;
ALTER TABLE investments ADD CONSTRAINT ck_investment_position_mode CHECK (
    (position_mode='UNIT' AND quantity IS NOT NULL) OR
    (position_mode='MONETARY' AND quantity IS NULL AND average_price IS NULL
     AND type IN ('FIXED_INCOME','TREASURY','OTHER') AND (valuation_basis IS NULL OR valuation_basis='TOTAL')));
ALTER TABLE credit_cards ALTER COLUMN card_limit DROP NOT NULL;
ALTER TABLE card_transactions ADD COLUMN opening_principal numeric(38,2), ADD COLUMN opening_charges numeric(38,2);
ALTER TABLE card_transactions ADD CONSTRAINT ck_opening_components CHECK (
    (opening_principal IS NULL AND opening_charges IS NULL) OR
    (origin='OPENING' AND opening_principal IS NOT NULL AND opening_charges IS NOT NULL
     AND opening_principal>=0 AND opening_charges>=0 AND opening_principal+opening_charges=amount));
ALTER TABLE invoices ADD COLUMN due_date_override date;
-- Goal aggregates can exceed the individual operation range (SPEC-001 §5); no rounding.
ALTER TABLE goals ALTER COLUMN target_value TYPE numeric;
ALTER TABLE goals ALTER COLUMN current_value TYPE numeric;
ALTER TABLE goals ADD COLUMN numeric_progress_known boolean NOT NULL DEFAULT false;
ALTER TABLE goal_allocations ADD COLUMN reservation_id uuid;
CREATE INDEX idx_goal_allocation_reservation ON goal_allocations(reservation_id) WHERE reservation_id IS NOT NULL;
ALTER TABLE financial_intent_receipts DROP CONSTRAINT ck_financial_intent_kind;
ALTER TABLE financial_intent_receipts ADD CONSTRAINT ck_financial_intent_kind
    CHECK (kind IN ('TRANSACTION_CREATE','INVESTMENT_OPERATION','ONBOARDING_COMPLETE'));
