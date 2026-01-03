// tests/unit/stats/queries.test.ts
import { describe, it, expect } from 'vitest';
import { getCardsReviewedToday, getTotalAccuracy } from '@/lib/stats/queries';
import type { UserProgress } from '@/lib/types';

describe('getCardsReviewedToday', () => {
  it('returns 0 for empty progress array', () => {
    const result = getCardsReviewedToday([], new Date('2026-01-03T12:00:00Z'));
    expect(result).toBe(0);
  });

  it('counts cards reviewed today (UTC)', () => {
    const today = new Date('2026-01-03T12:00:00Z');
    const progress: UserProgress[] = [
      createProgress({ lastReviewed: '2026-01-03T08:00:00Z' }), // today
      createProgress({ lastReviewed: '2026-01-03T23:59:59Z' }), // today
      createProgress({ lastReviewed: '2026-01-02T23:59:59Z' }), // yesterday
      createProgress({ lastReviewed: null }), // never reviewed
    ];

    expect(getCardsReviewedToday(progress, today)).toBe(2);
  });

  it('handles timezone edge cases (UTC midnight)', () => {
    const today = new Date('2026-01-03T00:01:00Z');
    const progress: UserProgress[] = [
      createProgress({ lastReviewed: '2026-01-03T00:00:00Z' }), // just after midnight
      createProgress({ lastReviewed: '2026-01-02T23:59:59Z' }), // just before midnight
    ];

    expect(getCardsReviewedToday(progress, today)).toBe(1);
  });
});

describe('getTotalAccuracy', () => {
  it('returns 0 for empty progress array', () => {
    expect(getTotalAccuracy([])).toBe(0);
  });

  it('returns 0 when no cards have been seen', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 0, timesCorrect: 0 }),
    ];
    expect(getTotalAccuracy(progress)).toBe(0);
  });

  it('calculates accuracy percentage correctly', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 10, timesCorrect: 8 }),
      createProgress({ timesSeen: 10, timesCorrect: 6 }),
    ];
    // Total: 20 seen, 14 correct = 70%
    expect(getTotalAccuracy(progress)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    const progress: UserProgress[] = [
      createProgress({ timesSeen: 3, timesCorrect: 1 }), // 33.33%
    ];
    expect(getTotalAccuracy(progress)).toBe(33);
  });
});

// Helper to create minimal UserProgress objects
function createProgress(overrides: Partial<UserProgress>): UserProgress {
  return {
    id: 'test-id',
    userId: 'user-1',
    exerciseId: 'exercise-1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2026-01-04T00:00:00Z',
    lastReviewed: null,
    timesSeen: 0,
    timesCorrect: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
