-- Independent synthetic representation of the schema that predates CF-017.
-- It is deliberately not produced by Hibernate and is never used for an empty
-- database. UUIDs and values below are stable test data, not production data.

CREATE TABLE users (
    id uuid PRIMARY KEY, nome varchar(255) NOT NULL, email varchar(255) NOT NULL UNIQUE,
    senha varchar(255) NOT NULL, dark_mode boolean NOT NULL, privacy_mode boolean NOT NULL,
    notif_contas boolean DEFAULT true, notif_semanal boolean DEFAULT true,
    dashboard_config text, created_at timestamp(6), updated_at timestamp(6),
    recovery_token varchar(255), recovery_token_expiry timestamp(6), reset_attempts integer DEFAULT 0
);

CREATE TABLE accounts (
    id uuid PRIMARY KEY, name varchar(255) NOT NULL, type varchar(255) NOT NULL,
    balance numeric(38,2) NOT NULL, color varchar(255), is_archived boolean NOT NULL,
    order_index integer DEFAULT 0, user_id uuid NOT NULL REFERENCES users(id), version bigint
);

CREATE TABLE categories (
    id uuid PRIMARY KEY, name varchar(255) NOT NULL, icon varchar(255), color varchar(255),
    type varchar(255) NOT NULL, is_system_reserved boolean DEFAULT false,
    user_id uuid NOT NULL REFERENCES users(id)
);

CREATE TABLE credit_cards (
    id uuid PRIMARY KEY, name varchar(255) NOT NULL, last_4_digits varchar(4),
    color varchar(255), brand varchar(255), card_limit numeric(38,2) NOT NULL,
    closing_day integer NOT NULL, due_day integer NOT NULL, order_index integer,
    user_id uuid NOT NULL REFERENCES users(id)
);

CREATE TABLE invoices (
    id uuid PRIMARY KEY, month integer NOT NULL, year integer NOT NULL,
    status varchar(255) NOT NULL, card_id uuid NOT NULL REFERENCES credit_cards(id),
    UNIQUE(card_id, month, year)
);

CREATE TABLE card_transactions (
    id uuid PRIMARY KEY, description varchar(255) NOT NULL, amount numeric(38,2) NOT NULL,
    date date NOT NULL, created_at timestamp(6) NOT NULL, installment integer,
    total_installments integer, purchase_id uuid,
    invoice_id uuid NOT NULL REFERENCES invoices(id),
    category_id uuid NOT NULL REFERENCES categories(id)
);

CREATE TABLE goals (
    id uuid PRIMARY KEY, title varchar(255) NOT NULL, category varchar(255), icon varchar(255),
    color varchar(255), type varchar(255) NOT NULL, unit varchar(255),
    target_value numeric(38,2) NOT NULL, current_value numeric(38,2) NOT NULL,
    deadline date NOT NULL, use_checklist boolean DEFAULT false, order_index integer,
    user_id uuid NOT NULL REFERENCES users(id), version bigint
);

CREATE TABLE goal_history (
    id uuid PRIMARY KEY, date timestamp(6), amount numeric(38,2) NOT NULL,
    note varchar(255), goal_id uuid NOT NULL REFERENCES goals(id), protocol jsonb
);

CREATE TABLE goal_items (
    id uuid PRIMARY KEY, name varchar(255) NOT NULL, suggested_model varchar(255),
    estimated_price numeric(38,2) NOT NULL, paid_price numeric(38,2),
    status varchar(255) NOT NULL, order_index integer, bank_transaction_id uuid,
    card_transaction_id uuid, used_goal_balance boolean DEFAULT false,
    goal_id uuid NOT NULL REFERENCES goals(id)
);

CREATE TABLE habits (
    id uuid PRIMARY KEY, name varchar(255) NOT NULL, description varchar(255),
    icon varchar(255) NOT NULL, color varchar(255) NOT NULL,
    current_streak integer NOT NULL, highest_streak integer NOT NULL, order_index integer,
    frequency varchar(255) NOT NULL, weekly_goal integer,
    user_id uuid NOT NULL REFERENCES users(id), goal_id uuid REFERENCES goals(id),
    created_at timestamp(6)
);

