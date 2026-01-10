# SRS-App Agent Guidelines

## What This Is

A spaced repetition platform for practicing code syntax. Users get short practice sessions with Python exercises, tracked via FSRS algorithm at the **subconcept** level (not individual exercises).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vitest + Playwright

**Current State:** Blueprint + Skin System complete. 529 exercises (109 dynamic with 38 generators) across 65 subconcepts. Phase 3 Gamification complete (points, streaks, achievements, skill tree). 15 blueprints (234 beats), 22 skins.

---

## Project Structure

```
src/
├── app/                    # Next.js pages (/, /dashboard, /practice)
├── components/
│   ├── ui/                 # Custom UI components (Button, Card, Input, etc.)
│   ├── exercise/           # ExerciseCard, CodeInput, FillInExercise, PredictOutputExercise, TeachingCard, CoachingFeedback, BeatHeader, ContextHint
│   ├── session/            # SessionProgress, SessionSummary
│   ├── dashboard/          # Greeting, PracticeCTA, StatsGrid
│   ├── gamification/       # PointsAnimation, StreakFlame, AchievementCard
│   ├── stats/              # StatsCard, StatsGrid, ContributionGraph
│   └── skill-tree/         # SkillTree, ConceptCluster, SubconceptNode
└── lib/
    ├── hooks/              # useAuth, useProfile, useConceptSRS, useConceptSession, useStats, usePathContext
    ├── srs/                # FSRS algorithm (ts-fsrs adapter), concept-based scheduling
    ├── curriculum/         # python.json (11 concepts, 65 subconcepts), loader
    ├── session/            # Card interleaving, teaching pairs, anti-repeat
    ├── exercise/           # Answer normalization, matching, two-pass grading, construct detection
    ├── generators/         # Dynamic exercise generation (38 generators)
    ├── paths/              # Blueprint + Skin system (loader, grouping, apply-skin)
    ├── gamification/       # Points, badges, achievements, contribution graph
    ├── context/            # AuthContext, ToastContext, PyodideContext
    ├── stats/              # Stats queries, streak calculation, dynamic metrics
    └── supabase/           # Client, server, mappers (snake_case → camelCase)

exercises/python/           # YAML exercise definitions (529 total, 109 dynamic)
paths/python/               # Blueprints (15) and Skins (22) YAML files
tests/                      # unit/, integration/, e2e/
supabase/migrations/        # Database schema
```

---

## Commands

```bash
pnpm dev                    # Dev server at localhost:3000
pnpm build                  # Production build
pnpm lint && pnpm typecheck # Code quality
pnpm test                   # Vitest (2219 tests)
pnpm test:e2e               # Playwright E2E
pnpm validate:exercises     # Validate exercise YAML
pnpm validate:dynamic       # Validate dynamic exercises
pnpm validate:paths         # Validate blueprints/skins
pnpm generate:exercise-list # Generate Obsidian docs
pnpm db:start               # Local Supabase
pnpm db:reset               # Reset + migrate
```

---

## Key Patterns

### Authentication
Magic Link (passwordless) via Supabase. Auth state in `AuthContext`. Protected routes use `useRequireAuth()`.

### Styling
Tailwind CSS 4 with CSS variables in `globals.css`. Use `cn()` from `@/lib/utils` for class merging. Import UI components from `@/components/ui`.

### Database Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User data, stats (streak, accuracy), experience_level, recent_skins |
| `exercises` | Content with taxonomy (concept, subconcept, level, type, generator) |
| `subconcept_progress` | FSRS state per subconcept (stability, difficulty, fsrs_state) |
| `exercise_attempts` | Usage tracking, points_earned, rating |
| `user_achievements` | Unlocked achievements |

RLS enabled on all user tables. Use `auth.uid()` for user scoping.

### Exercise Taxonomy
Every exercise has: `concept`, `subconcept`, `level` (intro/practice/edge/integrated), `type` (write/fill-in/predict), `pattern`, `objective`.

Dynamic exercises additionally have: `generator`, `target_construct`, `verify_by_execution`.

### Exercise Types
| Type | Component | Description |
|------|-----------|-------------|
| `write` | `CodeInput` | Write code from scratch (319) |
| `fill-in` | `FillInExercise` | Complete blanks in template (71) |
| `predict` | `PredictOutputExercise` | Predict code output (139) |

### Dynamic Exercise System
- **38 generators:** Parameterize exercises with deterministic seeding
- **Two-pass grading:** Pass 1 (correctness) + Pass 2 (construct coaching)
- **Construct patterns:** slice, comprehension, f-string, ternary, enumerate, zip, lambda, generator-expr
- **Pyodide:** Lazy-loaded Python execution for predict exercises

### Blueprint + Skin System
- **Blueprints:** Ordered sequences of exercises (15 blueprints, 234 beats)
- **Skins:** Domain theming with variable substitution (22 skins)
- **BeatHeader:** Shows progress ("Beat 3 of 20: Create storage")
- **ContextHint:** Shows skin-specific context per exercise

### Gamification
- **Points:** Per-answer scoring with streak multiplier
- **Streaks:** Daily tracking with freeze tokens
- **Badges:** Bronze → Silver → Gold → Platinum based on FSRS stability
- **Achievements:** 18 achievements across habit, mastery, completionist categories
- **Contribution Graph:** GitHub-style 52-week activity display

### Session Flow
1. `useConceptSession` fetches due subconcepts + selects exercises
2. Teaching cards shown once per new subconcept (then practice card)
3. Dynamic exercises rendered with user-specific parameters
4. Two-pass grading: correctness check, then optional construct coaching
5. Results update `subconcept_progress` via FSRS algorithm
6. Points awarded, achievements checked
7. Session ends with summary + stats update

---

## Coding Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Path alias: `@/*` → `src/*`
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Components: PascalCase. Files: kebab-case. DB columns: snake_case (mapped to camelCase)

---

## Testing

- **Unit/Integration:** Vitest in `tests/unit/`, `tests/integration/` (2219 tests)
- **E2E:** Playwright in `tests/e2e/`
- **Property-based:** fast-check for generators (38 generators × 1000 seeds)
- Run `pnpm test:run` before commits

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
