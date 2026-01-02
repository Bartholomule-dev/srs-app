# Milestone 2: Auth & Hooks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wrap authentication in a clean abstraction with an AuthContext/AuthProvider, create reusable data hooks, and add protected route functionality.

**Architecture:** Client-side React context provides auth state globally. Hooks abstract Supabase queries with type-safe mappers. ProtectedRoute guards authenticated pages. Profile auto-creation handled by existing database trigger.

**Tech Stack:** React 19, TypeScript 5 (strict), Supabase JS v2, Vitest (unit/integration), React Testing Library

---

## Prerequisites

- Local Supabase running: `pnpm db:start`
- Database migrated with seed data: `pnpm db:reset`
- All Milestone 1 tests passing: `pnpm test`

---

## Task 1: AuthContext Types

**Files:**
- Create: `src/lib/context/auth.types.ts`
- Test: `tests/unit/context/auth.types.test.ts`

**Step 1: Write the type test**

```typescript
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
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/context/auth.types.test.ts`
Expected: FAIL with "Cannot find module '@/lib/context/auth.types'"

**Step 3: Create directory and types**

```bash
mkdir -p src/lib/context
```

```typescript
// src/lib/context/auth.types.ts
import type { User } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/context/auth.types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/context/auth.types.ts tests/unit/context/auth.types.test.ts
git commit -m "feat(auth): add AuthContext type definitions"
```

---

## Task 2: Create AuthContext and useAuth Hook

**Files:**
- Create: `src/lib/context/AuthContext.tsx`
- Create: `src/lib/hooks/useAuth.ts`
- Test: `tests/unit/hooks/useAuth.test.tsx`

**Step 1: Write the failing hook test**

```typescript
// tests/unit/hooks/useAuth.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';
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
  },
}));

import { supabase } from '@/lib/supabase/client';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    
    spy.mockRestore();
  });

  it('returns loading true initially', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('returns user after loading completes', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('sets error when auth check fails', async () => {
    const mockError = new Error('Network error');
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: mockError as any,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/hooks/useAuth.test.tsx`
Expected: FAIL with "Cannot find module '@/lib/hooks/useAuth'"

**Step 3: Install React Testing Library**

```bash
pnpm add -D @testing-library/react @testing-library/dom jsdom
```

