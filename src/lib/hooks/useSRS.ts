'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapUserProgress, cardStateToProgressUpdate } from '@/lib/supabase/mappers';
import { calculateNextReview, createInitialCardState } from '@/lib/srs';
import { handleSupabaseError } from '@/lib/errors';
import type { DueCard } from '@/lib/srs';
import type { Quality, DbUserProgress } from '@/lib/types';
import type { AppError } from '@/lib/errors';

interface UseSRSReturn {
  dueCards: DueCard[];
  currentCard: DueCard | null;
  loading: boolean;
  error: AppError | null;
  recordAnswer: (exerciseId: string, quality: Quality) => Promise<void>;
  refetch: () => void;
  remainingCount: number;
}

export function useSRS(): UseSRSReturn {
  const { user, loading: authLoading } = useAuth();
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    // Only fetch cards when auth is done loading
    if (authLoading) {
      return;
    }

    // Use an IIFE to handle the async operation
    let cancelled = false;

    (async () => {
      if (!user) {
        setDueCards([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      const { data, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', now);

      if (cancelled) return;

      if (fetchError) {
        setError(handleSupabaseError(fetchError));
        setLoading(false);
        return;
      }

      const cards: DueCard[] = (data || [])
        .map((row) => {
          const progress = mapUserProgress(row as DbUserProgress);
          return {
            exerciseId: progress.exerciseId,
            state: {
              easeFactor: progress.easeFactor,
              interval: progress.interval,
              repetitions: progress.repetitions,
              nextReview: new Date(progress.nextReview),
              lastReviewed: progress.lastReviewed ? new Date(progress.lastReviewed) : null,
            },
            isNew: false,
          };
        })
        .sort((a, b) => a.state.nextReview.getTime() - b.state.nextReview.getTime());

      setDueCards(cards);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, fetchTrigger]);

  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  const recordAnswer = useCallback(
    async (exerciseId: string, quality: Quality): Promise<void> => {
      if (!user) {
        setError(handleSupabaseError(new Error('Must be authenticated')));
        return;
      }

      setError(null);

      // Find existing card state or create initial
      const existingCard = dueCards.find((c) => c.exerciseId === exerciseId);
      const currentState = existingCard?.state ?? createInitialCardState();

      // Calculate new state
      const result = calculateNextReview(quality, currentState);
      const dbUpdate = cardStateToProgressUpdate(result.newState);

      // Increment counters
      const existingProgress = existingCard
        ? await supabase
            .from('user_progress')
            .select('times_seen, times_correct')
            .eq('user_id', user.id)
            .eq('exercise_id', exerciseId)
            .single()
        : null;

      const timesSeen = ((existingProgress?.data?.times_seen as number) || 0) + 1;
      const timesCorrect = ((existingProgress?.data?.times_correct as number) || 0) + (result.wasCorrect ? 1 : 0);

      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          exercise_id: exerciseId,
          ...dbUpdate,
          times_seen: timesSeen,
          times_correct: timesCorrect,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (upsertError) {
        setError(handleSupabaseError(upsertError));
        return;
      }

      // Remove card from due list (optimistic update)
      setDueCards((prev) => prev.filter((c) => c.exerciseId !== exerciseId));
    },
    [user, dueCards]
  );

  const currentCard = dueCards.length > 0 ? dueCards[0] : null;

  return {
    dueCards,
    currentCard,
    loading: authLoading || loading,
    error,
    recordAnswer,
    refetch,
    remainingCount: dueCards.length,
  };
}
