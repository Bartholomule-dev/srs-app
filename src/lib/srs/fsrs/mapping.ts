// src/lib/srs/fsrs/mapping.ts
// Maps between SM-2 Quality scores and FSRS Ratings

import type { Quality } from '@/lib/types';
import type { ReviewInput, FSRSRating } from './types';

/** Response time threshold for "fast" (perfect recall) - 15 seconds */
const FAST_THRESHOLD_MS = 15_000;

/** Response time threshold for "slow" (struggle) - 30 seconds */
const SLOW_THRESHOLD_MS = 30_000;

/**
 * Converts an SM-2 quality score (0-5) to an FSRS rating.
 *
 * Mapping:
 * - 0-2 (fail) -> Again
 * - 3 (struggle) -> Hard
 * - 4 (hesitation) -> Good
 * - 5 (perfect) -> Easy
 */
export function qualityToRating(quality: Quality): FSRSRating {
  if (quality <= 2) return 'Again';
  if (quality === 3) return 'Hard';
  if (quality === 4) return 'Good';
  return 'Easy';
}

/**
 * Infers FSRS rating directly from review input signals.
 * This is the preferred method for FSRS - bypasses SM-2 quality.
 *
 * Rating logic:
 * - Incorrect -> Again
 * - Correct with hint -> Hard
 * - Correct with AST match -> Good (format differs but logic correct)
 * - Correct fast (<15s) -> Easy
 * - Correct medium (15-30s) -> Good
 * - Correct slow (>30s) -> Hard
 */
export function inferRating(input: ReviewInput): FSRSRating {
  const { isCorrect, hintUsed, responseTimeMs, usedAstMatch } = input;

  // Incorrect always fails
  if (!isCorrect) return 'Again';

  // Hint used caps at Hard
  if (hintUsed) return 'Hard';

  // AST match (format differs) caps at Good
  if (usedAstMatch) return 'Good';

  // Time-based rating for exact matches
  if (responseTimeMs < FAST_THRESHOLD_MS) return 'Easy';
  if (responseTimeMs < SLOW_THRESHOLD_MS) return 'Good';
  return 'Hard';
}

/**
 * Returns true if the rating represents a passing review.
 * Again is the only failing rating.
 */
export function isPassingRating(rating: FSRSRating): boolean {
  return rating !== 'Again';
}
