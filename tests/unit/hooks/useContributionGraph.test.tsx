// tests/unit/hooks/useContributionGraph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

import { useContributionGraph } from '@/lib/hooks/useContributionGraph';
import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useContributionGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches contribution history on mount', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: '2026-01-05', count: 10, accuracy: 80 },
        { date: '2026-01-06', count: 15, accuracy: 90 },
      ],
      error: null,
    } as never);

    const { result } = renderHook(() => useContributionGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days.length).toBe(2);
    expect(result.current.days[0].date).toBe('2026-01-05');
    expect(result.current.days[0].level).toBe('moderate'); // 6-15
    expect(result.current.days[1].level).toBe('moderate');
  });

  it('calculates contribution level from count', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: '2026-01-01', count: 0, accuracy: null },
        { date: '2026-01-02', count: 3, accuracy: 100 },
        { date: '2026-01-03', count: 10, accuracy: 80 },
        { date: '2026-01-04', count: 25, accuracy: 75 },
        { date: '2026-01-05', count: 50, accuracy: 90 },
      ],
      error: null,
    } as never);

    const { result } = renderHook(() => useContributionGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days[0].level).toBe('none');
    expect(result.current.days[1].level).toBe('light');
    expect(result.current.days[2].level).toBe('moderate');
    expect(result.current.days[3].level).toBe('good');
    expect(result.current.days[4].level).toBe('strong');
  });

  it('handles RPC error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed', code: '500', details: null, hint: null },
    } as never);

    const { result } = renderHook(() => useContributionGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.days).toEqual([]);
  });

  it('returns current streak from consecutive recent days', async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        { date: twoDaysAgo, count: 5, accuracy: 80 },
        { date: yesterday, count: 10, accuracy: 90 },
        { date: today, count: 8, accuracy: 85 },
      ],
      error: null,
    } as never);

    const { result } = renderHook(() => useContributionGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentStreakDays).toBe(3);
  });

  it('returns null summary when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useContributionGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.days).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