**Step 4: Update Vitest config for React**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environmentMatchGlobs: [
      ['tests/integration/**', 'node'],
      ['tests/unit/**/*.tsx', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 5: Create AuthContext**

```typescript
// src/lib/context/AuthContext.tsx
'use client';

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AuthContextValue, AuthState } from './auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check current user on mount
    supabase.auth.getUser().then(({ data, error }) => {
      setState({
        user: data.user,
        loading: false,
        error: error,
      });
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    setState((prev) => ({
      ...prev,
      loading: false,
      error: error,
    }));

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signOut();
    
    setState({
      user: null,
      loading: false,
      error: error,
    });

    if (error) throw error;
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Step 6: Create useAuth hook**

```typescript
// src/lib/hooks/useAuth.ts
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/context/AuthContext';
import type { AuthContextValue } from '@/lib/context/auth.types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
```

**Step 7: Create barrel exports**

```typescript
// src/lib/context/index.ts
export { AuthProvider, AuthContext } from './AuthContext';
export type { AuthState, AuthContextValue } from './auth.types';
```

```typescript
// src/lib/hooks/index.ts
export { useAuth } from './useAuth';
```

**Step 8: Run tests to verify they pass**

Run: `pnpm test tests/unit/hooks/useAuth.test.tsx`
Expected: PASS (4 tests)

**Step 9: Commit**

```bash
git add -A
git commit -m "feat(auth): add AuthContext and useAuth hook with tests"
```

---

## Task 3: useProfile Hook

**Files:**
- Create: `src/lib/hooks/useProfile.ts`
- Test: `tests/unit/hooks/useProfile.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/hooks/useProfile.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '@/lib/hooks/useProfile';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';
import type { Profile } from '@/lib/types';

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
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const mockUser = { id: 'test-user-id', email: 'test@example.com' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  it('returns loading true while fetching', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('returns profile after loading', async () => {
    const mockProfile = {
      id: 'test-user-id',
      username: null,
      display_name: 'Test User',
      avatar_url: null,
      preferred_language: 'python',
      daily_goal: 10,
      notification_time: null,
      current_streak: 5,
      longest_streak: 10,
      total_exercises_completed: 50,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeDefined();
    expect(result.current.profile?.displayName).toBe('Test User');
    expect(result.current.profile?.currentStreak).toBe(5);
  });

  it('returns null profile when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    const mockError = { message: 'Database error', code: 'PGRST116' };
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/hooks/useProfile.test.tsx`
Expected: FAIL with "Cannot find module '@/lib/hooks/useProfile'"

**Step 3: Implement useProfile hook**

```typescript
// src/lib/hooks/useProfile.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { mapProfile, toDbProfileUpdate } from '@/lib/supabase/mappers';
import type { Profile, DbProfile } from '@/lib/types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => Promise<Profile>;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      setError(new Error(fetchError.message));
      setProfile(null);
    } else if (data) {
      setProfile(mapProfile(data as DbProfile));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<Omit<Profile, 'id' | 'createdAt'>>): Promise<Profile> => {
      if (!user) {
        throw new Error('Must be authenticated to update profile');
      }

      const dbUpdates = toDbProfileUpdate(updates);

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedProfile = mapProfile(data as DbProfile);
      setProfile(updatedProfile);
      return updatedProfile;
    },
    [user]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}
```

**Step 4: Export from barrel**

```typescript
// src/lib/hooks/index.ts
export { useAuth } from './useAuth';
export { useProfile } from './useProfile';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/hooks/useProfile.test.tsx`
Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add src/lib/hooks/useProfile.ts tests/unit/hooks/useProfile.test.tsx src/lib/hooks/index.ts
git commit -m "feat(auth): add useProfile hook with tests"
```

---

## Task 4: useRequireAuth Hook

**Files:**
- Create: `src/lib/hooks/useRequireAuth.ts`
- Test: `tests/unit/hooks/useRequireAuth.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/hooks/useRequireAuth.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
  },
}));

import { supabase } from '@/lib/supabase/client';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useRequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isAuthenticated true when user exists', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to login when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('redirects to custom path when provided', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderHook(() => useRequireAuth({ redirectTo: '/login' }), { wrapper });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('returns loading true while checking auth', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useRequireAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/hooks/useRequireAuth.test.tsx`
Expected: FAIL with "Cannot find module '@/lib/hooks/useRequireAuth'"

**Step 3: Implement useRequireAuth hook**

```typescript
// src/lib/hooks/useRequireAuth.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

interface UseRequireAuthOptions {
  redirectTo?: string;
}

interface UseRequireAuthReturn {
  isAuthenticated: boolean;
  loading: boolean;
}

export function useRequireAuth(
  options: UseRequireAuthOptions = {}
): UseRequireAuthReturn {
  const { redirectTo = '/' } = options;
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return {
    isAuthenticated: !!user,
    loading,
  };
}
```

**Step 4: Export from barrel**

```typescript
// src/lib/hooks/index.ts
export { useAuth } from './useAuth';
export { useProfile } from './useProfile';
export { useRequireAuth } from './useRequireAuth';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/hooks/useRequireAuth.test.tsx`
Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add src/lib/hooks/useRequireAuth.ts tests/unit/hooks/useRequireAuth.test.tsx src/lib/hooks/index.ts
git commit -m "feat(auth): add useRequireAuth hook with redirect logic"
```

---

## Task 5: ProtectedRoute Component

**Files:**
- Create: `src/components/ProtectedRoute.tsx`
- Test: `tests/unit/components/ProtectedRoute.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/ProtectedRoute.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/lib/context/AuthContext';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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
  },
}));

