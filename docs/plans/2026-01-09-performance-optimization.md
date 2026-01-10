# Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce initial bundle size by ~50-80KB and improve page load performance through dynamic imports, server components, and data caching.

**Architecture:** Convert heavy client components to dynamically imported modules, migrate dashboard data fetching to server components with client hydration, add React Query for caching, and integrate Vercel analytics.

**Tech Stack:** Next.js 16, React 19, @next/bundle-analyzer, @tanstack/react-query, @vercel/speed-insights, @vercel/analytics

---

## Phase 1: Bundle Analysis Setup

### Task 1.1: Install Bundle Analyzer

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

**Step 1: Install the bundle analyzer package**

Run:
```bash
pnpm add -D @next/bundle-analyzer
```

Expected: Package added to devDependencies

**Step 2: Update next.config.ts to use bundle analyzer**

Modify `next.config.ts`:

```typescript
import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // HSTS - only enable in production (Vercel handles this, but explicit is better)
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ]
    : []),
  // CSP - permissive for Pyodide (WebAssembly) and inline styles (Framer Motion)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Pyodide CDN + unsafe-eval for Pyodide Python execution
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      // Styles: self + unsafe-inline for Framer Motion and Tailwind
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + Supabase storage
      "img-src 'self' data: blob: https://*.supabase.co",
      // Fonts: self
      "font-src 'self'",
      // Connect: self + Supabase APIs + Pyodide CDN
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net",
      // WebAssembly for Pyodide
      "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      // Workers for potential future Pyodide isolation
      "worker-src 'self' blob:",
      // Frame ancestors - prevent clickjacking
      "frame-ancestors 'none'",
      // Form action
      "form-action 'self'",
      // Base URI
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
```

**Step 3: Add analyze script to package.json**

Add to scripts section of `package.json`:
```json
"analyze": "ANALYZE=true pnpm build"
```

**Step 4: Run analysis to establish baseline**

Run:
```bash
pnpm analyze
```

Expected: Browser opens with bundle visualization showing chunk sizes

**Step 5: Commit**

```bash
git add package.json next.config.ts pnpm-lock.yaml
git commit -m "feat: add bundle analyzer for performance monitoring"
```

---

## Phase 2: Dynamic Imports for Heavy Components

### Task 2.1: Create Loading Skeletons

**Files:**
- Create: `src/components/ui/Skeleton.tsx`
- Test: `tests/unit/components/ui/Skeleton.test.tsx`

**Step 1: Write the failing test**

Create `tests/unit/components/ui/Skeleton.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkillTreeSkeleton, ContributionGraphSkeleton, AchievementsSkeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default styles', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('accepts custom className', () => {
    render(<Skeleton className="h-64 w-full" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-64', 'w-full');
  });
});

describe('SkillTreeSkeleton', () => {
  it('renders loading skeleton for skill tree', () => {
    render(<SkillTreeSkeleton />);
    expect(screen.getByTestId('skill-tree-skeleton')).toBeInTheDocument();
  });
});

describe('ContributionGraphSkeleton', () => {
  it('renders loading skeleton for contribution graph', () => {
    render(<ContributionGraphSkeleton />);
    expect(screen.getByTestId('contribution-graph-skeleton')).toBeInTheDocument();
  });
});

describe('AchievementsSkeleton', () => {
  it('renders loading skeleton for achievements', () => {
    render(<AchievementsSkeleton />);
    expect(screen.getByTestId('achievements-skeleton')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/unit/components/ui/Skeleton.test.tsx
```

Expected: FAIL with "Cannot find module '@/components/ui/Skeleton'"

**Step 3: Write minimal implementation**

Create `src/components/ui/Skeleton.tsx`:

```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[var(--bg-surface-1)]',
        className
      )}
      {...props}
    />
  );
}

export function SkillTreeSkeleton() {
  return (
    <div data-testid="skill-tree-skeleton" className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ContributionGraphSkeleton() {
  return (
    <div data-testid="contribution-graph-skeleton">
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function AchievementsSkeleton() {
  return (
    <div data-testid="achievements-skeleton" className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/unit/components/ui/Skeleton.test.tsx
```

Expected: PASS

**Step 5: Export from UI index**

