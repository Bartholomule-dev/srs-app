# SRS-App Agent Guidelines

## What This Is

A spaced repetition platform for practicing code syntax. Users get short practice sessions with Python exercises, tracked via FSRS algorithm at the **subconcept** level (not individual exercises).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vitest + Playwright

**Current State:** Dynamic Exercise System complete (all 5 phases). 355 exercises across 54 subconcepts. Three exercise types (write/fill-in/predict). Teaching cards introduce new concepts. Two-pass grading with construct coaching.

---

## Project Structure

```
src/
├── app/                    # Next.js pages (/, /dashboard, /practice)
├── components/
│   ├── ui/                 # Custom UI components (Button, Card, Input, etc.)
│   ├── exercise/           # ExerciseCard, CodeInput, FillInExercise, PredictOutputExercise, TeachingCard, CoachingFeedback
│   ├── session/            # SessionProgress, SessionSummary
│   └── dashboard/          # Greeting, PracticeCTA, StatsGrid
└── lib/
    ├── hooks/              # useAuth, useProfile, useConceptSRS, useConceptSession, useStats
    ├── srs/                # FSRS algorithm (ts-fsrs adapter), concept-based scheduling
    ├── curriculum/         # python.json (10 concepts, 54 subconcepts), loader
    ├── session/            # Card interleaving, teaching pairs, anti-repeat
    ├── exercise/           # Answer normalization, matching, two-pass grading, construct detection
    ├── generators/         # Dynamic exercise generation (5 generators)
    ├── context/            # AuthContext, ToastContext, PyodideContext
    ├── stats/              # Stats queries, streak calculation, dynamic metrics
    └── supabase/           # Client, server, mappers (snake_case → camelCase)

exercises/python/           # YAML exercise definitions (355 total, 23 dynamic)
tests/                      # unit/, integration/, e2e/
supabase/migrations/        # Database schema
```

---

## Commands

```bash
pnpm dev                    # Dev server at localhost:3000
pnpm build                  # Production build
pnpm lint && pnpm typecheck # Code quality
pnpm test                   # Vitest (1088 tests)
pnpm test:e2e               # Playwright E2E
pnpm validate:dynamic       # Validate dynamic exercises
pnpm db:start               # Local Supabase
pnpm db:reset               # Reset + migrate
pnpm db:import-exercises    # Import YAML → database
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
| `profiles` | User data, stats (streak, accuracy), experience_level |
| `exercises` | Content with taxonomy (concept, subconcept, level, type, generator) |
| `subconcept_progress` | FSRS state per subconcept (stability, difficulty, fsrs_state) |
| `exercise_attempts` | Usage tracking for selection algorithm |

RLS enabled on all user tables. Use `auth.uid()` for user scoping.

### Exercise Taxonomy
Every exercise has: `concept`, `subconcept`, `level` (intro/practice/edge/integrated), `type` (write/fill-in/predict), `pattern`, `objective`.

Dynamic exercises additionally have: `generator`, `target_construct`, `verify_by_execution`.

### Exercise Types
| Type | Component | Description |
|------|-----------|-------------|
| `write` | `CodeInput` | Write code from scratch |
| `fill-in` | `FillInExercise` | Complete blanks in template |
| `predict` | `PredictOutputExercise` | Predict code output |

### Dynamic Exercise System
- **Generators:** Parameterize exercises with deterministic seeding
- **Two-pass grading:** Pass 1 (correctness) + Pass 2 (construct coaching)
- **8 construct patterns:** slice, comprehension, f-string, ternary, enumerate, zip, lambda, generator-expr
- **Pyodide:** Lazy-loaded Python execution for predict exercises
- **5 generators:** slice-bounds, list-values, variable-names, index-values, arithmetic-values

### Session Flow
1. `useConceptSession` fetches due subconcepts + selects exercises
2. Teaching cards shown once per new subconcept (then practice card)
3. Dynamic exercises rendered with user-specific parameters
4. Two-pass grading: correctness check, then optional construct coaching
5. Results update `subconcept_progress` via FSRS algorithm
6. Session ends with summary + stats update

---

## Coding Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Path alias: `@/*` → `src/*`
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Components: PascalCase. Files: kebab-case. DB columns: snake_case (mapped to camelCase)

---

## Testing

- **Unit/Integration:** Vitest in `tests/unit/`, `tests/integration/` (1088 tests)
- **E2E:** Playwright in `tests/e2e/`
- **Property-based:** fast-check for generators (5 tests × 1000 seeds)
- Run `pnpm test:run` before commits

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
