// tests/unit/gamification/contribution.test.ts
import { describe, it, expect } from 'vitest';
import type { ContributionDay, ContributionLevel } from '@/lib/gamification/contribution';
import { getContributionLevel, CONTRIBUTION_THRESHOLDS } from '@/lib/gamification/contribution';

describe('Contribution types', () => {
  it('ContributionDay has required fields', () => {
    const day: ContributionDay = {
      date: '2026-01-08',
      count: 15,
      accuracy: 85,
      level: 'moderate',
    };
    expect(day.level).toBe('moderate');
  });
});

describe('getContributionLevel', () => {
  it('returns "none" for 0 cards', () => {
    expect(getContributionLevel(0)).toBe('none');
  });

  it('returns "light" for 1-5 cards', () => {
    expect(getContributionLevel(1)).toBe('light');
    expect(getContributionLevel(5)).toBe('light');
  });

  it('returns "moderate" for 6-15 cards', () => {
    expect(getContributionLevel(6)).toBe('moderate');
    expect(getContributionLevel(15)).toBe('moderate');
  });

  it('returns "good" for 16-30 cards', () => {
    expect(getContributionLevel(16)).toBe('good');
    expect(getContributionLevel(30)).toBe('good');
  });

  it('returns "strong" for 31+ cards', () => {
    expect(getContributionLevel(31)).toBe('strong');
    expect(getContributionLevel(100)).toBe('strong');
  });
});

describe('CONTRIBUTION_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(CONTRIBUTION_THRESHOLDS.light).toBe(1);
    expect(CONTRIBUTION_THRESHOLDS.moderate).toBe(6);
    expect(CONTRIBUTION_THRESHOLDS.good).toBe(16);
    expect(CONTRIBUTION_THRESHOLDS.strong).toBe(31);
  });
});
