// tests/unit/context/auth.types.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { AuthState, AuthContextValue } from '@/lib/context/auth.types';
import type { User } from '@supabase/supabase-js';

describe('AuthContext Types', () => {
  it('AuthState has correct shape', () => {
    expectTypeOf<AuthState>().toMatchTypeOf<{
      user: User | null;
      loading: boolean;
      error: Error | null;
    }>();
  });

  it('AuthContextValue includes auth methods', () => {
    expectTypeOf<AuthContextValue>().toMatchTypeOf<{
      user: User | null;
      loading: boolean;
      error: Error | null;
      signIn: (email: string) => Promise<void>;
      signOut: () => Promise<void>;
    }>();
  });
});
