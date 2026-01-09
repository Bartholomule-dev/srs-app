import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  serviceClient as supabase,
  createTestUser,
  deleteTestUser,
} from '@tests/fixtures/supabase';

describe('get_contribution_history RPC function', () => {
  let testUserId: string;

  beforeAll(async () => {
    testUserId = await createTestUser();
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase
        .from('exercise_attempts')
        .delete()
        .eq('user_id', testUserId);
      await deleteTestUser(testUserId);
    }
  });

  beforeEach(async () => {
    await supabase
      .from('exercise_attempts')
      .delete()
      .eq('user_id', testUserId);
  });

  it('returns empty array when no attempts', async () => {
    const { data, error } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('aggregates attempts by date', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-05T11:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: false, attempted_at: '2026-01-05T12:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(1);
    expect(data[0].date).toBe('2026-01-05');
    expect(data[0].count).toBe(3);
    expect(data[0].accuracy).toBe(67); // 2/3 = 66.67 rounded
  });

  it('returns multiple days', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-06T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: true, attempted_at: '2026-01-07T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(3);
    expect(data.map((d: { date: string }) => d.date)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
  });

  it('filters by date range', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-10T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.length).toBe(1);
    expect(data[0].date).toBe('2026-01-05');
  });

  it('excludes attempts with null is_correct (teaching cards)', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: null, attempted_at: '2026-01-05T11:00:00Z' }, // Teaching card
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data[0].count).toBe(1); // Only graded card
  });

  it('orders by date ascending', async () => {
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, attempted_at: '2026-01-07T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, attempted_at: '2026-01-05T10:00:00Z' },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: true, attempted_at: '2026-01-06T10:00:00Z' },
    ]);

    const { data } = await supabase.rpc('get_contribution_history', {
      p_user_id: testUserId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-07',
    });

    expect(data.map((d: { date: string }) => d.date)).toEqual(['2026-01-05', '2026-01-06', '2026-01-07']);
  });
});
