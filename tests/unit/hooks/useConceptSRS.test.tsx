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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          lte: vi.fn(),
          single: vi.fn(),
          order: vi.fn(),
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
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('exposes dueSubconcepts array', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

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
          subconcept_slug: 'for-loops',
          concept_slug: 'control-flow',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
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

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dueSubconcepts).toHaveLength(1);
      expect(result.current.dueSubconcepts[0].subconceptSlug).toBe('for-loops');
    });
  });

  describe('recordSubconceptResult', () => {
    it('provides recordSubconceptResult function', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

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
          subconcept_slug: 'for-loops',
          concept_slug: 'control-flow',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: '2026-01-01T00:00:00Z',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: mockProgress, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockProgress[0], error: null }),
          }),
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockProgress[0],
                interval: 6,
                next_review: '2026-01-08T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordSubconceptResult('for-loops', 'control-flow', 4, 'ex-1', true);
      });

      expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
    });
  });

  describe('getNextExercise', () => {
    it('provides getNextExercise function', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

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
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: '50000' },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('refetch', () => {
    it('provides refetch function', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

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
          subconcept_slug: 'for-loops',
          concept_slug: 'control-flow',
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
          subconcept_slug: 'while-loops',
          concept_slug: 'control-flow',
          phase: 'learning',
          ease_factor: 2.5,
          interval: 1,
          next_review: '2026-01-02T00:00:00Z',
          last_reviewed: null,
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

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentSubconcept?.subconceptSlug).toBe('for-loops');
    });

    it('returns null when no subconcepts due', async () => {
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useConceptSRS(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentSubconcept).toBeNull();
    });
  });
});
