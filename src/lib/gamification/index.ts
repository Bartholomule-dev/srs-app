/**
 * Gamification module barrel export
 */

// Types
export type {
  PointsBreakdown,
  StreakInfo,
  PointsSummary,
} from './types';

// Constants
export {
  QUALITY_BONUS,
  STREAK_MULTIPLIERS,
  POINTS,
  STREAK_FREEZE,
} from './types';

// Points calculation utilities
export {
  calculateQualityBonus,
  calculateSpeedBonus,
  calculateStreakMultiplier,
  calculatePointsBreakdown,
  formatPoints,
  type PointsCalculationInput,
} from './points';
