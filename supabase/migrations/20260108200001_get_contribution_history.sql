-- RPC function to get contribution graph data
-- Returns daily aggregates of exercise attempts for a user within a date range

CREATE OR REPLACE FUNCTION get_contribution_history(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'date', activity_date,
        'count', attempt_count,
        'accuracy', CASE
          WHEN attempt_count > 0 THEN ROUND((correct_count::FLOAT / attempt_count) * 100)
          ELSE NULL
        END
      )
      ORDER BY activity_date
    ),
    '[]'::json
  ) INTO v_result
  FROM (
    SELECT
      DATE(attempted_at) AS activity_date,
      COUNT(*) AS attempt_count,
      COUNT(*) FILTER (WHERE is_correct = TRUE) AS correct_count
    FROM exercise_attempts
    WHERE user_id = p_user_id
      AND DATE(attempted_at) BETWEEN p_start_date AND p_end_date
      AND is_correct IS NOT NULL -- Exclude teaching cards
    GROUP BY DATE(attempted_at)
  ) daily_stats;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_contribution_history TO authenticated;

COMMENT ON FUNCTION get_contribution_history IS
  'Get contribution graph data for a user within a date range.';
