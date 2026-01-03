// tests/unit/hooks/useSession.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';

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
      update: vi.fn(),
      insert: vi.fn(),
      upsert: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';
import { useSession } from '@/lib/hooks/useSession';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockExercisesDb = [
  {
    id: 'ex-1',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Print Statement',
    prompt: 'Write a print statement',
    expected_answer: 'print("hello")',
    hints: ['Use print()'],
    explanation: null,
    tags: ['print'],
    times_practiced: 0,
    avg_success_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ex-2',
    language: 'python',
    category: 'basics',
    difficulty: 1,
    title: 'Variables',
    prompt: 'Assign x = 5',
    expected_answer: 'x = 5',
    hints: [],
    explanation: null,
    tags: ['variables'],
    times_practiced: 0,
    avg_success_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockProgressDb = [
  {
    id: 'progress-1',
    user_id: 'user-123',
    exercise_id: 'ex-1',
    ease_factor: 2.5,
    interval: 1,
    repetitions: 1,
    next_review: '2026-01-01T00:00:00Z', // Due (in past)
    last_reviewed: '2025-12-31T00:00:00Z',
    times_seen: 1,
    times_correct: 1,
    created_at: '2025-12-31T00:00:00Z',
    updated_at: '2025-12-31T00:00:00Z',
  },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <ToastProvider>{children}</ToastProvider>
  </AuthProvider>
);

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('initialization', () => {
    it('returns loading true initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.loading).toBe(true);
    });

    it('returns empty cards initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.cards).toEqual([]);
    });

    it('returns currentIndex 0 initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.currentIndex).toBe(0);
    });

    it('returns null currentCard initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.currentCard).toBeNull();
    });

    it('returns isComplete false initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.isComplete).toBe(false);
    });

    it('returns initial stats with zero counts', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.stats.total).toBe(0);
      expect(result.current.stats.completed).toBe(0);
      expect(result.current.stats.correct).toBe(0);
      expect(result.current.stats.incorrect).toBe(0);
      expect(result.current.stats.startTime).toBeInstanceOf(Date);
    });

    it('returns null error initially', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(result.current.error).toBeNull();
    });

    it('exposes recordResult function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.recordResult).toBe('function');
    });

    it('exposes endSession function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.endSession).toBe('function');
    });

    it('exposes retry function', () => {
      const { result } = renderHook(() => useSession(), { wrapper });
      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('data fetching', () => {
    it('fetches exercises and progress on mount', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockExercisesDb,
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockProgressDb,
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFrom).toHaveBeenCalledWith('exercises');
      expect(mockFrom).toHaveBeenCalledWith('user_progress');
    });

    it('populates cards with due and new cards combined', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockExercisesDb,
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockProgressDb,
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have 1 due card (ex-1) + 1 new card (ex-2) = 2 cards
      expect(result.current.cards).toHaveLength(2);
      expect(result.current.stats.total).toBe(2);
    });

    it('sets currentCard to first card after loading', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockExercisesDb,
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: mockProgressDb,
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentCard).not.toBeNull();
      expect(result.current.currentCard?.exercise.id).toBeDefined();
    });

    it('handles fetch error gracefully', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Network error', code: 'NETWORK_ERROR' },
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.cards).toHaveLength(0);
    });

    it('handles empty state (no exercises)', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cards).toHaveLength(0);
      expect(result.current.currentCard).toBeNull();
    });
  });
});
