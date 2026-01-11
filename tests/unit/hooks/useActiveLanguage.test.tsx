import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useActiveLanguage } from '@/lib/hooks/useActiveLanguage';
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
        eq: vi.fn(),
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

describe('useActiveLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to python when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActiveLanguage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('python');
    expect(result.current.error).toBeNull();
  });

  it('returns loading state initially', async () => {
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActiveLanguage(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    // Cleanup
    await act(async () => {
      resolveGetUser!({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns profile preferred_language when available', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { preferred_language: 'javascript' },
            error: null,
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActiveLanguage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('javascript');
    expect(result.current.error).toBeNull();
  });

  it('defaults to python when preferred_language is null', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { preferred_language: null },
            error: null,
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActiveLanguage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.language).toBe('python');
  });

  describe('setLanguage', () => {
    it('updates profile and invalidates related query caches', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { preferred_language: 'python' },
              error: null,
            }),
          }),
        }),
        update: updateMock,
      } as never);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call setLanguage
      await act(async () => {
        await result.current.setLanguage('typescript');
      });

      // Verify supabase update was called
      expect(updateMock).toHaveBeenCalledWith({ preferred_language: 'typescript' });
      expect(eqMock).toHaveBeenCalledWith('id', 'test-user-id');

      // Verify query caches were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['activeLanguage'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dueCount'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['subconcept-progress'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['skillTree'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['languageStats'] });
    });

    it('does nothing when no user is authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const updateMock = vi.fn();
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        update: updateMock,
      } as never);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call setLanguage - should return early
      await act(async () => {
        await result.current.setLanguage('javascript');
      });

      // Verify update was NOT called
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('throws error when database update fails', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const dbError = { message: 'Update failed', code: 'PGRST116' };
      const eqMock = vi.fn().mockResolvedValue({ error: dbError });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { preferred_language: 'python' },
              error: null,
            }),
          }),
        }),
        update: updateMock,
      } as never);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Call setLanguage - should throw
      await expect(
        act(async () => {
          await result.current.setLanguage('javascript');
        })
      ).rejects.toEqual(dbError);
    });
  });

  it('handles fetch errors gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useActiveLanguage(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should default to python on error
    expect(result.current.language).toBe('python');
    expect(result.current.error).toBeDefined();
  });
});
