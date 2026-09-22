-- CF-017 baseline: schema owned by the application immediately before the
-- temporal metadata adoption. Existing databases may be tagged as V1 only
-- after the documented schema preflight; this script is for empty databases.

CREATE TABLE users (
    id uuid NOT NULL,
    nome varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    senha varchar(255) NOT NULL,
    dark_mode boolean NOT NULL,
    privacy_mode boolean NOT NULL,
    notif_contas boolean DEFAULT true,
    notif_semanal boolean DEFAULT true,
    dashboard_config text,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    recovery_token varchar(255),
    recovery_token_expiry timestamp(6) without time zone,
    reset_attempts integer DEFAULT 0,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE accounts (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    type varchar(255) NOT NULL,
    balance numeric(38,2) NOT NULL,
    color varchar(255),
    is_archived boolean NOT NULL,
    order_index integer DEFAULT 0,
    user_id uuid NOT NULL,
    version bigint,
    CONSTRAINT pk_accounts PRIMARY KEY (id),
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE categories (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    icon varchar(255),
    color varchar(255),
    type varchar(255) NOT NULL,
    is_system_reserved boolean DEFAULT false,
    user_id uuid NOT NULL,
    CONSTRAINT pk_categories PRIMARY KEY (id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE credit_cards (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    last_4_digits varchar(4),
    color varchar(255),
    brand varchar(255),
    card_limit numeric(38,2) NOT NULL,
    closing_day integer NOT NULL,
    due_day integer NOT NULL,
    order_index integer,
    user_id uuid NOT NULL,
    CONSTRAINT pk_credit_cards PRIMARY KEY (id),
    CONSTRAINT fk_credit_cards_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE invoices (
    id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    status varchar(255) NOT NULL,
    card_id uuid NOT NULL,
    CONSTRAINT pk_invoices PRIMARY KEY (id),
    CONSTRAINT uk_invoices_card_period UNIQUE (card_id, month, year),
    CONSTRAINT fk_invoices_card FOREIGN KEY (card_id) REFERENCES credit_cards (id)
);

CREATE TABLE card_transactions (
    id uuid NOT NULL,
    description varchar(255) NOT NULL,
    amount numeric(38,2) NOT NULL,
    date date NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    installment integer,
    total_installments integer,
    purchase_id uuid,
    invoice_id uuid NOT NULL,
    category_id uuid NOT NULL,
    CONSTRAINT pk_card_transactions PRIMARY KEY (id),
    CONSTRAINT fk_card_transactions_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    CONSTRAINT fk_card_transactions_category FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE goals (
    id uuid NOT NULL,
    title varchar(255) NOT NULL,
    category varchar(255),
    icon varchar(255),
    color varchar(255),
    type varchar(255) NOT NULL,
    unit varchar(255),
    target_value numeric(38,2) NOT NULL,
    current_value numeric(38,2) NOT NULL,
    deadline date NOT NULL,
    use_checklist boolean DEFAULT false,
    order_index integer,
    user_id uuid NOT NULL,
    version bigint,
    CONSTRAINT pk_goals PRIMARY KEY (id),
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE goal_history (
    id uuid NOT NULL,
    date timestamp(6) without time zone,
    amount numeric(38,2) NOT NULL,
    note varchar(255),
    goal_id uuid NOT NULL,
    protocol jsonb,
    CONSTRAINT pk_goal_history PRIMARY KEY (id),
    CONSTRAINT fk_goal_history_goal FOREIGN KEY (goal_id) REFERENCES goals (id)
);

CREATE TABLE goal_items (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    suggested_model varchar(255),
    estimated_price numeric(38,2) NOT NULL,
    paid_price numeric(38,2),
    status varchar(255) NOT NULL,
    order_index integer,
    bank_transaction_id uuid,
    card_transaction_id uuid,
    used_goal_balance boolean DEFAULT false,
    goal_id uuid NOT NULL,
    CONSTRAINT pk_goal_items PRIMARY KEY (id),
    CONSTRAINT fk_goal_items_goal FOREIGN KEY (goal_id) REFERENCES goals (id)
);

CREATE TABLE habits (
    id uuid NOT NULL,
    name varchar(255) NOT NULL,
    description varchar(255),
    icon varchar(255) NOT NULL,
    color varchar(255) NOT NULL,
    current_streak integer NOT NULL,
    highest_streak integer NOT NULL,
    order_index integer,
    frequency varchar(255) NOT NULL,
    weekly_goal integer,
    user_id uuid NOT NULL,
    goal_id uuid,
    created_at timestamp(6) without time zone,
    CONSTRAINT pk_habits PRIMARY KEY (id),
    CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_habits_goal FOREIGN KEY (goal_id) REFERENCES goals (id)
);

CREATE TABLE habit_days (
    habit_id uuid NOT NULL,
    day_of_week varchar(255),
    CONSTRAINT fk_habit_days_habit FOREIGN KEY (habit_id) REFERENCES habits (id)
);

CREATE TABLE habit_logs (
    id uuid NOT NULL,
    log_date date NOT NULL,
    status varchar(255) NOT NULL,
    habit_id uuid NOT NULL,
    CONSTRAINT pk_habit_logs PRIMARY KEY (id),
    CONSTRAINT uk_habit_logs_habit_date UNIQUE (habit_id, log_date),
    CONSTRAINT fk_habit_logs_habit FOREIGN KEY (habit_id) REFERENCES habits (id)
);

CREATE TABLE investments (
    id uuid NOT NULL,
    ticker varchar(255) NOT NULL,
    name varchar(255) NOT NULL,
    type varchar(255) NOT NULL,
    quantity numeric(38,2) NOT NULL,
    average_price numeric(38,2) NOT NULL,
    current_price numeric(38,2) NOT NULL,
    goal_id uuid,
    user_id uuid NOT NULL,
    version bigint,
    CONSTRAINT pk_investments PRIMARY KEY (id),
    CONSTRAINT fk_investments_goal FOREIGN KEY (goal_id) REFERENCES goals (id),
    CONSTRAINT fk_investments_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE transactions (
    id uuid NOT NULL,
    description varchar(255) NOT NULL,
    amount numeric(38,2) NOT NULL,
    date date NOT NULL,
    is_paid boolean NOT NULL,
    type varchar(255) NOT NULL,
    account_id uuid NOT NULL,
    category_id uuid,
    is_system_managed boolean DEFAULT false,
    user_id uuid NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    CONSTRAINT pk_transactions PRIMARY KEY (id),
    CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id),
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE invest_transactions (
    id uuid NOT NULL,
    type varchar(255) NOT NULL,
    date timestamp(6) without time zone NOT NULL,
    quantity numeric(38,2) NOT NULL,
    price numeric(38,2) NOT NULL,
    total_value numeric(38,2) NOT NULL,
    fees numeric(38,2),
    investment_id uuid NOT NULL,
    bank_transaction_id uuid,
    CONSTRAINT pk_invest_transactions PRIMARY KEY (id),
    CONSTRAINT uk_invest_transactions_bank UNIQUE (bank_transaction_id),
    CONSTRAINT fk_invest_transactions_investment FOREIGN KEY (investment_id) REFERENCES investments (id),
    CONSTRAINT fk_invest_transactions_bank FOREIGN KEY (bank_transaction_id) REFERENCES transactions (id)
);

CREATE TABLE monthly_plans (
    id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    income_forecast numeric(38,2),
    user_id uuid NOT NULL,
    CONSTRAINT pk_monthly_plans PRIMARY KEY (id),
    CONSTRAINT uk_monthly_plans_user_period UNIQUE (user_id, month, year),
    CONSTRAINT fk_monthly_plans_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE plan_items (
    id uuid NOT NULL,
    description varchar(255) NOT NULL,
    amount numeric(38,2) NOT NULL,
    due_date date,
    order_index integer,
    status varchar(255) NOT NULL,
    plan_id uuid NOT NULL,
    category_id uuid,
    card_id uuid,
    CONSTRAINT pk_plan_items PRIMARY KEY (id),
    CONSTRAINT fk_plan_items_plan FOREIGN KEY (plan_id) REFERENCES monthly_plans (id),
    CONSTRAINT fk_plan_items_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_plan_items_card FOREIGN KEY (card_id) REFERENCES credit_cards (id)
);

CREATE TABLE yearly_notes (
    id uuid NOT NULL,
    note_year integer NOT NULL,
    content text,
    updated_at timestamp(6) without time zone,
    user_id uuid NOT NULL,
    CONSTRAINT pk_yearly_notes PRIMARY KEY (id),
    CONSTRAINT uk_yearly_notes_user_year UNIQUE (user_id, note_year),
    CONSTRAINT fk_yearly_notes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE shedlock (
    name varchar(64) NOT NULL,
    lock_until timestamp(3) without time zone NOT NULL,
    locked_at timestamp(3) without time zone NOT NULL,
    locked_by varchar(255) NOT NULL,
    CONSTRAINT pk_shedlock PRIMARY KEY (name)
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
