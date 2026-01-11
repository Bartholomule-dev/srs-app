import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLanguageStats } from '@/lib/hooks/useLanguageStats';
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
          eq: vi.fn(),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }
  return { wrapper: TestWrapper, queryClient };
};

describe('useLanguageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    // Cleanup
    await act(async () => {
      resolveGetUser!({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns zero stats when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accuracy).toBe(0);
    expect(result.current.totalExercises).toBe(0);
    expect(result.current.exercisesToday).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('fetches and computes stats for default language (python)', async () => {
    const todayISO = new Date().toISOString();
    const yesterdayISO = new Date(Date.now() - 86400000).toISOString();

    const mockAttempts = [
      {
        times_seen: 10,
        times_correct: 8,
        last_seen_at: todayISO, // seen today
      },
      {
        times_seen: 10,
        times_correct: 6,
        last_seen_at: todayISO, // seen today
      },
      {
        times_seen: 5,
        times_correct: 4,
        last_seen_at: yesterdayISO, // not today
      },
    ];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const secondEqMock = vi.fn().mockResolvedValue({ data: mockAttempts, error: null });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify correct language filter
    expect(secondEqMock).toHaveBeenCalledWith('language', 'python');

    // 18 correct out of 25 seen = 72%
    expect(result.current.accuracy).toBe(72);
    // Total times seen across all attempts
    expect(result.current.totalExercises).toBe(25);
    // 2 exercises seen today
    expect(result.current.exercisesToday).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('fetches stats for specified language', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const secondEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats('javascript'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify correct language filter
    expect(firstEqMock).toHaveBeenCalledWith('user_id', 'test-user-id');
    expect(secondEqMock).toHaveBeenCalledWith('language', 'javascript');
  });

  it('returns zero accuracy when no attempts exist', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const secondEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accuracy).toBe(0);
    expect(result.current.totalExercises).toBe(0);
    expect(result.current.exercisesToday).toBe(0);
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const dbError = { message: 'Database error', code: 'PGRST116' };
    const secondEqMock = vi.fn().mockResolvedValue({ data: null, error: dbError });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have error and default values
    expect(result.current.error).toBeDefined();
    expect(result.current.accuracy).toBe(0);
    expect(result.current.totalExercises).toBe(0);
  });

  it('handles null last_seen_at values', async () => {
    const mockAttempts = [
      {
        times_seen: 10,
        times_correct: 8,
        last_seen_at: null, // null date
      },
    ];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const secondEqMock = vi.fn().mockResolvedValue({ data: mockAttempts, error: null });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLanguageStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should calculate stats correctly
    expect(result.current.accuracy).toBe(80);
    expect(result.current.totalExercises).toBe(10);
    // Null dates should not count as today
    expect(result.current.exercisesToday).toBe(0);
  });

  it('uses different query keys for different languages', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const secondEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const firstEqMock = vi.fn().mockReturnValue({ eq: secondEqMock });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: firstEqMock,
      }),
    } as never);

    const { wrapper } = createWrapper();

    // Render for python
    const { result: pythonResult } = renderHook(() => useLanguageStats('python'), { wrapper });

    await waitFor(() => {
      expect(pythonResult.current.isLoading).toBe(false);
    });

    // Render for javascript
    const { result: jsResult } = renderHook(() => useLanguageStats('javascript'), { wrapper });

    await waitFor(() => {
      expect(jsResult.current.isLoading).toBe(false);
    });

    // Both should have been called with different languages
    expect(secondEqMock).toHaveBeenCalledWith('language', 'python');
    expect(secondEqMock).toHaveBeenCalledWith('language', 'javascript');
  });
});
