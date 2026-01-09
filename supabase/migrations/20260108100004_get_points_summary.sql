-- RPC function to get points summary for a user
-- Part of Phase 3.1: Gamification Foundation

CREATE OR REPLACE FUNCTION get_points_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today_points INTEGER := 0;
  v_week_points INTEGER := 0;
  v_daily_cap INTEGER := 500;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get today's points
  SELECT COALESCE(SUM(points_earned), 0) INTO v_today_points
  FROM exercise_attempts
  WHERE user_id = p_user_id
    AND DATE(attempted_at) = v_today;

  -- Get week's points (within date range)
  SELECT COALESCE(SUM(points_earned), 0) INTO v_week_points
  FROM exercise_attempts
  WHERE user_id = p_user_id
    AND DATE(attempted_at) BETWEEN p_start_date AND p_end_date;

  RETURN json_build_object(
    'today', v_today_points,
    'this_week', v_week_points,
    'daily_cap', v_daily_cap,
    'daily_cap_reached', v_today_points >= v_daily_cap
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_points_summary TO authenticated;
COMMENT ON FUNCTION get_points_summary IS 'Get points summary for a user within a date range.';
