// tests/unit/stats/types.test.ts
import { describe, it, expect } from 'vitest';
import type { UserStats, DailyStats } from '@/lib/stats/types';

describe('Stats types', () => {
  it('UserStats has required fields', () => {
    const stats: UserStats = {
      cardsReviewedToday: 10,
      accuracyPercent: 85,
      currentStreak: 7,
      longestStreak: 14,
      totalExercisesCompleted: 150,
    };

    expect(stats.cardsReviewedToday).toBe(10);
    expect(stats.accuracyPercent).toBe(85);
    expect(stats.currentStreak).toBe(7);
    expect(stats.longestStreak).toBe(14);
    expect(stats.totalExercisesCompleted).toBe(150);
  });

  it('DailyStats tracks today activity', () => {
    const daily: DailyStats = {
      date: '2026-01-03',
      cardsReviewed: 10,
      correctCount: 8,
      incorrectCount: 2,
    };

    expect(daily.date).toBe('2026-01-03');
    expect(daily.cardsReviewed).toBe(10);
    expect(daily.correctCount).toBe(8);
    expect(daily.incorrectCount).toBe(2);
  });
});
