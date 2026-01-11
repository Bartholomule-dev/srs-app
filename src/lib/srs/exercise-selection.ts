// src/lib/srs/exercise-selection.ts
// Algorithm-agnostic exercise selection logic for concept-based SRS
// These functions select which exercise to show - the SRS algorithm (FSRS) handles scheduling

import type { ExerciseAttempt, ExerciseLevel, ExercisePattern, ExerciseType } from '@/lib/curriculum/types';
import type { Exercise } from '@/lib/types';
import type { FSRSState } from './fsrs/types';

// Type ratios for exercise type balancing
type TypeRatios = Record<'write' | 'fill-in' | 'predict', number>;

// Constants
export const LEVEL_ORDER: ExerciseLevel[] = ['intro', 'practice', 'edge'];

/**
 * Subconcept info needed for exercise selection
 * (Algorithm-agnostic - works with FSRS state names)
 */
export interface SubconceptSelectionInfo {
  subconceptSlug: string;
  /** Learning = 'New' | 'Learning' | 'Relearning', Review = 'Review' */
  phase: 'learning' | 'review';
}

/**
 * Map FSRS state to selection phase
 * New/Learning/Relearning = learning phase (level progression)
 * Review = review phase (least-seen selection)
 */
export function mapFSRSStateToPhase(state: FSRSState): 'learning' | 'review' {
  return state === 'Review' ? 'review' : 'learning';
}

/**
 * Select an exercise for a subconcept based on phase and attempt history
 *
 * Learning phase: level progression (intro -> practice -> edge)
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
  subconceptInfo: SubconceptSelectionInfo,
  exercises: Exercise[],
  attempts: ExerciseAttempt[],
  lastPattern?: ExercisePattern | null
): Exercise | null {
  // Filter exercises for this subconcept
  const subconceptExercises = exercises.filter(
    (e) => e.subconcept === subconceptInfo.subconceptSlug
  );

  if (subconceptExercises.length === 0) {
    return null;
  }

  // Build attempt lookup map
  const attemptMap = new Map(attempts.map((a) => [a.exerciseSlug, a]));

  // Get candidates from phase-appropriate selection
  let selected: Exercise | null;
  if (subconceptInfo.phase === 'learning') {
    selected = selectLearningExercise(subconceptExercises, attemptMap, lastPattern);
  } else {
    selected = selectReviewExercise(subconceptExercises, attemptMap, lastPattern);
  }

  return selected;
}

/**
 * Learning phase: level progression algorithm
 * - Work through levels in order: intro -> practice -> edge
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
 * Determine which exercise type is most underrepresented in the session.
 * Returns null if ratios are approximately balanced.
 */
export function getUnderrepresentedType(
  sessionHistory: ExerciseType[],
  targetRatios: TypeRatios
): ExerciseType | null {
  if (sessionHistory.length === 0) {
    // For empty session, prefer write (core skill)
    return 'write';
  }

  const counts: Record<string, number> = { write: 0, 'fill-in': 0, predict: 0 };
  for (const type of sessionHistory) {
    if (type in counts) {
      counts[type]++;
    }
  }

  const total = sessionHistory.length;
  let mostUnderrepresented: ExerciseType | null = null;
  let maxDeficit = 0;

  for (const [type, targetRatio] of Object.entries(targetRatios)) {
    const actualRatio = counts[type] / total;
    const deficit = targetRatio - actualRatio;

    if (deficit > maxDeficit) {
      maxDeficit = deficit;
      mostUnderrepresented = type as ExerciseType;
    }
  }

  // Only return if deficit is significant (>10%)
  return maxDeficit > 0.1 ? mostUnderrepresented : null;
}

/**
 * Select an exercise preferring the underrepresented type.
 * Falls back to any available exercise if preferred type unavailable.
 */
export function selectExerciseByType(
  exercises: Exercise[],
  sessionHistory: ExerciseType[],
  targetRatios: TypeRatios
): Exercise | null {
  if (exercises.length === 0) {
    return null;
  }

  const preferredType = getUnderrepresentedType(sessionHistory, targetRatios);

  if (preferredType) {
    const preferredExercises = exercises.filter(e => e.exerciseType === preferredType);
    if (preferredExercises.length > 0) {
      // Random selection among preferred type
      return preferredExercises[Math.floor(Math.random() * preferredExercises.length)];
    }
  }

  // Fallback: random from all available
  return exercises[Math.floor(Math.random() * exercises.length)];
}
