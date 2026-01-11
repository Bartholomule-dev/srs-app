# SRS-App - Gemini Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## Documentation & Source of Truth

**Obsidian Vault** (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) is the primary source of truth.
- `Index.md` - Project hub
- `Architecture.md` - System design & SRS algorithm
- `Features.md` - Roadmap
- `Database-Schema.md` - PostgreSQL schema & RLS

**Post-task actions:** Update Obsidian docs, Serena memories, and this file if significant changes occurred.

---

## Project Overview

A gamified web platform for practicing code syntax through spaced repetition. Target users are AI-assisted developers who want to maintain their programming fundamentals.

**Current Status:** Multi-Language Infrastructure Complete - 529 Python exercises (109 dynamic with 38 generators), JavaScript curriculum stub ready, 15 blueprints (234 beats), 22 skins. Phase 3 Gamification complete (points, streaks, achievements, skill tree). Per-language progress tracking. Next: JavaScript exercises, then onboarding flow.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (Strict Mode) |
| UI | React 19, Tailwind CSS 4, framer-motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Testing | Vitest (2219 unit/integration) + Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

---

## Essential Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests (2219 tests)
pnpm test:e2e         # Run Playwright E2E tests
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML

# Exercise Management
pnpm validate:exercises    # Validate YAML against schema
pnpm validate:dynamic      # Validate dynamic exercises
pnpm validate:curriculum   # Validate against curriculum definition
pnpm validate:all          # Run all validations
pnpm generate:exercise-list           # Generate docs/EXERCISES.md from YAML
pnpm generate:exercise-list:obsidian  # Also generate to Obsidian vault
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout (AuthProvider, ToastProvider)
│   ├── page.tsx          # Home/auth page
│   ├── auth/callback/route.ts  # Magic link PKCE code exchange
│   ├── dashboard/page.tsx # Dashboard with stats + skill tree
│   └── practice/page.tsx  # Practice session flow
├── middleware.ts         # Supabase session refresh
├── components/
│   ├── ui/               # Custom UI components (Button, Card, Input, etc.)
│   ├── layout/           # Header, LandingHeader
│   ├── landing/          # Hero, Features, HowItWorks, AuthForm
│   ├── exercise/         # ExerciseCard, CodeInput, FillInExercise, TeachingCard, CoachingFeedback
│   ├── session/          # SessionProgress, SessionSummary (immersive mode)
│   ├── dashboard/        # Greeting, PracticeCTA, DueCardsBanner, SkillTree
│   └── stats/            # StatsCard, StatsGrid
└── lib/
    ├── hooks/            # useAuth, useProfile, useActiveLanguage, useConceptSRS(lang), useConceptSession(lang), useSkillTree(lang), useLanguageStats(lang), useStats
    ├── srs/              # FSRS algorithm (ts-fsrs adapter)
    ├── exercise/         # Answer matching, quality inference, two-pass grading, construct detection
    ├── session/          # Session types, interleaving, teaching cards, anti-repeat
    ├── curriculum/       # python.json, javascript.json (stub), multi-language loader
    ├── generators/       # Dynamic exercise generation (13 generators)
    ├── context/          # PyodideContext for Python execution
    ├── stats/            # Stats queries, streak calculation, dynamic metrics
    ├── errors/           # AppError, handleSupabaseError
    ├── supabase/         # Client (browser), server, helpers, mappers
    └── utils.ts          # cn() class utility

tests/
├── unit/                 # Vitest unit tests
├── integration/          # Vitest integration tests
└── e2e/                  # Playwright E2E tests

