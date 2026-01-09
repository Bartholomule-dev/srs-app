/**
 * Points calculation utility functions (client-side display helper)
 *
 * These functions are used for client-side display of points breakdown.
 * Actual points persistence happens server-side via RPC.
 */

import {
  QUALITY_BONUS,
  STREAK_MULTIPLIERS,
  POINTS,
  type PointsBreakdown,
} from './types';

/**
 * Input parameters for calculating points breakdown
 */
export interface PointsCalculationInput {
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** FSRS rating (1=Again, 2=Hard, 3=Good, 4=Easy) */
  rating: 1 | 2 | 3 | 4;
  /** Whether a hint was used */
  hintUsed: boolean;
  /** Whether this is the first attempt at this exercise */
  isFirstAttempt: boolean;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Stability of the subconcept (FSRS stability in days) */
  subconceptStability: number;
  /** Current streak in days */
  currentStreak: number;
}

/**
 * Calculate quality bonus based on FSRS rating
 * Rating 4 (Easy) = +5, Rating 3 (Good) = +3, Rating 2 (Hard) = +1, Rating 1 (Again) = 0
 */
export function calculateQualityBonus(rating: 1 | 2 | 3 | 4): number {
  return QUALITY_BONUS[rating];
}

/**
 * Calculate speed bonus for mastered subconcepts
 * Only applies when subconcept stability >= 30 days
 * Returns 0-5 based on response time thresholds
 */
export function calculateSpeedBonus(
  responseTimeMs: number,
  subconceptStability: number
): number {
  if (subconceptStability < POINTS.SPEED_BONUS_STABILITY_THRESHOLD) {
    return 0;
  }

  const thresholds = POINTS.SPEED_BONUS_THRESHOLDS;

  if (responseTimeMs < thresholds[0]) return 5;
  if (responseTimeMs < thresholds[1]) return 4;
  if (responseTimeMs < thresholds[2]) return 3;
  if (responseTimeMs < thresholds[3]) return 2;
  if (responseTimeMs < thresholds[4]) return 1;

  return 0;
}

/**
 * Calculate streak multiplier based on current streak length
 * 30+ days = 1.2x, 14+ days = 1.15x, 7+ days = 1.1x, <7 days = 1.0x
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  for (const { minDays, multiplier } of STREAK_MULTIPLIERS) {
    if (currentStreak >= minDays) {
      return multiplier;
    }
  }
  return 1.0;
}

/**
 * Calculate full points breakdown for display
 * Returns all components: base, bonuses, subtotal, multiplier, and total
 */
export function calculatePointsBreakdown(
  input: PointsCalculationInput
): PointsBreakdown {
  // Incorrect answers earn no points
  if (!input.isCorrect) {
    return {
      base: 0,
      qualityBonus: 0,
      noHintBonus: 0,
      firstAttemptBonus: 0,
      speedBonus: 0,
      subtotal: 0,
      streakMultiplier: 1.0,
      total: 0,
    };
  }

  // Calculate all components
  const base = POINTS.BASE;
  const qualityBonus = calculateQualityBonus(input.rating);
  const noHintBonus = input.hintUsed ? 0 : POINTS.NO_HINT_BONUS;
  const firstAttemptBonus = input.isFirstAttempt
    ? POINTS.FIRST_ATTEMPT_BONUS
    : 0;
  const speedBonus = calculateSpeedBonus(
    input.responseTimeMs,
    input.subconceptStability
  );

  // Sum before multiplier
  const subtotal =
    base + qualityBonus + noHintBonus + firstAttemptBonus + speedBonus;

  // Apply streak multiplier
  const streakMultiplier = calculateStreakMultiplier(input.currentStreak);
  const total = Math.floor(subtotal * streakMultiplier);

  return {
    base,
    qualityBonus,
    noHintBonus,
    firstAttemptBonus,
    speedBonus,
    subtotal,
    streakMultiplier,
    total,
  };
}

/**
 * Format points for display
 * Returns "+15" for positive, "0" for zero, "+1,500" for large numbers
 */
export function formatPoints(points: number): string {
  if (points === 0) {
    return '0';
  }
  return `+${points.toLocaleString('en-US')}`;
}
