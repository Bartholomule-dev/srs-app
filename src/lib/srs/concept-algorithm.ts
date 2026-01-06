// src/lib/srs/concept-algorithm.ts
// Concept-Based SRS Algorithm for subconcept-level scheduling
// SRS tracks subconcept mastery, exercises are "question pools"

import type { SubconceptProgress, ExerciseAttempt, ConceptSlug, ExerciseLevel, ExercisePattern } from '@/lib/curriculum/types';
import type { Exercise, Quality } from '@/lib/types';
import { QUALITY_PASSING_THRESHOLD } from './types';

// Constants
export const LEVEL_ORDER: ExerciseLevel[] = ['intro', 'practice', 'edge', 'integrated'];
export const GRADUATING_INTERVAL = 6;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3.0;
export const INITIAL_EASE_FACTOR = 2.5;

/**
 * Get subconcepts that are due for review (nextReview <= now)
 * Sorted by most overdue first
 */
export function getDueSubconcepts(
  progress: SubconceptProgress[],
  now: Date = new Date()
): SubconceptProgress[] {
  return progress
    .filter((p) => p.nextReview <= now)
    .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
}

/**
 * Select an exercise for a subconcept based on phase and attempt history
 *
 * Learning phase: level progression (intro -> practice -> edge -> integrated)
 *   - Prioritize unseen exercises at current level
 *   - Progress to next level when all current level exercises seen
 *
 * Review phase: least-seen with random tie-breaking
 *   - Select exercise with lowest timesSeen
 *   - Ensures variety in review sessions
 *
 * Anti-repeat: when lastPattern is provided, prefer different patterns
 */
export function selectExercise(
  subconceptProgress: SubconceptProgress,
  exercises: Exercise[],
  attempts: ExerciseAttempt[],
  lastPattern?: ExercisePattern | null
): Exercise | null {
  // Filter exercises for this subconcept
  const subconceptExercises = exercises.filter(
    (e) => e.subconcept === subconceptProgress.subconceptSlug
  );

  if (subconceptExercises.length === 0) {
    return null;
  }

  // Build attempt lookup map
  const attemptMap = new Map(attempts.map((a) => [a.exerciseSlug, a]));

  // Get candidates from phase-appropriate selection
  let selected: Exercise | null;
  if (subconceptProgress.phase === 'learning') {
    selected = selectLearningExercise(subconceptExercises, attemptMap, lastPattern);
  } else {
    selected = selectReviewExercise(subconceptExercises, attemptMap, lastPattern);
  }

  return selected;
}

/**
 * Learning phase: level progression algorithm
 * - Work through levels in order: intro -> practice -> edge -> integrated
 * - Prioritize unseen exercises at current level (randomized)
 * - Move to next level when all exercises at current level have been seen
 * - Prefer different pattern from lastPattern when possible
 */
function selectLearningExercise(
  exercises: Exercise[],
  attemptMap: Map<string, ExerciseAttempt>,
  lastPattern?: ExercisePattern | null
): Exercise | null {
  for (const level of LEVEL_ORDER) {
    const levelExercises = exercises.filter((e) => e.level === level);
    if (levelExercises.length === 0) continue;

    // Find unseen exercises at this level
    const unseenExercises = levelExercises.filter(
      (e) => !attemptMap.has(e.slug) || attemptMap.get(e.slug)!.timesSeen === 0
    );

    if (unseenExercises.length > 0) {
      // Apply anti-repeat: prefer different pattern if available
      if (lastPattern) {
        const differentPattern = unseenExercises.filter((e) => e.pattern !== lastPattern);
        if (differentPattern.length > 0) {
          // Randomize within different-pattern unseen exercises
          return differentPattern[Math.floor(Math.random() * differentPattern.length)];
        }
      }
      // Randomize within unseen exercises (no anti-repeat needed or no alternatives)
      return unseenExercises[Math.floor(Math.random() * unseenExercises.length)];
    }

    // Check if all exercises at this level have been seen
    const allSeen = levelExercises.every(
      (e) => attemptMap.has(e.slug) && attemptMap.get(e.slug)!.timesSeen > 0
    );

    if (!allSeen) {
      // Not all seen yet, return least-seen at this level
      return getLeastSeenExercise(levelExercises, attemptMap, lastPattern);
    }
    // All seen at this level, continue to next level
  }

  // All levels exhausted, return least-seen overall
  return getLeastSeenExercise(exercises, attemptMap, lastPattern);
}

/**
 * Review phase: least-seen selection algorithm
 * - Select exercise with lowest timesSeen
 * - Ensures variety across review sessions
 * - Prefer different pattern from lastPattern when possible
 */
