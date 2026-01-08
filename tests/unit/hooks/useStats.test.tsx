import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStats } from '@/lib/hooks/useStats';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    // Use a deferred promise to control when getUser resolves
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { result } = renderHook(() => useStats(), { wrapper });

    // Stats hook starts in loading state
    expect(result.current.loading).toBe(true);

    // Resolve the promise to clean up
    await act(async () => {
      resolveGetUser!({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns null stats when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches and computes stats from progress and profile', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: null,
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };

    // Create attempts with today's date for cardsReviewedToday
    const todayISO = new Date().toISOString();
    const mockAttempts = [
      {
        id: 'attempt-1',
        user_id: 'test-user-id',
        exercise_slug: 'ex-1',
        last_seen_at: todayISO, // seen today
        times_seen: 10,
        times_correct: 8,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'attempt-2',
        user_id: 'test-user-id',
        exercise_slug: 'ex-2',
        last_seen_at: todayISO, // seen today
        times_seen: 10,
        times_correct: 6,
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    // Set up auth mock
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    // Set up fetch mocks for both exercise_attempts and profiles
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'exercise_attempts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockAttempts, error: null }),
          }),
        } as never;
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
            }),
          }),
        } as never;
      }
      return {} as never;
    });

    const { result } = renderHook(() => useStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeDefined();
    expect(result.current.error).toBeNull();

    // 2 cards reviewed today
    expect(result.current.stats?.cardsReviewedToday).toBe(2);
    // 14 correct out of 20 seen = 70%
    expect(result.current.stats?.accuracyPercent).toBe(70);
    // From profile
    expect(result.current.stats?.currentStreak).toBe(5);
    expect(result.current.stats?.longestStreak).toBe(10);
    expect(result.current.stats?.totalExercisesCompleted).toBe(50);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const mockError = { message: 'Database error', code: 'PGRST116', details: null, hint: null };
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      } as never;
    });

    const { result } = renderHook(() => useStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.stats).toBeNull();
  });

  describe('refetch', () => {
    it('triggers a new fetch of stats', async () => {
      const mockProfile = {
        id: 'test-user-id',
        username: null,
        display_name: 'Test User',
        avatar_url: null,
        preferred_language: 'python',
        daily_goal: 10,
        notification_time: null,
        current_streak: 5,
        longest_streak: 10,
        total_exercises_completed: 50,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z',
      };

      const updatedProfile = {
        ...mockProfile,
        current_streak: 6,
        total_exercises_completed: 55,
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      let fetchCount = 0;
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercise_attempts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as never;
        }
        if (table === 'profiles') {
          fetchCount++;
          // Return different profile on subsequent fetches
          const profile = fetchCount === 1 ? mockProfile : updatedProfile;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: profile, error: null }),
              }),
            }),
          } as never;
        }
        return {} as never;
      });

      const { result } = renderHook(() => useStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify initial stats
      expect(result.current.stats?.currentStreak).toBe(5);
      expect(result.current.stats?.totalExercisesCompleted).toBe(50);

      // Call refetch
      await act(async () => {
        result.current.refetch();
      });

      // Wait for the refetch to complete
      await waitFor(() => {
        expect(result.current.stats?.currentStreak).toBe(6);
      });

      // Verify stats were updated
      expect(result.current.stats?.totalExercisesCompleted).toBe(55);
    });
  });
});
