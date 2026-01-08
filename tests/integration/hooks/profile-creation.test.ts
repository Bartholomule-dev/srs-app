// tests/integration/hooks/profile-creation.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import { serviceClient } from '@tests/fixtures/supabase';

describe('Profile Auto-Creation', () => {
  let testUserId: string;

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  it('creates profile when user signs up', async () => {
    // Create a new user via admin API
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: `test-profile-${Date.now()}@example.com`,
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    testUserId = data.user!.id;

    // Profile should be auto-created by trigger
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.id).toBe(testUserId);
    expect(profile.daily_goal).toBe(10); // Default value
    expect(profile.current_streak).toBe(0);
  });

  it('profile has correct default values', async () => {
    // Create another test user
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: `test-defaults-${Date.now()}@example.com`,
      email_confirm: true,
    });

    expect(error).toBeNull();
    const userId = data.user!.id;

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    expect(profile.preferred_language).toBe('python');
    expect(profile.daily_goal).toBe(10);
    expect(profile.current_streak).toBe(0);
    expect(profile.longest_streak).toBe(0);
    expect(profile.total_exercises_completed).toBe(0);

    // Clean up
    await serviceClient.auth.admin.deleteUser(userId);
  });
});
