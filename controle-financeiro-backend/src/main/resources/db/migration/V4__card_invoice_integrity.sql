-- CF-019: datas de ciclo são fixadas na criação; legado permanece sem origem inferida.
ALTER TABLE invoices ADD COLUMN closing_date date;
ALTER TABLE invoices ADD COLUMN due_date date;
ALTER TABLE invoices ADD CONSTRAINT ck_invoice_cycle_dates
    CHECK ((closing_date IS NULL AND due_date IS NULL)
           OR (closing_date IS NOT NULL AND due_date IS NOT NULL AND due_date > closing_date));
ALTER TABLE card_transactions ADD COLUMN paid_amount numeric(38,2) NOT NULL DEFAULT 0;
ALTER TABLE card_transactions ADD COLUMN refunded_amount numeric(38,2) NOT NULL DEFAULT 0;
ALTER TABLE card_transactions ADD COLUMN credit_applied numeric(38,2) NOT NULL DEFAULT 0;
ALTER TABLE card_transactions ADD COLUMN origin varchar(32) NOT NULL DEFAULT 'LEGACY_UNKNOWN';
ALTER TABLE credit_cards ADD COLUMN credit_balance numeric(38,2) NOT NULL DEFAULT 0;
CREATE TABLE card_opening_batches (
    id uuid PRIMARY KEY,
    card_id uuid NOT NULL UNIQUE REFERENCES credit_cards(id),
    base_date date NOT NULL,
    created_at timestamptz NOT NULL
);
ALTER TABLE card_transactions ADD COLUMN opening_batch_id uuid REFERENCES card_opening_batches(id);
ALTER TABLE card_transactions ADD CONSTRAINT ck_card_paid_amount
    CHECK (paid_amount >= 0 AND refunded_amount >= 0 AND credit_applied >= 0
           AND credit_applied <= paid_amount
           AND (amount < 0 OR paid_amount + refunded_amount <= amount));
ALTER TABLE card_transactions ADD CONSTRAINT ck_card_transaction_origin
    CHECK (origin IN ('PURCHASE', 'OPENING', 'LEGACY_UNKNOWN'));
ALTER TABLE card_transactions ADD CONSTRAINT ck_card_positive_new_fact
    CHECK (origin = 'LEGACY_UNKNOWN' OR amount > 0);
ALTER TABLE card_transactions ADD CONSTRAINT ck_card_opening_batch
    CHECK ((origin = 'OPENING') = (opening_batch_id IS NOT NULL));
ALTER TABLE credit_cards ADD CONSTRAINT ck_credit_cards_credit_balance CHECK (credit_balance >= 0);

CREATE TABLE card_payments (
    id uuid PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES invoices(id),
    account_id uuid NOT NULL REFERENCES accounts(id),
    operation_id uuid UNIQUE,
    is_prepayment boolean NOT NULL,
    amount numeric(38,2) NOT NULL CHECK (amount > 0),
    payment_date date NOT NULL,
    bank_transaction_id uuid UNIQUE REFERENCES transactions(id),
    created_at timestamptz NOT NULL
);
CREATE INDEX idx_card_payments_invoice ON card_payments(invoice_id);
CREATE UNIQUE INDEX uk_card_payments_legacy_retry
    ON card_payments(invoice_id, account_id, payment_date, amount, is_prepayment)
    WHERE operation_id IS NULL;
CREATE TABLE card_payment_allocations (
    id uuid PRIMARY KEY,
    payment_id uuid NOT NULL REFERENCES card_payments(id),
    card_transaction_id uuid NOT NULL REFERENCES card_transactions(id),
    amount numeric(38,2) NOT NULL CHECK (amount > 0),
    CONSTRAINT uk_card_payment_allocation UNIQUE (payment_id, card_transaction_id)
);
CREATE INDEX idx_card_transactions_unpaid ON card_transactions(invoice_id, id) WHERE amount > 0;

CREATE TABLE card_refunds (
    id uuid PRIMARY KEY,
    card_id uuid NOT NULL REFERENCES credit_cards(id),
    purchase_id uuid NOT NULL,
    category_id uuid NOT NULL REFERENCES categories(id),
    operation_id uuid UNIQUE,
    amount numeric(38,2) NOT NULL CHECK (amount > 0),
    credit_created numeric(38,2) NOT NULL CHECK (credit_created >= 0),
    refund_date date NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_card_refund_credit CHECK (credit_created <= amount)
);
CREATE UNIQUE INDEX uk_card_refunds_legacy_retry
    ON card_refunds(card_id, purchase_id, amount, refund_date) WHERE operation_id IS NULL;
CREATE INDEX idx_card_refunds_purchase ON card_refunds(card_id, purchase_id);

ALTER TABLE transactions DROP CONSTRAINT ck_transactions_origin;
ALTER TABLE transactions ADD CONSTRAINT ck_transactions_origin CHECK (
    origin IS NULL OR origin IN ('USER', 'ACCOUNT_OPENING', 'TRANSFER', 'TRANSFER_FEE',
               'SETTLEMENT', 'CORRECTION', 'REVERSAL', 'INVOICE_PAYMENT', 'UNKNOWN')
);
