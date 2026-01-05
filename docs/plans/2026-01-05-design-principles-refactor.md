# Design Principles Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the entire codebase with strict design principles - CSS variable theming, consistent depth strategy, standardized motion system, and unified iconography.

**Architecture:** Replace hardcoded Tailwind colors with CSS variables across all components, standardize framer-motion animations with a tiered duration system, reduce shadow intensity for dark mode while maintaining depth hierarchy, and migrate to Phosphor Icons.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, framer-motion, @phosphor-icons/react, darwin-ui

**AI Consultation Summary:**
- Gemini: Approved plan, suggested hybrid gradient approach, warned about visual regression testing
- Codex: Challenged blanket spring removal (keep for micro-interactions), suggested tiered animation durations, warned about token/Tailwind conflicts

---

## Phase 1: Foundation - Motion System & CSS Variables

### Task 1.1: Define Motion Constants

**Files:**
- Create: `src/lib/motion.ts`
- Test: `tests/unit/lib/motion.test.ts`

**Step 1: Write the test file**

```typescript
// tests/unit/lib/motion.test.ts
import { describe, expect, it } from 'vitest';
import {
  DURATION,
  EASE,
  springConfig,
  fadeIn,
  slideUp
} from '@/lib/motion';

describe('motion constants', () => {
  it('exports duration tiers', () => {
    expect(DURATION.micro).toBe(0.15);
    expect(DURATION.fast).toBe(0.2);
    expect(DURATION.normal).toBe(0.3);
    expect(DURATION.slow).toBe(0.4);
    expect(DURATION.page).toBe(0.5);
  });

  it('exports ease curves', () => {
    expect(EASE.default).toEqual([0.25, 1, 0.5, 1]);
    expect(EASE.emphasized).toEqual([0.2, 0, 0, 1]);
    expect(EASE.decelerate).toEqual([0, 0, 0.2, 1]);
  });

  it('exports spring config for micro-interactions', () => {
    expect(springConfig.stiffness).toBe(400);
    expect(springConfig.damping).toBe(30);
  });

  it('exports preset animations', () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 });
    expect(fadeIn.animate).toEqual({ opacity: 1 });
    expect(slideUp.initial).toHaveProperty('y', 20);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/lib/motion.test.ts`
Expected: FAIL with "Cannot find module '@/lib/motion'"

**Step 3: Create the motion constants file**

```typescript
// src/lib/motion.ts

/**
 * Motion System - Standardized animation constants
 *
 * Duration Tiers (per Codex recommendation):
 * - micro: ≤150ms (button hovers, toggles)
 * - fast: 200ms (small UI feedback)
 * - normal: 300ms (component transitions)
 * - slow: 400ms (larger component animations)
 * - page: 500ms (route transitions, hero reveals)
 */

export const DURATION = {
  micro: 0.15,
  fast: 0.2,
  normal: 0.3,
  slow: 0.4,
  page: 0.5,
} as const;

/**
 * Easing Curves
 * - default: General-purpose ease-out
 * - emphasized: For attention-grabbing animations
 * - decelerate: For elements entering the screen
 */
export const EASE = {
  default: [0.25, 1, 0.5, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
} as const;

/**
 * Spring config for micro-interactions ONLY
 * (toggles, switches, small tactile feedback)
 * Do NOT use for layout/content transitions
 */
export const springConfig = {
  stiffness: 400,
  damping: 30,
} as const;

// Preset animation variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast, ease: EASE.default },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};

export const slideIn = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: DURATION.fast, ease: EASE.default },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};

// For staggered children animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DURATION.normal, ease: EASE.default },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/lib/motion.test.ts`
Expected: PASS

**Step 5: Export from lib/index.ts**

Add to `src/lib/index.ts`:
```typescript
export * from './motion';
```

**Step 6: Commit**

```bash
git add src/lib/motion.ts tests/unit/lib/motion.test.ts src/lib/index.ts
git commit -m "feat(motion): add standardized motion system constants"
```

---

### Task 1.2: Install Phosphor Icons

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run: `pnpm add @phosphor-icons/react`
Expected: Package added successfully

