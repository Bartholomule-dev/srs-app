-- Add code column for predict-output exercises
-- This stores the read-only code snippet users must predict output for

ALTER TABLE exercises
ADD COLUMN code TEXT;

-- Comment for documentation
COMMENT ON COLUMN exercises.code IS 'Code snippet for predict-output exercises (read-only display)';
