'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/lib/errors';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';
import type { Achievement } from '@/lib/gamification/achievements';
import type { AppError } from '@/lib/errors';

/**
 * Database row shape from user_achievements table
 */
interface UserAchievementRow {
  achievement_slug: string;
  unlocked_at: string;
}

/**
 * Achievement with unlock status merged
 */
export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface UseAchievementsReturn {
  /** All achievements with unlock status */
  achievements: AchievementWithStatus[];
  /** Number of unlocked achievements */
  unlockedCount: number;
  /** Loading state */
  loading: boolean;
  /** Error if fetch failed */
  error: AppError | null;
  /** Check if a specific achievement is unlocked */
  isUnlocked: (slug: string) => boolean;
  /** Get unlock date for an achievement (null if not unlocked) */
  getUnlockedAt: (slug: string) => string | null;
  /** Manually refresh achievements */
  refetch: () => void;
}

export function useAchievements(): UseAchievementsReturn {
  const { user, loading: authLoading } = useAuth();
  const [userAchievements, setUserAchievements] = useState<UserAchievementRow[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setUserAchievements([]);
      setAchievementsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setAchievementsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('user_achievements')
          .select('achievement_slug, unlocked_at')
          .eq('user_id', user.id);

        if (cancelled) return;

        if (fetchError) {
          throw handleSupabaseError(fetchError);
        }

        setUserAchievements((data ?? []) as UserAchievementRow[]);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setUserAchievements([]);
      } finally {
        if (!cancelled) {
          setAchievementsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  // Create a map of unlocked achievements for fast lookup
  const unlockedMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ua of userAchievements) {
      map.set(ua.achievement_slug, ua.unlocked_at);
    }
    return map;
  }, [userAchievements]);

  // Merge achievement definitions with unlock status
  const achievements = useMemo((): AchievementWithStatus[] => {
    if (!user) return [];

    return Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      unlocked: unlockedMap.has(achievement.slug),
      unlockedAt: unlockedMap.get(achievement.slug) ?? null,
    }));
  }, [user, unlockedMap]);

  const unlockedCount = useMemo(() => userAchievements.length, [userAchievements]);

  const loading = authLoading || achievementsLoading;

  const isUnlocked = useCallback(
    (slug: string): boolean => {
      return unlockedMap.has(slug);
    },
    [unlockedMap]
  );

  const getUnlockedAt = useCallback(
    (slug: string): string | null => {
      return unlockedMap.get(slug) ?? null;
    },
    [unlockedMap]
  );

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    achievements,
    unlockedCount,
    loading,
    error,
    isUnlocked,
    getUnlockedAt,
    refetch,
  };
}
