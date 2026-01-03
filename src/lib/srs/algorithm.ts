// src/lib/srs/algorithm.ts
import type { CardState, ReviewResult, SRSConfig } from './types';
import { DEFAULT_SRS_CONFIG } from './types';
import type { Quality } from '@/lib/types';

/**
 * Create initial state for a new card
 */
export function createInitialCardState(config: SRSConfig = DEFAULT_SRS_CONFIG): CardState {
  return {
    easeFactor: config.initialEaseFactor,
    interval: 0,
    repetitions: 0,
    nextReview: new Date(),
    lastReviewed: null,
  };
}

/**
 * SM-2 algorithm: Calculate the next review state based on quality rating
 *
 * Quality ratings:
 * - 0-2: Failure (reset progress)
 * - 3: Hard (correct but difficult)
 * - 4: Good (correct with some hesitation)
 * - 5: Easy (perfect recall)
 */
export function calculateNextReview(
  quality: Quality,
  currentState: CardState,
  config: SRSConfig = DEFAULT_SRS_CONFIG
): ReviewResult {
  const wasCorrect = quality >= 3;
  const now = new Date();

  if (!wasCorrect) {
    // Failure: reset repetitions, keep ease factor, review tomorrow
    return {
      newState: {
        ...currentState,
        repetitions: 0,
        interval: 1,
        nextReview: addDays(now, 1),
        lastReviewed: now,
      },
      wasCorrect: false,
      quality,
    };
  }

  // Success: calculate new ease factor and interval
  const newEaseFactor = calculateNewEaseFactor(quality, currentState.easeFactor, config);
  const newRepetitions = currentState.repetitions + 1;
  const newInterval = calculateNewInterval(newRepetitions, currentState.interval, newEaseFactor, config);

  return {
    newState: {
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      nextReview: addDays(now, newInterval),
      lastReviewed: now,
    },
    wasCorrect: true,
    quality,
  };
}

/**
 * SM-2 ease factor adjustment formula
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 */
function calculateNewEaseFactor(
  quality: Quality,
  currentEaseFactor: number,
  config: SRSConfig
): number {
  const q = quality;
  const adjustment = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEF = currentEaseFactor + adjustment;

  return Math.max(config.minEaseFactor, Math.min(config.maxEaseFactor, newEF));
}

/**
 * Calculate new interval based on repetition count
 */
function calculateNewInterval(
  repetitions: number,
  currentInterval: number,
  easeFactor: number,
  config: SRSConfig
): number {
  if (repetitions === 1) {
    return config.initialInterval;
  }

  if (repetitions === 2) {
    return config.graduatingInterval;
  }

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
