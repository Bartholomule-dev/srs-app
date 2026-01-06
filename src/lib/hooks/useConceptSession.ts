'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useConceptSRS } from './useConceptSRS';
import { useProfile } from './useProfile';
import { useToast } from '@/lib/context/ToastContext';
import { supabase } from '@/lib/supabase/client';
import { mapExercise } from '@/lib/supabase/mappers';
import { handleSupabaseError, AppError } from '@/lib/errors';
import { updateProfileStats } from '@/lib/stats';
import { selectExerciseByType } from '@/lib/srs/concept-algorithm';
import type { Exercise, Quality } from '@/lib/types';
import { EXPERIENCE_LEVEL_RATIOS } from '@/lib/types/app.types';
import type { ExperienceLevel } from '@/lib/types/app.types';
import type {
  SessionStats,
  SessionCardType,
  ReviewSessionCard,
} from '@/lib/session/types';
import { QUALITY_PASSING_THRESHOLD } from '@/lib/srs/types';
import type { SubconceptProgress, ExercisePattern, ExerciseType } from '@/lib/curriculum/types';
import {
  buildTeachingPair,
  interleaveWithTeaching,
  type TeachingPair,
} from '@/lib/session';
import { getSubconceptDefinition, getAllSubconcepts } from '@/lib/curriculum';

/** Limit on teaching pairs (new subconcepts with teaching content) per session */
const TEACHING_PAIRS_LIMIT = 5;

/** Card type strings for progress bar display */
export type CardTypeLabel = 'teaching' | 'practice' | 'review';