**Step 2: Verify installation**

Run: `pnpm list @phosphor-icons/react`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add @phosphor-icons/react for unified iconography"
```

---

## Phase 2: Fix Broken Theme System (Critical)

### Task 2.1: Fix Header.tsx - Replace Hardcoded Colors

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Test: Visual verification in browser

**Step 1: Read current file to understand structure**

Review lines 15-61 which contain hardcoded colors.

**Step 2: Replace hardcoded colors with CSS variables**

Replace entire Header component with:

```tsx
// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStats } from '@/lib/hooks/useStats';

export function Header() {
  const { user, signOut } = useAuth();
  const { stats } = useStats();

  const streak = stats?.currentStreak ?? 0;
  const todayCount = stats?.cardsReviewedToday ?? 0;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-surface-1)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-[var(--text-primary)]"
        >
          SyntaxSRS
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Streak */}
          <div className="flex items-center gap-1 text-sm">
            {streak > 0 ? (
              <>
                <span className="text-[var(--accent-warning)]">🔥</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {streak}
                </span>
                <span className="text-[var(--text-secondary)]">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">
                Start your streak!
              </span>
            )}
          </div>

          {/* Today count */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-[var(--text-primary)]">
              {todayCount}
            </span>
            <span className="text-[var(--text-secondary)]">today</span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Verify visually**

Run: `pnpm dev`
Navigate to `/dashboard` and verify header renders correctly with theme colors.

**Step 4: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "fix(Header): replace hardcoded colors with CSS variables"
```

---

### Task 2.2: Fix page.tsx - Replace Loading State Colors

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace hardcoded colors**

Change lines 19-21 and 32:

```tsx
// Before (lines 18-24):
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );
}

// After:
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
      <div className="animate-pulse text-[var(--text-tertiary)]">Loading...</div>
    </div>
  );
}
```

```tsx
// Before (line 32):
<main className="min-h-screen bg-white dark:bg-gray-950">

// After:
<main className="min-h-screen bg-[var(--bg-base)]">
```

**Step 2: Verify visually**

Run: `pnpm dev`
Verify landing page loads with correct theme colors.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix(page): replace hardcoded colors with CSS variables"
```

---

### Task 2.3: Fix Progress.tsx - Replace Hardcoded Colors

**Files:**
- Modify: `src/components/ui/Progress.tsx`

**Step 1: Replace hardcoded colors**

```tsx
// src/components/ui/Progress.tsx
'use client';

export interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  'aria-label'?: string;
}

export function Progress({
  value,
  max = 100,
  className = '',
  'aria-label': ariaLabel,
}: ProgressProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-3)] ${className}`}
    >
      <div
        className="h-full bg-[var(--accent-primary)] transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/Progress.tsx
git commit -m "fix(Progress): replace hardcoded colors with CSS variables"
```

---

### Task 2.4: Fix PracticeCTA.tsx - Replace Hardcoded Colors

**Files:**
- Modify: `src/components/dashboard/PracticeCTA.tsx`

**Step 1: Replace entire file with themed version**

```tsx
// src/components/dashboard/PracticeCTA.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

interface PracticeCTAProps {
  dueCount: number;
  newCount: number;
}

