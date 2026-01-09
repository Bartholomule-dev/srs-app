import { describe, it, expect } from 'vitest';
import {
  getBadgeTier,
  BADGE_THRESHOLDS,
  shouldCelebrateTierUp,
} from '@/lib/gamification/badges';

describe('Badge types', () => {
  it('BADGE_THRESHOLDS has correct values', () => {
    expect(BADGE_THRESHOLDS.bronze).toBe(1);
    expect(BADGE_THRESHOLDS.silver).toBe(7);
    expect(BADGE_THRESHOLDS.gold).toBe(30);
    expect(BADGE_THRESHOLDS.platinum).toBe(90);
  });
});

describe('getBadgeTier', () => {
  it('returns "locked" when prerequisites not met', () => {
    expect(getBadgeTier({ stability: 0, prereqsMet: false })).toBe('locked');
  });

  it('returns "available" when prereqs met but not started', () => {
    expect(getBadgeTier({ stability: 0, prereqsMet: true })).toBe('available');
  });

  it('returns "bronze" for stability >= 1 day', () => {
    expect(getBadgeTier({ stability: 1, prereqsMet: true })).toBe('bronze');
    expect(getBadgeTier({ stability: 6, prereqsMet: true })).toBe('bronze');
  });

  it('returns "silver" for stability >= 7 days', () => {
    expect(getBadgeTier({ stability: 7, prereqsMet: true })).toBe('silver');
    expect(getBadgeTier({ stability: 29, prereqsMet: true })).toBe('silver');
  });

  it('returns "gold" for stability >= 30 days', () => {
    expect(getBadgeTier({ stability: 30, prereqsMet: true })).toBe('gold');
    expect(getBadgeTier({ stability: 89, prereqsMet: true })).toBe('gold');
  });

  it('returns "platinum" for stability >= 90 days', () => {
    expect(getBadgeTier({ stability: 90, prereqsMet: true })).toBe('platinum');
    expect(getBadgeTier({ stability: 365, prereqsMet: true })).toBe('platinum');
  });

  it('ignores stability when prereqs not met', () => {
    expect(getBadgeTier({ stability: 100, prereqsMet: false })).toBe('locked');
  });
});

describe('shouldCelebrateTierUp', () => {
  it('returns null when tier stays the same', () => {
    expect(shouldCelebrateTierUp('bronze', 'bronze')).toBeNull();
  });

  it('returns null when tier goes down', () => {
    expect(shouldCelebrateTierUp('gold', 'silver')).toBeNull();
    expect(shouldCelebrateTierUp('platinum', 'bronze')).toBeNull();
  });

  it('returns "mini" for upgrade to bronze', () => {
    expect(shouldCelebrateTierUp('available', 'bronze')).toBe('mini');
    expect(shouldCelebrateTierUp('locked', 'bronze')).toBe('mini');
  });

  it('returns "mini" for upgrade to silver', () => {
    expect(shouldCelebrateTierUp('bronze', 'silver')).toBe('mini');
    expect(shouldCelebrateTierUp('available', 'silver')).toBe('mini');
  });

  it('returns "full" for upgrade to gold', () => {
    expect(shouldCelebrateTierUp('silver', 'gold')).toBe('full');
    expect(shouldCelebrateTierUp('bronze', 'gold')).toBe('full');
    expect(shouldCelebrateTierUp('available', 'gold')).toBe('full');
  });

  it('returns "full" for upgrade to platinum', () => {
    expect(shouldCelebrateTierUp('gold', 'platinum')).toBe('full');
    expect(shouldCelebrateTierUp('silver', 'platinum')).toBe('full');
    expect(shouldCelebrateTierUp('bronze', 'platinum')).toBe('full');
  });

  it('returns null for non-badge tier transitions (locked to available)', () => {
    expect(shouldCelebrateTierUp('locked', 'available')).toBeNull();
  });
});
