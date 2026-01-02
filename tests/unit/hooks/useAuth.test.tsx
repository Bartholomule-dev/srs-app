import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('returns user after loading completes', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' } as User;
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

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
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
