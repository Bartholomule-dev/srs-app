# Phase 3: Gamification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Hybrid Loop gamification system as designed in `docs/plans/2026-01-08-phase3-gamification-design.md`

**Architecture:** Server-side RPC functions compute points, streaks, and achievements to prevent gaming. Client-side hooks fetch and display data. Follows existing patterns (useStats, useSkillTree, supabase/migrations/).

**Tech Stack:** TypeScript, Supabase (PostgreSQL RPC functions), React hooks, Vitest, Playwright

**TDD Approach:** Write failing tests first, then implement, then verify. Each task is small (~2-5 min).

---

## Overview

This master document links to the 4 phase-specific implementation plans:

1. **Phase 3.1: Foundation** - Points, streaks, freezes, database schema
2. **Phase 3.2: Visualization** - Contribution graph, skill tree badges
3. **Phase 3.3: Achievements** - Achievement engine, achievements page
4. **Phase 3.4: Polish** - Animations, mobile, tuning

Each phase can be implemented independently and merged before starting the next.

---

## Pre-Implementation Checklist

Before starting any phase:

1. [ ] Run `pnpm test` - all 1368+ tests pass
2. [ ] Run `pnpm typecheck` - no errors
3. [ ] Run `pnpm lint` - no errors
4. [ ] Create feature branch: `git checkout -b feat/phase3-gamification`

---

## Phase Documents

### [Phase 3.1: Foundation](./2026-01-08-phase31-foundation.md)
- Database migrations (new tables, columns, RPC functions)
- Points calculation RPC
- Streak RPC with freeze logic
- `usePoints` hook
- `useStreak` hook (enhanced)
- Points display in session + dashboard
- ~35 tasks, ~150 tests expected

### [Phase 3.2: Visualization](./2026-01-08-phase32-visualization.md)
- Contribution graph RPC
- `useContributionGraph` hook
- `ContributionGraph` component
- Skill tree badge tiers (Bronze/Silver/Gold/Platinum)
- Badge tier animations + celebrations
- ~25 tasks, ~80 tests expected

### [Phase 3.3: Achievements](./2026-01-08-phase33-achievements.md)
- Achievement definitions seed
- Achievement check RPC
- `useAchievements` hook
- `AchievementCard` + `AchievementToast` components
- Achievements page
- Dashboard "Recent achievements" section
- ~30 tasks, ~100 tests expected

### [Phase 3.4: Polish](./2026-01-08-phase34-polish.md)
- Micro-interactions and animations
- Mobile responsiveness
- Performance optimizations
- Documentation updates
- ~15 tasks, ~30 tests expected

---

## Testing Strategy

### Unit Tests (Vitest)
- RPC function mocking with `vi.mock('@/lib/supabase/client')`
- Hook tests with `@testing-library/react-hooks`
- Component tests with `@testing-library/react`
- Follow existing patterns in `tests/unit/`

### Integration Tests (Vitest)
- Database migrations tested against local Supabase
- RLS policies verified
- RPC function behavior with real data
- Follow patterns in `tests/integration/`

### E2E Tests (Playwright)
- Session points flow
- Streak display
- Achievement unlock flow
- Follow patterns in `tests/e2e/`

---

## Documentation Updates

After each phase:

1. [ ] Update `CLAUDE.md` milestones section
2. [ ] Update Obsidian `SRS-app/Features.md`
3. [ ] Update Serena memories if structure changed
4. [ ] Record decision in Daem0nMCP

---

## Commit Strategy

- Commit after each passing test + implementation
- Use conventional commits: `feat:`, `test:`, `fix:`
- Co-author: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`

---

## Related Documents

- [Phase 3 Design](./2026-01-08-phase3-gamification-design.md) - Full design specification
- [Skill Tree Design](./2026-01-07-skill-tree-progress-design.md) - Existing skill tree
- [Database Schema](Obsidian: SRS-app/Database-Schema.md) - Current schema