Add to `src/components/ui/index.ts` (create if doesn't exist):
```typescript
export { Skeleton, SkillTreeSkeleton, ContributionGraphSkeleton, AchievementsSkeleton } from './Skeleton';
```

**Step 6: Commit**

```bash
git add src/components/ui/Skeleton.tsx tests/unit/components/ui/Skeleton.test.tsx src/components/ui/index.ts
git commit -m "feat: add skeleton loading components for dynamic imports"
```

---

### Task 2.2: Dynamic Import SkillTree Component

**Files:**
- Create: `src/components/skill-tree/SkillTreeLazy.tsx`
- Modify: `src/components/skill-tree/index.ts`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Create lazy wrapper for SkillTree**

Create `src/components/skill-tree/SkillTreeLazy.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';
import { SkillTreeSkeleton } from '@/components/ui/Skeleton';

export const SkillTreeLazy = dynamic(
  () => import('./SkillTree').then((mod) => ({ default: mod.SkillTree })),
  {
    loading: () => <SkillTreeSkeleton />,
    ssr: false, // SkillTree uses client-side hooks
  }
);
```

**Step 2: Update skill-tree index exports**

Modify `src/components/skill-tree/index.ts`:

```typescript
export { SkillTree } from './SkillTree';
export { SkillTreeLazy } from './SkillTreeLazy';
```

**Step 3: Update dashboard to use lazy import**

In `src/app/dashboard/page.tsx`, change the import:

```typescript
// Change this line:
// import { SkillTree } from '@/components';

// To import the lazy version directly:
import { SkillTreeLazy } from '@/components/skill-tree';
```

And update the JSX (around line 150):

```typescript
{/* Skill Tree Section */}
<section>
  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
    Learning Path
  </h2>
  <SkillTreeLazy />
</section>
```

**Step 4: Run typecheck to verify**

Run:
```bash
pnpm typecheck
```

Expected: No errors

**Step 5: Run existing tests**

Run:
```bash
pnpm test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/components/skill-tree/SkillTreeLazy.tsx src/components/skill-tree/index.ts src/app/dashboard/page.tsx
git commit -m "perf: lazy load SkillTree component on dashboard"
```

---

### Task 2.3: Dynamic Import ContributionGraph Component

**Files:**
- Create: `src/components/stats/ContributionGraphLazy.tsx`
- Modify: `src/components/stats/index.ts`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Create lazy wrapper for ContributionGraph**

Create `src/components/stats/ContributionGraphLazy.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';
import { ContributionGraphSkeleton } from '@/components/ui/Skeleton';

export const ContributionGraphLazy = dynamic(
  () => import('./ContributionGraph').then((mod) => ({ default: mod.ContributionGraph })),
  {
    loading: () => <ContributionGraphSkeleton />,
    ssr: false,
  }
);
```

**Step 2: Update stats index exports**

Modify `src/components/stats/index.ts`:

```typescript
export { ContributionGraph } from './ContributionGraph';
export { ContributionGraphLazy } from './ContributionGraphLazy';
```

**Step 3: Update dashboard to use lazy import**

In `src/app/dashboard/page.tsx`, add the import:

```typescript
import { ContributionGraphLazy } from '@/components/stats';
```

And update the JSX (around line 140):

```typescript
{/* Contribution History Section */}
<section>
  <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
    Activity History
  </h2>
  <ContributionGraphLazy
    days={contributionDays}
    loading={contributionLoading}
    collapsedMobile={true}
  />
</section>
```

**Step 4: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/components/stats/ContributionGraphLazy.tsx src/components/stats/index.ts src/app/dashboard/page.tsx
git commit -m "perf: lazy load ContributionGraph component on dashboard"
```

---

### Task 2.4: Dynamic Import RecentAchievements Component

**Files:**
- Create: `src/components/dashboard/RecentAchievementsLazy.tsx`
- Modify: `src/components/dashboard/index.ts`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Create lazy wrapper for RecentAchievements**

Create `src/components/dashboard/RecentAchievementsLazy.tsx`:

```typescript
'use client';

import dynamic from 'next/dynamic';
import { AchievementsSkeleton } from '@/components/ui/Skeleton';

export const RecentAchievementsLazy = dynamic(
  () => import('./RecentAchievements').then((mod) => ({ default: mod.RecentAchievements })),
  {
    loading: () => <AchievementsSkeleton />,
    ssr: false,
  }
);
```

**Step 2: Update dashboard index exports**

Add to `src/components/dashboard/index.ts`:

```typescript
export { RecentAchievementsLazy } from './RecentAchievementsLazy';
```

**Step 3: Update dashboard to use lazy import**

In `src/app/dashboard/page.tsx`, update imports and usage:

```typescript
import { RecentAchievementsLazy } from '@/components/dashboard';
```

Update the JSX:

```typescript
{/* Recent Achievements Section */}
<RecentAchievementsLazy />
```

**Step 4: Run typecheck and tests**

Run:
```bash
pnpm typecheck && pnpm test
```

Expected: All pass

**Step 5: Commit**

```bash
git add src/components/dashboard/RecentAchievementsLazy.tsx src/components/dashboard/index.ts src/app/dashboard/page.tsx
git commit -m "perf: lazy load RecentAchievements component on dashboard"
```

---

## Phase 3: React Query for Data Caching

### Task 3.1: Install and Setup React Query

**Files:**
- Modify: `package.json`
- Create: `src/lib/providers/QueryProvider.tsx`
- Modify: `src/components/Providers.tsx`

**Step 1: Install React Query**

Run:
```bash
pnpm add @tanstack/react-query
```

Expected: Package added to dependencies

**Step 2: Create QueryProvider**

Create `src/lib/providers/QueryProvider.tsx`:

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Step 3: Add QueryProvider to Providers**

Modify `src/components/Providers.tsx`:

```typescript
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { PyodideProvider } from '@/lib/context/PyodideContext';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ToastContainer } from '@/components/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <PyodideProvider>
            {children}
          </PyodideProvider>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
