-- Candidate only: exercised against synthetic legacy tables, NOT a production migration.
-- No default and no backfill: absent provenance and historical audit remain NULL.
ALTER TABLE transactions ADD COLUMN operation_time time(0), ADD COLUMN time_origin varchar(255),
    ADD COLUMN recorded_at timestamp(6) with time zone, ADD COLUMN legacy_created_at_raw timestamp(6);
ALTER TABLE card_transactions ADD COLUMN operation_time time(0), ADD COLUMN time_origin varchar(255),
    ADD COLUMN recorded_at timestamp(6) with time zone, ADD COLUMN legacy_created_at_raw timestamp(6);
ALTER TABLE invest_transactions ADD COLUMN operation_date date, ADD COLUMN date_origin varchar(255);
