// tests/unit/stats/index.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock supabase before importing stats (updateProfile imports supabase)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          })),
        })),
      })),
    })),
  },
}));

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

  it('exports updateProfileStats', () => {
    expect(typeof stats.updateProfileStats).toBe('function');
  });
});
