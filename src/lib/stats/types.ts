/**
 * Aggregated user statistics for dashboard display.
 */
export interface UserStats {
  /** Number of cards reviewed in the current day (UTC) */
  cardsReviewedToday: number;
  /** Overall accuracy as a percentage (0-100) */
  accuracyPercent: number;
  /** Current consecutive days practiced */
  currentStreak: number;
  /** Highest streak ever achieved */
  longestStreak: number;
  /** Total number of exercises with at least one review */
  totalExercisesCompleted: number;
}

/**
 * Statistics for a single day of practice.
 */
export interface DailyStats {
  /** Date in YYYY-MM-DD format (UTC) */
  date: string;
  /** Total cards reviewed on this day */
  cardsReviewed: number;
  /** Number of correct answers */
  correctCount: number;
  /** Number of incorrect answers */
  incorrectCount: number;
}
