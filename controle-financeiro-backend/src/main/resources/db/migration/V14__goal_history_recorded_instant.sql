-- Additive: preserve every legacy date, including null. No inferred backfill/default.
ALTER TABLE goal_history ADD COLUMN recorded_at timestamp(6) with time zone;
