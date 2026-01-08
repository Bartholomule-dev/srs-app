// tests/unit/stats/queries.test.ts
import { describe, it, expect } from 'vitest';
import { getCardsReviewedToday, getTotalAccuracy } from '@/lib/stats/queries';
import type { ExerciseAttempt } from '@/lib/curriculum/types';

describe('getCardsReviewedToday', () => {
  it('returns 0 for empty attempts array', () => {
    const result = getCardsReviewedToday([], new Date('2026-01-03T12:00:00Z'));
    expect(result).toBe(0);
  });

  it('counts exercises practiced today (UTC)', () => {
    const today = new Date('2026-01-03T12:00:00Z');
    const attempts: ExerciseAttempt[] = [
      createAttempt({ lastSeenAt: new Date('2026-01-03T08:00:00Z') }), // today
      createAttempt({ lastSeenAt: new Date('2026-01-03T23:59:59Z') }), // today
      createAttempt({ lastSeenAt: new Date('2026-01-02T23:59:59Z') }), // yesterday
    ];

    expect(getCardsReviewedToday(attempts, today)).toBe(2);
  });

  it('handles timezone edge cases (UTC midnight)', () => {
    const today = new Date('2026-01-03T00:01:00Z');
    const attempts: ExerciseAttempt[] = [
      createAttempt({ lastSeenAt: new Date('2026-01-03T00:00:00Z') }), // just after midnight
      createAttempt({ lastSeenAt: new Date('2026-01-02T23:59:59Z') }), // just before midnight
    ];

    expect(getCardsReviewedToday(attempts, today)).toBe(1);
  });
});

describe('getTotalAccuracy', () => {
  it('returns 0 for empty attempts array', () => {
    expect(getTotalAccuracy([])).toBe(0);
  });

  it('returns 0 when no exercises have been seen', () => {
    const attempts: ExerciseAttempt[] = [
      createAttempt({ timesSeen: 0, timesCorrect: 0 }),
    ];
    expect(getTotalAccuracy(attempts)).toBe(0);
  });

  it('calculates accuracy percentage correctly', () => {
    const attempts: ExerciseAttempt[] = [
      createAttempt({ timesSeen: 10, timesCorrect: 8 }),
      createAttempt({ timesSeen: 10, timesCorrect: 6 }),
    ];
    // Total: 20 seen, 14 correct = 70%
    expect(getTotalAccuracy(attempts)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    const attempts: ExerciseAttempt[] = [
      createAttempt({ timesSeen: 3, timesCorrect: 1 }), // 33.33%
    ];
    expect(getTotalAccuracy(attempts)).toBe(33);
  });
});

// Helper to create minimal ExerciseAttempt objects
function createAttempt(overrides: Partial<ExerciseAttempt>): ExerciseAttempt {
  return {
    id: 'test-id',
    userId: 'user-1',
    exerciseSlug: 'test-exercise',
    timesSeen: 0,
    timesCorrect: 0,
    lastSeenAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}
