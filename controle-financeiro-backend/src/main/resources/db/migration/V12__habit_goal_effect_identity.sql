-- Add identity only for new contributions. Legacy text/date cannot prove origin.
ALTER TABLE habit_logs ADD COLUMN goal_history_id uuid;
ALTER TABLE habit_logs ADD COLUMN goal_effect_managed boolean NOT NULL DEFAULT false;
-- Do not infer a calculation watermark for legacy calendars.
ALTER TABLE habits ADD COLUMN streak_as_of date;
ALTER TABLE habit_logs ADD CONSTRAINT uk_habit_log_goal_history UNIQUE (goal_history_id);
ALTER TABLE habit_logs ADD CONSTRAINT fk_habit_log_goal_history
    FOREIGN KEY (goal_history_id) REFERENCES goal_history(id) ON DELETE SET NULL;

-- Deleting an intention leaves its calendar intact, without dangling linkage.
-- The legacy Hibernate schema has a generated FK name, unlike the V1 baseline.
-- Find only the goal_id -> goals FK; preserve all unrelated constraints.
DO $$
DECLARE existing_fk record;
BEGIN
    FOR existing_fk IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'habits'::regclass AND confrelid = 'goals'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                              WHERE attrelid = 'habits'::regclass AND attname = 'goal_id')]::smallint[]
    LOOP
        EXECUTE format('ALTER TABLE habits DROP CONSTRAINT %I', existing_fk.conname);
    END LOOP;
END $$;
ALTER TABLE habits ADD CONSTRAINT fk_habits_goal
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;