```

**Step 4: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: No errors

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/providers/QueryProvider.tsx src/components/Providers.tsx
git commit -m "feat: add React Query for data caching"
```

---

### Task 3.2: Create useDueCount Query Hook

**Files:**
- Create: `src/lib/hooks/useDueCount.ts`
- Test: `tests/unit/hooks/useDueCount.test.tsx`
- Modify: `src/lib/hooks/index.ts`

**Step 1: Write the failing test**

Create `tests/unit/hooks/useDueCount.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useDueCount } from '@/lib/hooks/useDueCount';

// Mock supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [
            { next_review: new Date(Date.now() - 1000).toISOString() }, // Due
            { next_review: new Date(Date.now() + 86400000).toISOString() }, // Not due
            { next_review: null }, // No review scheduled
          ],
          error: null,
        })),
      })),
    })),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useDueCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns due count for user', async () => {
    const { result } = renderHook(() => useDueCount('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dueCount).toBe(1); // Only 1 is due
  });

  it('returns 0 when userId is undefined', () => {
    const { result } = renderHook(() => useDueCount(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.dueCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test tests/unit/hooks/useDueCount.test.tsx
```

Expected: FAIL with "Cannot find module '@/lib/hooks/useDueCount'"

**Step 3: Write minimal implementation**

Create `src/lib/hooks/useDueCount.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface UseDueCountReturn {
  dueCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDueCount(userId: string | undefined): UseDueCountReturn {
  const query = useQuery({
    queryKey: ['dueCount', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('subconcept_progress')
        .select('next_review')
        .eq('user_id', userId);

      if (error) throw error;

      const now = new Date();
      return (data ?? []).filter((p) => {
        if (!p.next_review) return false;
        return new Date(p.next_review) <= now;
      }).length;
    },
    enabled: !!userId,
    staleTime: 60_000, // Cache for 1 minute
  });

  return {
    dueCount: query.data ?? 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test tests/unit/hooks/useDueCount.test.tsx
```

Expected: PASS

**Step 5: Export from hooks index**

Add to `src/lib/hooks/index.ts`:

```typescript
export { useDueCount } from './useDueCount';
export type { UseDueCountReturn } from './useDueCount';
```

**Step 6: Commit**

```bash
git add src/lib/hooks/useDueCount.ts tests/unit/hooks/useDueCount.test.tsx src/lib/hooks/index.ts
git commit -m "feat: add useDueCount hook with React Query caching"
```

---

### Task 3.3: Update Dashboard to Use useDueCount

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Update dashboard to use the new hook**

Replace the manual useEffect data fetching in `src/app/dashboard/page.tsx`:

```typescript
// src/app/dashboard/page.tsx
'use client';

import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  DueNowBand,
  StatsGrid,
} from '@/components';
import { SkillTreeLazy } from '@/components/skill-tree';
import { ContributionGraphLazy } from '@/components/stats';
import { RecentAchievementsLazy } from '@/components/dashboard';
import { useAuth, useStats, useContributionGraph, useDueCount } from '@/lib/hooks';

function LoadingSkeleton() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-6">
          {/* DueNowBand skeleton */}
          <div className="border-l-4 border-[var(--border)] bg-[var(--bg-surface-1)] rounded-r-lg p-4">
            <div className="animate-pulse flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-20 bg-[var(--bg-surface-3)] rounded" />
                <div className="h-4 w-32 bg-[var(--bg-surface-3)] rounded" />
              </div>
              <div className="h-10 w-28 bg-[var(--bg-surface-3)] rounded-lg" />
            </div>
          </div>

          {/* Stats skeleton - hero + row */}
          <div className="space-y-4">
            <div className="h-24 bg-[var(--bg-surface-1)] rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[var(--bg-surface-1)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const { days: contributionDays, loading: contributionLoading } = useContributionGraph();
  const { dueCount, isLoading: dueLoading, error } = useDueCount(user?.id);

  if (dueLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
          <div className="text-center py-12 rounded-lg border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 mb-4">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  const streak = stats?.currentStreak ?? 0;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
        <div className="space-y-6">
          {/* Due Now Band - Primary focal point */}
          <DueNowBand dueCount={dueCount} streak={streak} />

          {/* Stats Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Your Progress
            </h2>
            <StatsGrid stats={stats} loading={statsLoading} />
          </section>

          {/* Recent Achievements Section */}
          <RecentAchievementsLazy />

          {/* Contribution History Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Activity History
            </h2>
            <ContributionGraphLazy
              days={contributionDays}
              loading={contributionLoading}
              collapsedMobile={true}
            />
          </section>

          {/* Skill Tree Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Learning Path
            </h2>
            <SkillTreeLazy />
          </section>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-[var(--text-secondary)]">Something went wrong. Please refresh.</p>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
```

