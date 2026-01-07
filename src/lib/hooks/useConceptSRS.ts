'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { selectExercise, mapFSRSStateToPhase, type SubconceptSelectionInfo } from '@/lib/srs/exercise-selection';
import { reviewCard, createEmptyFSRSCard, progressToCardState } from '@/lib/srs/fsrs/adapter';
import { qualityToRating } from '@/lib/srs/fsrs/mapping';
import { STATE_MAP, STATE_REVERSE_MAP } from '@/lib/srs/fsrs/types';
import { getTargetsToCredit, getTargetsToPenalize } from '@/lib/srs/multi-target';
import { handleSupabaseError } from '@/lib/errors';
import type { SubconceptProgress, ExerciseAttempt, ConceptSlug, ExercisePattern } from '@/lib/curriculum/types';
import type { Exercise, Quality } from '@/lib/types';
import type { AppError } from '@/lib/errors';
import type { FSRSState } from '@/lib/srs/fsrs/types';

/**
 * Database row type for subconcept_progress table (FSRS schema)
 */
interface DbSubconceptProgress {
  id: string;
  user_id: string;
  subconcept_slug: string;
  concept_slug: string;
  stability: number | null;
  difficulty: number | null;
  fsrs_state: number | null;
  reps: number | null;
  lapses: number | null;
  elapsed_days: number | null;
  scheduled_days: number | null;
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
    conceptSlug: ConceptSlug,
    quality: Quality,
    exerciseSlug: string,
    wasCorrect: boolean,
    targets?: string[] | null
  ) => Promise<void>;
  getNextExercise: (
    subconceptProgress: SubconceptProgress,
    exercises: Exercise[],
    lastPattern?: ExercisePattern | null
  ) => Exercise | null;
  refetch: () => void;
  remainingCount: number;
}

/**
 * Map database row to app type for SubconceptProgress (FSRS schema)
 */
