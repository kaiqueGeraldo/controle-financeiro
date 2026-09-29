CREATE TABLE goal_purchases (
    item_id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    name varchar(255) NOT NULL,
    amount numeric(38,2) NOT NULL CHECK (amount > 0),
    bank_transaction_id uuid REFERENCES transactions(id),
    card_transaction_id uuid REFERENCES card_transactions(id),
    recorded_at timestamptz,
    refunded_at timestamptz,
    CHECK (num_nonnulls(bank_transaction_id, card_transaction_id) = 1)
);
CREATE INDEX goal_purchases_owner ON goal_purchases(user_id, recorded_at);
-- Only explicit surviving links are adopted. Unknown historical audit stays null.
INSERT INTO goal_purchases(item_id,user_id,name,amount,bank_transaction_id,card_transaction_id)
SELECT i.id,g.user_id,i.name,i.paid_price,i.bank_transaction_id,i.card_transaction_id
FROM goal_items i JOIN goals g ON g.id=i.goal_id
WHERE i.status='PURCHASED' AND i.paid_price > 0
AND num_nonnulls(i.bank_transaction_id,i.card_transaction_id)=1;
