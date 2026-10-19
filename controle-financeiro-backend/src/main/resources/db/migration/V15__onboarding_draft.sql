-- Draft snapshots only. No opening balances, financial facts or inferred provenance.
CREATE TABLE onboarding_sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    version bigint NOT NULL CHECK (version >= 1),
    status varchar(20) NOT NULL CHECK (status IN ('IN_PROGRESS', 'SKIPPED', 'COMPLETED')),
    payload text,
    issues text NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    CHECK (payload IS NOT NULL OR status = 'SKIPPED')
);
COMMENT ON COLUMN onboarding_sessions.payload IS
    'SPEC-001 v1 normalized draft including proposed current reservation confirmations; never validated domain evidence.';

-- Protected domain inventory contract. CF-030 owns authoritative population/revalidation.
-- No browser writer, backfill, guessed source, or permission is introduced by CF-029.
CREATE TABLE onboarding_reservation_records (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revision bigint NOT NULL CHECK (revision >= 0),
    attribution text NOT NULL,
    evidence text NOT NULL,
    recorded_at timestamp(6) with time zone NOT NULL
);
CREATE INDEX idx_onboarding_reservation_owner ON onboarding_reservation_records(user_id);
