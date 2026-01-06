import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/lib/errors';
import { calculateUpdatedStreak } from './streak';
import type { Database } from '@/lib/types/database.generated';

type DbProfile = Database['public']['Tables']['profiles']['Row'];

export interface UpdateProfileStatsInput {
  userId: string;
  exercisesCompleted: number;
  lastPracticed: Date | null;
  now?: Date;
}

/**
 * Updates profile statistics after a practice session.
 * - Atomically increments total_exercises_completed (prevents race conditions)
 * - Updates current_streak and longest_streak based on practice timing
 *
 * Uses PostgreSQL RPC function for atomic increment to handle concurrent
 * sessions (e.g., user with multiple tabs open).
 */
export async function updateProfileStats(
  input: UpdateProfileStatsInput
): Promise<void> {
  const { userId, exercisesCompleted, lastPracticed, now = new Date() } = input;

  // First, fetch current profile to get streak data for calculation
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw handleSupabaseError(fetchError);
  }

  const currentProfile = profile as Pick<
    DbProfile,
    'current_streak' | 'longest_streak'
  >;

  // Calculate updated streak
  const streakUpdate = calculateUpdatedStreak({
    currentStreak: currentProfile.current_streak ?? 0,
    longestStreak: currentProfile.longest_streak ?? 0,
    lastPracticed,
    now,
  });

  // Use atomic RPC to prevent race conditions
  const { error: rpcError } = await supabase.rpc('update_profile_stats_atomic', {
    p_user_id: userId,
    p_exercises_completed: exercisesCompleted,
    p_current_streak: streakUpdate.currentStreak,
    p_longest_streak: streakUpdate.longestStreak,
  });

  if (rpcError) {
    throw handleSupabaseError(rpcError);
  }
}
