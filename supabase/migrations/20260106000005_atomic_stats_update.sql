-- Atomic profile stats update to prevent race conditions
-- This fixes a bug where concurrent sessions (multiple tabs) could cause
-- lost updates to total_exercises_completed due to read-then-write pattern.

CREATE OR REPLACE FUNCTION update_profile_stats_atomic(
  p_user_id UUID,
  p_exercises_completed INT,
  p_current_streak INT,
  p_longest_streak INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET
    total_exercises_completed = COALESCE(total_exercises_completed, 0) + p_exercises_completed,
    current_streak = p_current_streak,
    longest_streak = p_longest_streak,
    updated_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$
