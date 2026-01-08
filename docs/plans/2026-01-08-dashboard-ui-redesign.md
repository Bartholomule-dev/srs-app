# Dashboard UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the dashboard to feel less "AI-generated" by implementing intentional hierarchy - removing decorative effects and adding purposeful, data-driven visual cues.

**Architecture:** Remove ambient decorations (aurora gradients, noise texture, excessive glows), restructure stats from 2x2 grid to hero+supporting layout, add "Due Now" band as temporal anchor, convert skill tree nodes from glow-based to border-width-based states.

**Tech Stack:** Next.js, React 19, Tailwind CSS 4, Framer Motion (reduced usage)

---

## Overview of Changes

### Files to Modify (in order)

| File | Change Type | Summary |
|------|-------------|---------|
| `src/lib/motion.ts` | Extend | Add animation budget constants |
| `src/app/dashboard/page.tsx` | Major rewrite | Remove DashboardBackground, QuickActionCard, uniform animations; add DueNowBand |
| `src/components/dashboard/Greeting.tsx` | Simplify | Remove gradient username, decorative div, reduce animations |
| `src/components/dashboard/StatsGrid.tsx` | Restructure | Hero + supporting row instead of 2x2 grid |
| `src/components/dashboard/StatsCard.tsx` | Simplify | Remove glows, simplify animations |
| `src/components/ui/Button.tsx` | Modify | Replace static glow with respiratory pulse |
| `src/components/skill-tree/SubconceptNode.tsx` | Refactor | Border-width states instead of glow states |
| `src/components/skill-tree/SkillTree.tsx` | Simplify | Remove backdrop-blur, reduce loading animations |
| Tests | Update | Update dashboard and component tests |

### What Gets Deleted (No Legacy Code)

- `DashboardBackground` function (entire function, ~35 lines)
- `QuickActionCard` component (entire function, ~40 lines)
- `QuickActionCardProps` interface
- Noise texture reference (`/noise.svg`)
- All `motion.div` wrappers with uniform `initial/animate` on dashboard page
- `iconGlowMap` in StatsCard
- Decorative corner glow divs in StatsCard
- Icon rotation animation in StatsCard
- `stateStyles` glow-based shadows in SubconceptNode
- Constant pulsing `animate` prop on available nodes

---

## Task 1: Update Motion Constants

**Files:**
- Modify: `src/lib/motion.ts`

**Step 1: Add animation budget constants**

Add to end of file:
```typescript
/**
 * Animation Budget - Per debate consensus
 * Only these events should animate:
 * - State changes: 150ms ease-out
 * - Completion: 120ms ease-out
 * - Hover: 100ms ease-out
 * - Page load: 0ms (instant)
 */
export const ANIMATION_BUDGET = {
  stateChange: { duration: 0.15, ease: 'easeOut' },
  completion: { duration: 0.12, ease: 'easeOut' },
  hover: { duration: 0.1, ease: 'easeOut' },
  pageLoad: { duration: 0 },
} as const;

/**
 * Respiratory pulse - for single CTA emphasis only
 * Respects prefers-reduced-motion
 */
export const respiratoryPulse = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(245, 158, 11, 0)',
      '0 0 0 4px rgba(245, 158, 11, 0.2)',
      '0 0 0 0 rgba(245, 158, 11, 0)',
    ],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const;
```

**Step 2: Run tests to verify no breakage**

Run: `pnpm test src/lib/motion`
Expected: PASS (no tests exist yet, but TypeScript should compile)

