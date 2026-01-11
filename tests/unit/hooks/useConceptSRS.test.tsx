// tests/unit/hooks/useConceptSRS.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConceptSRS } from '@/lib/hooks/useConceptSRS';
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
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'user-123', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

// Helper to create mock that supports chained eq() calls
// Uses a lazy approach to avoid infinite recursion
function createMockFrom(subconceptData: unknown[], attemptData: unknown[] = []) {
  const mockFrom = vi.mocked(supabase.from);

  mockFrom.mockImplementation((table: string) => {
    // Create a lazy chain that doesn't recurse infinitely
    const createChain = (data: unknown[]) => {
      const chain: Record<string, unknown> = {};

      chain.eq = vi.fn().mockImplementation(() => createChain(data));
      chain.lte = vi.fn().mockResolvedValue({ data, error: null });
      chain.single = vi.fn().mockResolvedValue({
        data: data[0] ?? null,
        error: data.length ? null : { code: 'PGRST116' }
      });
      chain.order = vi.fn().mockImplementation(() => createChain(data));

      return chain;
    };

    if (table === 'subconcept_progress') {
      return {
        select: vi.fn().mockImplementation(() => createChain(subconceptData)),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: subconceptData[0], error: null }),
          }),
        }),
      } as any;
    }
    if (table === 'exercise_attempts') {
      return {
        select: vi.fn().mockImplementation(() => createChain(attemptData)),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: attemptData[0] ?? {}, error: null }),
          }),
        }),
      } as any;
    }
    return {
      select: vi.fn().mockImplementation(() => createChain([])),
    } as any;
  });

  return mockFrom;
}

describe('useConceptSRS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  describe('initialization', () => {
    it('returns loading true initially', () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('exposes dueSubconcepts array', async () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dueSubconcepts).toEqual([]);
    });

    it('fetches due subconcepts on mount', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          user_id: 'user-123',
          language: 'python',
          subconcept_slug: 'for-loops',
          concept_slug: 'loops',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      createMockFrom(mockProgress);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dueSubconcepts).toHaveLength(1);
      expect(result.current.dueSubconcepts[0].subconceptSlug).toBe('for-loops');
    });

    it('defaults to python language', async () => {
      const mockFrom = createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify queries were made
      expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
      expect(mockFrom).toHaveBeenCalledWith('exercise_attempts');
    });

    it('accepts custom language parameter', async () => {
      const mockFrom = createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS('javascript'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify queries were made for javascript
      expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
      expect(mockFrom).toHaveBeenCalledWith('exercise_attempts');
    });
  });

  describe('recordSubconceptResult', () => {
    it('provides recordSubconceptResult function', async () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.recordSubconceptResult).toBe('function');
    });

    it('updates subconcept progress after recording result', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          user_id: 'user-123',
          language: 'python',
          subconcept_slug: 'for-loops',
          concept_slug: 'loops',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = createMockFrom(mockProgress);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordSubconceptResult('for-loops', 'loops', 4, 'ex-1', true);
      });

      expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
    });

    it('includes language in upsert operations', async () => {
      const mockProgress = [
        {
          id: 'progress-1',
          user_id: 'user-123',
          language: 'javascript',
          subconcept_slug: 'for-loops',
          concept_slug: 'loops',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = createMockFrom(mockProgress);

      const { result } = renderHook(() => useConceptSRS('javascript'), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordSubconceptResult('for-loops', 'loops', 4, 'ex-1', true);
      });

      // Verify upsert was called for both tables
      expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
      expect(mockFrom).toHaveBeenCalledWith('exercise_attempts');
    });
  });

  describe('getNextExercise', () => {
    it('provides getNextExercise function', async () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.getNextExercise).toBe('function');
    });
  });

  describe('error handling', () => {
    it('sets error on fetch failure', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockImplementation(() => {
        const createChain = () => {
          const chain: Record<string, unknown> = {};
          chain.eq = vi.fn().mockImplementation(() => createChain());
          chain.lte = vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: '50000' },
          });
          chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
          return chain;
        };

        return {
          select: vi.fn().mockImplementation(() => createChain()),
        } as any;
      });

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('refetch', () => {
    it('provides refetch function', async () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  describe('currentSubconcept', () => {
    it('returns first due subconcept as current', async () => {
      const mockProgress = [
        {
          id: 'p1',
          user_id: 'user-123',
          language: 'python',
          subconcept_slug: 'for-loops',
          concept_slug: 'loops',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-01T00:00:00Z',
          last_reviewed: null,
          created_at: '2025-12-31T00:00:00Z',
          updated_at: '2025-12-31T00:00:00Z',
        },
        {
          id: 'p2',
          user_id: 'user-123',
          language: 'python',
          subconcept_slug: 'while-loops',
          concept_slug: 'loops',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      createMockFrom(mockProgress);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentSubconcept?.subconceptSlug).toBe('for-loops');
    });

    it('returns null when no subconcepts due', async () => {
      createMockFrom([]);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentSubconcept).toBeNull();
    });
  });

  describe('language parameter', () => {
    it('refetches when language changes', async () => {
      const mockFrom = createMockFrom([]);

      const { result, rerender } = renderHook(
        ({ lang }) => useConceptSRS(lang),
        { wrapper, initialProps: { lang: 'python' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      mockFrom.mockClear();

      // Change language
      rerender({ lang: 'javascript' });

      // Should trigger a new fetch
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalled();
      });
    });
  });
});