function mapDbToSubconceptProgress(row: DbSubconceptProgress): SubconceptProgress {
  return {
    id: row.id,
    userId: row.user_id,
    subconceptSlug: row.subconcept_slug,
    conceptSlug: row.concept_slug as ConceptSlug,
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    fsrsState: (row.fsrs_state ?? 0) as 0 | 1 | 2 | 3,
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    elapsedDays: row.elapsed_days ?? 0,
    scheduledDays: row.scheduled_days ?? 0,
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
 * Get due subconcepts sorted by most overdue first
 */
function getDueSubconcepts(progress: SubconceptProgress[], now: Date): SubconceptProgress[] {
  return progress
    .filter((p) => p.nextReview <= now)
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
}

/**
 * Create initial subconcept state using FSRS empty card
 */
function createInitialSubconceptState(
  subconceptSlug: string,
  conceptSlug: ConceptSlug,
  userId: string
): SubconceptProgress {
  const card = createEmptyFSRSCard(new Date());
  return {
    id: '', // Will be assigned by database
    userId,
    subconceptSlug,
    conceptSlug,
    stability: card.stability,
    difficulty: card.difficulty,
    fsrsState: STATE_MAP[card.state] as 0 | 1 | 2 | 3,
    reps: card.reps,
    lapses: card.lapses,
    elapsedDays: card.elapsedDays,
    scheduledDays: card.scheduledDays,
    nextReview: card.due,
    lastReviewed: card.lastReview,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Hook for concept-based SRS scheduling
 *
 * Manages subconcept progress:
 * - Fetches due subconcepts from subconcept_progress table
 * - Records results using FSRS algorithm
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

  // Fetch due subconcepts and exercise attempts on mount and when trigger changes
  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    (async () => {
      if (!user) {
        setDueSubconcepts([]);
        setAttemptCache(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Fetch due subconcepts and exercise attempts in parallel
      const [subconceptResult, attemptsResult] = await Promise.all([
        supabase
          .from('subconcept_progress')
          .select('*')
          .eq('user_id', user.id)
          .lte('next_review', now),
        supabase
          .from('exercise_attempts')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (cancelled) return;

      if (subconceptResult.error) {
        setError(handleSupabaseError(subconceptResult.error));
        setLoading(false);
        return;
      }

      // Map database rows to app types
      const progress: SubconceptProgress[] = (subconceptResult.data || [])
        .map((row) => mapDbToSubconceptProgress(row as DbSubconceptProgress));

      // Use getDueSubconcepts to sort by most overdue first
      const sortedDue = getDueSubconcepts(progress, new Date());

      setDueSubconcepts(sortedDue);

      // Load exercise attempts into cache (non-critical - log but don't fail)
      if (attemptsResult.error) {
        console.warn('Failed to load exercise attempts:', attemptsResult.error);
      } else {
        const attemptsMap = new Map<string, ExerciseAttempt>();
        for (const row of attemptsResult.data || []) {
          const attempt = mapDbToExerciseAttempt(row as DbExerciseAttempt);
          attemptsMap.set(attempt.exerciseSlug, attempt);
        }
        setAttemptCache(attemptsMap);
      }

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
   * 2. Calculates new SRS state using FSRS
   * 3. Upserts subconcept_progress
   * 4. Updates exercise_attempts
   * 5. Refreshes due list
   */
  const recordSubconceptResult = useCallback(
    async (
      subconceptSlug: string,
      conceptSlug: ConceptSlug,
      quality: Quality,
      exerciseSlug: string,
      wasCorrect: boolean,
      targets: string[] | null = null
    ): Promise<void> => {
      if (!user) {
        setError(handleSupabaseError(new Error('Must be authenticated')));
        return;
      }

      setError(null);

      // Determine which subconcepts to update
      const subconceptsToUpdate = wasCorrect
        ? getTargetsToCredit(targets, subconceptSlug, wasCorrect)
        : getTargetsToPenalize(targets, subconceptSlug, wasCorrect);

      // Update each targeted subconcept
      for (const targetSlug of subconceptsToUpdate) {
        // Find existing progress for this target
        let targetProgress = dueSubconcepts.find(
          (p) => p.subconceptSlug === targetSlug
        );

        // If no progress exists, fetch or create it
        if (!targetProgress) {
          const { data: existingData, error: fetchErr } = await supabase
            .from('subconcept_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('subconcept_slug', targetSlug)
            .single();

          if (fetchErr && fetchErr.code !== 'PGRST116') {
            console.error(`Failed to fetch progress for ${targetSlug}:`, fetchErr);
            continue;
          }

          if (existingData) {
            targetProgress = mapDbToSubconceptProgress(existingData as DbSubconceptProgress);
          } else {
            // Create initial state
            targetProgress = createInitialSubconceptState(
              targetSlug,
              conceptSlug, // Use same concept for new subconcepts
              user.id
            );
          }
        }

        // Convert quality to FSRS rating
        const rating = qualityToRating(quality);

        // Convert progress to FSRS card state
        const cardState = progressToCardState({
          stability: targetProgress.stability,
          difficulty: targetProgress.difficulty,
          fsrsState: STATE_REVERSE_MAP[targetProgress.fsrsState] as FSRSState,
          due: targetProgress.nextReview,
          lastReview: targetProgress.lastReviewed,
          reps: targetProgress.reps,
          lapses: targetProgress.lapses,
          elapsedDays: targetProgress.elapsedDays,
          scheduledDays: targetProgress.scheduledDays,
        });

        // Calculate new SRS state using FSRS
        const result = reviewCard(cardState, rating);

        // Upsert subconcept progress with FSRS fields
        const { error: upsertError } = await supabase
          .from('subconcept_progress')
          .upsert({
            user_id: user.id,
            subconcept_slug: targetSlug,
            concept_slug: targetProgress.conceptSlug,
            stability: result.cardState.stability,
            difficulty: result.cardState.difficulty,
            fsrs_state: STATE_MAP[result.cardState.state],
            reps: result.cardState.reps,
            lapses: result.cardState.lapses,
            elapsed_days: result.cardState.elapsedDays,
            scheduled_days: result.cardState.scheduledDays,
            next_review: result.cardState.due.toISOString(),
            last_reviewed: result.cardState.lastReview?.toISOString() ?? new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (upsertError) {
          console.error(`Failed to update progress for ${targetSlug}:`, upsertError);
        }
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

      // Remove all updated subconcepts from due list (optimistic update)
      const updatedSlugs = new Set(subconceptsToUpdate);
      setDueSubconcepts((prev) =>
        prev.filter((p) => !updatedSlugs.has(p.subconceptSlug))
      );
    },
    [user, dueSubconcepts, attemptCache]
  );

  /**
   * Get next exercise for a subconcept using hybrid selection algorithm
   *
   * Learning phase: level progression (intro -> practice -> edge -> integrated)
   * Review phase: least-seen with random tie-breaking
   * Anti-repeat: avoids same pattern as lastPattern when possible
   */
  const getNextExercise = useCallback(
    (
      subconceptProgress: SubconceptProgress,
      exercises: Exercise[],
      lastPattern?: ExercisePattern | null
    ): Exercise | null => {
      // Fetch attempts for exercises in this subconcept
      const subconceptExerciseSlugs = exercises
        .filter((e) => e.subconcept === subconceptProgress.subconceptSlug)
        .map((e) => e.slug);

      // Build attempts array from cache
      const attempts: ExerciseAttempt[] = subconceptExerciseSlugs
        .map((slug) => attemptCache.get(slug))
        .filter((a): a is ExerciseAttempt => a !== undefined);

      // Convert SubconceptProgress to SubconceptSelectionInfo using FSRS state mapping
      const selectionInfo: SubconceptSelectionInfo = {
        subconceptSlug: subconceptProgress.subconceptSlug,
        phase: mapFSRSStateToPhase(STATE_REVERSE_MAP[subconceptProgress.fsrsState] as FSRSState),
      };

      return selectExercise(selectionInfo, exercises, attempts, lastPattern);
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
