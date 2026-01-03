// src/lib/hooks/useSession.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { mapExercise, mapUserProgress } from '@/lib/supabase/mappers';
import { getDueCards, getNewCards } from '@/lib/srs';
import { interleaveCards, type SessionCard, type SessionStats } from '@/lib/session';
import type { Quality, Exercise, UserProgress } from '@/lib/types';
import { AppError, ErrorCode } from '@/lib/errors';
import { handleSupabaseError } from '@/lib/errors/handleSupabaseError';
import { useAuth } from './useAuth';
import { useSRS } from './useSRS';
import { useToast } from '@/lib/context/ToastContext';

const NEW_CARDS_LIMIT = 5;

export interface UseSessionReturn {
  /** Combined due + new cards queue (with full Exercise data) */
  cards: SessionCard[];
  /** Position in queue (0-based) */
  currentIndex: number;
  /** Card at currentIndex (null if complete/empty) */
  currentCard: SessionCard | null;
  /** True when currentIndex >= cards.length */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** True while fetching exercises/progress */
  loading: boolean;
  /** Fetch error if any */
  error: AppError | null;
  /** Record answer + advance to next card */
  recordResult: (quality: Quality) => Promise<void>;
  /** Mark session complete early */
  endSession: () => void;
  /** Retry failed fetch */
  retry: () => void;
}

function createInitialStats(): SessionStats {
  return {
    total: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    startTime: new Date(),
    endTime: undefined,
  };
}

export function useSession(): UseSessionReturn {
  const { user, loading: authLoading } = useAuth();
  const { recordAnswer } = useSRS();
  const { showToast } = useToast();
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete = currentIndex >= cards.length && cards.length > 0;

  // Fetch exercises and progress, build session queue
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    // Capture user ID for use in async function (TypeScript flow analysis)
    const userId = user.id;
    let cancelled = false;

    async function fetchSessionData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch all exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');

        if (exercisesError) {
          throw handleSupabaseError(exercisesError);
        }

        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);

        if (progressError) {
          throw handleSupabaseError(progressError);
        }

        if (cancelled) return;

        // Map to app types
        const exercises: Exercise[] = (exercisesData ?? []).map(mapExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

        // Build exercise lookup map
        const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

        // Get due cards and convert to SessionCards
        const dueCards = getDueCards(progress);
        const dueSessionCards: SessionCard[] = dueCards
          .filter((dc) => exerciseMap.has(dc.exerciseId))
          .map((dc) => ({
            exercise: exerciseMap.get(dc.exerciseId)!,
            state: dc.state,
            isNew: false,
          }));

        // Get new cards and convert to SessionCards
        const newCards = getNewCards(exercises, progress, NEW_CARDS_LIMIT);
        const newSessionCards: SessionCard[] = newCards
          .filter((dc) => exerciseMap.has(dc.exerciseId))
          .map((dc) => ({
            exercise: exerciseMap.get(dc.exerciseId)!,
            state: dc.state,
            isNew: true,
          }));

        // Interleave new cards into due cards
        const sessionCards = interleaveCards(dueSessionCards, newSessionCards);

        setCards(sessionCards);
        setCurrentIndex(0);
        setStats({
          total: sessionCards.length,
          completed: 0,
          correct: 0,
          incorrect: 0,
          startTime: new Date(),
          endTime: undefined,
        });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AppError) {
          setError(err);
        } else {
          setError(
            new AppError(
              'Failed to load session data',
              ErrorCode.UNKNOWN,
              err instanceof Error ? err : undefined
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSessionData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey]);

  const recordResult = useCallback(
    async (quality: Quality) => {
      const card = cards[currentIndex];
      if (!card) return;

      const isCorrect = quality >= 3;
      const newCompleted = stats.completed + 1;
      const willComplete = newCompleted >= cards.length;

      // Update local stats immediately (optimistic)
      setStats((prev) => ({
        ...prev,
        completed: newCompleted,
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
        endTime: willComplete ? new Date() : undefined,
      }));

      // Advance to next card immediately
      setCurrentIndex((prev) => prev + 1);

      // Persist to database (fire-and-forget with error handling)
      try {
        await recordAnswer(card.exercise.id, quality);
      } catch {
        showToast({ type: 'error', message: 'Failed to save progress' });
        // Session continues even if save fails
      }
    },
    [cards, currentIndex, stats.completed, recordAnswer, showToast]
  );

  const endSession = useCallback(() => {
    // To be implemented in Task 6
  }, []);

  const retry = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  return {
    cards,
    currentIndex,
    currentCard,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  };
}