exercises/python/         # 352 exercises across 10 YAML files (source of truth)
```

---

## Key Patterns & Guidelines

### 1. UI & Components
- Use custom UI components via `@/components/ui/`.
- Use the `cn()` utility from `@/lib/utils` for Tailwind class merging.
- **Theme:** Dark mode is the default. Use CSS variables from `globals.css` (e.g., `--bg-base`, `--accent-primary`).
- **Elevation:** Use the `elevation` prop (1, 2, 3) on `Card` components.
- **Fonts:** `font-display` (Space Grotesk), `font-body` (DM Sans), `font-mono` (JetBrains Mono)

### 2. TypeScript & Data
- **Strict mode is non-negotiable.** No `any`.
- Database schema: `snake_case` in DB, `camelCase` in app. Use mappers in `src/lib/supabase/mappers.ts`.
- Generated DB types: `src/lib/types/database.generated.ts`.

### 3. Authentication
- Supabase Magic Link with PKCE.
- SSR supported via `@supabase/ssr`.
- State managed via `useAuth` hook.

### 4. Spaced Repetition (SRS)
- **Algorithm: FSRS** (Free Spaced Repetition Scheduler) via ts-fsrs library.
- Concept-based SRS: Tracking subconcept mastery rather than individual exercises.
- Multi-target support: Integrated exercises credit multiple subconcepts on success.
- Stability threshold: >=7 days = mastered (used for skill tree visualization).

### 5. Exercise System
**Types:**
- `write` (221): Write code from scratch
- `fill-in` (58): Complete blanks in template
- `predict` (73): Predict code output

**Dynamic Exercises (37):** Values change per user/day via generators:
- slice-bounds, list-values, variable-names, index-values, arithmetic-values
- loop-simulation, comparison-logic, string-ops, dict-values
- comp-mapping, comp-filter, try-except-flow, oop-instance

**Taxonomy Fields:**
- `concept`, `subconcept`, `level` (intro→practice→edge→integrated)
- `prereqs`, `type`, `pattern`, `objective`, `targets`

### 6. Coding Style
- **Files:** `kebab-case`
- **Components:** `PascalCase`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Path alias:** `@/*` maps to `src/*`

---

## Database Schema

Key tables:
- `profiles` - User data with auto-generated username, stats, preferred_language
- `exercises` - Exercise content with slug-based identity (529 Python exercises)
- `subconcept_progress` - FSRS state per subconcept with **language column** (unique: user_id, language, subconcept_slug)
- `exercise_attempts` - Exercise usage tracking with **language column** (unique: user_id, language, exercise_slug)

RLS enabled on all user tables. Progress tracked independently per language.

---

## Gemini-Specific Tips

- **Parallelism:** Use parallel tool calls for searching and reading files to speed up context gathering.
- **Verification:** Always run `pnpm typecheck` and `pnpm test` after modifications.
- **Knowledge Retrieval:** Use `grep` or search to find existing patterns before implementing new ones.
- **Exercise Workflow:** Edit YAML in `exercises/python/`, run `pnpm validate:all`, then `pnpm generate:exercise-list:obsidian`.
- **Context:** Check `docs/plans/` for design documents on major features.

---

## Completed Milestones

1. Database & Types - Migrations, RLS, auto-generated types
2. Auth & Hooks - Magic Link, useAuth, useProfile
3. SRS Engine - SM-2 algorithm (later migrated to FSRS)
4. Exercise Engine - CodeInput, ExerciseCard, answer matching
5. Practice Session - useSession, /dashboard, /practice pages
6. Exercise Library - 50 Python exercises (expanded to 529)
7. Basic Stats - StatsGrid, useStats, streak/accuracy
8. MVP Deployment - Vercel, GitHub Actions CI/E2E, Playwright
9. UI/UX Redesign - "IDE-Inspired Premium" aesthetic
10. Custom UI Components - Premium Tailwind components with framer-motion
11. Theme System - CSS variables, cn() utility, CodeEditor, Card elevation
12. Phase 2 Curriculum System - Concept-based SRS, taxonomy fields
13. Phase 2.5 Curriculum Enhancement - objective/targets fields, anti-repeat pattern
14. Learning Mode - Teaching cards with dedicated exampleCode
15. Phase 2.7 Exercise Variety - Three exercise types, experience levels
16. Curriculum Restructure - 10 files matching curriculum graph
17. SM-2 to FSRS Migration - ts-fsrs adapter, validateFsrsState guard
18. Dedicated Teaching Examples - exampleCode field for all 54 subconcepts
19. Dynamic Exercises Phase 1-6 - Generator infrastructure, 38 generators, 109 dynamic exercises
20. Exercise-List.md Auto-Generation - YAML source of truth, generated docs
21. Skill Tree Visualization - 65 subconcept nodes, 4 states, dependency lines
22. Phase 3 Gamification - Points, streaks, achievements, contribution graph
23. Blueprint + Skin System - 15 blueprints (234 beats), 22 skins
24. Multi-Language Infrastructure - Language-aware loaders, hooks, UI, JavaScript stub

---

## Next Steps

1. **JavaScript Exercises:** Create content for JavaScript curriculum
2. **JavaScript Blueprints/Skins:** Presentation layer for JavaScript
3. **Onboarding:** Integrate ExperienceLevelSelector into user flow
4. **Leaderboards:** Daily/weekly/all-time rankings (deferred from Phase 3)
