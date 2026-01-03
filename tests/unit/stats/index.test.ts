// tests/unit/stats/index.test.ts
import { describe, it, expect } from 'vitest';
import * as stats from '@/lib/stats';

describe('Stats barrel export', () => {
  it('exports types', () => {
    // Type-only exports verified by TypeScript compilation
    const userStats: stats.UserStats = {
      cardsReviewedToday: 0,
      accuracyPercent: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalExercisesCompleted: 0,
    };
    expect(userStats).toBeDefined();
  });

  it('exports query functions', () => {
    expect(typeof stats.getCardsReviewedToday).toBe('function');
    expect(typeof stats.getTotalAccuracy).toBe('function');
  });

  it('exports streak utilities', () => {
    expect(typeof stats.shouldIncrementStreak).toBe('function');
    expect(typeof stats.calculateUpdatedStreak).toBe('function');
  });
});
