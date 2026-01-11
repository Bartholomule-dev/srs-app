'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface UseLanguageStatsReturn {
  accuracy: number;
  totalExercises: number;
  exercisesToday: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching per-language statistics.
 *
 * This hook returns stats filtered by language (accuracy, total exercises, exercises today).
 * For global stats (streak, lifetime totals), use useStats instead.
 *
 * @param language - The programming language to get stats for (default: 'python')
 * @returns Language-specific statistics
 */
export function useLanguageStats(language: string = 'python'): UseLanguageStatsReturn {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['languageStats', user?.id, language],
    queryFn: async () => {
      if (!user) return { accuracy: 0, totalExercises: 0, exercisesToday: 0 };

      const { data, error } = await supabase
        .from('exercise_attempts')
        .select('times_seen, times_correct, last_seen_at')
        .eq('user_id', user.id)
        .eq('language', language);

      if (error) throw error;

      const totalSeen = data?.reduce((sum, a) => sum + a.times_seen, 0) ?? 0;
      const totalCorrect = data?.reduce((sum, a) => sum + a.times_correct, 0) ?? 0;
      const accuracy = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

      const today = new Date().toDateString();
      const exercisesToday =
        data?.filter((a) => a.last_seen_at && new Date(a.last_seen_at).toDateString() === today)
          .length ?? 0;

      return {
        accuracy,
        totalExercises: totalSeen,
        exercisesToday,
      };
    },
    enabled: !authLoading && !!user,
    staleTime: 60_000,
  });

  return {
    accuracy: query.data?.accuracy ?? 0,
    totalExercises: query.data?.totalExercises ?? 0,
    exercisesToday: query.data?.exercisesToday ?? 0,
    isLoading: authLoading || query.isLoading,
    error: query.error as Error | null,
  };
}
