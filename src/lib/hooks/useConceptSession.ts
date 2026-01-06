'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useConceptSRS } from './useConceptSRS';
import { useToast } from '@pikoloo/darwin-ui';
import { createClient } from '@/lib/supabase/client';
import { mapExercise } from '@/lib/supabase/mappers';
import { handleSupabaseError, AppError } from '@/lib/errors';
import { updateProfileStats } from '@/lib/stats';
import type { Exercise, Quality } from '@/lib/types';
import type { SessionCard, SessionStats } from '@/lib/session/types';
import type { ExercisePattern, SubconceptProgress } from '@/lib/curriculum/types';

/** Limit on new subconcepts introduced per session */
const NEW_SUBCONCEPTS_LIMIT = 5;

interface ConceptSessionCard extends Omit<SessionCard, 'state'> {
  /** The subconcept this exercise belongs to */
  subconceptProgress: SubconceptProgress;
}

export interface UseConceptSessionReturn {
  /** All cards in the session (for progress display) */
  cards: ConceptSessionCard[];
  /** Index of current card */
  currentIndex: number;
  /** Current card being displayed */
  currentCard: ConceptSessionCard | null;
  /** Session is complete */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: AppError | null;
  /** Record result for current card */
  recordResult: (quality: Quality) => Promise<void>;
  /** End session early */
  endSession: () => Promise<void>;
  /** Retry loading session */
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

/**
 * useConceptSession - Session management using concept-based SRS
 *
 * Uses subconcept-level SRS scheduling instead of exercise-level.
 * For each due subconcept, selects an exercise using the hybrid algorithm:
 * - Learning phase: level progression (intro → practice → edge → integrated)
 * - Review phase: least-seen with randomization
 */
export function useConceptSession(): UseConceptSessionReturn {
  const { user, loading: authLoading } = useAuth();
  const {
    dueSubconcepts,
    loading: srsLoading,
    error: srsError,
    recordSubconceptResult,
    getNextExercise,
    refetch: refetchSRS,
  } = useConceptSRS();
  const { showToast } = useToast();

  const supabase = useMemo(() => createClient(), []);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [cards, setCards] = useState<ConceptSessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [forceComplete, setForceComplete] = useState(false);
  const [lastPattern, setLastPattern] = useState<ExercisePattern | null>(null);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete =
    forceComplete || (currentIndex >= cards.length && cards.length > 0);

  // Fetch all exercises on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchExercises() {
      try {
        const { data, error: fetchError } = await supabase
          .from('exercises')
          .select('*');

        if (cancelled) return;

        if (fetchError) {
          throw handleSupabaseError(fetchError);
        }

        const mappedExercises = (data ?? []).map(mapExercise);
        setExercises(mappedExercises);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? handleSupabaseError(err) : null);
      }
    }

    fetchExercises();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, fetchKey, supabase]);

  // Build session cards when due subconcepts and exercises are ready
  useEffect(() => {
    if (srsLoading || exercises.length === 0) return;

    // Build session cards by selecting an exercise for each due subconcept
    const sessionCards: ConceptSessionCard[] = [];

    for (const subconceptProgress of dueSubconcepts) {
      const exercise = getNextExercise(subconceptProgress, exercises);
      if (exercise) {
        sessionCards.push({
          exercise,
          subconceptProgress,
          isNew: subconceptProgress.phase === 'learning' && subconceptProgress.interval === 0,
        });
      }
    }

    // Also add new subconcepts the user hasn't started yet
    // Find subconcepts in exercises that don't have progress
    const dueSubconceptSlugs = new Set(dueSubconcepts.map((s) => s.subconceptSlug));
    const exercisesBySubconcept = new Map<string, Exercise[]>();

    for (const exercise of exercises) {
      if (exercise.subconcept && !dueSubconceptSlugs.has(exercise.subconcept)) {
        const existing = exercisesBySubconcept.get(exercise.subconcept) ?? [];
        existing.push(exercise);
        exercisesBySubconcept.set(exercise.subconcept, existing);
      }
    }

    // Pick intro exercises for new subconcepts (limit to NEW_SUBCONCEPTS_LIMIT)
    let newSubconceptsAdded = 0;
    for (const [subconcept, subconceptExercises] of exercisesBySubconcept) {
      if (newSubconceptsAdded >= NEW_SUBCONCEPTS_LIMIT) break;

      // Find an intro-level exercise
      const introExercise = subconceptExercises.find((e) => e.level === 'intro');
      if (introExercise) {
        // Create temporary progress for new subconcept
        const newProgress: SubconceptProgress = {
          id: `new-${subconcept}`,
          userId: user?.id ?? '',
          subconceptSlug: subconcept,
          conceptSlug: introExercise.concept,
          phase: 'learning',
          easeFactor: 2.5,
          interval: 0,
          nextReview: new Date(),
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        sessionCards.push({
          exercise: introExercise,
          subconceptProgress: newProgress,
          isNew: true,
        });
        newSubconceptsAdded++;
      }
    }

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
    setLoading(false);
  }, [dueSubconcepts, exercises, srsLoading, getNextExercise, user?.id]);

  // Set error from SRS hook
  useEffect(() => {
    if (srsError) {
      setError(srsError);
    }
  }, [srsError]);

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

      // Track pattern for anti-repeat
      setLastPattern(card.exercise.pattern);

      // Persist to database via concept SRS
      try {
        await recordSubconceptResult(
          card.subconceptProgress.subconceptSlug,
          card.subconceptProgress.conceptSlug,
          quality,
          card.exercise.slug,
          isCorrect
        );
      } catch {
        showToast('Failed to save progress', { type: 'error' });
        // Session continues even if save fails
      }
    },
    [cards, currentIndex, stats.completed, recordSubconceptResult, showToast]
  );

  const endSession = useCallback(async () => {
    setForceComplete(true);
    setStats((prev) => ({
      ...prev,
      endTime: new Date(),
    }));

    // Update profile stats if any cards were completed
    if (stats.completed > 0 && user) {
      try {
        await updateProfileStats({
          userId: user.id,
          exercisesCompleted: stats.completed,
          lastPracticed: new Date(),
        });
      } catch {
        showToast('Failed to update stats', { type: 'error' });
      }
    }
  }, [stats.completed, user, showToast]);

  const retry = useCallback(() => {
    setFetchKey((k) => k + 1);
    refetchSRS();
  }, [refetchSRS]);

  return {
    cards,
    currentIndex,
    currentCard,
    isComplete,
    stats,
    loading: authLoading || srsLoading || loading,
    error,
    recordResult,
    endSession,
    retry,
  };
}
