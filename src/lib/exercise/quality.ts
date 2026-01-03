// src/lib/exercise/quality.ts
import type { QualityInputs } from './types';
import type { Quality } from '@/lib/types';

/** Response time threshold for "fast" (perfect recall) - 15 seconds */
export const FAST_THRESHOLD_MS = 15_000;

/** Response time threshold for "slow" (struggle) - 30 seconds */
export const SLOW_THRESHOLD_MS = 30_000;

/**
 * Infers the SM-2 quality score (2-5) based on answer correctness and timing.
 *
 * Quality mapping:
 * - 5: Perfect recall (correct, no hint, fast)
 * - 4: Hesitation (correct, no hint, medium time) or AST match
 * - 3: Struggle (correct with hint, or slow time)
 * - 2: Failed (incorrect or gave up)
 */
export function inferQuality(inputs: QualityInputs): Quality {
  const { isCorrect, hintUsed, responseTimeMs, usedAstMatch } = inputs;

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
    return 5; // Perfect recall
  }

  if (responseTimeMs < SLOW_THRESHOLD_MS) {
    return 4; // Hesitation
  }

  return 3; // Struggle
}
