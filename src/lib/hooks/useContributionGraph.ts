'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { handleSupabaseError } from '@/lib/errors';
import type { ContributionDay } from '@/lib/gamification/contribution';
import { getContributionLevel } from '@/lib/gamification/contribution';
import type { AppError } from '@/lib/errors';

export interface UseContributionGraphReturn {
  days: ContributionDay[];
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
  /** Current streak from consecutive recent activity */
  currentStreakDays: number;
}

/**
 * Get date 52 weeks ago for contribution graph start
 */
function getYearAgoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 364); // 52 weeks
  return d.toISOString().split('T')[0];
}

/**
 * Calculate current streak from consecutive recent days
 */
function calculateStreakFromDays(days: ContributionDay[]): number {
  if (days.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const daysSet = new Set(days.map((d) => d.date));

  let streak = 0;
  const currentDate = new Date(today);

  // Check if today has activity, if not start from yesterday
  if (!daysSet.has(today)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (daysSet.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export function useContributionGraph(): UseContributionGraphReturn {
  const { user, loading: authLoading } = useAuth();
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setDays([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchContributionData() {
      setLoading(true);
      setError(null);

      try {
        const startDate = getYearAgoDate();
        const endDate = new Date().toISOString().split('T')[0];

        const { data, error: rpcError } = await supabase.rpc('get_contribution_history', {
          p_user_id: user!.id,
          p_start_date: startDate,
          p_end_date: endDate,
        });

        if (cancelled) return;

        if (rpcError) {
          throw handleSupabaseError(rpcError);
        }

        const mappedDays: ContributionDay[] = (data ?? []).map(
          (d: { date: string; count: number; accuracy: number | null }) => ({
            date: d.date,
            count: d.count,
            accuracy: d.accuracy,
            level: getContributionLevel(d.count),
          })
        );

        setDays(mappedDays);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setDays([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchContributionData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  const currentStreakDays = useMemo(() => calculateStreakFromDays(days), [days]);

  return { days, loading: authLoading || loading, error, refetch, currentStreakDays };
}