export function PracticeCTA({ dueCount, newCount }: PracticeCTAProps) {
  if (dueCount === 0 && newCount === 0) {
    return (
      <Card className="bg-[var(--bg-surface-2)]">
        <CardContent className="p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            All caught up! No cards due right now.
          </p>
          <Link
            href="/practice"
            className="inline-block py-2 px-6 bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface-3)]/80 text-[var(--text-primary)] font-medium rounded-lg transition-colors"
          >
            Browse exercises
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (dueCount === 0) {
    return (
      <Card className="bg-[var(--accent-success)]/10 border-[var(--accent-success)]/20">
        <CardContent className="p-6 text-center">
          <p className="text-[var(--accent-success)] font-medium mb-4">
            All caught up! 🎉
          </p>
          <Link
            href="/practice"
            className="inline-block py-3 px-8 bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 text-white font-medium rounded-lg transition-colors"
          >
            Learn new cards
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20">
      <CardContent className="p-6">
        <p className="text-[var(--text-secondary)] mb-4">
          🎯 {dueCount} cards due • {newCount} new cards available
        </p>
        <Link
          href="/practice"
          className="inline-block py-3 px-8 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold rounded-lg text-lg transition-colors"
        >
          Start Practice
        </Link>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/PracticeCTA.tsx
git commit -m "fix(PracticeCTA): replace hardcoded colors with CSS variables"
```

---

### Task 2.5: Fix DueCardsBanner.tsx - Replace Hardcoded Colors

**Files:**
- Modify: `src/components/dashboard/DueCardsBanner.tsx`

**Step 1: Replace hardcoded colors**

```tsx
// src/components/dashboard/DueCardsBanner.tsx
'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DueCardsBannerProps {
  dueCount: number;
  newCount: number;
  onStartPractice: () => void;
  loading?: boolean;
}

export function DueCardsBanner({
  dueCount,
  newCount,
  onStartPractice,
  loading = false,
}: DueCardsBannerProps) {
  const totalCards = dueCount + newCount;

  return (
    <Card className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary)]/80 border-0">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-semibold mb-2">Ready to Practice?</h2>
            <div className="flex gap-4 text-sm">
              <span>
                <strong>{dueCount}</strong> due
              </span>
              <span>
                <strong>{newCount}</strong> new
              </span>
              <span className="opacity-70">({totalCards} cards total)</span>
            </div>
          </div>
          <Button
            onClick={onStartPractice}
            disabled={loading}
            variant="secondary"
            className="bg-white text-[var(--accent-primary)] hover:bg-white/90"
          >
            Start Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/DueCardsBanner.tsx
git commit -m "fix(DueCardsBanner): replace hardcoded colors with CSS variables"
```

---

## Phase 3: Standardize Animations

### Task 3.1: Fix SessionSummary.tsx - Replace Spring Animations

**Files:**
- Modify: `src/components/session/SessionSummary.tsx`

**Step 1: Import motion constants and replace spring animations**

Add import at top:
```tsx
import { DURATION, EASE } from '@/lib/motion';
```

Replace spring animations (lines 60, 103):

```tsx
// Line 60 - StatCard transition
// Before:
transition={{ delay, type: 'spring', stiffness: 200 }}

// After:
transition={{ delay, duration: DURATION.normal, ease: EASE.default }}
```

```tsx
// Line 103 - Celebration emoji
// Before:
transition={{ type: 'spring', delay: 0.2, stiffness: 300 }}

// After:
transition={{ delay: 0.2, duration: DURATION.normal, ease: EASE.emphasized }}
```

**Step 2: Commit**

```bash
git add src/components/session/SessionSummary.tsx
git commit -m "fix(SessionSummary): replace spring animations with ease curves"
```

---

### Task 3.2: Fix Hero.tsx - Replace Spring Animation

**Files:**
- Modify: `src/components/landing/Hero.tsx`

**Step 1: Import motion constants**

Add import at top:
```tsx
import { DURATION, EASE } from '@/lib/motion';
```

**Step 2: Replace spring animation (line 227)**

```tsx
// Before:
transition={{ type: 'spring', stiffness: 200, damping: 15 }}

// After:
transition={{ duration: DURATION.normal, ease: EASE.emphasized }}
```

**Step 3: Commit**

```bash
git add src/components/landing/Hero.tsx
git commit -m "fix(Hero): replace spring animation with ease curve"
```

---

### Task 3.3: Fix StatsCard.tsx - Replace Spring Animation

**Files:**
- Modify: `src/components/dashboard/StatsCard.tsx`

**Step 1: Import motion constants**

Add import at top:
```tsx
import { DURATION, EASE } from '@/lib/motion';
```

**Step 2: Replace spring animation (around line 297)**

```tsx
// Before:
transition={{
  type: 'spring',
  stiffness: 200,
  damping: 15,
  delay: delay + 0.2,
}}

// After:
transition={{
  duration: DURATION.normal,
  ease: EASE.default,
  delay: delay + 0.2,
}}
```

**Step 3: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx
git commit -m "fix(StatsCard): replace spring animation with ease curve"
```

---

### Task 3.4: Fix practice/page.tsx - Replace Spring Animations

**Files:**
- Modify: `src/app/practice/page.tsx`

**Step 1: Import motion constants**

Add import at top:
```tsx
import { DURATION, EASE } from '@/lib/motion';
```

**Step 2: Replace spring animations (lines 73, 118)**

```tsx
// Line 73 - ErrorState icon
// Before:
transition={{ type: 'spring', delay: 0.1 }}

// After:
transition={{ duration: DURATION.normal, ease: EASE.emphasized, delay: 0.1 }}
```

```tsx
// Line 118 - EmptyState icon
// Before:
transition={{ type: 'spring', delay: 0.1 }}

// After:
transition={{ duration: DURATION.normal, ease: EASE.emphasized, delay: 0.1 }}
```

**Step 3: Commit**

```bash
git add src/app/practice/page.tsx
git commit -m "fix(practice): replace spring animations with ease curves"
```

---

### Task 3.5: Standardize Long Animation Durations

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/components/landing/HowItWorks.tsx`

**Step 1: Update dashboard/page.tsx durations**

Import motion constants and replace:
```tsx
// Lines 163, 172, 184, 193 - reduce 0.5 to DURATION.slow (0.4)
transition={{ duration: DURATION.slow }}

// Line 264 - reduce 0.8 to DURATION.page (0.5)
transition={{ duration: DURATION.page, delay: 0.5 }}
```

**Step 2: Update Hero.tsx durations**

```tsx
// Line 42 - reduce 0.6 to DURATION.page (0.5)
transition={{ duration: DURATION.page }}

// Line 123 - reduce 0.8 to DURATION.page (0.5)
transition={{ duration: DURATION.page, delay: 0.3 }}
```

**Step 3: Update HowItWorks.tsx durations**

```tsx
// Line 89 - reduce 0.6 to DURATION.page (0.5)
transition={{ duration: DURATION.page }}

// Line 107 - reduce 0.8 to DURATION.page (0.5)
transition={{ duration: DURATION.page, delay: 0.3 }}
```

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/landing/Hero.tsx src/components/landing/HowItWorks.tsx
git commit -m "fix(animations): standardize durations to motion system"
```

---

## Phase 4: Improve Dark Mode Depth

### Task 4.1: Refine Card Shadow Strategy

**Files:**
- Modify: `src/components/ui/Card.tsx`

**Step 1: Update elevation styles for dark mode**

Replace the elevationStyles object:

```tsx
const elevationStyles: Record<CardElevation, string> = {
  flat: 'bg-transparent shadow-none border-transparent',
  1: 'bg-[var(--bg-surface-1)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
  2: 'bg-[var(--bg-surface-2)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
  3: 'bg-[var(--bg-surface-3)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
};
```

**Step 2: Update interactive hover state**

```tsx
interactive && [
  'cursor-pointer',
  'hover:-translate-y-0.5',
  'hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
  'hover:border-[var(--accent-primary)]/30',
],
```

**Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "fix(Card): reduce shadow intensity for dark mode, prioritize borders"
```

---

## Phase 5: Icon Migration (Optional - Can Be Deferred)

### Task 5.1: Create Icon Wrapper Component

**Files:**
- Create: `src/components/ui/Icon.tsx`
- Test: `tests/unit/components/ui/Icon.test.tsx`

**Step 1: Create Icon wrapper for consistent sizing**

```tsx
// src/components/ui/Icon.tsx
'use client';

import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps {
  icon: PhosphorIcon;
  size?: IconSize;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
}

export function Icon({
  icon: IconComponent,
  size = 'md',
  weight = 'regular',
  className
}: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      weight={weight}
      className={cn('flex-shrink-0', className)}
    />
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ui/Icon.tsx
git commit -m "feat(Icon): add Icon wrapper component for Phosphor icons"
```

---

### Task 5.2: Migrate StatsCard Icons to Phosphor

**Files:**
- Modify: `src/components/dashboard/StatsCard.tsx`

**Step 1: Replace inline SVG icons with Phosphor**

Add imports:
```tsx
import { Fire, Target, Trophy, ChartBar, CheckCircle } from '@phosphor-icons/react';
```

Replace icon map:
```tsx
const iconMap: Record<StatsIconType, React.ComponentType<{ size?: number; weight?: string; className?: string }>> = {
  fire: Fire,
  target: Target,
  trophy: Trophy,
  check: CheckCircle,
  chart: ChartBar,
};
```

Remove all inline SVG icon function components (FlameIcon, TargetIcon, etc.).

**Step 2: Update icon rendering**

```tsx
{IconComponent && (
  <IconComponent size={32} weight="regular" className={cn('relative', iconColor)} />
)}
```

**Step 3: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx
git commit -m "refactor(StatsCard): migrate to Phosphor icons"
```

---

### Task 5.3: Migrate Landing Page Icons to Phosphor

**Files:**
- Modify: `src/components/landing/Features.tsx`
- Modify: `src/components/landing/HowItWorks.tsx`

**Step 1: Update Features.tsx**

Add imports:
```tsx
import { Brain, Code, ChartLineUp } from '@phosphor-icons/react';
```

Update features array:
```tsx
const features = [
  {
    title: 'Spaced Repetition',
    description: 'Science-backed algorithm schedules reviews at optimal intervals for long-term retention.',
    Icon: Brain,
  },
  {
    title: 'Code Syntax Focus',
    description: 'Practice real programming patterns. Write actual code from memory.',
    Icon: Code,
  },
  {
    title: 'Track Progress',
    description: 'Build consistency with daily streaks. Watch your accuracy improve over time.',
    Icon: ChartLineUp,
  },
];
```

Remove inline SVG icon components and update render:
```tsx
<feature.Icon size={40} weight="regular" className="text-[var(--accent-primary)] mb-6" />
```

**Step 2: Update HowItWorks.tsx similarly**

Add imports:
```tsx
import { Calendar, Keyboard, Brain } from '@phosphor-icons/react';
```

**Step 3: Commit**

```bash
git add src/components/landing/Features.tsx src/components/landing/HowItWorks.tsx
git commit -m "refactor(landing): migrate to Phosphor icons"
```

---

## Phase 6: Final Verification

### Task 6.1: Run Full Test Suite

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No lint errors

**Step 4: Commit any test fixes if needed**

---

### Task 6.2: Visual Regression Check

**Step 1: Start dev server and check all pages**

Run: `pnpm dev`

Check these routes visually:
- `/` (landing page)
- `/dashboard` (logged in)
- `/practice` (during session)

Verify:
- [ ] Colors are consistent with theme
- [ ] No hardcoded gray values visible
- [ ] Animations feel smooth (not bouncy)
- [ ] Card depth is visible but not overwhelming
- [ ] Icons render correctly

**Step 2: Run E2E tests**

Run: `pnpm test:e2e`
Expected: All E2E tests pass

---

### Task 6.3: Final Commit

**Step 1: Create summary commit if any loose changes**

```bash
git status
# If any uncommitted changes:
git add .
git commit -m "chore: final cleanup after design principles refactor"
```

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Foundation | Motion system, Phosphor install | 15 min |
| 2. Theme System | 5 files with hardcoded colors | 20 min |
| 3. Animations | 6 spring animations + durations | 15 min |
| 4. Dark Mode Depth | Card shadow refinement | 10 min |
| 5. Icon Migration | Optional - can defer | 20 min |
| 6. Verification | Tests + visual check | 10 min |

**Total: ~90 minutes**

## Files Changed Summary

**Created:**
- `src/lib/motion.ts`
- `tests/unit/lib/motion.test.ts`
- `src/components/ui/Icon.tsx` (optional)

**Modified:**
- `src/components/layout/Header.tsx`
- `src/app/page.tsx`
- `src/components/ui/Progress.tsx`
- `src/components/ui/Card.tsx`
- `src/components/dashboard/PracticeCTA.tsx`
- `src/components/dashboard/DueCardsBanner.tsx`
- `src/components/dashboard/StatsCard.tsx`
- `src/components/session/SessionSummary.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/Features.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/practice/page.tsx`
