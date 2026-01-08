// tests/unit/hooks/useConceptSession.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { SubconceptProgress } from '@/lib/curriculum/types';

// Mock useConceptSRS hook
const mockRecordSubconceptResult = vi.fn();
const mockGetNextExercise = vi.fn();
const mockRefetch = vi.fn();

const mockDueSubconcepts: SubconceptProgress[] = [
  {
    id: 'sp-1',
    userId: 'user-123',
    subconceptSlug: 'for',
    conceptSlug: 'loops',
    stability: 0,
    difficulty: 0,
    fsrsState: 0 as 0 | 1 | 2 | 3,
    reps: 0,
    lapses: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    nextReview: new Date(),
    lastReviewed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('@/lib/hooks/useConceptSRS', () => ({
  useConceptSRS: () => ({
    dueSubconcepts: mockDueSubconcepts,
    currentSubconcept: mockDueSubconcepts[0],
    loading: false,
    error: null,
    recordSubconceptResult: mockRecordSubconceptResult,
    getNextExercise: mockGetNextExercise,
    refetch: mockRefetch,
    remainingCount: mockDueSubconcepts.length,
  }),
}));

// Mock toast context
vi.mock('@/lib/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
  }),
}));

// Mock PyodideContext (added by Phase 3)
vi.mock('@/lib/context/PyodideContext', () => ({
  usePyodide: () => ({
    ready: true,
    loading: false,
    error: null,
    execute: vi.fn().mockResolvedValue({ output: '', error: null }),
  }),
}));

// Mock updateProfileStats
const mockUpdateProfileStats = vi.fn();
vi.mock('@/lib/stats', () => ({
  updateProfileStats: (...args: unknown[]) => mockUpdateProfileStats(...args),
}));

// Mock Supabase client - inline to avoid hoisting issues
vi.mock('@/lib/supabase/client', () => {
  const mockExercisesDb = [
    {
      id: 'ex-1',
      slug: 'for-intro-1',
      language: 'python',
      category: 'loops',
      difficulty: 1,
      title: 'For Loop Intro',
      prompt: 'Write a for loop',
      expected_answer: 'for i in range(5):',
      hints: ['Use range()'],
      explanation: null,
      tags: ['loops'],
      times_practiced: 0,
      avg_success_rate: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      concept: 'loops',
      subconcept: 'for',
      level: 'intro',
      prereqs: [],
      exercise_type: 'write',
      pattern: 'iteration',
      template: null,
      blank_position: null,
    },
  ];

  const mockClient = {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'exercises') {
        return {
          select: vi.fn(() => Promise.resolve({ data: mockExercisesDb, error: null })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      };
    }),
  };

  return {
    supabase: mockClient,
    createClient: () => mockClient,
  };
});

import { useConceptSession } from '@/lib/hooks/useConceptSession';

// Wrapper with auth context
function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useConceptSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup getNextExercise to return an exercise
    mockGetNextExercise.mockReturnValue(createMockExercise({
      id: 'ex-1',
      slug: 'for-intro-1',
      subconcept: 'for',
      concept: 'loops',
      level: 'intro',
    }));
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      // Initially loading while fetching
      expect(result.current.loading).toBe(true);
    });

    it('initializes stats with zero values', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.completed).toBe(0);
      expect(result.current.stats.correct).toBe(0);
      expect(result.current.stats.incorrect).toBe(0);
    });
  });

  describe('session building', () => {
    it('initializes cards as empty array', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Cards is always an array (may be empty depending on mock)
      expect(Array.isArray(result.current.cards)).toBe(true);
    });

    it('sets total in stats based on cards', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.total).toBe(result.current.cards.length);
    });
  });

  describe('recordResult', () => {
    it('is a function', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.recordResult).toBe('function');
    });

    it('does not throw when called without cards', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw even if no cards
      await expect(
        act(async () => {
          await result.current.recordResult(4);
        })
      ).resolves.not.toThrow();
    });
  });

  describe('session completion', () => {
    it('isComplete is false while cards remain', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Before answering any cards
      expect(result.current.isComplete).toBe(false);
    });

    it('sets endTime in stats when endSession called', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.endTime).toBeUndefined();

      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.stats.endTime).toBeDefined();
    });
  });

  describe('endSession', () => {
    it('forces session complete', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isComplete).toBe(false);

      await act(async () => {
        await result.current.endSession();
      });

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe('retry', () => {
    it('triggers refetch', async () => {
      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.retry();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