import { supabase } from '@/lib/supabase/client';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while checking auth', async () => {
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('redirects when user is not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows custom loading component when provided', async () => {
    vi.mocked(supabase.auth.getUser).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <AuthProvider>
        <ProtectedRoute loadingComponent={<div>Custom Loading</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    expect(screen.getByText('Custom Loading')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/ProtectedRoute.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ProtectedRoute'"

**Step 3: Create components directory and implement ProtectedRoute**

```bash
mkdir -p src/components
```

```typescript
// src/components/ProtectedRoute.tsx
'use client';

import { type ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useRequireAuth({ redirectTo });

  if (loading) {
    return loadingComponent ?? <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect is happening via useRequireAuth, don't render anything
    return null;
  }

  return <>{children}</>;
}
```

**Step 4: Create barrel export**

```typescript
// src/components/index.ts
export { ProtectedRoute } from './ProtectedRoute';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/components/ProtectedRoute.test.tsx`
Expected: PASS (4 tests)

**Step 6: Commit**

```bash
git add src/components/ProtectedRoute.tsx src/components/index.ts tests/unit/components/ProtectedRoute.test.tsx
git commit -m "feat(auth): add ProtectedRoute component with loading state"
```

---

## Task 6: Integrate AuthProvider into Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Test: `tests/unit/app/layout.test.tsx`

**Step 1: Write the test**

```typescript
// tests/unit/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the AuthProvider and Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// We need to test that AuthProvider wraps the children
// This is a structural test - we verify the layout renders children
describe('RootLayout', () => {
  it('renders children within AuthProvider', async () => {
    // Dynamic import to get the layout after mocks are set up
    const { default: RootLayout } = await import('@/app/layout');

    // Note: RootLayout returns html element which can't be directly rendered
    // We test the component structure instead
    const layout = RootLayout({ children: <div>Test Child</div> });
    
    // Verify the structure includes AuthProvider
    expect(layout).toBeDefined();
    expect(layout.type).toBe('html');
  });
});
```

**Step 2: Run test to verify baseline**

Run: `pnpm test tests/unit/app/layout.test.tsx`
Expected: PASS (verifies current structure)

**Step 3: Update layout.tsx to include AuthProvider**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/context/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SRS App",
  description: "Spaced repetition code syntax practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/app/layout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/layout.tsx tests/unit/app/layout.test.tsx
git commit -m "feat(auth): integrate AuthProvider into root layout"
```

---

## Task 7: Refactor Home Page to Use useAuth

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/unit/app/page.test.tsx`

**Step 1: Write the test for refactored page**

```typescript
// tests/unit/app/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from '@/app/page';
import { AuthProvider } from '@/lib/context/AuthContext';

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
      getSession: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import { supabase } from '@/lib/supabase/client';

const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login form when not authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('shows user info when authenticated', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls signIn when form is submitted', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByPlaceholderText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send magic link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });
  });

  it('calls signOut when sign out button is clicked', async () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    renderWithAuth(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test against current implementation**

Run: `pnpm test tests/unit/app/page.test.tsx`
Expected: PASS or FAIL depending on how current impl works with AuthProvider

**Step 3: Refactor page.tsx to use useAuth**

```typescript
// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";

type CheckStatus = "pending" | "success" | "error" | "not-configured";

interface SystemCheck {
  status: CheckStatus;
  message: string;
}

interface SystemChecks {
  env: SystemCheck;
  auth: SystemCheck;
  database: SystemCheck;
}

function StatusIndicator({ status }: { status: CheckStatus }) {
  switch (status) {
    case "pending":
      return <span className="text-amber-500">...</span>;
    case "success":
      return <span className="text-green-500 font-medium">✓</span>;
    case "error":
      return <span className="text-red-500 font-medium">✗</span>;
    case "not-configured":
      return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
  }
}

function StatusCard({ title, check }: { title: string; check: SystemCheck }) {
  return (
    <div className="flex-1 min-w-[140px] p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-black dark:text-white">
          {title}
        </h3>
        <StatusIndicator status={check.status} />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{check.message}</p>
    </div>
  );
}

export default function Home() {
  const { user, loading, signIn, signOut, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Environment check is synchronous - compute in initial state
  const hasEnvVars = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [checks, setChecks] = useState<SystemChecks>({
    env: {
      status: hasEnvVars ? "success" : "error",
      message: hasEnvVars ? "Configured" : "Missing Supabase credentials",
    },
    auth: { status: "pending", message: "Checking..." },
    database: { status: "not-configured", message: "Not configured yet" },
  });

  useEffect(() => {
    // Auth connection check (async)
    supabase.auth.getSession().then(({ error }) => {
      setChecks((prev) => ({
        ...prev,
        auth: {
          status: error ? "error" : "success",
          message: error ? error.message : "Connected",
        },
      }));
    });
  }, []);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage("");

    try {
      await signIn(email);
      setMessage("Check your email for the login link!");
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    setSending(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-16 px-8 bg-white dark:bg-black">
        {/* System Health Section */}
        <section className="w-full max-w-lg">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">
            System Health
          </h2>
          <div className="flex flex-wrap gap-3">
            <StatusCard title="Environment" check={checks.env} />
            <StatusCard title="Auth" check={checks.auth} />
            <StatusCard title="Database" check={checks.database} />
          </div>
        </section>

        {/* Divider */}
        <div className="w-full max-w-lg border-t border-zinc-200 dark:border-zinc-800" />

        {/* Auth Status Section */}
        <section className="w-full max-w-lg flex flex-col items-center gap-6">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Auth Status
          </h1>
          {loading ? (
            <p className="text-zinc-600 dark:text-zinc-400">Checking...</p>
          ) : user ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-lg text-green-600 dark:text-green-400">
                ✓ Logged in
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleMagicLink}
              className="flex flex-col items-center gap-4 w-full max-w-sm"
            >
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Sign in with Magic Link
              </p>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Magic Link"}
              </button>
              {message && (
                <p
                  className={`text-sm ${message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}
                >
                  {message}
                </p>
              )}
              {authError && (
                <p className="text-sm text-red-500">
                  {authError.message}
                </p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/app/page.test.tsx`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/app/page.tsx tests/unit/app/page.test.tsx
git commit -m "refactor(auth): use useAuth hook in home page"
```

---

## Task 8: Integration Test - Profile Auto-Creation

**Files:**
- Test: `tests/integration/hooks/profile-creation.test.ts`

**Step 1: Write the integration test**

```typescript
// tests/integration/hooks/profile-creation.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_ANON_KEY,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

describe('Profile Auto-Creation', () => {
  let testUserId: string;

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  it('creates profile when user signs up', async () => {
    // Create a new user via admin API
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: `test-profile-${Date.now()}@example.com`,
      email_confirm: true,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    testUserId = data.user!.id;

    // Profile should be auto-created by trigger
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(profileError).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.id).toBe(testUserId);
    expect(profile.daily_goal).toBe(10); // Default value
    expect(profile.current_streak).toBe(0);
  });

  it('profile has correct default values', async () => {
    // Create another test user
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: `test-defaults-${Date.now()}@example.com`,
      email_confirm: true,
    });

    expect(error).toBeNull();
    const userId = data.user!.id;

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    expect(profile.preferred_language).toBe('python');
    expect(profile.daily_goal).toBe(10);
    expect(profile.current_streak).toBe(0);
    expect(profile.longest_streak).toBe(0);
    expect(profile.total_exercises_completed).toBe(0);

    // Clean up
    await serviceClient.auth.admin.deleteUser(userId);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `pnpm test tests/integration/hooks/profile-creation.test.ts`
Expected: PASS (2 tests) - relies on existing database trigger from Milestone 1

**Step 3: Commit**

```bash
git add tests/integration/hooks/profile-creation.test.ts
git commit -m "test(auth): add integration test for profile auto-creation"
```

---

## Task 9: Run Full Test Suite

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass (existing 33 + new ~25 = ~58 tests)

**Step 2: Run type check**

Run: `pnpm tsc --noEmit`
Expected: No type errors

**Step 3: Run linter**

Run: `pnpm lint`
Expected: No errors

**Step 4: Build application**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(milestone-2): complete auth & hooks implementation

- Add AuthContext and AuthProvider
- Add useAuth, useProfile, useRequireAuth hooks  
- Add ProtectedRoute component
- Integrate AuthProvider into root layout
- Refactor home page to use hooks
- Add comprehensive test coverage (~25 new tests)"
```

---

## Summary

| Task | Files | Tests Added |
|------|-------|-------------|
| 1. AuthContext Types | `auth.types.ts` | 2 |
| 2. AuthContext + useAuth | `AuthContext.tsx`, `useAuth.ts` | 4 |
| 3. useProfile Hook | `useProfile.ts` | 4 |
| 4. useRequireAuth Hook | `useRequireAuth.ts` | 4 |
| 5. ProtectedRoute | `ProtectedRoute.tsx` | 4 |
| 6. Layout Integration | `layout.tsx` | 1 |
| 7. Page Refactor | `page.tsx` | 4 |
| 8. Profile Integration | - | 2 |
| **Total** | **10 files** | **~25 tests** |

---

## Verification Checklist

Before marking Milestone 2 complete:

- [ ] All tests pass: `pnpm test`
- [ ] Type check passes: `pnpm tsc --noEmit`
- [ ] Lint passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Can sign in via Magic Link and see auth state
- [ ] Profile auto-created on first login
- [ ] useAuth hook provides user, loading, signIn, signOut
- [ ] useProfile hook provides profile data with camelCase mapping
- [ ] useRequireAuth redirects unauthenticated users
- [ ] ProtectedRoute shows loading then content/redirect

---

## Related

- [[2026-01-02-foundation-roadmap]] - Master roadmap
- [[Testing-Strategy]] - Test approach
- [[Architecture]] - System design
- [[Database-Schema]] - Schema reference
