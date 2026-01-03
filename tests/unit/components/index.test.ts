import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client before importing components
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
  },
}));

import * as components from '@/components';

describe('components barrel export', () => {
  it('exports exercise components', () => {
    expect(components.ExerciseCard).toBeDefined();
    expect(components.ExercisePrompt).toBeDefined();
    expect(components.CodeInput).toBeDefined();
    expect(components.ExerciseFeedback).toBeDefined();
    expect(components.HintButton).toBeDefined();
  });
});
