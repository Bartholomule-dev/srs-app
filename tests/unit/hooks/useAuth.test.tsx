import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';

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
  },
}));

import { supabase } from '@/lib/supabase/client';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });

  it('returns loading true initially', async () => {
    // Use a deferred promise to control when getUser resolves
    let resolveGetUser: (value: any) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // Resolve the promise and wait for state update to complete
    await act(async () => {
      resolveGetUser({ data: { user: null }, error: null });
      await getUserPromise;
    });
  });

  it('returns user after loading completes', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' } as User;
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('sets error when auth check fails', async () => {
    const mockError = new Error('Network error') as AuthError;
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: mockError,
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });

  describe('signIn', () => {
    it('calls supabase.auth.signInWithOtp with correct email', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com');
      });

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.any(String),
        },
      });
    });

    it('throws error when signInWithOtp fails', async () => {
      const mockError = { message: 'Invalid email' } as AuthError;
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: {},
        error: mockError,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: AuthError | null = null;
      await act(async () => {
        try {
          await result.current.signIn('invalid@example.com');
        } catch (e) {
          thrownError = e as AuthError;
        }
      });

      expect(thrownError).toEqual(mockError);
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      const mockUser = { id: 'test-id', email: 'test@example.com' } as User;
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('throws error when signOut fails', async () => {
      const mockError = { message: 'Sign out failed' } as AuthError;
      const mockUser = { id: 'test-id', email: 'test@example.com' } as User;
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      } as any);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let thrownError: AuthError | null = null;
      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e) {
          thrownError = e as AuthError;
        }
      });

      expect(thrownError).toEqual(mockError);
      expect(result.current.error).toEqual(mockError);
    });
  });
});
