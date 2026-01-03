import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

describe('SRS Flow Integration', () => {
  let testUserId: string;
  let testExerciseId: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData } = await serviceClient.auth.admin.createUser({
      email: `srs-test-${Date.now()}@example.com`,
      email_confirm: true,
    });
    testUserId = userData.user!.id;

    // Get an exercise ID from seed data
    const { data: exercises } = await serviceClient
      .from('exercises')
      .select('id')
      .limit(1)
      .single();
    testExerciseId = exercises!.id;
  });

  afterAll(async () => {
    // Clean up test user (cascades to user_progress)
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    // Clean up any existing progress for this user
    await serviceClient
      .from('user_progress')
      .delete()
      .eq('user_id', testUserId);
  });

  it('creates progress record on first answer', async () => {
    // Simulate first answer (quality 4 = good)
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1); // Initial interval = 1

    const { data, error } = await serviceClient
      .from('user_progress')
      .insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 2.5,
        interval: 1,
        repetitions: 1,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 1,
        times_correct: 1,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.ease_factor).toBe(2.5);
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(1);
  });

  it('updates progress after subsequent answer', async () => {
    // Create initial progress
    const now = new Date();
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      ease_factor: 2.5,
      interval: 1,
      repetitions: 1,
      next_review: now.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Update with second answer (quality 4 -> interval becomes 6)
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 6);

    const { data, error } = await serviceClient
      .from('user_progress')
      .update({
        ease_factor: 2.5,
        interval: 6,
        repetitions: 2,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 2,
        times_correct: 2,
      })
      .eq('user_id', testUserId)
      .eq('exercise_id', testExerciseId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.interval).toBe(6);
    expect(data.repetitions).toBe(2);
  });

  it('resets progress on failure', async () => {
    // Create progress with good history
    const now = new Date();
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: testExerciseId,
      ease_factor: 2.5,
      interval: 10,
      repetitions: 3,
      next_review: now.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 3,
      times_correct: 3,
    });

    // Simulate failure (quality < 3)
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1); // Reset to 1 day

    const { data, error } = await serviceClient
      .from('user_progress')
      .update({
        interval: 1,
        repetitions: 0,
        next_review: nextReview.toISOString(),
        last_reviewed: now.toISOString(),
        times_seen: 4,
        times_correct: 3, // Did not increment
      })
      .eq('user_id', testUserId)
      .eq('exercise_id', testExerciseId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.interval).toBe(1);
    expect(data.repetitions).toBe(0);
    expect(data.times_correct).toBe(3);
  });

  it('fetches due cards correctly', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get multiple exercise IDs
    const { data: exercises } = await serviceClient
      .from('exercises')
      .select('id')
      .limit(3);

    // Create due card (yesterday)
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: exercises![0].id,
      ease_factor: 2.5,
      interval: 1,
      repetitions: 1,
      next_review: yesterday.toISOString(),
      last_reviewed: yesterday.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Create not-due card (tomorrow)
    await serviceClient.from('user_progress').insert({
      user_id: testUserId,
      exercise_id: exercises![1].id,
      ease_factor: 2.5,
      interval: 2,
      repetitions: 1,
      next_review: tomorrow.toISOString(),
      last_reviewed: now.toISOString(),
      times_seen: 1,
      times_correct: 1,
    });

    // Fetch due cards
    const { data: dueCards } = await serviceClient
      .from('user_progress')
      .select('*')
      .eq('user_id', testUserId)
      .lte('next_review', now.toISOString());

    expect(dueCards).toHaveLength(1);
    expect(dueCards![0].exercise_id).toBe(exercises![0].id);
  });
});
