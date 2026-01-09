/**
 * Contribution graph types and utilities
 */

/**
 * Contribution intensity level
 */
export type ContributionLevel = 'none' | 'light' | 'moderate' | 'good' | 'strong';

/**
 * Data for a single day in the contribution graph
 */
export interface ContributionDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of cards reviewed */
  count: number;
  /** Accuracy percentage (0-100) */
  accuracy: number | null;
  /** Contribution intensity level */
  level: ContributionLevel;
}

/**
 * Thresholds for contribution levels
 */
export const CONTRIBUTION_THRESHOLDS = {
  light: 1,     // 1-5 cards
  moderate: 6,  // 6-15 cards
  good: 16,     // 16-30 cards
  strong: 31,   // 31+ cards
} as const;

/**
 * Get contribution level for a card count
 */
export function getContributionLevel(count: number): ContributionLevel {
  if (count === 0) return 'none';
  if (count < CONTRIBUTION_THRESHOLDS.moderate) return 'light';
  if (count < CONTRIBUTION_THRESHOLDS.good) return 'moderate';
  if (count < CONTRIBUTION_THRESHOLDS.strong) return 'good';
  return 'strong';
}

/**
 * CSS class map for contribution levels
 */
export const CONTRIBUTION_COLORS: Record<ContributionLevel, string> = {
  none: 'bg-bg-surface-1',
  light: 'bg-accent-primary/25',
  moderate: 'bg-accent-primary/50',
  good: 'bg-accent-primary/75',
  strong: 'bg-accent-primary',
};
