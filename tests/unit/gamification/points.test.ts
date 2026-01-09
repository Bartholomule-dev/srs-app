import { describe, it, expect } from 'vitest';
import {
  calculateQualityBonus,
  calculateSpeedBonus,
  calculateStreakMultiplier,
  calculatePointsBreakdown,
  formatPoints,
  type PointsCalculationInput,
} from '@/lib/gamification/points';
import { POINTS, STREAK_MULTIPLIERS } from '@/lib/gamification/types';

describe('calculateQualityBonus', () => {
  it('returns 5 for rating 4 (Easy)', () => {
    expect(calculateQualityBonus(4)).toBe(5);
  });

  it('returns 3 for rating 3 (Good)', () => {
    expect(calculateQualityBonus(3)).toBe(3);
  });

  it('returns 1 for rating 2 (Hard)', () => {
    expect(calculateQualityBonus(2)).toBe(1);
  });

  it('returns 0 for rating 1 (Again)', () => {
    expect(calculateQualityBonus(1)).toBe(0);
  });
});

describe('calculateSpeedBonus', () => {
  describe('stability threshold check', () => {
    it('returns 0 when stability is below threshold', () => {
      expect(calculateSpeedBonus(1000, 29)).toBe(0);
    });

    it('returns 0 when stability is exactly at threshold - 1', () => {
      expect(calculateSpeedBonus(1000, 29.99)).toBe(0);
    });

    it('applies bonus when stability is at threshold', () => {
      expect(calculateSpeedBonus(1000, 30)).toBe(5);
    });

    it('applies bonus when stability is above threshold', () => {
      expect(calculateSpeedBonus(1000, 60)).toBe(5);
    });
  });

  describe('time thresholds', () => {
    const highStability = 60;

    it('returns 5 for response under 3000ms', () => {
      expect(calculateSpeedBonus(2999, highStability)).toBe(5);
      expect(calculateSpeedBonus(1000, highStability)).toBe(5);
      expect(calculateSpeedBonus(0, highStability)).toBe(5);
    });

    it('returns 4 for response 3000-4999ms', () => {
      expect(calculateSpeedBonus(3000, highStability)).toBe(4);
      expect(calculateSpeedBonus(4500, highStability)).toBe(4);
      expect(calculateSpeedBonus(4999, highStability)).toBe(4);
    });

    it('returns 3 for response 5000-7999ms', () => {
      expect(calculateSpeedBonus(5000, highStability)).toBe(3);
      expect(calculateSpeedBonus(7000, highStability)).toBe(3);
      expect(calculateSpeedBonus(7999, highStability)).toBe(3);
    });

    it('returns 2 for response 8000-11999ms', () => {
      expect(calculateSpeedBonus(8000, highStability)).toBe(2);
      expect(calculateSpeedBonus(10000, highStability)).toBe(2);
      expect(calculateSpeedBonus(11999, highStability)).toBe(2);
    });

    it('returns 1 for response 12000-19999ms', () => {
      expect(calculateSpeedBonus(12000, highStability)).toBe(1);
      expect(calculateSpeedBonus(15000, highStability)).toBe(1);
      expect(calculateSpeedBonus(19999, highStability)).toBe(1);
    });

    it('returns 0 for response 20000ms or more', () => {
      expect(calculateSpeedBonus(20000, highStability)).toBe(0);
      expect(calculateSpeedBonus(30000, highStability)).toBe(0);
    });
  });
});

describe('calculateStreakMultiplier', () => {
  it('returns 1.0 for streak of 0 days', () => {
    expect(calculateStreakMultiplier(0)).toBe(1.0);
  });

  it('returns 1.0 for streak of 6 days', () => {
    expect(calculateStreakMultiplier(6)).toBe(1.0);
  });

  it('returns 1.1 for streak of 7 days', () => {
    expect(calculateStreakMultiplier(7)).toBe(1.1);
  });

  it('returns 1.1 for streak of 13 days', () => {
    expect(calculateStreakMultiplier(13)).toBe(1.1);
  });

  it('returns 1.15 for streak of 14 days', () => {
    expect(calculateStreakMultiplier(14)).toBe(1.15);
  });

  it('returns 1.15 for streak of 29 days', () => {
    expect(calculateStreakMultiplier(29)).toBe(1.15);
  });

  it('returns 1.2 for streak of 30 days', () => {
    expect(calculateStreakMultiplier(30)).toBe(1.2);
  });

  it('returns 1.2 for streak of 100 days', () => {
    expect(calculateStreakMultiplier(100)).toBe(1.2);
  });
});