CREATE TABLE habit_days (
    habit_id uuid NOT NULL REFERENCES habits(id), day_of_week varchar(255)
);

CREATE TABLE habit_logs (
    id uuid PRIMARY KEY, log_date date NOT NULL, status varchar(255) NOT NULL,
    habit_id uuid NOT NULL REFERENCES habits(id), UNIQUE(habit_id, log_date)
);

CREATE TABLE investments (
    id uuid PRIMARY KEY, ticker varchar(255) NOT NULL, name varchar(255) NOT NULL,
    type varchar(255) NOT NULL, quantity numeric(38,2) NOT NULL,
    average_price numeric(38,2) NOT NULL, current_price numeric(38,2) NOT NULL,
    goal_id uuid REFERENCES goals(id), user_id uuid NOT NULL REFERENCES users(id), version bigint
);

CREATE TABLE transactions (
    id uuid PRIMARY KEY, description varchar(255) NOT NULL, amount numeric(38,2) NOT NULL,
    date date NOT NULL, is_paid boolean NOT NULL, type varchar(255) NOT NULL,
    account_id uuid NOT NULL REFERENCES accounts(id), category_id uuid REFERENCES categories(id),
    is_system_managed boolean DEFAULT false, user_id uuid NOT NULL REFERENCES users(id),
    created_at timestamp(6) NOT NULL
);

CREATE TABLE invest_transactions (
    id uuid PRIMARY KEY, type varchar(255) NOT NULL, date timestamp(6) NOT NULL,
    quantity numeric(38,2) NOT NULL, price numeric(38,2) NOT NULL,
    total_value numeric(38,2) NOT NULL, fees numeric(38,2),
    investment_id uuid NOT NULL REFERENCES investments(id),
    bank_transaction_id uuid UNIQUE REFERENCES transactions(id)
);

CREATE TABLE monthly_plans (
    id uuid PRIMARY KEY, month integer NOT NULL, year integer NOT NULL,
    income_forecast numeric(38,2), user_id uuid NOT NULL REFERENCES users(id),
    UNIQUE(user_id, month, year)
);

CREATE TABLE plan_items (
    id uuid PRIMARY KEY, description varchar(255) NOT NULL, amount numeric(38,2) NOT NULL,
    due_date date, order_index integer, status varchar(255) NOT NULL,
    plan_id uuid NOT NULL REFERENCES monthly_plans(id), category_id uuid REFERENCES categories(id),
    card_id uuid REFERENCES credit_cards(id)
);

CREATE TABLE yearly_notes (
    id uuid PRIMARY KEY, note_year integer NOT NULL, content text, updated_at timestamp(6),
    user_id uuid NOT NULL REFERENCES users(id), UNIQUE(user_id, note_year)
);

CREATE TABLE shedlock (
    name varchar(64) PRIMARY KEY, lock_until timestamp(3) NOT NULL,
    locked_at timestamp(3) NOT NULL, locked_by varchar(255) NOT NULL
);

CREATE INDEX idx_accounts_user_order ON accounts (user_id, is_archived, order_index);
CREATE INDEX idx_categories_user_name ON categories (user_id, name);
CREATE INDEX idx_credit_cards_user_order ON credit_cards (user_id, order_index);
CREATE INDEX idx_card_transactions_invoice_legacy_order ON card_transactions (invoice_id, date DESC, created_at DESC, id DESC);
CREATE INDEX idx_goals_user_deadline ON goals (user_id, deadline);
CREATE INDEX idx_goal_history_goal_date ON goal_history (goal_id, date DESC);
CREATE INDEX idx_habits_user_order ON habits (user_id, order_index);
CREATE INDEX idx_investments_user ON investments (user_id);
CREATE INDEX idx_invest_transactions_investment_date ON invest_transactions (investment_id, date DESC, id DESC);
CREATE INDEX idx_plan_items_plan ON plan_items (plan_id);
CREATE INDEX idx_transactions_user_date ON transactions (user_id, date DESC, id DESC);