**Step 3: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat(motion): add animation budget constants per debate consensus"
```

---

## Task 2: Create DueNowBand Component

**Files:**
- Create: `src/components/dashboard/DueNowBand.tsx`
- Test: `tests/unit/components/dashboard/DueNowBand.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/dashboard/DueNowBand.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DueNowBand } from '@/components/dashboard/DueNowBand';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('DueNowBand', () => {
  it('shows due count when cards are due', () => {
    render(<DueNowBand dueCount={5} streak={3} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/cards due/i)).toBeInTheDocument();
  });

  it('shows streak warning when streak at risk', () => {
    render(<DueNowBand dueCount={5} streak={7} />);
    expect(screen.getByText(/7-day streak/i)).toBeInTheDocument();
  });

  it('shows all caught up message when no cards due', () => {
    render(<DueNowBand dueCount={0} streak={3} />);
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it('renders Start Practice button with pulse when cards due', () => {
    render(<DueNowBand dueCount={5} streak={0} />);
    const button = screen.getByRole('button', { name: /start practice/i });
    expect(button).toBeInTheDocument();
  });

  it('renders Learn New button when no cards due', () => {
    render(<DueNowBand dueCount={0} streak={0} />);
    const button = screen.getByRole('button', { name: /learn new/i });
    expect(button).toBeInTheDocument();
  });

  it('has border-l-4 accent styling', () => {
    const { container } = render(<DueNowBand dueCount={5} streak={0} />);
    const band = container.firstChild;
    expect(band).toHaveClass('border-l-4');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/dashboard/DueNowBand.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/components/dashboard/DueNowBand.tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui';
import { respiratoryPulse } from '@/lib/motion';

interface DueNowBandProps {
  dueCount: number;
  streak: number;
  isLoading?: boolean;
}

export function DueNowBand({ dueCount, streak, isLoading = false }: DueNowBandProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const hasDueCards = dueCount > 0;
  const streakAtRisk = streak > 0 && hasDueCards;

  if (isLoading) {
    return (
      <div className="border-l-4 border-[var(--border)] bg-[var(--bg-surface-1)] rounded-r-lg p-4">
        <div className="animate-pulse flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-20 bg-[var(--bg-surface-3)] rounded" />
            <div className="h-4 w-32 bg-[var(--bg-surface-3)] rounded" />
          </div>
          <div className="h-10 w-28 bg-[var(--bg-surface-3)] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        border-l-4 rounded-r-lg p-4 transition-colors duration-150
        ${hasDueCards
          ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-1)]'
          : 'border-[var(--accent-success)] bg-[var(--bg-surface-1)]'
        }
      `}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          {hasDueCards ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-display text-[var(--text-primary)]">
                  {dueCount}
                </span>
                <span className="text-[var(--text-secondary)]">
                  card{dueCount !== 1 ? 's' : ''} due
                </span>
              </div>
              {streakAtRisk && (
                <p className="text-sm text-[var(--accent-warning)] mt-1">
                  Practice to keep your {streak}-day streak!
                </p>
              )}
            </>
          ) : (
            <div>
              <span className="text-lg font-semibold text-[var(--accent-success)]">
                All caught up!
              </span>
              <p className="text-sm text-[var(--text-secondary)]">
                Learn something new?
              </p>
            </div>
          )}
        </div>

        <motion.div
          animate={hasDueCards && !reduceMotion ? respiratoryPulse.animate : undefined}
          transition={hasDueCards && !reduceMotion ? respiratoryPulse.transition : undefined}
        >
          <Button
            size="lg"
            onClick={() => router.push('/practice')}
          >
            {hasDueCards ? 'Start Practice' : 'Learn New'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/dashboard/DueNowBand.test.tsx`
Expected: PASS

**Step 5: Export from components index**

Add to `src/components/index.ts`:
```typescript
export { DueNowBand } from './dashboard/DueNowBand';
```

**Step 6: Commit**

```bash
git add src/components/dashboard/DueNowBand.tsx tests/unit/components/dashboard/DueNowBand.test.tsx src/components/index.ts
git commit -m "feat(dashboard): add DueNowBand component with respiratory pulse"
```

---

## Task 3: Simplify Dashboard Page - Remove Background & Uniform Animations

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Write test for new structure (update existing)**

Update `tests/unit/app/dashboard.test.tsx` mock for Greeting to include new props:
```typescript
// In the mock, change Greeting to accept new props
Greeting: ({ dueCount, isLoading }: { dueCount: number; isLoading: boolean }) => (
  <div data-testid="greeting">
    Due: {dueCount}, Loading: {isLoading ? 'yes' : 'no'}
  </div>
),
// Add DueNowBand mock
DueNowBand: ({ dueCount, streak }: { dueCount: number; streak: number }) => (
  <div data-testid="due-now-band">Due: {dueCount}, Streak: {streak}</div>
),
```

**Step 2: Run test to verify current state**

Run: `pnpm test tests/unit/app/dashboard.test.tsx`
Expected: PASS (current tests should pass)

**Step 3: Rewrite dashboard page**

Replace entire `src/app/dashboard/page.tsx`:

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  DueNowBand,
  StatsGrid,
  SkillTree,
} from '@/components';
import { useAuth, useStats } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/types';

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
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchDueCount() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('subconcept_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (queryError) throw queryError;

        type SubconceptProgressRow = Database['public']['Tables']['subconcept_progress']['Row'];
        const now = new Date();
        const due = (data ?? []).filter((p: SubconceptProgressRow) => {
          if (!p.next_review) return false;
          return new Date(p.next_review) <= now;
        }).length;

        setDueCount(due);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDueCount();
  }, [user]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[var(--bg-base)]">
          <div className="text-center py-12 rounded-lg border border-red-500/20 bg-red-500/5">
            <p className="text-red-400 mb-4">{error}</p>
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

          {/* Skill Tree Section */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Learning Path
            </h2>
            <SkillTree />
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

**Step 4: Update test expectations**

Update the mock in `tests/unit/app/dashboard.test.tsx` to include DueNowBand:
```typescript
vi.mock('@/components', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  ),
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  Header: () => <header data-testid="header">Header</header>,
  DueNowBand: ({ dueCount, streak }: { dueCount: number; streak: number }) => (
    <div data-testid="due-now-band">Due: {dueCount}, Streak: {streak}</div>
  ),
  StatsGrid: ({ stats, loading }: { stats: unknown; loading: boolean }) => (
    <div data-testid="stats-grid">
      {loading ? 'Loading stats...' : stats ? 'Stats loaded' : 'No stats'}
    </div>
  ),
  SkillTree: () => <div data-testid="skill-tree">Skill Tree</div>,
}));
```

Remove tests for removed components (Greeting) and add test for DueNowBand:
```typescript
it('renders DueNowBand component', async () => {
  render(<DashboardPage />);

  await waitFor(() => {
    expect(screen.getByTestId('due-now-band')).toBeInTheDocument();
  });
});
```

**Step 5: Run tests**

Run: `pnpm test tests/unit/app/dashboard.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx tests/unit/app/dashboard.test.tsx
git commit -m "refactor(dashboard): remove aurora backgrounds and uniform animations

BREAKING: Removes DashboardBackground, QuickActionCard components
- Replaced Greeting with DueNowBand as primary focal point
- Removed noise texture overlay reference
- Removed all motion.div wrappers with uniform animations
- Instant shell render (no page-level animation)"
```

---

## Task 4: Restructure StatsGrid - Hero + Supporting Layout

**Files:**
- Modify: `src/components/dashboard/StatsGrid.tsx`
- Modify: `src/components/dashboard/StatsCard.tsx`
- Test: Update existing tests

**Step 1: Update StatsCard - remove glows**

Replace `src/components/dashboard/StatsCard.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ANIMATION_BUDGET } from '@/lib/motion';

// SVG Icons (keep existing icons: FlameIcon, TargetIcon, TrophyIcon, ChartIcon, CheckCircleIcon)
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2c0 4.5-3 7.5-3 11 0 2.5 1.5 4.5 3.5 5 2-.5 3.5-2.5 3.5-5 0-3.5-3-6.5-3-11z" />
      <path d="M12 13c0 2 1 3 2 3.5 1-.5 2-1.5 2-3.5 0-1.5-1-3-2-4-1 1-2 2.5-2 4z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// Check if test environment
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  size?: 'sm' | 'lg';
}

function AnimatedCounter({ value, suffix = '', size = 'sm' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(isTestEnv ? value : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isTestEnv || reduceMotion) {
      setDisplayValue(value);
      return;
    }

    // Simple count-up animation
    const duration = 300;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, reduceMotion]);

  const textSize = size === 'lg' ? 'text-4xl' : 'text-2xl';

  return (
    <span className={cn(textSize, 'font-bold font-display text-[var(--text-primary)]')}>
      {displayValue}
      {suffix && <span className="text-lg ml-0.5">{suffix}</span>}
    </span>
  );
}

export type StatsIconType = 'fire' | 'chart' | 'check';

export interface StatsCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: StatsIconType;
  variant?: 'hero' | 'supporting';
  className?: string;
}

const iconMap: Record<StatsIconType, React.ComponentType<{ className?: string }>> = {
  fire: FlameIcon,
  chart: ChartIcon,
  check: CheckCircleIcon,
};

const iconColorMap: Record<StatsIconType, string> = {
  fire: 'text-[var(--accent-warning)]',
  chart: 'text-[var(--accent-primary)]',
  check: 'text-[var(--accent-success)]',
};

export function StatsCard({
  label,
  value,
  suffix = '',
  icon,
  variant = 'supporting',
  className = '',
}: StatsCardProps) {
  const IconComponent = icon ? iconMap[icon] : null;
  const iconColor = icon ? iconColorMap[icon] : '';
  const reduceMotion = useReducedMotion();

  const isHero = variant === 'hero';

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={ANIMATION_BUDGET.stateChange}
    >
      <Card
        elevation={isHero ? 2 : 1}
        className={cn(
          'border border-[var(--border)]',
          isHero && 'bg-[var(--bg-surface-1)]',
          className
        )}
      >
        <CardContent className={cn('p-4', isHero && 'p-6')}>
          <div className={cn(
            'flex items-center gap-3',
            isHero ? 'flex-row' : 'flex-col items-start'
          )}>
            {IconComponent && (
              <IconComponent
                className={cn(
                  iconColor,
                  isHero ? 'w-8 h-8' : 'w-5 h-5'
                )}
              />
            )}
            <div className={isHero ? 'flex-1' : ''}>
              <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                {label}
              </span>
              <div className="mt-1">
                <AnimatedCounter
                  value={value}
                  suffix={suffix}
                  size={isHero ? 'lg' : 'sm'}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

**Step 2: Update StatsGrid layout**

Replace `src/components/dashboard/StatsGrid.tsx`:

```typescript
'use client';

import { StatsCard } from './StatsCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { UserStats } from '@/lib/stats';

export interface StatsGridProps {
  stats: UserStats | null;
  loading?: boolean;
}

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Hero skeleton */}
      <div className="h-24 bg-[var(--bg-surface-1)] rounded-lg border border-[var(--border)]">
        <div className="p-6 animate-pulse flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </div>
      {/* Supporting row skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-[var(--bg-surface-1)] rounded-lg border border-[var(--border)]"
          >
            <div className="p-4 animate-pulse space-y-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsGrid({ stats, loading = false }: StatsGridProps) {
  if (loading || !stats) {
    return <StatsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Hero stat - Due Today / Streak */}
      <StatsCard
        label="Current Streak"
        value={stats.currentStreak}
        suffix=" days"
        icon="fire"
        variant="hero"
      />

      {/* Supporting stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Today"
          value={stats.cardsReviewedToday}
          icon="check"
          variant="supporting"
        />
        <StatsCard
          label="Accuracy"
          value={stats.accuracyPercent}
          suffix="%"
          variant="supporting"
        />
        <StatsCard
          label="Total"
          value={stats.totalExercisesCompleted}
          icon="chart"
          variant="supporting"
        />
      </div>
    </div>
  );
}
```

**Step 3: Run tests**

Run: `pnpm test tests/unit/components/dashboard`
Expected: PASS (may need test updates)

**Step 4: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx src/components/dashboard/StatsGrid.tsx
git commit -m "refactor(stats): hero + supporting layout, remove glow effects

- Changed from 2x2 grid to hero card + 3-column supporting row
- Removed iconGlowMap and decorative corner glows
- Removed icon rotation animation
- Simplified AnimatedCounter with CSS transitions
- Added variant prop: 'hero' | 'supporting'"
```

---

## Task 5: Simplify Greeting Component

**Files:**
- Modify: `src/components/dashboard/Greeting.tsx`

**Step 1: Simplify Greeting (now secondary to DueNowBand)**

Since DueNowBand is now the primary CTA, Greeting becomes optional/removable. If we keep it, simplify:

```typescript
'use client';

import { useProfile } from '@/lib/hooks/useProfile';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

interface GreetingProps {
  isLoading?: boolean;
}

export function Greeting({ isLoading = false }: GreetingProps) {
  const { profile, loading: profileLoading } = useProfile();

  const greeting = getGreeting();
  const username = profile?.username || 'there';
  const loading = isLoading || profileLoading;

  return (
    <div className="mb-2">
      <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
        {greeting},{' '}
        <span className="text-[var(--text-primary)]">
          {loading ? '...' : username}
        </span>
      </h1>
    </div>
  );
}
```

Note: Greeting is now optional since DueNowBand handles the CTA. Can be removed entirely if desired.

**Step 2: Commit**

```bash
git add src/components/dashboard/Greeting.tsx
git commit -m "refactor(greeting): remove gradient text and animations

- Username now solid text (not gradient)
- Removed decorative gradient div
- Removed framer-motion animations
- Component is now optional (DueNowBand is primary)"
```

---

## Task 6: Update Button Glow to Respiratory Pulse

**Files:**
- Modify: `src/components/ui/Button.tsx`

**Step 1: Update Button**

Change the glow prop behavior:

```typescript
// In Button.tsx, line 76, change:
glow && variant === 'primary' && 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',

// To remove static glow (respiratory pulse is handled by motion wrapper in DueNowBand)
// Just remove the line entirely or replace with:
// glow && 'transition-shadow duration-150'
```

The respiratory pulse is now applied via motion wrapper where needed, not as a static shadow.

**Step 2: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "refactor(button): remove static glow shadow

Respiratory pulse is now applied via motion wrapper where needed"
```

---

## Task 7: Refactor Skill Tree Node States

**Files:**
- Modify: `src/components/skill-tree/SubconceptNode.tsx`

**Step 1: Replace glow-based states with border-width states**

```typescript
'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SkillTreeNode, SubconceptState } from '@/lib/skill-tree/types';
import { MASTERY_REPS } from '@/lib/skill-tree/types';
import { ANIMATION_BUDGET } from '@/lib/motion';

interface SubconceptNodeProps {
  node: SkillTreeNode;
  prereqNames?: Record<string, string>;
  className?: string;
}

// Border-width based states (per debate consensus)
const stateStyles: Record<SubconceptState, string> = {
  locked:
    'border border-[var(--text-tertiary)]/30 bg-[var(--bg-surface-2)]/30 ' +
    'opacity-40 cursor-not-allowed',
  available:
    'border-2 border-[var(--accent-primary)] bg-[var(--bg-surface-1)] ' +
    'hover:bg-[var(--bg-surface-2)]',
  'in-progress':
    'border-[3px] border-[var(--accent-primary)] bg-[var(--bg-surface-1)]',
  proficient:
    'border-2 border-emerald-500 bg-[var(--bg-surface-1)]',
  mastered:
    'border-2 border-emerald-500 bg-emerald-500/20',
};

function getTooltipContent(
  node: SkillTreeNode,
  prereqNames?: Record<string, string>
): { title: string; subtitle: string } {
  const title = node.name;

  switch (node.state) {
    case 'locked': {
      const names = node.prereqs
        .map((slug) => prereqNames?.[slug] ?? slug)
        .join(', ');
      return { title, subtitle: `Requires: ${names}` };
    }
    case 'available':
      return { title, subtitle: 'Ready to learn' };
    case 'in-progress': {
      const stability = node.stability?.toFixed(1) ?? '0';
      const reps = node.reps ?? 0;
      return {
        title,
        subtitle: `Stability: ${stability}d, ${reps}/${MASTERY_REPS} reviews`,
      };
    }
    case 'proficient': {
      const stability = node.stability?.toFixed(1) ?? '0';
      const reps = node.reps ?? 0;
      return {
        title,
        subtitle: `Proficient! ${stability}d stability, ${reps}/${MASTERY_REPS} to master`,
      };
    }
    case 'mastered':
      return { title, subtitle: 'Mastered!' };
  }
}

export function SubconceptNode({
  node,
  prereqNames,
  className,
}: SubconceptNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const reduceMotion = useReducedMotion();

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);
  const handleFocus = useCallback(() => setShowTooltip(true), []);
  const handleBlur = useCallback(() => setShowTooltip(false), []);

  const { title, subtitle } = getTooltipContent(node, prereqNames);

  return (
    <div className="relative w-12 h-12">
      <motion.button
        ref={nodeRef}
        type="button"
        className={cn(
          'w-12 h-12 rounded-full transition-all',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]',
          stateStyles[node.state],
          className
        )}
        style={{ transitionDuration: '150ms' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={node.name}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-disabled={node.state === 'locked'}
        tabIndex={node.state === 'locked' ? -1 : 0}
        whileHover={
          node.state !== 'locked' && !reduceMotion
            ? { scale: 1.05 }
            : undefined
        }
        whileTap={
          node.state !== 'locked' && !reduceMotion
            ? { scale: 0.95 }
            : undefined
        }
        transition={ANIMATION_BUDGET.hover}
      />

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2',
              'px-3 py-2 rounded-lg',
              'bg-[var(--bg-surface-3)] border border-[var(--border)]',
              'shadow-lg',
              'whitespace-nowrap pointer-events-none'
            )}
          >
            <div className="font-medium text-sm text-[var(--text-primary)]">
              {title}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{subtitle}</div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--bg-surface-3)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 2: Run tests**

Run: `pnpm test tests/unit/components/skill-tree`
Expected: PASS (or update if tests check for specific shadows)

**Step 3: Commit**

```bash
git add src/components/skill-tree/SubconceptNode.tsx
git commit -m "refactor(skill-tree): border-width states instead of glow states

- locked: 1px border
- available: 2px border
- in-progress: 3px border
- proficient: 2px emerald border
- mastered: 2px emerald border + fill
- Removed constant pulsing animation
- Removed backdrop-blur from tooltip"
```

---

## Task 8: Simplify SkillTree Container

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx`

**Step 1: Remove backdrop-blur and simplify**

In `src/components/skill-tree/SkillTree.tsx`, make these changes:

1. In loading state (line 119): Remove `backdrop-blur-sm`
2. In error state (line 150): Remove `backdrop-blur-sm`
3. In main container (line 169): Remove `backdrop-blur-sm`
4. In ClusterWithNodeRefs (line 238): Remove `backdrop-blur-sm`
5. Remove staggered tier animations (lines 202-206) - instant render

**Step 2: Commit**

```bash
git add src/components/skill-tree/SkillTree.tsx
git commit -m "refactor(skill-tree): remove backdrop-blur and staggered animations

- Instant render (no staggered tier delays)
- Removed backdrop-blur from all states
- Cleaner, faster appearance"
```

---

## Task 9: Run Full Test Suite and Fix Failures

**Files:**
- Various test files as needed

**Step 1: Run full test suite**

```bash
pnpm test
```

**Step 2: Fix any failures**

Common issues to check:
- Mock updates for removed components
- Snapshot tests that need updating
- E2E tests that look for removed elements

**Step 3: Run E2E tests**

```bash
pnpm test:e2e
```

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "test: update tests for dashboard redesign"
```

---

## Task 10: Run Lighthouse and Verify Success Metrics

**Step 1: Build for production**

```bash
pnpm build
```

**Step 2: Run Lighthouse audit**

Expected: 95+ performance score

**Step 3: Manual verification**

- [ ] **No-Touch Audit**: Only CTA pulse should be animating
- [ ] **Squint Test**: Hero stat and CTA visible when squinting
- [ ] **5-Second Test**: Clear path to "Start Practice"

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(dashboard): complete UI redesign per debate consensus

Summary of changes:
- Removed aurora gradients, noise texture, excessive glows
- Added DueNowBand with respiratory pulse as focal point
- Stats: hero + supporting layout (not 2x2 grid)
- Skill tree: border-width states (not glow states)
- Removed gradient text on username
- Instant shell render (no uniform animations)

Success metrics:
- Lighthouse: [score]
- Only CTA animates at rest
- Clear visual hierarchy"
```

---

## Cleanup Checklist

Before marking complete, verify these items are DELETED (no legacy code):

- [ ] `DashboardBackground` function in page.tsx
- [ ] `QuickActionCard` function and interface in page.tsx
- [ ] Noise texture reference (`/noise.svg`) - verify file can be deleted
- [ ] `iconGlowMap` in StatsCard.tsx
- [ ] Decorative corner glow `<div>` in StatsCard.tsx
- [ ] Icon rotation animation (`initial={{ scale: 0, rotate: -180 }}`) in StatsCard.tsx
- [ ] `ProgressRing` component (if not used elsewhere)
- [ ] `backdrop-blur-sm` from SkillTree containers
- [ ] Constant pulsing `animate` prop on SubconceptNode
- [ ] Gradient text on username in Greeting.tsx

---

## Summary

| Task | Effort | Files Changed |
|------|--------|---------------|
| 1. Motion constants | Low | 1 |
| 2. DueNowBand component | Medium | 3 |
| 3. Dashboard page rewrite | High | 2 |
| 4. StatsGrid restructure | Medium | 2 |
| 5. Greeting simplify | Low | 1 |
| 6. Button glow removal | Low | 1 |
| 7. SubconceptNode refactor | Medium | 1 |
| 8. SkillTree simplify | Low | 1 |
| 9. Test fixes | Medium | Various |
| 10. Verification | Low | 0 |

**Total: ~12-15 files modified, ~500 lines removed, ~300 lines added**
