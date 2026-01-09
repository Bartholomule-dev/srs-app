-- RPC function to repair user stats from exercise_attempts
-- Part of Phase 3.4: Polish & Admin Tools
-- This is an admin function for data repair scenarios

CREATE OR REPLACE FUNCTION repair_user_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_completed integer;
  v_total_points integer;
BEGIN
  -- Count correct attempts
  SELECT COUNT(*) INTO v_total_completed
  FROM exercise_attempts
  WHERE user_id = p_user_id AND is_correct = true;

  -- Sum points (COALESCE handles NULL from empty result)
  SELECT COALESCE(SUM(points_earned), 0) INTO v_total_points
  FROM exercise_attempts
  WHERE user_id = p_user_id;

  -- Update profile with recalculated values
  UPDATE profiles
  SET total_exercises_completed = v_total_completed
  WHERE id = p_user_id;

  RETURN json_build_object(
    'total_exercises_completed', v_total_completed,
    'total_points_recalculated', v_total_points
  );
END;
$$;

-- Grant execute to authenticated users (admin would call via service role)
GRANT EXECUTE ON FUNCTION repair_user_stats TO authenticated;

COMMENT ON FUNCTION repair_user_stats IS
  'Recalculates user stats from exercise_attempts for data repair. Returns total_exercises_completed and total_points_recalculated.';
