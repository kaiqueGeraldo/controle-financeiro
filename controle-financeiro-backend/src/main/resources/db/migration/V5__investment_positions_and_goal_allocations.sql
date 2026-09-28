-- CF-020. Preserve legacy values without claiming that their cost or quote is known.
ALTER TABLE investments ADD COLUMN total_cost numeric(38,2);
ALTER TABLE investments ADD COLUMN valuation_amount numeric(38,2);
ALTER TABLE investments ADD COLUMN valuation_date date;
ALTER TABLE investments ADD COLUMN valuation_source varchar(255);
ALTER TABLE investments ADD COLUMN legacy_current_price numeric(38,2);
UPDATE investments SET legacy_current_price = current_price;
ALTER TABLE investments ALTER COLUMN current_price DROP NOT NULL;
UPDATE investments SET current_price = NULL;
ALTER TABLE investments ALTER COLUMN quantity TYPE numeric(20,8);
ALTER TABLE investments ALTER COLUMN average_price TYPE numeric(20,8);
ALTER TABLE investments ALTER COLUMN current_price TYPE numeric(20,8);
ALTER TABLE investments ADD CONSTRAINT ck_investment_position
    CHECK (quantity >= 0 AND (total_cost IS NULL OR total_cost >= 0)
        AND (valuation_amount IS NULL OR valuation_amount >= 0)
        AND (current_price IS NULL OR current_price >= 0));

ALTER TABLE invest_transactions ALTER COLUMN quantity TYPE numeric(20,8);
ALTER TABLE invest_transactions ALTER COLUMN price TYPE numeric(20,8);
ALTER TABLE invest_transactions ADD COLUMN cost_delta numeric(38,2);
ALTER TABLE invest_transactions ADD COLUMN realized_result numeric(38,2);

ALTER TABLE goals ADD COLUMN allocation_reconciled boolean NOT NULL DEFAULT true;
UPDATE goals SET allocation_reconciled = false
    WHERE type = 'MONETARY' AND current_value <> 0;

CREATE TABLE goal_allocations (
    id uuid PRIMARY KEY,
    goal_id uuid NOT NULL REFERENCES goals(id),
    account_id uuid REFERENCES accounts(id),
    investment_id uuid REFERENCES investments(id),
    amount numeric(38,2) NOT NULL,
    version bigint,
    CONSTRAINT ck_goal_allocation_source CHECK ((account_id IS NULL) <> (investment_id IS NULL)),
    CONSTRAINT ck_goal_allocation_amount CHECK (amount >= 0)
);
CREATE UNIQUE INDEX uk_goal_allocation_account ON goal_allocations(goal_id, account_id)
    WHERE account_id IS NOT NULL;
CREATE UNIQUE INDEX uk_goal_allocation_investment ON goal_allocations(goal_id, investment_id)
    WHERE investment_id IS NOT NULL;
CREATE INDEX idx_goal_allocations_account ON goal_allocations(account_id);
CREATE INDEX idx_goal_allocations_investment ON goal_allocations(investment_id);
ALTER TABLE goal_history ADD COLUMN allocation_id uuid;
ALTER TABLE goal_items ADD COLUMN allocation_id uuid;
ALTER TABLE transactions ADD COLUMN goal_item_id uuid;
-- Nomes de FK do schema legado podem ter sido gerados pelo Hibernate.
DO $$
DECLARE fk record;
BEGIN
    FOR fk IN SELECT conname FROM pg_constraint
              WHERE conrelid = 'investments'::regclass AND confrelid = 'goals'::regclass
                AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE investments DROP CONSTRAINT %I', fk.conname);
    END LOOP;
END $$;
ALTER TABLE investments ADD CONSTRAINT fk_investments_goal
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

ALTER TABLE transactions DROP CONSTRAINT ck_transactions_origin;
ALTER TABLE transactions ADD CONSTRAINT ck_transactions_origin CHECK (
    origin IS NULL OR origin IN ('USER', 'ACCOUNT_OPENING', 'TRANSFER', 'TRANSFER_FEE',
        'SETTLEMENT', 'CORRECTION', 'REVERSAL', 'INVOICE_PAYMENT', 'UNKNOWN',
        'INVESTMENT_BUY', 'INVESTMENT_SELL', 'INVESTMENT_DIVIDEND', 'INVESTMENT_FEE',
        'GOAL_PURCHASE')
);