**Step 2: Run typecheck and tests**

Run:
```bash
pnpm typecheck && pnpm test
```

Expected: All pass

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "refactor: use useDueCount hook with React Query caching in dashboard"
```

---

## Phase 4: Vercel Analytics Integration

### Task 4.1: Install Vercel Analytics

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`

**Step 1: Install packages**

Run:
```bash
pnpm add @vercel/speed-insights @vercel/analytics
```

Expected: Packages added to dependencies

**Step 2: Update layout.tsx**

Modify `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import { Providers } from "@/components/Providers";
import "./globals.css";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
```

**Step 3: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: No errors

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/layout.tsx
git commit -m "feat: add Vercel Speed Insights and Analytics"
```

---

## Phase 5: CSS Optimization

### Task 5.1: Scope CSS Transitions

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Update globals.css to scope transitions**

Modify the transition section in `src/app/globals.css`:

```css
/* Base body styles */
body {
  background-color: var(--bg-base);
  color: var(--text-primary);
}

/* Smooth transitions for theme switching (respects reduced motion preference) */
/* Scoped to specific elements to avoid performance issues */
@media (prefers-reduced-motion: no-preference) {
  /* Only apply transitions to theme-aware containers */
  .theme-transition,
  body,
  main,
  header,
  nav,
  footer,
  section,
  article {
    transition: background-color var(--duration-normal),
      border-color var(--duration-normal), color var(--duration-normal);
  }

  /* Buttons and interactive elements */
  button,
  a,
  input,
  textarea,
  select {
    transition: background-color var(--duration-fast),
      border-color var(--duration-fast), color var(--duration-fast),
      opacity var(--duration-fast), transform var(--duration-fast);
  }

  /* Cards and surfaces */
  [class*="bg-surface"],
  [class*="Card"],
  .card {
    transition: background-color var(--duration-normal),
      border-color var(--duration-normal), box-shadow var(--duration-normal);
  }
}
```

**Step 2: Run build to verify no issues**

Run:
```bash
pnpm build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "perf: scope CSS transitions to specific elements"
```

---

## Phase 6: Final Verification

### Task 6.1: Run Full Test Suite

**Step 1: Run all tests**

Run:
```bash
pnpm test:run
```

Expected: All 1913+ tests pass

**Step 2: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: No errors

**Step 3: Run lint**

Run:
```bash
pnpm lint
```

Expected: No errors

**Step 4: Run production build**

Run:
```bash
pnpm build
```

Expected: Build succeeds without errors

---

### Task 6.2: Run Bundle Analysis Comparison

**Step 1: Run bundle analysis**

Run:
```bash
pnpm analyze
```

Expected: Browser opens with bundle visualization

**Step 2: Document size improvements**

Compare chunk sizes before and after optimization. Document in commit message.

**Step 3: Final commit**

```bash
git add .
git commit -m "perf: complete performance optimization

- Add bundle analyzer for monitoring
- Lazy load SkillTree, ContributionGraph, RecentAchievements
- Add React Query for data caching
- Integrate Vercel Speed Insights and Analytics
- Scope CSS transitions for better performance

Estimated savings: ~50-80KB initial JS bundle"
```

---

## Summary

| Task | Description | Impact |
|------|-------------|--------|
| 1.1 | Bundle Analyzer Setup | Visibility |
| 2.1-2.4 | Dynamic Imports | ~50-80KB savings |
| 3.1-3.3 | React Query Caching | Fewer requests, faster nav |
| 4.1 | Vercel Analytics | Performance monitoring |
| 5.1 | CSS Optimization | Reduced jank |
| 6.1-6.2 | Verification | Quality assurance |

**Total Tasks:** 11
**Estimated Time:** 1-2 hours
