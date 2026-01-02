import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from '@/lib/hooks/useProfile';
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
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
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

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading true while fetching', async () => {
    // Use a deferred promise to control when getUser resolves
    // This keeps AuthProvider in loading state, which means useProfile stays loading too
    let resolveGetUser: (value: any) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    // Profile hook starts in loading state
    expect(result.current.loading).toBe(true);

    // Resolve the promise to clean up
    await act(async () => {
      resolveGetUser!({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns profile after loading', async () => {
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

    // Set up auth mock first
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    // Set up profile fetch mock
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.displayName).toBe('Test User');
    expect(result.current.profile?.currentStreak).toBe(5);
  });

  it('returns null profile when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    const mockError = { message: 'Database error', code: 'PGRST116' };
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});
