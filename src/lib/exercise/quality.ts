// src/lib/exercise/quality.ts
import type { QualityInputs } from './types';
import type { Quality } from '@/lib/types';

/** Response time threshold for "fast" (perfect recall) - 10 seconds */
export const FAST_THRESHOLD_MS = 10_000;

/** Response time threshold for "slow" (struggle) - 30 seconds */
export const SLOW_THRESHOLD_MS = 30_000;

/** Minimum reps required before Quality 5 (Easy) is allowed */
export const MIN_REPS_FOR_EASY = 2;

/**
 * Infers the SM-2 quality score (2-5) based on answer correctness and timing.
 *
 * Quality mapping:
 * - 5: Perfect recall (correct, no hint, fast, AND reps >= 2)
 * - 4: Hesitation (correct, no hint, medium time) or AST match or first exposure
 * - 3: Struggle (correct with hint, or slow time)
 * - 2: Failed (incorrect or gave up)
 *
 * Note: Quality 5 (Easy) is capped at 4 (Good) when currentReps < 2 to prevent
 * one-shot FSRS "Easy" ratings that immediately grant high stability.
 */
export function inferQuality(inputs: QualityInputs): Quality {
  const { isCorrect, hintUsed, responseTimeMs, usedAstMatch, currentReps } = inputs;

  // Incorrect always returns 2 (failed)
  if (!isCorrect) {
    return 2;
  }

  // Hint used caps at 3 (difficulty)
  if (hintUsed) {
    return 3;
  }

  // AST match (format differs) caps at 4
  if (usedAstMatch) {
    return 4;
  }

  // Time-based quality for exact matches
  if (responseTimeMs < FAST_THRESHOLD_MS) {
    // Cap at Quality 4 if this is an early review (reps < 2)
    // This prevents one-shot FSRS "Easy" ratings that give 8+ day stability
    if (currentReps !== undefined && currentReps < MIN_REPS_FOR_EASY) {
      return 4; // Good, not Easy - prevents one-shot mastery
    }
    return 5; // Perfect recall (allowed for experienced users)
  }

  if (responseTimeMs < SLOW_THRESHOLD_MS) {
    return 4; // Hesitation
  }

  return 3; // Struggle
}
