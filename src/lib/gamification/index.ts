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

// Contribution graph
export type { ContributionDay, ContributionLevel } from './contribution';
export {
  getContributionLevel,
  CONTRIBUTION_THRESHOLDS,
  CONTRIBUTION_COLORS,
} from './contribution';

// Badge tier types and utilities
export type { BadgeTier } from './badges';
export {
  getBadgeTier,
  BADGE_THRESHOLDS,
  BADGE_STYLES,
  shouldCelebrateTierUp,
  getTierDisplayName,
  getTierUpgradeMessage,
} from './badges';