describe('calculatePointsBreakdown', () => {
  const baseInput: PointsCalculationInput = {
    isCorrect: true,
    rating: 3,
    hintUsed: false,
    isFirstAttempt: true,
    responseTimeMs: 5000,
    subconceptStability: 15,
    currentStreak: 0,
  };

  describe('incorrect answers', () => {
    it('returns all zeros for incorrect answer', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        isCorrect: false,
      });

      expect(result).toEqual({
        base: 0,
        qualityBonus: 0,
        noHintBonus: 0,
        firstAttemptBonus: 0,
        speedBonus: 0,
        subtotal: 0,
        streakMultiplier: 1.0,
        total: 0,
      });
    });
  });

  describe('correct answers', () => {
    it('calculates base points correctly', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        hintUsed: true,
        isFirstAttempt: false,
      });

      expect(result.base).toBe(POINTS.BASE);
    });

    it('applies quality bonus based on rating', () => {
      const result = calculatePointsBreakdown(baseInput);
      expect(result.qualityBonus).toBe(3); // rating 3 = +3
    });

    it('applies no-hint bonus when hint not used', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        hintUsed: false,
      });
      expect(result.noHintBonus).toBe(POINTS.NO_HINT_BONUS);
    });

    it('does not apply no-hint bonus when hint used', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        hintUsed: true,
      });
      expect(result.noHintBonus).toBe(0);
    });

    it('applies first-attempt bonus on first attempt', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        isFirstAttempt: true,
      });
      expect(result.firstAttemptBonus).toBe(POINTS.FIRST_ATTEMPT_BONUS);
    });

    it('does not apply first-attempt bonus on subsequent attempts', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        isFirstAttempt: false,
      });
      expect(result.firstAttemptBonus).toBe(0);
    });

    it('applies speed bonus for mastered subconcepts', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        subconceptStability: 60,
        responseTimeMs: 2000,
      });
      expect(result.speedBonus).toBe(5);
    });

    it('does not apply speed bonus for non-mastered subconcepts', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        subconceptStability: 15,
        responseTimeMs: 2000,
      });
      expect(result.speedBonus).toBe(0);
    });
  });

  describe('subtotal and multiplier', () => {
    it('calculates subtotal as sum of all bonuses', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        rating: 4,
        hintUsed: false,
        isFirstAttempt: true,
        subconceptStability: 60,
        responseTimeMs: 2000,
      });
      // base(10) + quality(5) + noHint(3) + firstAttempt(2) + speed(5) = 25
      expect(result.subtotal).toBe(25);
    });

    it('applies streak multiplier to subtotal', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        currentStreak: 14,
        rating: 4,
        hintUsed: true,
        isFirstAttempt: false,
        subconceptStability: 0,
      });
      // base(10) + quality(5) = 15, * 1.15 = 17.25, floored = 17
      expect(result.streakMultiplier).toBe(1.15);
      expect(result.subtotal).toBe(15);
      expect(result.total).toBe(17);
    });

    it('floors total points', () => {
      const result = calculatePointsBreakdown({
        ...baseInput,
        currentStreak: 7,
        rating: 3,
        hintUsed: true,
        isFirstAttempt: false,
        subconceptStability: 0,
      });
      // base(10) + quality(3) = 13, * 1.1 = 14.3, floored = 14
      expect(result.total).toBe(14);
    });
  });

  describe('full calculation examples', () => {
    it('calculates maximum possible points', () => {
      const result = calculatePointsBreakdown({
        isCorrect: true,
        rating: 4, // +5
        hintUsed: false, // +3
        isFirstAttempt: true, // +2
        responseTimeMs: 1000, // +5 (if stable)
        subconceptStability: 60, // meets threshold
        currentStreak: 30, // 1.2x
      });
      // 10 + 5 + 3 + 2 + 5 = 25, * 1.2 = 30
      expect(result.total).toBe(30);
    });

    it('calculates minimum possible points for correct answer', () => {
      const result = calculatePointsBreakdown({
        isCorrect: true,
        rating: 1, // +0
        hintUsed: true, // +0
        isFirstAttempt: false, // +0
        responseTimeMs: 30000, // +0
        subconceptStability: 0, // no speed bonus
        currentStreak: 0, // 1.0x
      });
      // 10 + 0 + 0 + 0 + 0 = 10, * 1.0 = 10
      expect(result.total).toBe(10);
    });
  });
});

describe('formatPoints', () => {
  it('formats zero as "0"', () => {
    expect(formatPoints(0)).toBe('0');
  });

  it('formats small positive number with plus sign', () => {
    expect(formatPoints(15)).toBe('+15');
  });

  it('formats large number with comma separator and plus sign', () => {
    expect(formatPoints(1500)).toBe('+1,500');
  });

  it('formats very large numbers correctly', () => {
    expect(formatPoints(10000)).toBe('+10,000');
    expect(formatPoints(1000000)).toBe('+1,000,000');
  });

  it('formats single digit with plus sign', () => {
    expect(formatPoints(1)).toBe('+1');
  });
});
