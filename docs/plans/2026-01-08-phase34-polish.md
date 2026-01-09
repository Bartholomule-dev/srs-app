# Phase 3.4: Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish animations, mobile responsiveness, performance, and documentation

**Architecture:** Framer Motion for animations, responsive Tailwind classes, React Query caching, comprehensive documentation updates.

**Tech Stack:** TypeScript, Framer Motion, Tailwind CSS, React Query, Vitest, Playwright

**Prerequisite:** Phase 3.3 (Achievements) must be complete

---

## Task 1: Add Micro-Interactions to Points Animation

**Files:**
- Modify: `src/components/gamification/PointsAnimation.tsx`
- Test: `tests/unit/components/gamification/PointsAnimation-polish.test.tsx`

**Step 1.1: Write the failing tests**

```typescript
// tests/unit/components/gamification/PointsAnimation-polish.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PointsAnimation } from '@/components/gamification/PointsAnimation';

describe('PointsAnimation polish', () => {
  it('applies scale animation on mount', () => {
    const { container } = render(<PointsAnimation points={15} />);
    const motion = container.querySelector('[style*="scale"]');
    // Framer Motion applies inline styles
    expect(motion || container.firstChild).toBeInTheDocument();
  });

  it('applies float-up effect', () => {
    const { container } = render(<PointsAnimation points={15} />);
    // Check for transform/translateY or opacity animation
    expect(container.firstChild).toBeInTheDocument();
  });

  it('supports large size variant', () => {
    const { container } = render(<PointsAnimation points={50} size="large" />);
    const el = container.querySelector('[class*="text-2xl"]');
    expect(el).toBeInTheDocument();
  });

  it('adds sparkle effect for bonus points', () => {
    const { container } = render(<PointsAnimation points={25} showSparkle />);
    const sparkle = container.querySelector('[data-sparkle]');
    // Sparkle might be an SVG or pseudo-element
    expect(sparkle || container.firstChild).toBeInTheDocument();
  });
});
```

**Step 1.2-1.6: Standard TDD flow**

Implementation adds:
- Scale animation (1.2 → 1.0) on mount
- Float-up effect (y: 0 → -10)
- `size` prop for "small" | "medium" | "large"
- Optional sparkle SVG for bonus points

---

## Task 2: Enhance Streak Flame Animation

**Files:**
- Create: `src/components/gamification/StreakFlame.tsx`
- Test: `tests/unit/components/gamification/StreakFlame.test.tsx`

**Step 2.1: Write the failing tests**

```typescript
// tests/unit/components/gamification/StreakFlame.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakFlame } from '@/components/gamification/StreakFlame';

describe('StreakFlame', () => {
  it('renders flame icon', () => {
    const { container } = render(<StreakFlame streak={5} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies gentle animation for streak < 7', () => {
    const { container } = render(<StreakFlame streak={5} />);
    const flame = container.querySelector('[data-flame]');
    expect(flame).toHaveClass('animate-pulse');
  });

  it('applies larger animation at milestone (7)', () => {
    const { container } = render(<StreakFlame streak={7} />);
    const flame = container.querySelector('[data-flame]');
    expect(flame).toHaveClass('animate-bounce');
  });

  it('glows brighter at 30+ streak', () => {
    const { container } = render(<StreakFlame streak={30} />);
    const glow = container.querySelector('[class*="shadow"]');
    expect(glow).toBeInTheDocument();
  });

  it('shows streak count', () => {
    render(<StreakFlame streak={14} showCount />);
    expect(screen.getByText('14')).toBeInTheDocument();
  });
});
```

**Step 2.2-2.6: Standard TDD flow**

Implementation:
- SVG flame icon with animated gradient
- Intensity increases with streak length
- Glow effect at milestones (7, 14, 30)
- Optional streak count badge

---

## Task 3: Add Badge Tier Transition Animations

**Files:**
- Modify: `src/components/skill-tree/SubconceptNode.tsx`
- Test: `tests/unit/components/skill-tree/SubconceptNode-transitions.test.tsx`

**Step 3.1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/SubconceptNode-transitions.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SubconceptNode } from '@/components/skill-tree/SubconceptNode';

