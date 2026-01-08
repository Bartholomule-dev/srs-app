// src/lib/stats/queries.ts
import type { ExerciseAttempt } from '@/lib/curriculum/types';
import { toUTCDateString } from '@/lib/utils/date';

/**
 * Counts how many exercises were practiced today (UTC).
 * @param attempts - Array of exercise attempt records
 * @param now - Current date/time (for testability)
 */
export function getCardsReviewedToday(
  attempts: ExerciseAttempt[],
  now: Date = new Date()
): number {
  const todayStr = toUTCDateString(now);

  return attempts.filter((a) => {
    if (!a.lastSeenAt) return false;
    const attemptDateStr = toUTCDateString(new Date(a.lastSeenAt));
    return attemptDateStr === todayStr;
  }).length;
}

/**
 * Calculates overall accuracy percentage across all attempt records.
 * @param attempts - Array of exercise attempt records
 * @returns Accuracy as integer percentage (0-100)
 */
export function getTotalAccuracy(attempts: ExerciseAttempt[]): number {
  const totals = attempts.reduce(
    (acc, a) => ({
      seen: acc.seen + a.timesSeen,
      correct: acc.correct + a.timesCorrect,
    }),
    { seen: 0, correct: 0 }
  );

  if (totals.seen === 0) return 0;
  return Math.round((totals.correct / totals.seen) * 100);
}
