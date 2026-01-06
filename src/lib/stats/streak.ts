import { toUTCDateString } from '@/lib/utils/date';

/**
 * Gets the number of days between two UTC date strings.
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines if we should increment the streak.
 * Returns true if:
 * - First practice ever (lastPracticed is null)
 * - Last practice was yesterday (continuing streak)
 * Returns false if:
 * - Already practiced today
 * - Streak is broken (gap > 1 day)
 */
export function shouldIncrementStreak(
  lastPracticed: Date | null,
  now: Date
): boolean {
  if (!lastPracticed) return true;

  const lastDateStr = toUTCDateString(lastPracticed);
  const todayStr = toUTCDateString(now);

  if (lastDateStr === todayStr) return false; // already practiced today

  const daysDiff = daysBetween(lastDateStr, todayStr);
  return daysDiff === 1; // exactly yesterday
}

export interface StreakUpdateInput {
  currentStreak: number;
  longestStreak: number;
  lastPracticed: Date | null;
  now: Date;
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Calculates updated streak values based on practice timing.
 */
export function calculateUpdatedStreak(
  input: StreakUpdateInput
): StreakUpdateResult {
  const { currentStreak, longestStreak, lastPracticed, now } = input;

  // Already practiced today - no change
  if (lastPracticed && toUTCDateString(lastPracticed) === toUTCDateString(now)) {
    return { currentStreak, longestStreak };
  }

  // First practice or continuing from yesterday
  if (shouldIncrementStreak(lastPracticed, now)) {
    const newCurrent = currentStreak + 1;
    const newLongest = Math.max(longestStreak, newCurrent);
    return { currentStreak: newCurrent, longestStreak: newLongest };
  }

  // Streak broken - reset to 1
  return { currentStreak: 1, longestStreak };
}
