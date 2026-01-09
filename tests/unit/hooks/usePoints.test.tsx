// tests/unit/hooks/usePoints.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePoints } from '@/lib/hooks/usePoints';
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
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('usePoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    let resolveGetUser: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => {
      resolveGetUser = resolve;
    });
    vi.mocked(supabase.auth.getUser).mockReturnValue(getUserPromise as never);

    const { result } = renderHook(() => usePoints(), { wrapper });

    expect(result.current.loading).toBe(true);

    // Cleanup
    resolveGetUser!({ data: { user: null }, error: null });
  });

  it('returns null summary when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches points summary on mount', async () => {
    const mockRpcResponse = {
      today: 150,
      this_week: 450,
      daily_cap: 500,
      daily_cap_reached: false,
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcResponse,
      error: null,
    } as never);

    const { result } = renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual({
      today: 150,
      thisWeek: 450,
      dailyCap: 500,
      dailyCapReached: false,
    });
    expect(result.current.error).toBeNull();

    // Verify RPC was called with correct parameters
    expect(supabase.rpc).toHaveBeenCalledWith('get_points_summary', {
      p_user_id: mockUser.id,
      p_start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      p_end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it('handles RPC error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC error', code: 'PGRST116', details: null, hint: null },
    } as never);

    const { result } = renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.summary).toBeNull();
  });

  it('refetches when refetch() called', async () => {
    const initialResponse = {
      today: 100,
      this_week: 300,
      daily_cap: 500,
      daily_cap_reached: false,
    };

    const updatedResponse = {
      today: 200,
      this_week: 400,
      daily_cap: 500,
      daily_cap_reached: false,
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    let callCount = 0;
    vi.mocked(supabase.rpc).mockImplementation(() => {
      callCount++;
      const response = callCount === 1 ? initialResponse : updatedResponse;
      return Promise.resolve({ data: response, error: null }) as never;
    });

    const { result } = renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify initial data
    expect(result.current.summary?.today).toBe(100);
    expect(result.current.summary?.thisWeek).toBe(300);

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    // Wait for refetch to complete
    await waitFor(() => {
      expect(result.current.summary?.today).toBe(200);
    });

    expect(result.current.summary?.thisWeek).toBe(400);
  });

  it('computes correct week boundaries', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        today: 0,
        this_week: 0,
        daily_cap: 500,
        daily_cap_reached: false,
      },
      error: null,
    } as never);

    renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalled();
    });

    // Get the actual call arguments
    const rpcCall = vi.mocked(supabase.rpc).mock.calls[0];
    const args = rpcCall[1] as { p_start_date: string; p_end_date: string };

    // Verify start date is Monday and end date is Sunday
    const startDate = new Date(args.p_start_date);
    const endDate = new Date(args.p_end_date);

    // Monday is day 1, Sunday is day 0
    expect(startDate.getDay()).toBe(1); // Monday
    expect(endDate.getDay()).toBe(0); // Sunday
  });

  it('handles daily cap reached state', async () => {
    const mockRpcResponse = {
      today: 500,
      this_week: 800,
      daily_cap: 500,
      daily_cap_reached: true,
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockRpcResponse,
      error: null,
    } as never);

    const { result } = renderHook(() => usePoints(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary?.dailyCapReached).toBe(true);
    expect(result.current.summary?.today).toBe(500);
  });
});