export interface UseConceptSessionReturn {
  /** All cards in the session (unified type) */
  cards: SessionCardType[];
  /** Card type for each position (for progress bar styling) */
  cardTypes: CardTypeLabel[];
  /** Index of current card */
  currentIndex: number;
  /** Current card being displayed */
  currentCard: SessionCardType | null;
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
  const { profile } = useProfile();
  const {
    dueSubconcepts,
    loading: srsLoading,
    error: srsError,
    recordSubconceptResult,
    getNextExercise,
    refetch: refetchSRS,
  } = useConceptSRS();
  const { showToast } = useToast();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Unified session cards (teaching, practice, review)
  const [cards, setCards] = useState<SessionCardType[]>([]);
  // Internal tracking: maps card index to subconcept progress (for SRS updates)
  // Only set for practice and review cards; undefined for teaching cards
  const [cardProgressMap, setCardProgressMap] = useState<
    Map<number, SubconceptProgress>
  >(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [forceComplete, setForceComplete] = useState(false);
  // Track whether session has been initialized (prevents rebuilding on dueSubconcepts changes)
  const [sessionInitialized, setSessionInitialized] = useState(false);
  // Track exercise types shown in session for type-balanced selection
  const [sessionTypeHistory, setSessionTypeHistory] = useState<ExerciseType[]>([]);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete =
    forceComplete || (currentIndex >= cards.length && cards.length > 0);
  // Derive card types for progress bar
  const cardTypes: CardTypeLabel[] = useMemo(
    () => cards.map((c) => c.type),
    [cards]
  );

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
  }, [user, authLoading, fetchKey]);

  // Build session cards when due subconcepts and exercises are ready
  // Only runs once per session - skip if already initialized
  useEffect(() => {
    if (srsLoading || exercises.length === 0) return;
    if (sessionInitialized) return; // Don't rebuild mid-session
    if (!user) return;

    // Capture user.id for TypeScript narrowing inside async function
    const userId = user.id;

    let cancelled = false;

    async function buildSession() {
      // === Step 1: Build review cards from due subconcepts ===
      const reviewCards: ReviewSessionCard[] = [];
      // Track subconcept progress for each review card by its index in reviewCards
      const reviewProgressMap: SubconceptProgress[] = [];
      // Track last pattern for anti-repeat selection
      let lastPattern: ExercisePattern | null = null;
      // Track exercise types during session building for type-balanced selection
      const typeHistory: ExerciseType[] = [];
      // Get experience level from profile (default to 'refresher')
      const experienceLevel: ExperienceLevel = profile?.experienceLevel ?? 'refresher';
      const targetRatios = EXPERIENCE_LEVEL_RATIOS[experienceLevel];

      for (const subconceptProgress of dueSubconcepts) {
        // Get candidate exercises for this subconcept
        const subconceptExercises = exercises.filter(
          (e) => e.subconcept === subconceptProgress.subconceptSlug
        );

        // Try type-balanced selection first
        let exercise: Exercise | null = null;
        if (subconceptExercises.length > 0) {
          exercise = selectExerciseByType(subconceptExercises, typeHistory, targetRatios);
        }

        // Fall back to standard algorithm if type-balanced selection fails
        // or if we want to apply level progression logic
        if (!exercise) {
          exercise = getNextExercise(subconceptProgress, exercises, lastPattern);
        }

        if (exercise) {
          reviewCards.push({
            type: 'review',
            exercise,
          });
          reviewProgressMap.push(subconceptProgress);
          // Update pattern for next selection
          lastPattern = exercise.pattern;
          // Track exercise type for type balancing
          typeHistory.push(exercise.exerciseType);
        }
      }

      // Store type history for session state
      setSessionTypeHistory(typeHistory);

      // === Step 2: Identify NEW subconcepts (no progress row) ===
      // Query ALL subconcept progress (not just due) to find truly new subconcepts
      const { data: allProgressData, error: progressError } = await supabase
        .from('subconcept_progress')
        .select('subconcept_slug')
        .eq('user_id', userId);

      if (cancelled) return;

      // Handle progress query error - show toast and skip teaching cards
      // (don't treat all subconcepts as new if we can't verify)
      if (progressError) {
        console.error('Failed to fetch all progress:', progressError);
        showToast({ title: 'Could not check for new concepts', variant: 'warning' });
        // Fall back to just review cards - don't add teaching pairs
        setCards(reviewCards);
        const progressMap = new Map<number, SubconceptProgress>();
        for (let i = 0; i < reviewCards.length; i++) {
          const progress = reviewProgressMap[i];
          if (progress) progressMap.set(i, progress);
        }
        setCardProgressMap(progressMap);
        setCurrentIndex(0);
        setStats({
          total: reviewCards.length,
          completed: 0,
          correct: 0,
          incorrect: 0,
          startTime: new Date(),
          endTime: undefined,
        });
        setSessionInitialized(true);
        setLoading(false);
        return;
      }

      // Get all subconcepts user already has progress for (due or not)
      const progressSlugs = new Set(
        (allProgressData ?? []).map((p) => p.subconcept_slug)
      );

      // Get all subconcepts in curriculum
      const allSubconcepts = getAllSubconcepts();
      const newSubconcepts = allSubconcepts.filter((slug) => !progressSlugs.has(slug));

      // === Step 3: Build teaching pairs for new subconcepts (limit 2) ===
      const teachingPairs: TeachingPair[] = [];
      // Track progress for practice cards (teaching cards don't need SRS)
      const practiceProgressMap: Map<string, SubconceptProgress> = new Map();

      for (const slug of newSubconcepts.slice(0, TEACHING_PAIRS_LIMIT)) {
        const definition = getSubconceptDefinition(slug);
        if (definition) {
          const pair = buildTeachingPair(slug, definition, exercises);
          if (pair) {
            teachingPairs.push(pair);
            // Create initial progress for the practice card
            const practiceExercise = pair.practiceCard.exercise;
            const newProgress: SubconceptProgress = {
              id: `new-${slug}`,
              userId: userId,
              subconceptSlug: slug,
              conceptSlug: practiceExercise.concept,
              phase: 'learning',
              easeFactor: 2.5,
              interval: 0,
              nextReview: new Date(),
              lastReviewed: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            practiceProgressMap.set(slug, newProgress);
          }
        }
      }

      // === Step 4: Interleave teaching pairs with review cards ===
      const sessionCards = interleaveWithTeaching(reviewCards, teachingPairs);

      // === Step 5: Build progress map for all cards ===
      // Maps card index -> SubconceptProgress (only for practice/review cards)
      const progressMap = new Map<number, SubconceptProgress>();
      let reviewIndex = 0;

      for (let i = 0; i < sessionCards.length; i++) {
        const card = sessionCards[i];
        if (card.type === 'review') {
          // Review cards get progress from reviewProgressMap in order
          const progress = reviewProgressMap[reviewIndex];
          if (progress) {
            progressMap.set(i, progress);
          }
          reviewIndex++;
        } else if (card.type === 'practice') {
          // Practice cards get progress from practiceProgressMap by subconcept
          const subconcept = card.exercise.subconcept;
          if (subconcept) {
            const progress = practiceProgressMap.get(subconcept);
            if (progress) {
              progressMap.set(i, progress);
            }
          }
        }
        // Teaching cards don't have progress - they don't update SRS
      }

      // Calculate exercise count (practice + review, NOT teaching)
      const exerciseCount = sessionCards.filter(c => c.type !== 'teaching').length;

      setCards(sessionCards);
      setCardProgressMap(progressMap);
      setCurrentIndex(0);
      setStats({
        total: exerciseCount, // Only count exercises, not teaching cards
        completed: 0,
        correct: 0,
        incorrect: 0,
        startTime: new Date(),
        endTime: undefined,
      });
      setSessionInitialized(true);
      setLoading(false);
    }

    buildSession();

    return () => {
      cancelled = true;
    };
  }, [dueSubconcepts, exercises, srsLoading, getNextExercise, user, sessionInitialized, showToast, profile]);

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

      // Teaching cards don't record SRS or count toward stats - just advance
      if (card.type === 'teaching') {
        setCurrentIndex((prev) => prev + 1);
        return;
      }

      // Only practice/review cards update stats
      const newCompleted = stats.completed + 1;
      const willComplete = newCompleted >= stats.total;

      // For practice/review cards, run SRS logic
      const isCorrect = quality >= QUALITY_PASSING_THRESHOLD;

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

      // Get exercise for SRS update
      const exercise = card.exercise;

      // Get subconcept progress for this card
      const progress = cardProgressMap.get(currentIndex);
      if (!progress) {
        console.warn(`No progress found for card at index ${currentIndex}`);
        return;
      }

      // Persist to database via concept SRS
      try {
        await recordSubconceptResult(
          progress.subconceptSlug,
          progress.conceptSlug,
          quality,
          exercise.slug,
          isCorrect,
          exercise.targets
        );
      } catch {
        showToast({ title: 'Failed to save progress', variant: 'error' });
        // Session continues even if save fails
      }
    },
    [cards, currentIndex, stats.completed, stats.total, cardProgressMap, recordSubconceptResult, showToast]
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
        showToast({ title: 'Failed to update stats', variant: 'error' });
      }
    }
  }, [stats.completed, user, showToast]);

  const retry = useCallback(() => {
    setSessionInitialized(false); // Allow session to rebuild
    setSessionTypeHistory([]); // Reset type history for new session
    setFetchKey((k) => k + 1);
    refetchSRS();
  }, [refetchSRS]);

  return {
    cards,
    cardTypes,
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
