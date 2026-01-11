import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDueCount } from '@/lib/hooks/useDueCount';
import type { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return { wrapper: TestWrapper, queryClient };
};

describe('useDueCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 when userId is undefined', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(undefined), { wrapper });

    // Should not be loading when disabled
    expect(result.current.dueCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('defaults to python language when not specified', async () => {
    const userId = 'test-user-id';
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60000).toISOString();

    const mockFrom = vi.mocked(supabase.from);
    const mockEqLanguage = vi.fn().mockResolvedValue({
      data: [{ next_review: pastDate }],
      error: null,
    });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqLanguage });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: mockEqUser,
      }),
    } as never);

    const { wrapper } = createWrapper();
    renderHook(() => useDueCount(userId), { wrapper });

    await waitFor(() => {
      expect(mockEqUser).toHaveBeenCalledWith('user_id', userId);
    });

    expect(mockEqLanguage).toHaveBeenCalledWith('language', 'python');
  });

  it('filters by specified language', async () => {
    const userId = 'test-user-id';
    const language = 'javascript';
    const now = new Date();
    const pastDate = new Date(now.getTime() - 60000).toISOString();

    const mockFrom = vi.mocked(supabase.from);
    const mockEqLanguage = vi.fn().mockResolvedValue({
      data: [{ next_review: pastDate }],
      error: null,
    });
    const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqLanguage });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: mockEqUser,
      }),
    } as never);

    const { wrapper } = createWrapper();
    renderHook(() => useDueCount(userId, language), { wrapper });

    await waitFor(() => {
      expect(mockEqUser).toHaveBeenCalledWith('user_id', userId);
    });

    expect(mockEqLanguage).toHaveBeenCalledWith('language', 'javascript');
  });

  it('includes language in query key for proper caching', async () => {
    const userId = 'test-user-id';

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never);

    const { wrapper, queryClient } = createWrapper();

    // First render with python
    const { rerender } = renderHook(
      ({ language }) => useDueCount(userId, language),
      { wrapper, initialProps: { language: 'python' } }
    );

    await waitFor(() => {
      const cache = queryClient.getQueryCache().getAll();
      const pythonQuery = cache.find(
        (q) =>
          q.queryKey[0] === 'dueCount' &&
          q.queryKey[1] === userId &&
          q.queryKey[2] === 'python'
      );
      expect(pythonQuery).toBeDefined();
    });

    // Re-render with javascript - should create separate cache entry
    rerender({ language: 'javascript' });

    await waitFor(() => {
      const cache = queryClient.getQueryCache().getAll();
      const jsQuery = cache.find(
        (q) =>
          q.queryKey[0] === 'dueCount' &&
          q.queryKey[1] === userId &&
          q.queryKey[2] === 'javascript'
      );
      expect(jsQuery).toBeDefined();
    });
  });

  it('counts items with past next_review as due', async () => {
    const userId = 'test-user-id';
    const now = new Date();
    const pastDate1 = new Date(now.getTime() - 60000).toISOString();
    const pastDate2 = new Date(now.getTime() - 120000).toISOString();
    const futureDate = new Date(now.getTime() + 60000).toISOString();

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { next_review: pastDate1 }, // Due
              { next_review: pastDate2 }, // Due
              { next_review: futureDate }, // Not due
              { next_review: null }, // Not due
            ],
            error: null,
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(userId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dueCount).toBe(2);
  });

  it('returns 0 when all items are in the future', async () => {
    const userId = 'test-user-id';
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 60000).toISOString();
    const futureDate2 = new Date(now.getTime() + 120000).toISOString();

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { next_review: futureDate1 },
              { next_review: futureDate2 },
            ],
            error: null,
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(userId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dueCount).toBe(0);
  });

  it('handles database errors', async () => {
    const userId = 'test-user-id';
    const dbError = new Error('Database error');

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: dbError,
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(userId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.dueCount).toBe(0);
  });

  it('returns loading state initially', async () => {
    const userId = 'test-user-id';

    let resolveQuery: (value: unknown) => void;
    const queryPromise = new Promise((resolve) => {
      resolveQuery = resolve;
    });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue(queryPromise),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(userId), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dueCount).toBe(0);

    // Cleanup
    resolveQuery!({ data: [], error: null });
  });

  it('provides refetch function', async () => {
    const userId = 'test-user-id';

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDueCount(userId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});
