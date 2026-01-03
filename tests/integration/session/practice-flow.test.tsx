// tests/integration/session/practice-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor, act } from '@testing-library/react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import type { ReactNode } from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

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

// Mock Supabase
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
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockExercise = {
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
};

const mockProgress = {
  id: 'progress-1',
  user_id: 'user-123',
  exercise_id: 'ex-1',
  ease_factor: 2.5,
  interval: 1,
  repetitions: 1,
  next_review: '2026-01-01T00:00:00Z', // Due
  last_reviewed: '2025-12-31T00:00:00Z',
  times_seen: 1,
  times_correct: 1,
  created_at: '2025-12-31T00:00:00Z',
  updated_at: '2025-12-31T00:00:00Z',
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <ToastProvider>{children}</ToastProvider>
  </AuthProvider>
);

describe('Practice Session Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordAnswer.mockResolvedValue(undefined);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('useSession with real data flow', () => {
    it('builds session cards from exercises and progress', async () => {
      const { useSession } = await import('@/lib/hooks/useSession');
      const { renderHook } = await import('@testing-library/react');

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercise],
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockProgress],
                error: null,
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

      // Should have the due card
      expect(result.current.cards.length).toBeGreaterThan(0);
      expect(result.current.currentCard?.exercise.id).toBe('ex-1');
    });

    it('completes session flow from start to summary', async () => {
      const { useSession } = await import('@/lib/hooks/useSession');
      const { renderHook } = await import('@testing-library/react');

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'exercises') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [mockExercise],
              error: null,
            }),
          } as any;
        }
        if (table === 'user_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [mockProgress],
                error: null,
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

      // Answer the card
      await act(async () => {
        await result.current.recordResult(4);
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.stats.completed).toBe(1);
      expect(result.current.stats.correct).toBe(1);
    });
  });
});
