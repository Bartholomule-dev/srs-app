// tests/unit/hooks/useAchievements.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ACHIEVEMENTS } from '@/lib/gamification/achievements';
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
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const achievementCount = Object.keys(ACHIEVEMENTS).length;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    expect(result.current.loading).toBe(true);

    // Cleanup
    resolveGetUser!({ data: { user: null }, error: null });
  });

  it('returns all 18 achievements with unlock status merged', async () => {
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          data: [{ achievement_slug: 'first-steps', unlocked_at: '2026-01-08T12:00:00Z' }],
          error: null,
        })
      ),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.achievements).toHaveLength(achievementCount);
    expect(result.current.unlockedCount).toBe(1);

    // Check that the unlocked achievement has the correct status
    const firstSteps = result.current.achievements.find((a) => a.slug === 'first-steps');
    expect(firstSteps?.unlocked).toBe(true);
    expect(firstSteps?.unlockedAt).toBe('2026-01-08T12:00:00Z');

    // Check that a locked achievement has correct status
    const weekWarrior = result.current.achievements.find((a) => a.slug === 'week-warrior');
    expect(weekWarrior?.unlocked).toBe(false);
    expect(weekWarrior?.unlockedAt).toBeNull();
  });

  it('isUnlocked returns true for unlocked achievements', async () => {
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          data: [{ achievement_slug: 'first-steps', unlocked_at: '2026-01-08T12:00:00Z' }],
          error: null,
        })
      ),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isUnlocked('first-steps')).toBe(true);
  });

  it('isUnlocked returns false for locked achievements', async () => {
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isUnlocked('first-steps')).toBe(false);
  });

  it('getUnlockedAt returns date for unlocked', async () => {
    const unlockDate = '2026-01-08T12:00:00Z';
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          data: [{ achievement_slug: 'first-steps', unlocked_at: unlockDate }],
          error: null,
        })
      ),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getUnlockedAt('first-steps')).toBe(unlockDate);
  });

  it('getUnlockedAt returns null for locked', async () => {
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.getUnlockedAt('first-steps')).toBeNull();
  });

  it('handles Supabase error gracefully', async () => {
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() =>
        Promise.resolve({
          data: null,
          // Use an unmapped code to get generic database error
          error: { message: 'Database error', code: 'UNKNOWN_CODE', details: null, hint: null },
        })
      ),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('A database error occurred');
  });

  it('returns null when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.achievements).toHaveLength(0);
    expect(result.current.unlockedCount).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('refetches when refetch() is called', async () => {
    const initialData = [{ achievement_slug: 'first-steps', unlocked_at: '2026-01-08T12:00:00Z' }];
    const updatedData = [
      { achievement_slug: 'first-steps', unlocked_at: '2026-01-08T12:00:00Z' },
      { achievement_slug: 'week-warrior', unlocked_at: '2026-01-08T13:00:00Z' },
    ];

    let callCount = 0;
    const mockFromSelect = vi.fn(() => ({
      eq: vi.fn(() => {
        callCount++;
        const data = callCount === 1 ? initialData : updatedData;
        return Promise.resolve({ data, error: null });
      }),
    }));
    vi.mocked(supabase.from).mockReturnValue({ select: mockFromSelect } as never);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const { result } = renderHook(() => useAchievements(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify initial data
    expect(result.current.unlockedCount).toBe(1);

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.unlockedCount).toBe(2);
    });

    expect(result.current.isUnlocked('week-warrior')).toBe(true);
  });
});