INSERT INTO users (
    id, nome, email, senha, dark_mode, privacy_mode, notif_contas, notif_semanal,
    dashboard_config, created_at, updated_at, reset_attempts
) VALUES (
    '10000000-0000-0000-0000-000000000001', 'Legado Sintetico',
    'legacy-cf017@example.test', 'synthetic-hash', true, false, true, false,
    '[{"id":"BALANCE","visible":true}]', '2025-01-02 03:04:05.123456',
    '2026-08-31 22:10:09.654321', 0
);

INSERT INTO accounts (id, name, type, balance, color, is_archived, order_index, user_id, version)
VALUES ('20000000-0000-0000-0000-000000000001', 'Conta Legada', 'CHECKING', 1000.25,
        '#112233', false, 0, '10000000-0000-0000-0000-000000000001', 0);

INSERT INTO categories (id, name, icon, color, type, is_system_reserved, user_id)
VALUES ('30000000-0000-0000-0000-000000000001', 'Categoria Legada', 'box', '#445566',
        'EXPENSE', false, '10000000-0000-0000-0000-000000000001');

INSERT INTO transactions (
    id, description, amount, date, is_paid, type, account_id, category_id,
    is_system_managed, user_id, created_at
) VALUES
    ('40000000-0000-0000-0000-000000000001', 'Texto nao prova origem 00:00', 10.01,
     '2026-09-07', true, 'EXPENSE', '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', false,
     '10000000-0000-0000-0000-000000000001', '2026-09-07 00:00:00.000000'),
    ('40000000-0000-0000-0000-000000000002', 'Outro texto sem heuristica', 20.02,
     '2026-09-07', false, 'EXPENSE', '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', true,
     '10000000-0000-0000-0000-000000000001', '2026-09-07 23:30:45.123456');

INSERT INTO credit_cards (
    id, name, last_4_digits, color, brand, card_limit, closing_day, due_day, order_index, user_id
) VALUES (
    '50000000-0000-0000-0000-000000000001', 'Cartao Legado', '1234', '#778899',
    'OTHER', 2000.00, 20, 25, 0, '10000000-0000-0000-0000-000000000001'
);

INSERT INTO invoices (id, month, year, status, card_id)
VALUES ('51000000-0000-0000-0000-000000000001', 9, 2026, 'OPEN',
        '50000000-0000-0000-0000-000000000001');

INSERT INTO card_transactions (
    id, description, amount, date, created_at, installment, total_installments,
    purchase_id, invoice_id, category_id
) VALUES
    ('52000000-0000-0000-0000-000000000001', 'Compra meia-noite ambigua', 30.03,
     '2026-09-07', '2026-09-07 00:00:00.000000', 1, 1,
     '53000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001'),
    ('52000000-0000-0000-0000-000000000002', 'Compra hora desconhecida', 40.04,
     '2026-09-07', '2026-09-07 23:30:45.123456', 1, 1,
     '53000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001');

INSERT INTO investments (
    id, ticker, name, type, quantity, average_price, current_price, user_id, version
) VALUES (
    '60000000-0000-0000-0000-000000000001', 'LEG3', 'Ativo Legado', 'STOCK',
    2.00, 50.00, 55.00, '10000000-0000-0000-0000-000000000001', 0
);

INSERT INTO invest_transactions (
    id, type, date, quantity, price, total_value, fees, investment_id, bank_transaction_id
) VALUES
    ('61000000-0000-0000-0000-000000000001', 'BUY', '2026-09-07 00:00:00.000000',
     1.00, 50.00, 50.00, 0.00, '60000000-0000-0000-0000-000000000001', NULL),
    ('61000000-0000-0000-0000-000000000002', 'BUY', '2026-09-07 23:30:45.123456',
     1.00, 50.00, 50.00, 0.00, '60000000-0000-0000-0000-000000000001',
     '40000000-0000-0000-0000-000000000002');
