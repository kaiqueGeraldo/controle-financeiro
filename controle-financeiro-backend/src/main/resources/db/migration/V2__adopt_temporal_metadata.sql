-- Additive adoption only. Historical provenance and audit instants remain
-- unknown (NULL); created_at/date keep their original bytes and meaning.
ALTER TABLE transactions
    ADD COLUMN operation_time time(0) without time zone,
    ADD COLUMN time_origin varchar(32),
    ADD COLUMN recorded_at timestamp(6) with time zone,
    ADD COLUMN legacy_created_at_raw timestamp(6) without time zone,
    ADD CONSTRAINT ck_transactions_time_origin
        CHECK (time_origin IS NULL OR time_origin IN ('USER_INPUT', 'NOT_PROVIDED'));

ALTER TABLE card_transactions
    ADD COLUMN operation_time time(0) without time zone,
    ADD COLUMN time_origin varchar(32),
    ADD COLUMN recorded_at timestamp(6) with time zone,
    ADD COLUMN legacy_created_at_raw timestamp(6) without time zone,
    ADD CONSTRAINT ck_card_transactions_time_origin
        CHECK (time_origin IS NULL OR time_origin IN ('USER_INPUT', 'NOT_PROVIDED'));

ALTER TABLE invest_transactions
    ADD COLUMN operation_date date,
    ADD COLUMN date_origin varchar(32),
    ADD CONSTRAINT ck_invest_transactions_date_origin
        CHECK (date_origin IS NULL OR date_origin IN ('USER_INPUT', 'PRODUCT_CALENDAR'));

-- These indexes match the canonical global order: civil date, known wall
-- time before unknown, wall time descending and stable UUID tie-breaker.
-- Regular CREATE INDEX keeps this migration transactional; production must
-- measure real volume first because it takes a write-blocking table lock.
CREATE INDEX idx_transactions_user_temporal_order
    ON transactions (user_id, date DESC, (operation_time IS NULL), operation_time DESC, id DESC);

CREATE INDEX idx_card_transactions_invoice_temporal_order
    ON card_transactions (invoice_id, date DESC, (operation_time IS NULL), operation_time DESC, id DESC);
