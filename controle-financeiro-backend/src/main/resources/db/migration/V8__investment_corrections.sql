-- A current-position anchor permits replay of newly recorded operations only.
-- Historical ordering and unknown costs are not reconstructed.
ALTER TABLE investments ADD COLUMN replay_quantity numeric(20,8);
ALTER TABLE investments ADD COLUMN replay_cost numeric(38,2);
ALTER TABLE investments ADD COLUMN operation_sequence bigint NOT NULL DEFAULT 0;
UPDATE investments SET replay_quantity=quantity,replay_cost=total_cost;
ALTER TABLE invest_transactions ADD COLUMN sequence_number bigint;
ALTER TABLE invest_transactions ADD COLUMN account_id uuid REFERENCES accounts(id);
ALTER TABLE invest_transactions ADD COLUMN recorded_at timestamptz;
ALTER TABLE invest_transactions ADD COLUMN before_value numeric(38,2);
ALTER TABLE invest_transactions ADD COLUMN before_quantity numeric(20,8);
ALTER TABLE invest_transactions ADD COLUMN monetary_amount numeric(38,2);
ALTER TABLE invest_transactions ADD COLUMN withholding_transaction_id uuid REFERENCES transactions(id);
CREATE UNIQUE INDEX uk_investment_sequence ON invest_transactions(investment_id,sequence_number);
CREATE TABLE investment_corrections (
 id uuid PRIMARY KEY, investment_id uuid NOT NULL REFERENCES investments(id),
 original_id uuid NOT NULL UNIQUE REFERENCES invest_transactions(id),
 operation_id uuid NOT NULL UNIQUE, account_id uuid NOT NULL REFERENCES accounts(id),
 effective_date date NOT NULL, reason varchar(500) NOT NULL,
 returned_fees numeric(38,2) NOT NULL CHECK(returned_fees>=0),
 replacement_quantity numeric(20,8), replacement_price numeric(38,8), replacement_fees numeric(38,2),
 cash_delta numeric(38,2) NOT NULL, realized_delta numeric(38,2) NOT NULL,
 recorded_at timestamptz NOT NULL,
 CHECK ((replacement_quantity IS NULL AND replacement_price IS NULL AND replacement_fees IS NULL)
     OR (replacement_quantity>0 AND replacement_price>0 AND replacement_fees>=0))
);
CREATE INDEX idx_investment_corrections_position ON investment_corrections(investment_id);
CREATE TABLE investment_cost_revisions (
 id uuid PRIMARY KEY, correction_id uuid NOT NULL REFERENCES investment_corrections(id),
 transaction_id uuid NOT NULL REFERENCES invest_transactions(id),
 cost_delta numeric(38,2), realized_result numeric(38,2),
 UNIQUE(correction_id,transaction_id)
);