describe('SubconceptNode tier transitions', () => {
  it('animates ring color on tier change', () => {
    const { rerender, container } = render(
      <SubconceptNode
        subconcept="test"
        state="in-progress"
        badgeTier="bronze"
        label="Test"
      />
    );

    // Check bronze ring
    expect(container.querySelector('[class*="ring-amber"]')).toBeInTheDocument();

    // Upgrade to silver
    rerender(
      <SubconceptNode
        subconcept="test"
        state="in-progress"
        badgeTier="silver"
        label="Test"
      />
    );

    // Framer Motion should animate the change
    expect(container.querySelector('[class*="ring-slate"]')).toBeInTheDocument();
  });

  it('triggers celebration callback on tier up', () => {
    const onTierUp = vi.fn();
    const { rerender } = render(
      <SubconceptNode
        subconcept="test"
        state="in-progress"
        badgeTier="bronze"
        label="Test"
        onTierUp={onTierUp}
      />
    );

    // Upgrade to gold
    rerender(
      <SubconceptNode
        subconcept="test"
        state="in-progress"
        badgeTier="gold"
        label="Test"
        onTierUp={onTierUp}
      />
    );

    expect(onTierUp).toHaveBeenCalledWith('bronze', 'gold');
  });

  it('shows shine animation on platinum', () => {
    const { container } = render(
      <SubconceptNode
        subconcept="test"
        state="mastered"
        badgeTier="platinum"
        label="Test"
      />
    );

    const shine = container.querySelector('[class*="animate-shine"]');
    expect(shine || container.querySelector('[data-platinum]')).toBeInTheDocument();
  });
});
```

---

## Task 4: Mobile-Responsive Contribution Graph

**Files:**
- Modify: `src/components/stats/ContributionGraph.tsx`
- Test: `tests/unit/components/stats/ContributionGraph-mobile.test.tsx`

**Step 4.1: Write the failing tests**

```typescript
// tests/unit/components/stats/ContributionGraph-mobile.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContributionGraph } from '@/components/stats/ContributionGraph';

describe('ContributionGraph mobile', () => {
  it('shows condensed 3-month view on mobile', () => {
    // Mock window.innerWidth or use responsive testing
    const { container } = render(
      <ContributionGraph
        days={[]}
        loading={false}
        mobileWeeks={13} // 3 months
      />
    );

    // Check for mobile-specific classes
    const mobileView = container.querySelector('[data-mobile-graph]');
    expect(mobileView).toBeInTheDocument();
  });

  it('shows full year on desktop', () => {
    const { container } = render(
      <ContributionGraph
        days={[]}
        loading={false}
      />
    );

    const desktopView = container.querySelector('[data-desktop-graph]');
    expect(desktopView).toBeInTheDocument();
  });

  it('collapses month labels on mobile', () => {
    const { container } = render(
      <ContributionGraph
        days={[]}
        loading={false}
        collapsedLabels
      />
    );

    // Should show fewer month labels
    const labels = container.querySelectorAll('[data-month-label]');
    expect(labels.length).toBeLessThanOrEqual(4);
  });
});
```

---

## Task 5: Touch-Friendly Tooltips

**Files:**
- Modify: `src/components/ui/Tooltip.tsx`
- Test: `tests/unit/components/ui/Tooltip-touch.test.tsx`

**Step 5.1: Write the failing tests**

```typescript
// tests/unit/components/ui/Tooltip-touch.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '@/components/ui/Tooltip';

