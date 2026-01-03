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
 * - Increments total_exercises_completed
 * - Updates current_streak and longest_streak based on practice timing
 */
export async function updateProfileStats(
  input: UpdateProfileStatsInput
): Promise<void> {
  const { userId, exercisesCompleted, lastPracticed, now = new Date() } = input;

  // First, fetch current profile to get streak data
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, total_exercises_completed')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw handleSupabaseError(fetchError);
  }

  const currentProfile = profile as Pick<
    DbProfile,
    'current_streak' | 'longest_streak' | 'total_exercises_completed'
  >;

  // Calculate updated streak
  const streakUpdate = calculateUpdatedStreak({
    currentStreak: currentProfile.current_streak ?? 0,
    longestStreak: currentProfile.longest_streak ?? 0,
    lastPracticed,
    now,
  });

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
      total_exercises_completed:
        (currentProfile.total_exercises_completed ?? 0) + exercisesCompleted,
      updated_at: now.toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    throw handleSupabaseError(updateError);
  }
}
