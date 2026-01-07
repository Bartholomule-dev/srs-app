-- Migrate subconcept_progress from SM-2 to FSRS
-- This is a COMPLETE migration - SM-2 columns will be removed

-- Step 1: Add new FSRS columns
ALTER TABLE subconcept_progress
ADD COLUMN IF NOT EXISTS stability double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS difficulty double precision DEFAULT 0,
ADD COLUMN IF NOT EXISTS fsrs_state smallint DEFAULT 0,
ADD COLUMN IF NOT EXISTS reps integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lapses integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS elapsed_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_days integer DEFAULT 0;

-- Step 2: Add check constraint for fsrs_state (0=New, 1=Learning, 2=Review, 3=Relearning)
ALTER TABLE subconcept_progress
ADD CONSTRAINT chk_fsrs_state CHECK (fsrs_state >= 0 AND fsrs_state <= 3);

-- Step 3: Drop legacy SM-2 columns
ALTER TABLE subconcept_progress
DROP COLUMN IF EXISTS ease_factor,
DROP COLUMN IF EXISTS interval,
DROP COLUMN IF EXISTS phase;

-- Step 4: Add comments
COMMENT ON COLUMN subconcept_progress.stability IS 'FSRS stability - information retention measure';
COMMENT ON COLUMN subconcept_progress.difficulty IS 'FSRS difficulty - content difficulty (0-10 range)';
COMMENT ON COLUMN subconcept_progress.fsrs_state IS 'FSRS state: 0=New, 1=Learning, 2=Review, 3=Relearning';
COMMENT ON COLUMN subconcept_progress.reps IS 'FSRS total review count';
COMMENT ON COLUMN subconcept_progress.lapses IS 'FSRS forgotten/incorrect count';
COMMENT ON COLUMN subconcept_progress.elapsed_days IS 'FSRS days since last review';
COMMENT ON COLUMN subconcept_progress.scheduled_days IS 'FSRS scheduled interval in days';

-- Step 5: Create index on fsrs_state for filtering
CREATE INDEX IF NOT EXISTS idx_subconcept_progress_fsrs_state ON subconcept_progress(fsrs_state);
