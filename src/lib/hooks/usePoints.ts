'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { handleSupabaseError } from '@/lib/errors';
import type { PointsSummary } from '@/lib/gamification/types';
import type { AppError } from '@/lib/errors';

/**
 * Get the Monday of the current week (ISO week start)
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // If Sunday (0), go back 6 days; otherwise go back (day - 1) days
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get the Sunday of the current week (ISO week end)
 */
function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // If Sunday (0), stay; otherwise add (7 - day) days
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export interface UsePointsReturn {
  summary: PointsSummary | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

/**
 * Hook to fetch user's points summary via the get_points_summary RPC
 */
export function usePoints(): UsePointsReturn {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPoints() {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const { data, error: rpcError } = await supabase.rpc('get_points_summary', {
          p_user_id: user!.id,
          p_start_date: getWeekStart(now),
          p_end_date: getWeekEnd(now),
        });

        if (cancelled) return;

        if (rpcError) {
          throw handleSupabaseError(rpcError);
        }

        setSummary({
          today: data.today,
          thisWeek: data.this_week,
          dailyCap: data.daily_cap,
          dailyCapReached: data.daily_cap_reached,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && 'code' in err) {
          setError(err as AppError);
        } else {
          setError(handleSupabaseError(err as Error));
        }
        setSummary(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPoints();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return { summary, loading: authLoading || loading, error, refetch };
}
