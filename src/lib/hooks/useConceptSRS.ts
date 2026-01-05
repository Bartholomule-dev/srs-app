'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import {
  getDueSubconcepts,
  selectExercise,
  calculateSubconceptReview,
  createInitialSubconceptState,
} from '@/lib/srs/concept-algorithm';
import { handleSupabaseError } from '@/lib/errors';
import type { SubconceptProgress, ExerciseAttempt, ConceptSlug } from '@/lib/curriculum/types';
import type { Exercise, Quality } from '@/lib/types';
import type { AppError } from '@/lib/errors';

/**
 * Database row type for subconcept_progress table
 */
interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  phase: 'learning' | 'review';
  ease_factor: number;
  interval: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for exercise_attempts table
 */
interface DbExerciseAttempt {
  id: string;
  user_id: string;
  exercise_slug: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string | null;
  created_at: string;
}

/**
 * Return type for useConceptSRS hook
 */
export interface UseConceptSRSReturn {
  dueSubconcepts: SubconceptProgress[];
  currentSubconcept: SubconceptProgress | null;
  loading: boolean;
  error: AppError | null;
  recordSubconceptResult: (
    subconceptSlug: string,
    quality: Quality,
    exerciseSlug: string,
    wasCorrect: boolean
  ) => Promise<void>;
  getNextExercise: (
    subconceptProgress: SubconceptProgress,
    exercises: Exercise[]
  ) => Exercise | null;
  refetch: () => void;
  remainingCount: number;
}

/**
 * Map database row to app type for SubconceptProgress
 */
function mapDbToSubconceptProgress(row: DbSubconceptProgress): SubconceptProgress {
  return {
    id: row.id,
    userId: row.user_id,
    subconceptSlug: row.subconcept_slug,
    conceptSlug: row.concept_slug as ConceptSlug,
    phase: row.phase,
    easeFactor: row.ease_factor,
    interval: row.interval,
    nextReview: new Date(row.next_review),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Map database row to app type for ExerciseAttempt
 */
function mapDbToExerciseAttempt(row: DbExerciseAttempt): ExerciseAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseSlug: row.exercise_slug,
    timesSeen: row.times_seen,
    timesCorrect: row.times_correct,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : new Date(),
  };
}

/**
 * Hook for concept-based SRS scheduling
 *
 * Manages subconcept progress:
 * - Fetches due subconcepts from subconcept_progress table
 * - Records results using SM-2 calculation
 * - Tracks exercise attempts
 * - Provides exercise selection using hybrid algorithm
 */
