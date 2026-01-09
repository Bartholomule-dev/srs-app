import { describe, it, expect } from 'vitest';
import type {
  PointsBreakdown,
  StreakInfo,
  PointsSummary,
} from '@/lib/gamification/types';

describe('Gamification types', () => {
  it('PointsBreakdown has required fields', () => {
    const breakdown: PointsBreakdown = {
      base: 10,
      qualityBonus: 3,
      noHintBonus: 3,
      firstAttemptBonus: 2,
      speedBonus: 0,
      subtotal: 18,
      streakMultiplier: 1.1,
      total: 20,
    };
    expect(breakdown.total).toBe(20);
  });

  it('StreakInfo has required fields', () => {
    const streak: StreakInfo = {
      currentStreak: 7,
      longestStreak: 14,
      freezesAvailable: 2,
      lastActivityDate: '2026-01-08',
      lastFreezeEarnedAt: null,
    };
    expect(streak.freezesAvailable).toBeLessThanOrEqual(2);
  });

  it('PointsSummary has required fields', () => {
    const summary: PointsSummary = {
      today: 150,
      thisWeek: 850,
      dailyCap: 500,
      dailyCapReached: false,
    };
    expect(summary.dailyCap).toBe(500);
  });
});
