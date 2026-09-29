ALTER TABLE investments ADD COLUMN valuation_basis varchar(16);
ALTER TABLE investments ADD COLUMN valuation_reference_amount numeric(38,2);
ALTER TABLE investments ADD COLUMN valuation_reference_quantity numeric(20,8);
ALTER TABLE investments ALTER COLUMN current_price TYPE numeric(38,8);
ALTER TABLE investments ALTER COLUMN average_price TYPE numeric(38,8);
ALTER TABLE invest_transactions ALTER COLUMN price TYPE numeric(38,8);
ALTER TABLE transactions ADD COLUMN cash_amount numeric(38,2);
-- Preserve the explicitly stored total, without reconstructing it from rounded price.
-- This is the reference at adoption, not an assertion about the original valuation method.
UPDATE investments SET valuation_basis='TOTAL', valuation_reference_amount=valuation_amount,
    valuation_reference_quantity=quantity WHERE valuation_amount IS NOT NULL;
CREATE TABLE investment_valuations (
    id uuid PRIMARY KEY, investment_id uuid NOT NULL REFERENCES investments(id),
    amount numeric(38,2) NOT NULL, valuation_date date NOT NULL,
    source varchar(255) NOT NULL, reason varchar(500) NOT NULL,
    recorded_at timestamptz NOT NULL
);
