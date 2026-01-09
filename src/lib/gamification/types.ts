/**
 * Gamification type definitions
 */

/**
 * Breakdown of points earned for a single answer
 */
export interface PointsBreakdown {
  /** Base points for correct answer (10) */
  base: number;
  /** Bonus based on FSRS rating (0-5) */
  qualityBonus: number;
  /** Bonus for not using hints (+3) */
  noHintBonus: number;
  /** Bonus for first attempt (+2) */
  firstAttemptBonus: number;
  /** Speed bonus for mastered subconcepts (0-5) */
  speedBonus: number;
  /** Sum before multiplier */
  subtotal: number;
  /** Streak multiplier (1.0, 1.1, 1.15, or 1.2) */
  streakMultiplier: number;
  /** Final points after multiplier */
  total: number;
}

/**
 * Current streak information for a user
 */
export interface StreakInfo {
  /** Current consecutive days practiced */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Streak freezes available (0-2) */
  freezesAvailable: number;
  /** Last activity date (YYYY-MM-DD in user's timezone) */
  lastActivityDate: string | null;
  /** When last freeze was earned */
  lastFreezeEarnedAt: string | null;
}

/**
 * Points summary for display
 */
export interface PointsSummary {
  /** Points earned today */
  today: number;
  /** Points earned this week (Mon-Sun) */
  thisWeek: number;
  /** Daily cap (500) */
  dailyCap: number;
  /** Whether daily cap has been reached */
  dailyCapReached: boolean;
}

/**
 * Quality bonus mapping (FSRS Rating → bonus points)
 * Rating 4 (Easy) = +5, Rating 3 (Good) = +3, Rating 2 (Hard) = +1, Rating 1 (Again) = 0
 */
export const QUALITY_BONUS: Record<1 | 2 | 3 | 4, number> = {
  4: 5, // Easy
  3: 3, // Good
  2: 1, // Hard
  1: 0, // Again
};

/**
 * Streak multiplier thresholds
 */
export const STREAK_MULTIPLIERS: { minDays: number; multiplier: number }[] = [
  { minDays: 30, multiplier: 1.2 },
  { minDays: 14, multiplier: 1.15 },
  { minDays: 7, multiplier: 1.1 },
];

/**
 * Points constants
 */
export const POINTS = {
  BASE: 10,
  NO_HINT_BONUS: 3,
  FIRST_ATTEMPT_BONUS: 2,
  SPEED_BONUS_MAX: 5,
  DAILY_CAP: 500,
  /** Stability threshold for speed bonus (30 days) */
  SPEED_BONUS_STABILITY_THRESHOLD: 30,
  /** Response time thresholds for speed bonus (ms) */
  SPEED_BONUS_THRESHOLDS: [3000, 5000, 8000, 12000, 20000] as const,
} as const;

/**
 * Streak freeze constants
 */
export const STREAK_FREEZE = {
  /** Days between freeze earning milestones */
  EARN_INTERVAL: 7,
  /** Maximum freezes a user can hold */
  MAX_FREEZES: 2,
} as const;