export function useConceptSRS(): UseConceptSRSReturn {
  const { user, loading: authLoading } = useAuth();
  const [dueSubconcepts, setDueSubconcepts] = useState<SubconceptProgress[]>([]);
  const [attemptCache, setAttemptCache] = useState<Map<string, ExerciseAttempt>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Fetch due subconcepts on mount and when trigger changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    (async () => {
      if (!user) {
        setDueSubconcepts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Fetch due subconcepts
      const { data, error: fetchError } = await supabase
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', now);

      if (cancelled) return;

      if (fetchError) {
        setError(handleSupabaseError(fetchError));
        setLoading(false);
        return;
      }

      // Map database rows to app types
      const progress: SubconceptProgress[] = (data || [])
        .map((row) => mapDbToSubconceptProgress(row as DbSubconceptProgress));

      // Use getDueSubconcepts to sort by most overdue first
      const sortedDue = getDueSubconcepts(progress, new Date());

      setDueSubconcepts(sortedDue);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, fetchTrigger]);

  // Refetch function
  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  /**
   * Record a subconcept review result
   *
   * 1. Gets or creates subconcept progress
   * 2. Calculates new SRS state using SM-2
   * 3. Upserts subconcept_progress
   * 4. Updates exercise_attempts
   * 5. Refreshes due list
   */
  const recordSubconceptResult = useCallback(
    async (
      subconceptSlug: string,
      quality: Quality,
      exerciseSlug: string,
      wasCorrect: boolean
    ): Promise<void> => {
      if (!user) {
        setError(handleSupabaseError(new Error('Must be authenticated')));
        return;
      }

      setError(null);

      // Find existing subconcept progress
      let currentProgress = dueSubconcepts.find(
        (p) => p.subconceptSlug === subconceptSlug
      );

      // If no progress exists, we need to fetch or create it
      if (!currentProgress) {
        const { data: existingData, error: fetchErr } = await supabase
          .from('subconcept_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('subconcept_slug', subconceptSlug)
          .single();

        if (fetchErr && fetchErr.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          setError(handleSupabaseError(fetchErr));
          return;
        }

        if (existingData) {
          currentProgress = mapDbToSubconceptProgress(existingData as DbSubconceptProgress);
        } else {
          // Need to determine concept_slug from exercise or default
          // For now, we'll need this to be passed in or derive it
          // This is a limitation - in practice, the caller should ensure
          // progress exists or we need the concept_slug
          currentProgress = createInitialSubconceptState(
            subconceptSlug,
            'foundations', // Default concept - caller should ensure progress exists
            user.id
          );
        }
      }

      // Calculate new SRS state
      const result = calculateSubconceptReview(quality, currentProgress);

      // Upsert subconcept progress
      const { error: upsertError } = await supabase
        .from('subconcept_progress')
        .upsert({
          user_id: user.id,
          subconcept_slug: subconceptSlug,
          concept_slug: currentProgress.conceptSlug,
          phase: result.phase,
          ease_factor: result.easeFactor,
          interval: result.interval,
          next_review: result.nextReview.toISOString(),
          last_reviewed: result.lastReviewed.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (upsertError) {
        setError(handleSupabaseError(upsertError));
        return;
      }

      // Update exercise attempts
      const existingAttempt = attemptCache.get(exerciseSlug);
      const timesSeen = (existingAttempt?.timesSeen ?? 0) + 1;
      const timesCorrect = (existingAttempt?.timesCorrect ?? 0) + (wasCorrect ? 1 : 0);

      const { data: attemptData, error: attemptError } = await supabase
        .from('exercise_attempts')
        .upsert({
          user_id: user.id,
          exercise_slug: exerciseSlug,
          times_seen: timesSeen,
          times_correct: timesCorrect,
          last_seen_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (attemptError) {
        // Non-critical error - log but don't fail
        console.error('Failed to update exercise attempts:', attemptError);
      } else if (attemptData) {
        // Update cache
        const mappedAttempt = mapDbToExerciseAttempt(attemptData as DbExerciseAttempt);
        setAttemptCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(exerciseSlug, mappedAttempt);
          return newCache;
        });
      }

      // Remove subconcept from due list (optimistic update)
      setDueSubconcepts((prev) =>
        prev.filter((p) => p.subconceptSlug !== subconceptSlug)
      );
    },
    [user, dueSubconcepts, attemptCache]
  );

  /**
   * Get next exercise for a subconcept using hybrid selection algorithm
   *
   * Learning phase: level progression (intro -> practice -> edge -> integrated)
   * Review phase: least-seen with random tie-breaking
   */
  const getNextExercise = useCallback(
    (subconceptProgress: SubconceptProgress, exercises: Exercise[]): Exercise | null => {
      // Fetch attempts for exercises in this subconcept
      const subconceptExerciseSlugs = exercises
        .filter((e) => e.subconcept === subconceptProgress.subconceptSlug)
        .map((e) => e.slug);

      // Build attempts array from cache
      const attempts: ExerciseAttempt[] = subconceptExerciseSlugs
        .map((slug) => attemptCache.get(slug))
        .filter((a): a is ExerciseAttempt => a !== undefined);

      return selectExercise(subconceptProgress, exercises, attempts);
    },
    [attemptCache]
  );

  const currentSubconcept = dueSubconcepts.length > 0 ? dueSubconcepts[0] : null;

  return {
    dueSubconcepts,
    currentSubconcept,
    loading: authLoading || loading,
    error,
    recordSubconceptResult,
    getNextExercise,
    refetch,
    remainingCount: dueSubconcepts.length,
  };
}
