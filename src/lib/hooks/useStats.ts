'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { mapUserProgress, mapProfile } from '@/lib/supabase/mappers';
import { handleSupabaseError } from '@/lib/errors';
import { getCardsReviewedToday, getTotalAccuracy } from '@/lib/stats';
import type { UserStats } from '@/lib/stats';
import type { AppError } from '@/lib/errors';
import type { UserProgress, Profile, DbProfile, DbUserProgress } from '@/lib/types';

export interface UseStatsReturn {
  stats: UserStats | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

export function useStats(): UseStatsReturn {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStats(null);
      setStatsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setStatsLoading(true);
      setError(null);

      try {
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) {
          throw handleSupabaseError(progressError);
        }

        if (cancelled) return;

        // Fetch profile for streak data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          throw handleSupabaseError(profileError);
        }

        if (cancelled) return;

        const progress: UserProgress[] = (progressData ?? []).map((p) =>
          mapUserProgress(p as DbUserProgress)
        );
        const profile: Profile = mapProfile(profileData as DbProfile);

        const userStats: UserStats = {
          cardsReviewedToday: getCardsReviewedToday(progress),
          accuracyPercent: getTotalAccuracy(progress),
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          totalExercisesCompleted: profile.totalExercisesCompleted,
        };

        setStats(userStats);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setStats(null);
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  // Loading is true if auth is loading OR stats are loading
  const loading = authLoading || statsLoading;

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { stats, loading, error, refetch };
}
