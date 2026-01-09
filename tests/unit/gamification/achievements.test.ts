import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  getAchievementsByCategory,
  type Achievement,
  type AchievementCategory,
} from '@/lib/gamification/achievements';

describe('Achievement types', () => {
  it('ACHIEVEMENTS has 18 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBe(18);
  });

  it('each achievement has required fields', () => {
    for (const [slug, achievement] of Object.entries(ACHIEVEMENTS)) {
      expect(achievement.slug).toBe(slug);
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(['habit', 'mastery', 'completionist']).toContain(achievement.category);
      expect(achievement.icon).toBeTruthy();
    }
  });
});

describe('getAchievementsByCategory', () => {
  it('returns habit achievements', () => {
    const habits = getAchievementsByCategory('habit');
    expect(habits.length).toBeGreaterThan(0);
    expect(habits.every((a) => a.category === 'habit')).toBe(true);
    expect(habits.find((a) => a.slug === 'first-steps')).toBeTruthy();
  });

  it('returns mastery achievements', () => {
    const mastery = getAchievementsByCategory('mastery');
    expect(mastery.length).toBeGreaterThan(0);
    expect(mastery.every((a) => a.category === 'mastery')).toBe(true);
    expect(mastery.find((a) => a.slug === 'gold-standard')).toBeTruthy();
  });

  it('returns completionist achievements', () => {
    const completionist = getAchievementsByCategory('completionist');
    expect(completionist.length).toBeGreaterThan(0);
    expect(completionist.every((a) => a.category === 'completionist')).toBe(true);
    expect(completionist.find((a) => a.slug === 'century')).toBeTruthy();
  });
});
