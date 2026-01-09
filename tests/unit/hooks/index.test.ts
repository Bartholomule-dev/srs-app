import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client before importing hooks
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
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
}));

import * as hooks from '@/lib/hooks';

describe('Hooks barrel export', () => {
  it('exports useStats', () => {
    expect(typeof hooks.useStats).toBe('function');
  });

  it('exports usePoints', () => {
    expect(typeof hooks.usePoints).toBe('function');
  });
});
