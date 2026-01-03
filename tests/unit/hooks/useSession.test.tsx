// tests/unit/hooks/useSession.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';

// Mock useSRS hook to avoid its internal Supabase queries
const mockRecordAnswer = vi.fn();
vi.mock('@/lib/hooks/useSRS', () => ({
  useSRS: () => ({
    dueCards: [],
    currentCard: null,
    loading: false,
    error: null,
    recordAnswer: mockRecordAnswer,
    refetch: vi.fn(),
    remainingCount: 0,
  }),
}));

// Mock showToast for verification
const mockShowToast = vi.fn();
vi.mock('@/lib/context/ToastContext', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/context/ToastContext')>();
  return {
    ...original,
    useToast: () => ({
      toasts: [],
      showToast: mockShowToast,
      dismissToast: vi.fn(),
    }),
  };
});

// Mock updateProfileStats
const mockUpdateProfileStats = vi.fn();
vi.mock('@/lib/stats', () => ({
  updateProfileStats: (...args: unknown[]) => mockUpdateProfileStats(...args),
}));

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
    mockRecordAnswer.mockResolvedValue(undefined);
    mockUpdateProfileStats.mockResolvedValue(undefined);
    mockShowToast.mockClear();
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

  describe('recordResult', () => {
    const setupWithCards = () => {
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
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({ data: mockProgressDb[0], error: null }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });
    };

    it('advances currentIndex after recording', async () => {
      setupWithCards();
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialIndex = result.current.currentIndex;
      expect(initialIndex).toBe(0);

      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.currentIndex).toBe(initialIndex + 1);
    });

    it('increments completed count', async () => {
      setupWithCards();
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.completed).toBe(0);

      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.stats.completed).toBe(1);
    });

    it('increments correct count for quality >= 3', async () => {
      setupWithCards();
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.correct).toBe(0);

      await act(async () => {
        await result.current.recordResult(3);
      });

      expect(result.current.stats.correct).toBe(1);
      expect(result.current.stats.incorrect).toBe(0);
    });

    it('increments incorrect count for quality < 3', async () => {
      setupWithCards();
      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.incorrect).toBe(0);

      await act(async () => {
        await result.current.recordResult(2);
      });

      expect(result.current.stats.incorrect).toBe(1);
      expect(result.current.stats.correct).toBe(0);
    });

    it('sets isComplete when last card is answered', async () => {
      // Setup with only 1 card (just ex-1, due card)
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercisesDb[0]], // Only 1 exercise
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({ data: mockProgressDb[0], error: null }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

      expect(result.current.isComplete).toBe(false);

      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('sets endTime when session completes', async () => {
      // Setup with only 1 card
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercisesDb[0]],
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({ data: mockProgressDb[0], error: null }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

      expect(result.current.stats.endTime).toBeUndefined();

      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.stats.endTime).toBeInstanceOf(Date);
    });

    it('shows error toast when database persistence fails but still advances session', async () => {
      // Setup mock to fail on recordAnswer
      mockRecordAnswer.mockRejectedValueOnce(new Error('Database error'));

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
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
                single: vi.fn().mockResolvedValue({ data: mockProgressDb[0], error: null }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: {}, error: null }),
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

      const initialIndex = result.current.currentIndex;
      const initialCompleted = result.current.stats.completed;

      // Record result - should fail to persist but still advance
      await act(async () => {
        await result.current.recordResult(4);
      });

      // Session state should still advance (optimistic update preserved)
      expect(result.current.currentIndex).toBe(initialIndex + 1);
      expect(result.current.stats.completed).toBe(initialCompleted + 1);

      // Verify recordAnswer was called and rejected
      expect(mockRecordAnswer).toHaveBeenCalledWith(expect.any(String), 4);

      // Verify error toast was shown
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to save progress',
      });
    });
  });

  describe('endSession', () => {
    it('marks session as complete', async () => {
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

      expect(result.current.isComplete).toBe(false);

      act(() => {
        result.current.endSession();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it('sets endTime when ending early', async () => {
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

      expect(result.current.stats.endTime).toBeUndefined();

      act(() => {
        result.current.endSession();
      });

      expect(result.current.stats.endTime).toBeInstanceOf(Date);
    });

    it('preserves partial stats when ending early', async () => {
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

      // Answer one card first
      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.stats.completed).toBe(1);

      act(() => {
        result.current.endSession();
      });

      // Stats should still show the partial progress
      expect(result.current.stats.completed).toBe(1);
      expect(result.current.stats.total).toBe(2);
    });

    it('updates profile stats when session ends with completed cards', async () => {
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
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockProgressDb,
                    error: null,
                  }),
                }),
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
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

      // Answer one card first
      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.stats.completed).toBe(1);

      // End session
      await act(async () => {
        await result.current.endSession();
      });

      // Verify updateProfileStats was called with correct arguments
      expect(mockUpdateProfileStats).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileStats).toHaveBeenCalledWith({
        userId: mockUser.id,
        exercisesCompleted: 1,
        lastPracticed: expect.any(Date),
      });
    });

    it('does not update profile stats when session has no completed cards', async () => {
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
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockProgressDb,
                    error: null,
                  }),
                }),
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
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

      // End session immediately without answering any cards
      await act(async () => {
        await result.current.endSession();
      });

      // Verify updateProfileStats was NOT called
      expect(mockUpdateProfileStats).not.toHaveBeenCalled();
    });

    it('shows error toast when updateProfileStats fails', async () => {
      mockUpdateProfileStats.mockRejectedValueOnce(new Error('Database error'));

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
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockProgressDb,
                    error: null,
                  }),
                }),
                lte: vi.fn().mockResolvedValue({
                  data: mockProgressDb,
                  error: null,
                }),
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

      // Answer one card first
      await act(async () => {
        await result.current.recordResult(4);
      });

      // End session
      await act(async () => {
        await result.current.endSession();
      });

      // Verify error toast was shown
      expect(mockShowToast).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to update stats',
      });
    });
  });
});
