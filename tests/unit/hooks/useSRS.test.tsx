// tests/unit/hooks/useSRS.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSRS } from '@/lib/hooks/useSRS';
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
          lte: vi.fn(),
          order: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useSRS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('initialization', () => {
    it('returns loading true initially', () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('fetches due cards on mount', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          user_id: 'user-123',
          exercise_id: 'ex-1',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          times_seen: 1,
          times_correct: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dueCards).toHaveLength(1);
      expect(result.current.dueCards[0].exerciseId).toBe('ex-1');
    });
  });

  describe('recordAnswer', () => {
    it('updates card state after answer', async () => {
      const mockFrom = vi.mocked(supabase.from);

      // Initial fetch
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-progress',
                user_id: 'user-123',
                exercise_id: 'ex-1',
                ease_factor: 2.5,
                interval: 1,
                repetitions: 1,
                next_review: '2026-01-03T00:00:00Z',
                last_reviewed: '2026-01-02T00:00:00Z',
                times_seen: 1,
                times_correct: 1,
                created_at: '2026-01-02T00:00:00Z',
                updated_at: '2026-01-02T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordAnswer('ex-1', 4);
      });

      expect(mockFrom).toHaveBeenCalledWith('user_progress');
    });

    it('sets error on failure', async () => {
      const mockFrom = vi.mocked(supabase.from);

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: '50000' },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordAnswer('ex-1', 4);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('currentCard', () => {
    it('returns first due card', async () => {
      const mockProgress = [
        {
          id: 'p1',
          user_id: 'user-123',
          exercise_id: 'ex-1',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-01T00:00:00Z',
          last_reviewed: null,
          times_seen: 1,
          times_correct: 0,
          created_at: '2025-12-31T00:00:00Z',
          updated_at: '2025-12-31T00:00:00Z',
        },
        {
          id: 'p2',
          user_id: 'user-123',
          exercise_id: 'ex-2',
          ease_factor: 2.5,
          interval: 1,
          repetitions: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: null,
          times_seen: 1,
          times_correct: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCard?.exerciseId).toBe('ex-1');
    });

    it('returns null when no cards due', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCard).toBeNull();
    });
  });
});