describe('Tooltip touch support', () => {
  it('shows on long press for touch devices', async () => {
    render(
      <Tooltip content="Test tooltip">
        <button>Trigger</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');

    // Simulate long press
    fireEvent.touchStart(trigger);
    await new Promise((r) => setTimeout(r, 500));

    expect(screen.getByText('Test tooltip')).toBeInTheDocument();

    fireEvent.touchEnd(trigger);
  });

  it('dismisses on tap outside', () => {
    render(
      <div>
        <Tooltip content="Test tooltip">
          <button>Trigger</button>
        </Tooltip>
        <div data-testid="outside">Outside</div>
      </div>
    );

    const trigger = screen.getByRole('button');
    fireEvent.touchStart(trigger);

    // Tap outside
    fireEvent.touchStart(screen.getByTestId('outside'));

    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });
});
```

---

## Task 6: React Query Caching for Gamification Hooks

**Files:**
- Create: `src/lib/gamification/query-keys.ts`
- Modify: `src/lib/hooks/usePoints.ts`
- Modify: `src/lib/hooks/useAchievements.ts`
- Test: `tests/unit/gamification/caching.test.ts`

**Step 6.1: Write the failing tests**

```typescript
// tests/unit/gamification/caching.test.ts
import { describe, it, expect } from 'vitest';
import { gamificationQueryKeys, getStaleTime } from '@/lib/gamification/query-keys';

describe('Gamification query keys', () => {
  it('defines all query keys', () => {
    expect(gamificationQueryKeys.points('user-1')).toEqual(['gamification', 'points', 'user-1']);
    expect(gamificationQueryKeys.contributions('user-1')).toEqual(['gamification', 'contributions', 'user-1']);
    expect(gamificationQueryKeys.achievements('user-1')).toEqual(['gamification', 'achievements', 'user-1']);
    expect(gamificationQueryKeys.streak('user-1')).toEqual(['gamification', 'streak', 'user-1']);
  });
});

describe('getStaleTime', () => {
  it('returns 5 minutes for contributions', () => {
    expect(getStaleTime('contributions')).toBe(5 * 60 * 1000);
  });

  it('returns 1 minute for achievements', () => {
    expect(getStaleTime('achievements')).toBe(60 * 1000);
  });

  it('returns 0 for points (always fresh)', () => {
    expect(getStaleTime('points')).toBe(0);
  });
});
```

**Step 6.2-6.6: Standard TDD flow**

Implementation:
- Query key factory for type-safe React Query keys
- Stale time configuration per data type
- Update hooks to use React Query if not already

---

## Task 7: Performance Optimization for Skill Tree

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx`
- Test: `tests/unit/components/skill-tree/SkillTree-performance.test.tsx`

**Step 7.1: Write the failing tests**

```typescript
// tests/unit/components/skill-tree/SkillTree-performance.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SkillTree } from '@/components/skill-tree/SkillTree';

describe('SkillTree performance', () => {
  it('memoizes SubconceptNode components', () => {
    const renderSpy = vi.fn();

    // First render with mock data
    const { rerender } = render(
      <SkillTree
        data={mockData}
        onNodeRender={renderSpy}
      />
    );

    const initialRenderCount = renderSpy.mock.calls.length;

    // Rerender with same data
    rerender(
      <SkillTree
        data={mockData}
        onNodeRender={renderSpy}
      />
    );

    // Should not re-render nodes if data unchanged
    expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
  });

  it('virtualizes off-screen nodes', () => {
    const { container } = render(
      <SkillTree
        data={largeData} // 65 nodes
        virtualize
      />
    );

    // Should only render visible nodes
    const nodes = container.querySelectorAll('[data-subconcept-node]');
    expect(nodes.length).toBeLessThan(65);
  });
});

const mockData = { /* ... */ };
const largeData = { /* 65 subconcepts */ };
```

---

## Task 8: Update CLAUDE.md with Phase 3 Milestone

**Files:**
- Modify: `CLAUDE.md`

**Step 8.1: Add Phase 3 milestone entry**

Add to "Completed Milestones" section:

```markdown
27. ✅ Phase 3 Gamification System - Hybrid Loop gamification with points, streaks, achievements.
   - Session Scoring: Base + quality + modifiers + streak multiplier (1.0-1.2x), 500/day cap
   - Streak System: Freeze tokens (earn every 7 days, max 2, auto-apply on missed day)
   - Contribution Graph: GitHub-style 52-week grid with intensity levels
   - Skill Tree Badges: Bronze (1d) → Silver (7d) → Gold (30d) → Platinum (90d)
   - Achievements: 18 achievements (habit/mastery/completionist), check_achievements RPC
   - Server-side computation via Supabase RPC (prevents gaming)
   - Design doc: `docs/plans/2026-01-08-phase3-gamification-design.md`
```

**Step 8.2: Update Current Status**

```markdown
**Current Status:** Phase 3 Gamification Complete - Points, streak freezes, contribution graph, badge tiers, and 18 achievements implemented. All server-side via RPC. Next: Onboarding flow, additional languages.
```

**Step 8.3: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md with Phase 3 gamification milestone

- Session scoring with streak multipliers
- Streak freezes (earn/auto-apply)
- Contribution graph
- Badge tiers (Bronze→Platinum)
- 18 achievements

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Update Obsidian Features.md

**Files:**
- Modify: `~/GoogleDrive/Obsidian Vault/SRS-app/Features.md`

**Step 9.1: Mark Phase 3 complete and add details**

Use Obsidian MCP tools to update the Features.md file with:
- Mark Gamification as complete
- Add implementation notes
- Update next steps

---

## Task 10: Update Obsidian Database-Schema.md

**Files:**
- Modify: `~/GoogleDrive/Obsidian Vault/SRS-app/Database-Schema.md`

**Step 10.1: Add new tables and columns**

Document:
- `achievement_definitions` table
- `user_achievements` table
- New columns on `profiles` (streak_freezes, last_freeze_earned_at, last_activity_date)
- New columns on `exercise_attempts` (points_earned, timezone_offset_minutes, is_correct, rating, is_first_attempt)
- RPC functions (calculate_attempt_points, update_streak, get_points_summary, get_contribution_history, check_achievements)

---

## Task 11: Record Decision in Daem0nMCP

**Step 11.1: Use context_check and remember**

```typescript
// First, check for conflicts
mcp__daem0nmcp__context_check({
  description: "Recording Phase 3 Gamification completion"
})

// Then record
mcp__daem0nmcp__remember({
  category: "decision",
  content: `Phase 3 Gamification Implementation Complete

IMPLEMENTED:
- Session scoring: 10 base + quality (0-5) + no-hint (3) + first-attempt (2) + speed (0-5)
- Streak multiplier: 1.0x (<7d), 1.1x (7d), 1.15x (14d), 1.2x (30d+)
- Daily cap: 500 points (after multiplier)
- Streak freezes: Earn every 7 days (max 2), auto-apply on missed day
- Contribution graph: 52-week GitHub-style grid, RPC aggregation
- Badge tiers: Bronze (1d), Silver (7d), Gold (30d), Platinum (90d)
- 18 achievements across habit/mastery/completionist categories

DATABASE:
- achievement_definitions: 18 seeded rows
- user_achievements: user unlocks with FK
- profiles: +streak_freezes, +last_freeze_earned_at, +last_activity_date
- exercise_attempts: +points_earned, +timezone_offset_minutes, +is_correct, +rating, +is_first_attempt

RPC FUNCTIONS:
- calculate_attempt_points: server-side points
- update_streak: freeze logic, milestone earning
- get_points_summary: today/week totals
- get_contribution_history: 52-week aggregation
- check_achievements: idempotent unlock checker

TESTS: ~250 new tests (unit, integration, E2E)`,
  rationale: "Gamification provides motivation loops for user retention"
})
```

---

## Task 12: Update Serena Memories

**Step 12.1: Update codebase_structure memory**

Add new directories and files:
- `src/lib/gamification/` (types, points, contribution, badges, achievements)
- `src/components/gamification/` (PointsAnimation, StreakFlame, AchievementCard, AchievementToast)
- New hooks (usePoints, useContributionGraph, useAchievements)
- Achievement page route

---

## Task 13: Add Repair Stats Admin Function

**Files:**
- Create: `supabase/migrations/20260108400001_repair_stats.sql`
- Test: `tests/integration/gamification/repair-stats.test.ts`

**Step 13.1: Write the failing tests**

```typescript
// tests/integration/gamification/repair-stats.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('repair_user_stats RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-repair-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;

    // Add some attempts
    await supabase.from('exercise_attempts').insert([
      { user_id: testUserId, exercise_slug: 'test-1', is_correct: true, points_earned: 15 },
      { user_id: testUserId, exercise_slug: 'test-2', is_correct: true, points_earned: 20 },
      { user_id: testUserId, exercise_slug: 'test-3', is_correct: false, points_earned: 0 },
    ]);
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  it('recalculates total_exercises_completed from attempts', async () => {
    // Corrupt the profile data
    await supabase.from('profiles').update({ total_exercises_completed: 0 }).eq('id', testUserId);

    // Repair
    const { data, error } = await supabase.rpc('repair_user_stats', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.total_exercises_completed).toBe(2); // 2 correct

    // Verify in database
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_exercises_completed')
      .eq('id', testUserId)
      .single();

    expect(profile?.total_exercises_completed).toBe(2);
  });

  it('recalculates points from attempts', async () => {
    const { data } = await supabase.rpc('repair_user_stats', {
      p_user_id: testUserId,
    });

    expect(data.total_points_recalculated).toBe(35); // 15 + 20
  });
});
```

---

## Task 14: Final E2E Test Suite

**Files:**
- Create: `tests/e2e/gamification.spec.ts`

**Step 14.1: Write comprehensive E2E tests**

```typescript
// tests/e2e/gamification.spec.ts
import { test, expect } from '@playwright/test';
import { authenticateUser } from './utils/auth';

test.describe('Gamification E2E', () => {
  test('points display after correct answer', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/practice');

    // Submit correct answer
    await page.fill('[data-testid="code-input"]', 'print("hello")');
    await page.click('[data-testid="submit-button"]');

    // Points animation should appear
    await expect(page.locator('[data-testid="points-animation"]')).toContainText('+');
  });

  test('streak displays in header', async ({ page }) => {
    await authenticateUser(page, testUserWithStreak);
    await page.goto('/dashboard');

    await expect(page.locator('[data-testid="streak-display"]')).toContainText('7');
  });

  test('contribution graph renders on dashboard', async ({ page }) => {
    await authenticateUser(page, testUserWithHistory);
    await page.goto('/dashboard');

    await expect(page.locator('[data-contribution-graph]')).toBeVisible();
  });

  test('achievement unlocks and shows toast', async ({ page }) => {
    await authenticateUser(page, newUser);
    await page.goto('/practice');

    // Complete first exercise
    await page.fill('[data-testid="code-input"]', correctAnswer);
    await page.click('[data-testid="submit-button"]');
    await page.click('[data-testid="next-button"]');

    // First Steps achievement toast
    await expect(page.locator('[data-testid="achievement-toast"]')).toContainText('First Steps');
  });

  test('achievements page shows locked and unlocked', async ({ page }) => {
    await authenticateUser(page, testUser);
    await page.goto('/achievements');

    // Should show 18 achievements
    const achievements = page.locator('[data-testid="achievement-card"]');
    await expect(achievements).toHaveCount(18);

    // Some locked, some unlocked
    await expect(page.locator('[data-achievement-locked="true"]')).toHaveCount(expect.any(Number));
    await expect(page.locator('[data-achievement-locked="false"]')).toHaveCount(expect.any(Number));
  });
});
```

---

## Task 15: Performance Benchmarks

**Files:**
- Create: `scripts/benchmark-gamification.ts`

**Step 15.1: Create benchmark script**

```typescript
// scripts/benchmark-gamification.ts
/**
 * Benchmark gamification RPC functions
 * Run: npx tsx scripts/benchmark-gamification.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function benchmark(name: string, fn: () => Promise<void>, iterations = 100) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const p95 = times.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
  const p99 = times.sort((a, b) => a - b)[Math.floor(iterations * 0.99)];

  console.log(`${name}: avg=${avg.toFixed(2)}ms p95=${p95.toFixed(2)}ms p99=${p99.toFixed(2)}ms`);
}

async function main() {
  const userId = 'test-user-id'; // Use a real test user

  console.log('Gamification RPC Benchmarks\n');

  await benchmark('calculate_attempt_points', async () => {
    await supabase.rpc('calculate_attempt_points', {
      p_user_id: userId,
      p_is_correct: true,
      p_rating: 3,
      p_used_hint: false,
      p_is_first_attempt: true,
      p_response_time_ms: 5000,
      p_subconcept_stability: 30,
    });
  });

  await benchmark('update_streak', async () => {
    await supabase.rpc('update_streak', {
      p_user_id: userId,
      p_activity_date: new Date().toISOString().split('T')[0],
    });
  });

  await benchmark('get_points_summary', async () => {
    await supabase.rpc('get_points_summary', {
      p_user_id: userId,
      p_start_date: '2026-01-01',
      p_end_date: '2026-01-08',
    });
  });

  await benchmark('get_contribution_history', async () => {
    await supabase.rpc('get_contribution_history', {
      p_user_id: userId,
      p_start_date: '2025-01-08', // Full year
      p_end_date: '2026-01-08',
    });
  });

  await benchmark('check_achievements', async () => {
    await supabase.rpc('check_achievements', {
      p_user_id: userId,
    });
  });

  console.log('\nBenchmarks complete!');
}

main().catch(console.error);
```

**Target Performance:**
- calculate_attempt_points: < 10ms avg
- update_streak: < 15ms avg
- get_points_summary: < 20ms avg
- get_contribution_history: < 50ms avg (52 weeks of data)
- check_achievements: < 30ms avg

---

## Phase 3.4 Completion Checklist

Final checklist for Phase 3:

- [ ] All 15 tasks completed
- [ ] All tests passing (`pnpm test`) - expect ~1650+ tests
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] Lint clean (`pnpm lint`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] Performance benchmarks meet targets
- [ ] CLAUDE.md updated with milestone
- [ ] Obsidian Features.md updated
- [ ] Obsidian Database-Schema.md updated
- [ ] Daem0nMCP decision recorded
- [ ] Serena memories updated
- [ ] All Phase 3.x branches merged to main

---

## Post-Phase 3 Next Steps

With gamification complete, potential next priorities:

1. **Onboarding Flow** - Integrate ExperienceLevelSelector, first-time user guide
2. **JavaScript/TypeScript Exercises** - Expand beyond Python
3. **Leaderboards** - Daily/weekly/all-time rankings (deferred from Phase 3)
4. **Social Features** - Friends, challenges (deferred from Phase 3)

---

## Related Documents

- [Master Plan](./2026-01-08-phase3-gamification-implementation.md)
- [Phase 3.3: Achievements](./2026-01-08-phase33-achievements.md)
- [Design Document](./2026-01-08-phase3-gamification-design.md)
