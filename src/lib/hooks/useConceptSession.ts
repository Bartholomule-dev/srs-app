'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useConceptSRS } from './useConceptSRS';
import { useProfile } from './useProfile';
import { useToast } from '@/lib/context/ToastContext';
import { usePyodide } from '@/lib/context/PyodideContext';
import { supabase } from '@/lib/supabase/client';
import { mapExercise } from '@/lib/supabase/mappers';
import { renderExercise, renderExercises } from '@/lib/generators/render';
import { handleSupabaseError, AppError } from '@/lib/errors';
import { updateProfileStats } from '@/lib/stats';
import { logExerciseAttempt } from '@/lib/exercise';
import { getDefaultStrategy } from '@/lib/exercise/strategy-defaults';
import { selectExerciseByType, QUALITY_PASSING_THRESHOLD } from '@/lib/srs';
import type { Exercise, Quality } from '@/lib/types';
import { EXPERIENCE_LEVEL_RATIOS } from '@/lib/types/app.types';
import type { ExperienceLevel } from '@/lib/types/app.types';
import type {
  SessionStats,
  SessionCardType,
  ReviewSessionCard,
} from '@/lib/session/types';
import type { SubconceptProgress, ExercisePattern, ExerciseType } from '@/lib/curriculum/types';
import {
  buildTeachingPair,
  interleaveAtBoundaries,
  calculateNewCardLimit,
  type TeachingPair,
} from '@/lib/session';
import {
  getSubconceptDefinition,
  getCurriculumConcepts,
  getNextSubconcepts,
  getSkippedConceptsByExperience,
} from '@/lib/curriculum';
import { logSessionStart, buildSessionStartMetrics } from '@/lib/analytics/session-metrics';
import { createEmptyFSRSCard } from '@/lib/srs/fsrs/adapter';
import { getPathIndex } from '@/lib/paths/client-loader';
import { groupByBlueprint, sortByBeat } from '@/lib/paths/grouping';
import { selectSkinForExercises } from '@/lib/paths/selector';
import { applySkinContextBatch } from '@/lib/paths/apply-skin';
import { updateRecentSkins } from '@/lib/paths/update-recent-skins';
import type { SkinnedCard, PathIndex } from '@/lib/paths/types';

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
  /**
   * Current number of reps for the current card's subconcept.
   * Used to prevent one-shot "Easy" ratings on first exposure.
   */
  currentReps: number;
  /** Blueprint/skin context for all cards (keyed by card index) */
  skinnedCards: Map<number, SkinnedCard>;
  /** Blueprint/skin context for the current card */
  currentSkinnedCard: SkinnedCard | null;
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
  const { loadPyodide } = usePyodide();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Raw exercises (before Mustache rendering) keyed by slug - used for re-rendering with skin vars
  const [rawExercisesMap, setRawExercisesMap] = useState<Map<string, Exercise>>(new Map());
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
  // Note: sessionTypeHistory is maintained for future type-balanced selection features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionTypeHistory, setSessionTypeHistory] = useState<ExerciseType[]>([]);
  // Track start time for response time calculation
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  // Blueprint/skin context for each card (keyed by card index)
  const [skinnedCards, setSkinnedCards] = useState<Map<number, SkinnedCard>>(new Map());

  const currentCard = cards[currentIndex] ?? null;
  const isComplete =
    forceComplete || (currentIndex >= cards.length && cards.length > 0);
  // Derive card types for progress bar
  const cardTypes: CardTypeLabel[] = useMemo(
    () => cards.map((c) => c.type),
    [cards]
  );

  // Get current skinned card (blueprint/skin context for current card)
  const currentSkinnedCard = useMemo(() => {
    if (currentIndex === null) return null;
    return skinnedCards.get(currentIndex) ?? null;
  }, [currentIndex, skinnedCards]);

  // Fetch all exercises on mount
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // Capture user.id for TypeScript narrowing inside async function
    const userId = user.id;
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

        // Store raw exercises (before rendering) for later re-rendering with skin vars
        // This is needed because Mustache strips unresolved {{tags}} in the first pass
        const rawMap = new Map<string, Exercise>();
        for (const ex of mappedExercises) {
          rawMap.set(ex.slug, ex);
        }
        setRawExercisesMap(rawMap);

        // Render dynamic exercises (interpolate {{param}} templates)
        // Static exercises pass through unchanged
        // Note: Skin vars not available yet - exercises will be re-rendered when skin is selected
        const renderedExercises = renderExercises(mappedExercises, userId, new Date());
        setExercises(renderedExercises);
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

      // === Step 1.5: Apply blueprint grouping and beat ordering to review cards ===
      // This groups exercises from the same blueprint together and sorts by beat order
      let pathIndex: PathIndex | null = null;
      try {
        pathIndex = await getPathIndex();

        // Get exercise slugs from review cards
        const exerciseSlugs = reviewCards.map(c => c.exercise.slug);

        // Group exercises by blueprint
        const groups = groupByBlueprint(exerciseSlugs, pathIndex);

        // Sort each group by beat order and collect in new order
        const orderedSlugs: string[] = [];
        for (const group of groups) {
          const sorted = sortByBeat(group.exercises, group.blueprintId, pathIndex);
          orderedSlugs.push(...sorted);
        }

        // Reorder the review cards to match the sorted slugs
        const slugToCardAndProgress = new Map(
          reviewCards.map((c, i) => [c.exercise.slug, { card: c, progress: reviewProgressMap[i] }])
        );

        // Build reordered arrays
        const reorderedCards: ReviewSessionCard[] = [];
        const reorderedProgressMap: SubconceptProgress[] = [];
        for (const slug of orderedSlugs) {
          const entry = slugToCardAndProgress.get(slug);
          if (entry) {
            reorderedCards.push(entry.card);
            reorderedProgressMap.push(entry.progress);
          }
        }

        // Replace arrays with reordered versions
        reviewCards.length = 0;
        reviewCards.push(...reorderedCards);
        reviewProgressMap.length = 0;
        reviewProgressMap.push(...reorderedProgressMap);
      } catch (pathError) {
        // Path loading failed - continue with original order
        // This is non-fatal; exercises work without blueprint grouping
        console.warn('Failed to load path index for blueprint grouping:', pathError);
      }

      // === Step 2: Calculate dynamic new card limit based on review backlog ===
      const reviewBacklog = dueSubconcepts.length;
      const newCardLimit = calculateNewCardLimit(reviewBacklog);

      // === Step 3: Identify NEW subconcepts using soft concept gating ===
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

      // Build completed subconcepts set from progress data
      const completedSubconcepts = new Set(
        (allProgressData ?? []).map((p) => p.subconcept_slug)
      );

      // Build in-progress subconcepts set from due cards
      const inProgressSubconcepts = new Set(
        dueSubconcepts.map((p) => p.subconceptSlug)
      );

      // Apply experience-based skipping (adds skipped concepts to "completed")
      const skippedConcepts = getSkippedConceptsByExperience(experienceLevel);
      const curriculum = getCurriculumConcepts();

      // Get subconcepts from skipped concepts and add to completed set
      for (const concept of curriculum) {
        if (skippedConcepts.has(concept.slug)) {
          for (const subconcept of concept.subconcepts) {
            completedSubconcepts.add(subconcept);
          }
        }
      }

      // Get next subconcepts to learn using soft concept gating
      const newSubconcepts = getNextSubconcepts(
        completedSubconcepts,
        inProgressSubconcepts,
        curriculum,
        newCardLimit
      );

      // === Step 4: Build teaching pairs for new subconcepts ===
      const teachingPairs: TeachingPair[] = [];
      // Track progress for practice cards (teaching cards don't need SRS)
      const practiceProgressMap: Map<string, SubconceptProgress> = new Map();

      for (const slug of newSubconcepts) {
        const definition = getSubconceptDefinition(slug);
        if (definition) {
          const pair = buildTeachingPair(slug, definition, exercises);
          if (pair) {
            teachingPairs.push(pair);
            // Create initial progress for the practice card using FSRS
            const practiceExercise = pair.practiceCard.exercise;
            const initialCard = createEmptyFSRSCard(new Date());
            const newProgress: SubconceptProgress = {
              id: `new-${slug}`,
              userId: userId,
              subconceptSlug: slug,
              conceptSlug: practiceExercise.concept,
              stability: initialCard.stability,
              difficulty: initialCard.difficulty,
              fsrsState: 0 as 0 | 1 | 2 | 3, // New state
              reps: initialCard.reps,
              lapses: initialCard.lapses,
              elapsedDays: initialCard.elapsedDays,
              scheduledDays: initialCard.scheduledDays,
              nextReview: initialCard.due,
              lastReviewed: initialCard.lastReview,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            practiceProgressMap.set(slug, newProgress);
          }
        }
      }

      // === Step 5: Interleave teaching pairs at concept boundaries ===
      const sessionCards = interleaveAtBoundaries(reviewCards, teachingPairs);

      // === Step 6: Build progress map for all cards ===
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

      // === Step 7: Build skinned cards map for blueprint/skin context ===
      // This provides context text and blueprint position for each card
      const skinnedMap = new Map<number, SkinnedCard>();
      if (pathIndex) {
        try {
          // Get slugs from all non-teaching cards
          const exerciseCardsInfo: { index: number; slug: string }[] = [];
          for (let i = 0; i < sessionCards.length; i++) {
            const card = sessionCards[i];
            if (card.type !== 'teaching') {
              exerciseCardsInfo.push({ index: i, slug: card.exercise.slug });
            }
          }

          if (exerciseCardsInfo.length > 0) {
            const slugs = exerciseCardsInfo.map(info => info.slug);
            const recentSkins = profile?.recentSkins ?? [];

            // Select skins (tries to use same skin for exercises in same blueprint)
            const selectedSkins = selectSkinForExercises(slugs, recentSkins, pathIndex);

            // Re-render exercises with their selected skin vars and data packs
            // This applies skin variables (like list_name, item_singular) and
            // sample data (for predict exercises) to templates
            // IMPORTANT: Must use raw (un-rendered) exercises because Mustache
            // strips unresolved {{tags}} on first render. Using pre-rendered
            // exercises would lose all skin var placeholders.
            for (let i = 0; i < exerciseCardsInfo.length; i++) {
              const skin = selectedSkins[i];
              if (skin?.vars || skin?.dataPack) {
                const cardIndex = exerciseCardsInfo[i].index;
                const card = sessionCards[cardIndex];
                if (card.type !== 'teaching') {
                  // Look up raw exercise (before any Mustache rendering)
                  const rawExercise = rawExercisesMap.get(card.exercise.slug);
                  if (rawExercise) {
                    // Re-render from raw exercise with skin vars and data pack
                    const reRendered = renderExercise(
                      rawExercise,
                      userId,
                      new Date(),
                      skin?.vars,
                      skin?.dataPack
                    );
                    // Update the card's exercise with re-rendered version
                    (sessionCards[cardIndex] as { exercise: typeof reRendered }).exercise = reRendered;
                  }
                }
              }
            }

            // Apply skin context to get SkinnedCard objects
            const skinnedInfo = applySkinContextBatch(
              slugs,
              selectedSkins.map(s => s?.id ?? null),
              pathIndex
            );

            // Build the map with original card indices
            for (let i = 0; i < exerciseCardsInfo.length; i++) {
              skinnedMap.set(exerciseCardsInfo[i].index, skinnedInfo[i]);
            }

            // Persist skin usage to profile for recency tracking
            // Collect unique skins used in this session (in order of first use)
            const usedSkins: string[] = [];
            for (const skin of selectedSkins) {
              if (skin?.id && !usedSkins.includes(skin.id)) {
                usedSkins.push(skin.id);
              }
            }
            // Update profile's recent_skins (non-blocking)
            if (usedSkins.length > 0) {
              let currentRecentSkins = recentSkins;
              for (const skinId of usedSkins) {
                updateRecentSkins(userId, currentRecentSkins, skinId)
                  .then(updated => { currentRecentSkins = updated; })
                  .catch(() => { /* Non-fatal */ });
              }
            }
          }
        } catch (skinError) {
          // Skin selection failed - continue without skin context
          // This is non-fatal; exercises work without skins
          console.warn('Failed to apply skin context:', skinError);
        }
      }

      setCards(sessionCards);
      setCardProgressMap(progressMap);
      setSkinnedCards(skinnedMap);
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

      // === Step 8: Log session start metrics for analytics ===
      const sessionMetrics = buildSessionStartMetrics({
        reviewBacklog,
        newCardLimit,
        totalCards: sessionCards.length,
      });
      logSessionStart(sessionMetrics);
    }

    buildSession();

    return () => {
      cancelled = true;
    };
  }, [dueSubconcepts, exercises, rawExercisesMap, srsLoading, getNextExercise, user, sessionInitialized, showToast, profile]);

  // Preload Pyodide if session contains exercises that need it for grading
  // Uses getDefaultStrategy() to respect both explicit and default strategy routing
  useEffect(() => {
    const PYODIDE_STRATEGIES = new Set(['token', 'ast', 'execution']);
    const needsPyodide = cards.some((card) => {
      if (card.type === 'teaching') return false;
      const strategy = getDefaultStrategy(card.exercise);
      return PYODIDE_STRATEGIES.has(strategy.primary);
    });

    if (needsPyodide && sessionInitialized) {
      // Don't await - fire and forget to preload in background
      loadPyodide().catch((err) => {
        console.warn('Pyodide preload failed:', err);
        // Non-fatal - will fall back to string matching
      });
    }
  }, [cards, loadPyodide, sessionInitialized]);

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

      // Log attempt for metrics (non-blocking)
      if (user) {
        const responseTimeMs = Date.now() - cardStartTime;
        logExerciseAttempt({
          userId: user.id,
          exerciseSlug: exercise.slug,
          gradingResult: {
            isCorrect,
            usedTargetConstruct: null, // Full grading result not available here
            coachingFeedback: null,
            gradingMethod: 'string',
            normalizedUserAnswer: '',
            normalizedExpectedAnswer: '',
            matchedAlternative: null,
          },
          responseTimeMs,
          hintUsed: false, // Hint tracking not implemented yet
          qualityScore: quality,
          // Generator metadata would be passed from exercise if available
          generatedParams: (exercise as unknown as Record<string, unknown>)._generatedParams as Record<string, string | number | boolean | (string | number)[]> | undefined,
          seed: (exercise as unknown as Record<string, unknown>)._seed as string | undefined,
        }).catch(() => {
          // Non-fatal - don't show error for logging failure
          console.warn('Failed to log exercise attempt');
        });
        // Reset timer for next card
        setCardStartTime(Date.now());
      }
    },
    [cards, currentIndex, stats.completed, stats.total, cardProgressMap, recordSubconceptResult, showToast, user, cardStartTime]
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
    setSkinnedCards(new Map()); // Clear skinned cards for new session
    setFetchKey((k) => k + 1);
    refetchSRS();
  }, [refetchSRS]);

  // Get current reps for quality inference (prevents one-shot Easy ratings)
  const currentReps = cardProgressMap.get(currentIndex)?.reps ?? 0;

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
    currentReps,
    skinnedCards,
    currentSkinnedCard,
  };
}
