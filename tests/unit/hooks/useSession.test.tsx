// tests/unit/hooks/useSession.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
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
});
