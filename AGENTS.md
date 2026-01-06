# SRS-App Agent Guidelines

## What This Is

A spaced repetition platform for practicing code syntax. Users get short practice sessions with Python exercises, tracked via SM-2 algorithm at the **subconcept** level (not individual exercises).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vitest + Playwright

**Current State:** Learning Mode complete. 218 exercises across 54 subconcepts. Teaching cards introduce new concepts before practice.

---

## Project Structure

```
src/
├── app/                    # Next.js pages (/, /dashboard, /practice)
├── components/
│   ├── ui/                 # Custom UI components (Button, Card, Input, etc.)
│   ├── exercise/           # ExerciseCard, CodeInput, FillInExercise, TeachingCard
│   ├── session/            # SessionProgress, SessionSummary
│   └── dashboard/          # Greeting, PracticeCTA, StatsGrid
└── lib/
    ├── hooks/              # useAuth, useProfile, useConceptSRS, useConceptSession, useStats
    ├── srs/                # SM-2 algorithm, concept-based scheduling
    ├── curriculum/         # python.json (10 concepts, 54 subconcepts), loader
    ├── session/            # Card interleaving, teaching pairs, anti-repeat
    ├── exercise/           # Answer normalization, matching, quality inference
    └── supabase/           # Client, server, mappers (snake_case → camelCase)

exercises/python/           # YAML exercise definitions (218 total)
tests/                      # unit/, integration/, e2e/
supabase/migrations/        # Database schema
```

---

## Commands

```bash
pnpm dev                    # Dev server at localhost:3000
pnpm build                  # Production build
pnpm lint && pnpm typecheck # Code quality
pnpm test                   # Vitest (696 tests)
pnpm test:e2e               # Playwright E2E
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
| `profiles` | User data, stats (streak, accuracy) |
| `exercises` | Content with taxonomy (concept, subconcept, level, type) |
| `subconcept_progress` | SRS state per subconcept (ease_factor, interval, next_review) |
| `exercise_attempts` | Usage tracking for selection algorithm |

RLS enabled on all user tables. Use `auth.uid()` for user scoping.

### Exercise Taxonomy
Every exercise has: `concept`, `subconcept`, `level` (intro/practice/edge/integrated), `type` (write/fill-in), `pattern`, `objective`.

### Session Flow
1. `useConceptSession` fetches due subconcepts + selects exercises
2. Teaching cards shown once per new subconcept (then practice card)
3. Results update `subconcept_progress` via SM-2 algorithm
4. Session ends with summary + stats update

---

## Coding Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Path alias: `@/*` → `src/*`
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Components: PascalCase. Files: kebab-case. DB columns: snake_case (mapped to camelCase)

---

## Testing

- **Unit/Integration:** Vitest in `tests/unit/`, `tests/integration/`
- **E2E:** Playwright in `tests/e2e/`
- Run `pnpm test:run` before commits

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
