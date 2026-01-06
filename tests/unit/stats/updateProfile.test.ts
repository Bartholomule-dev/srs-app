import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfileStats } from '@/lib/stats/updateProfile';

// Hoist mocks to avoid "Cannot access before initialization" error
const { mockRpc, mockSelectSingle } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSelectSingle: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSelectSingle,
        })),
      })),
    })),
    rpc: mockRpc,
  },
}));

describe('updateProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: profile fetch succeeds
    mockSelectSingle.mockResolvedValue({
      data: {
        id: 'user-1',
        current_streak: 5,
        longest_streak: 10,
      },
      error: null,
    });

    // Default: RPC succeeds
    mockRpc.mockResolvedValue({ data: null, error: null });
  });

  it('calls atomic RPC to increment exercises completed', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 5,
      lastPracticed: null,
      now: new Date('2026-01-03T12:00:00Z'),
    });

    expect(mockRpc).toHaveBeenCalledWith('update_profile_stats_atomic', {
      p_user_id: 'user-1',
      p_exercises_completed: 5,
      p_current_streak: expect.any(Number),
      p_longest_streak: expect.any(Number),
    });
  });

  it('passes correct streak values to RPC', async () => {
    // Simulate continuing streak from yesterday
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 1,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(mockRpc).toHaveBeenCalledWith('update_profile_stats_atomic', {
      p_user_id: 'user-1',
      p_exercises_completed: 1,
      p_current_streak: 6, // Incremented from 5
      p_longest_streak: 10, // Unchanged (6 < 10)
    });
  });

  it('updates longest streak when current exceeds it', async () => {
    mockSelectSingle.mockResolvedValue({
      data: {
        current_streak: 9,
        longest_streak: 9,
      },
      error: null,
    });

    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 1,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(mockRpc).toHaveBeenCalledWith('update_profile_stats_atomic', {
      p_user_id: 'user-1',
      p_exercises_completed: 1,
      p_current_streak: 10,
      p_longest_streak: 10, // Updated to match new current
    });
  });

  it('resets streak after gap of more than one day', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 1,
      lastPracticed: new Date('2026-01-01T18:00:00Z'), // 2 days ago
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(mockRpc).toHaveBeenCalledWith('update_profile_stats_atomic', {
      p_user_id: 'user-1',
      p_exercises_completed: 1,
      p_current_streak: 1, // Reset to 1
      p_longest_streak: 10, // Unchanged
    });
  });

  it('throws error when profile fetch fails', async () => {
    mockSelectSingle.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found', code: 'PGRST116' },
    });

    await expect(
      updateProfileStats({
        userId: 'user-1',
        exercisesCompleted: 1,
        lastPracticed: null,
      })
    ).rejects.toThrow();
  });

  it('throws error when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC error', code: '42000' },
    });

    await expect(
      updateProfileStats({
        userId: 'user-1',
        exercisesCompleted: 1,
        lastPracticed: null,
      })
    ).rejects.toThrow();
  });
});
