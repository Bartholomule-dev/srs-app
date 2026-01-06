// src/lib/stats/queries.ts
import type { UserProgress } from '@/lib/types';
import { toUTCDateString } from '@/lib/utils/date';

/**
 * Counts how many cards were reviewed today (UTC).
 * @param progress - Array of user progress records
 * @param now - Current date/time (for testability)
 */
export function getCardsReviewedToday(
  progress: UserProgress[],
  now: Date = new Date()
): number {
  const todayStr = toUTCDateString(now);

  return progress.filter((p) => {
    if (!p.lastReviewed) return false;
    const reviewDateStr = toUTCDateString(new Date(p.lastReviewed));
    return reviewDateStr === todayStr;
  }).length;
}

/**
 * Calculates overall accuracy percentage across all progress records.
 * @param progress - Array of user progress records
 * @returns Accuracy as integer percentage (0-100)
 */
export function getTotalAccuracy(progress: UserProgress[]): number {
  const totals = progress.reduce(
    (acc, p) => ({
      seen: acc.seen + p.timesSeen,
      correct: acc.correct + p.timesCorrect,
    }),
    { seen: 0, correct: 0 }
  );

  if (totals.seen === 0) return 0;
  return Math.round((totals.correct / totals.seen) * 100);
}
