// tests/unit/supabase/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { mapProfile } from '@/lib/supabase/mappers';

describe('mapProfile', () => {
  // Base profile fixture with all required fields
  const baseDbProfile = {
    id: 'user-123',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
    preferred_language: 'python',
    daily_goal: 15,
    notification_time: '09:00',
    current_streak: 5,
    longest_streak: 10,
    total_exercises_completed: 100,
    experience_level: 'learning',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-08T00:00:00Z',
  };

  it('maps recent_skins to recentSkins array', () => {
    const dbProfile = {
      ...baseDbProfile,
      recent_skins: ['skin-1', 'skin-2'],
    };

    const result = mapProfile(dbProfile as any);

    expect(result.recentSkins).toEqual(['skin-1', 'skin-2']);
  });

  it('defaults to empty array when recent_skins is null', () => {
    const dbProfile = {
      ...baseDbProfile,
      recent_skins: null,
    };

    const result = mapProfile(dbProfile as any);

    expect(result.recentSkins).toEqual([]);
  });

  it('defaults to empty array when recent_skins is undefined', () => {
    const dbProfile = {
      ...baseDbProfile,
      // recent_skins not included
    };

    const result = mapProfile(dbProfile as any);

    expect(result.recentSkins).toEqual([]);
  });

  it('maps all profile fields correctly', () => {
    const dbProfile = {
      ...baseDbProfile,
      recent_skins: ['skin-a'],
    };

    const result = mapProfile(dbProfile as any);

    expect(result).toEqual({
      id: 'user-123',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      preferredLanguage: 'python',
      dailyGoal: 15,
      notificationTime: '09:00',
      currentStreak: 5,
      longestStreak: 10,
      totalExercisesCompleted: 100,
      experienceLevel: 'learning',
      recentSkins: ['skin-a'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-08T00:00:00Z',
    });
  });
});
