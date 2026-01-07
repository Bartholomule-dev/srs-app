// tests/integration/session/practice-flow.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock useConceptSRS hook
const mockRecordSubconceptResult = vi.fn();
const mockGetNextExercise = vi.fn();
const mockRefetch = vi.fn();

vi.mock('@/lib/hooks/useConceptSRS', () => ({
  useConceptSRS: () => ({
    dueSubconcepts: [],
    currentSubconcept: null,
    loading: false,
    error: null,
    recordSubconceptResult: mockRecordSubconceptResult,
    getNextExercise: mockGetNextExercise,
    refetch: mockRefetch,
    remainingCount: 0,
  }),
}));

// Mock toast context
vi.mock('@/lib/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock updateProfileStats
const mockUpdateProfileStats = vi.fn();
vi.mock('@/lib/stats', () => ({
  updateProfileStats: (...args: unknown[]) => mockUpdateProfileStats(...args),
}));

// Mock PyodideContext (Phase 3)
vi.mock('@/lib/context/PyodideContext', () => ({
  usePyodide: () => ({
    pyodide: null,
    loading: false,
    error: null,
    loadPyodide: vi.fn().mockResolvedValue(null),
    isReady: false,
  }),
}));

// Mock Supabase
vi.mock('@/lib/supabase/client', () => {
  const mockExercise = {
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
    concept: 'control-flow',
    subconcept: 'for',
    level: 'intro',
    prereqs: [],
    exercise_type: 'write',
    pattern: 'iteration',
    template: null,
    blank_position: null,
  };

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
          select: vi.fn(() => Promise.resolve({ data: [mockExercise], error: null })),
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('Practice Session Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordSubconceptResult.mockResolvedValue(undefined);
  });

  describe('useConceptSession with real data flow', () => {
    it('initializes session with loading state', async () => {
      const { renderHook } = await import('@testing-library/react');

      const { result } = renderHook(() => useConceptSession(), { wrapper });

      // Initially loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('provides session stats after loading', async () => {
      const { renderHook } = await import('@testing-library/react');

      const { result } = renderHook(() => useConceptSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats.completed).toBe(0);
      expect(result.current.stats.correct).toBe(0);
      expect(result.current.stats.incorrect).toBe(0);
      expect(result.current.stats.startTime).toBeInstanceOf(Date);
    });
  });
});
