-- Grant execute permission to authenticated users for atomic stats update
GRANT EXECUTE ON FUNCTION update_profile_stats_atomic(UUID, INT, INT, INT) TO authenticated;
