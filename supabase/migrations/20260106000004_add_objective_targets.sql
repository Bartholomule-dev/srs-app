-- Add objective and targets columns to exercises table

-- objective: Learning target for each exercise (required)
ALTER TABLE exercises
ADD COLUMN objective TEXT;

-- targets: Array of subconcepts tested (for integrated exercises)
ALTER TABLE exercises
ADD COLUMN targets TEXT[];

-- Add comment documentation
COMMENT ON COLUMN exercises.objective IS 'Learning objective: what skill this exercise teaches';
COMMENT ON COLUMN exercises.targets IS 'Subconcepts tested by this exercise (required for integrated level)';
