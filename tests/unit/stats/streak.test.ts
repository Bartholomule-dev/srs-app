import { describe, it, expect } from 'vitest';
import { shouldIncrementStreak, calculateUpdatedStreak } from '@/lib/stats/streak';

describe('shouldIncrementStreak', () => {
  it('returns true for first practice ever (null lastPracticed)', () => {
    expect(shouldIncrementStreak(null, new Date('2026-01-03T12:00:00Z'))).toBe(true);
  });

  it('returns true when last practice was yesterday (UTC)', () => {
    const lastPracticed = new Date('2026-01-02T18:00:00Z');
    const now = new Date('2026-01-03T10:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(true);
  });

  it('returns false when already practiced today (UTC)', () => {
    const lastPracticed = new Date('2026-01-03T08:00:00Z');
    const now = new Date('2026-01-03T20:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(false);
  });

  it('returns false when streak is broken (gap > 1 day)', () => {
    const lastPracticed = new Date('2026-01-01T18:00:00Z');
    const now = new Date('2026-01-03T10:00:00Z');
    expect(shouldIncrementStreak(lastPracticed, now)).toBe(false);
  });
});

describe('calculateUpdatedStreak', () => {
  it('starts streak at 1 for first practice', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 0,
      longestStreak: 0,
      lastPracticed: null,
      now: new Date('2026-01-03T12:00:00Z'),
    });

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('increments streak when continuing from yesterday', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(10); // unchanged
  });

  it('updates longest streak when current exceeds it', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 10,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(11);
    expect(result.longestStreak).toBe(11);
  });

  it('does not change streak when already practiced today', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-03T08:00:00Z'),
      now: new Date('2026-01-03T20:00:00Z'),
    });

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(10);
  });

  it('resets streak to 1 when broken (gap > 1 day)', () => {
    const result = calculateUpdatedStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastPracticed: new Date('2026-01-01T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10); // preserved
  });
});