function selectReviewExercise(
  exercises: Exercise[],
  attemptMap: Map<string, ExerciseAttempt>,
  lastPattern?: ExercisePattern | null
): Exercise | null {
  return getLeastSeenExercise(exercises, attemptMap, lastPattern);
}

/**
 * Get the least-seen exercise from a list
 * Random tie-breaking when multiple exercises have same timesSeen
 * Prefer different pattern from lastPattern when possible
 */
function getLeastSeenExercise(
  exercises: Exercise[],
  attemptMap: Map<string, ExerciseAttempt>,
  lastPattern?: ExercisePattern | null
): Exercise | null {
  if (exercises.length === 0) return null;

  // Get timesSeen for each exercise (0 if not in map)
  const exercisesWithCounts = exercises.map((e) => ({
    exercise: e,
    timesSeen: attemptMap.get(e.slug)?.timesSeen ?? 0,
  }));

  // Find minimum timesSeen
  const minTimesSeen = Math.min(...exercisesWithCounts.map((e) => e.timesSeen));

  // Get all exercises with minimum timesSeen
  const leastSeenExercises = exercisesWithCounts.filter(
    (e) => e.timesSeen === minTimesSeen
  );

  // Apply anti-repeat: prefer different pattern if available
  if (lastPattern && leastSeenExercises.length > 1) {
    const differentPattern = leastSeenExercises.filter(
      (e) => e.exercise.pattern !== lastPattern
    );
    if (differentPattern.length > 0) {
      const randomIndex = Math.floor(Math.random() * differentPattern.length);
      return differentPattern[randomIndex].exercise;
    }
  }

  // Random selection from tied exercises
  const randomIndex = Math.floor(Math.random() * leastSeenExercises.length);
  return leastSeenExercises[randomIndex].exercise;
}

/**
 * Result of a subconcept review calculation
 */
export interface SubconceptReviewResult {
  easeFactor: number;
  interval: number;
  phase: 'learning' | 'review';
  nextReview: Date;
  lastReviewed: Date;
}

/**
 * Calculate the next review state for a subconcept based on quality rating
 * Uses SM-2 algorithm adapted for subconcept-level scheduling
 *
 * Quality ratings:
 * - 0-2: Failure (reset to learning phase, interval = 1)
 * - 3: Hard (correct but difficult, decrease ease factor)
 * - 4: Good (correct with some hesitation, maintain ease factor)
 * - 5: Easy (perfect recall, increase ease factor)
 */
export function calculateSubconceptReview(
  quality: Quality,
  currentState: SubconceptProgress
): SubconceptReviewResult {
  const now = new Date();
  const wasCorrect = quality >= QUALITY_PASSING_THRESHOLD;

  if (!wasCorrect) {
    // Failure: reset to learning phase
    return {
      easeFactor: currentState.easeFactor,
      interval: 1,
      phase: 'learning',
      nextReview: addDays(now, 1),
      lastReviewed: now,
    };
  }

  // Success: calculate new ease factor and interval
  const newEaseFactor = calculateNewEaseFactor(quality, currentState.easeFactor);
  const newInterval = calculateNewInterval(
    currentState.interval,
    newEaseFactor
  );

  // Transition to review phase if interval >= graduating interval
  const newPhase = newInterval >= GRADUATING_INTERVAL ? 'review' : currentState.phase;

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    phase: newPhase,
    nextReview: addDays(now, newInterval),
    lastReviewed: now,
  };
}

/**
 * SM-2 ease factor adjustment formula
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEaseFactor(quality: Quality, currentEaseFactor: number): number {
  const q = quality;
  const adjustment = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEF = currentEaseFactor + adjustment;

  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEF));
}

/**
 * Calculate new interval based on current interval and ease factor
 */
function calculateNewInterval(currentInterval: number, easeFactor: number): number {
  if (currentInterval === 0) {
    // First review
    return 1;
  }
  if (currentInterval === 1) {
    // Second review
    return GRADUATING_INTERVAL;
  }
  // Subsequent reviews: multiply by ease factor
  return Math.round(currentInterval * easeFactor);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Create initial subconcept progress state for a new subconcept
 */
export function createInitialSubconceptState(
  subconceptSlug: string,
  conceptSlug: ConceptSlug,
  userId: string
): SubconceptProgress {
  const now = new Date();
  return {
    id: generateId(),
    userId,
    subconceptSlug,
    conceptSlug,
    phase: 'learning',
    easeFactor: INITIAL_EASE_FACTOR,
    interval: 0,
    nextReview: now,
    lastReviewed: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate a unique ID for subconcept progress
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
