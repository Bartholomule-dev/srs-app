# Codebase Structure

## Root Directory
```
srs-app/
├── src/                  # Application source code
├── tests/                # Test files (unit, integration, e2e)
├── supabase/             # Supabase configuration & migrations
├── exercises/            # YAML exercise definitions
├── public/               # Static assets
├── docs/                 # Implementation plans & deployment guide
├── .github/              # GitHub Actions workflows
├── .claude/              # Claude Code settings
├── .serena/              # Serena memories
├── .daem0nmcp/           # Daem0n MCP memory store
└── .next/                # Next.js build output (generated)
```

## Source Code (`src/`)
```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with providers (Auth, Toast)
│   ├── page.tsx              # Home/auth page (client component)
│   ├── globals.css           # Tailwind imports & CSS variables
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts      # Magic link PKCE code exchange
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard with stats + practice CTA
│   ├── practice/
│   │   └── page.tsx          # Practice session flow
│   └── favicon.ico
│
├── middleware.ts             # Supabase session refresh middleware
│
├── components/               # Reusable UI components
│   ├── index.ts              # Barrel export (all components)
│   ├── ProtectedRoute.tsx    # Auth-gated route wrapper
│   ├── ErrorBoundary.tsx     # React error boundary
│   ├── Toast.tsx             # Toast notification component
│   │
│   ├── layout/               # Layout components
│   │   ├── index.ts          # Barrel export
│   │   ├── Header.tsx        # Auth header with user stats + sign out
│   │   └── LandingHeader.tsx # Simple header for landing page
│   │
│   ├── landing/              # Landing page components
│   │   ├── index.ts          # Barrel export
│   │   ├── Hero.tsx          # Hero section with tagline + CTA
│   │   ├── Features.tsx      # Feature cards grid
│   │   ├── HowItWorks.tsx    # 3-step explanation
│   │   └── AuthForm.tsx      # Magic link auth form
│   │
│   ├── exercise/             # Exercise display components
│   │   ├── index.ts          # Barrel export
│   │   ├── CodeInput.tsx     # Textarea with Enter-to-submit
│   │   ├── PredictOutputExercise.tsx # ✅ Predict code output exercise type
│   │   ├── ExercisePrompt.tsx # Language/category + prompt display
│   │   ├── HintButton.tsx    # Hint reveal with SRS penalty warning
│   │   ├── ExerciseFeedback.tsx # Correct/incorrect + next review
│   │   ├── ExerciseCard.tsx  # Orchestrator (answering → feedback) - uses gradeAnswer
│   │   ├── FillInExercise.tsx # Fill-in-the-blank exercise type
│   │   ├── TeachingCard.tsx  # Teaching card for new subconcepts (blue styling)
│   │   └── CoachingFeedback.tsx # ✅ Non-punitive coaching (Phase 2) - blue info styling
│   │
│   ├── session/              # Session flow components
│   │   ├── index.ts          # Barrel export
│   │   ├── SessionProgress.tsx # Progress bar with counter
│   │   └── SessionSummary.tsx  # End-of-session celebration + stats
│   │
│   ├── dashboard/            # Dashboard components
│   │   ├── index.ts          # Barrel export
│   │   ├── DueCardsBanner.tsx # CTA with due/new counts
│   │   ├── EmptyState.tsx    # All-caught-up / mastered-all states
│   │   ├── Greeting.tsx      # Time-based greeting ("Good morning, user!")
│   │   └── PracticeCTA.tsx   # Practice button with card counts
│   │
│   └── stats/                # Stats display components
│       ├── index.ts          # Barrel export
│       ├── StatsCard.tsx     # Individual stat with icon
│       └── StatsGrid.tsx     # Grid layout (streak, accuracy, today, total)
│
└── lib/                      # Shared libraries
    ├── context/              # React context providers
    │   ├── index.ts          # Barrel export
    │   ├── AuthContext.tsx   # Auth state provider
    │   ├── auth.types.ts     # Auth type definitions
    │   ├── ToastContext.tsx  # Toast notification provider
    │   ├── toast.types.ts    # Toast type definitions
    │   └── PyodideContext.tsx # ✅ Lazy-loaded Python execution (Phase 3)
    │
    ├── hooks/                # Custom React hooks
    │   ├── index.ts          # Barrel export
    │   ├── useAuth.ts        # Auth context consumer
    │   ├── useProfile.ts     # User profile CRUD
    │   ├── useRequireAuth.ts # Auth guard with redirect
    │   ├── useConceptSRS.ts  # Concept-based SRS scheduling
    │   ├── useConceptSession.ts # Practice session with teaching cards
    │   └── useStats.ts       # User stats fetching
    │
    ├── errors/               # Error handling utilities
    │   ├── index.ts          # Barrel export
    │   ├── AppError.ts       # Custom error class with codes
    │   └── handleSupabaseError.ts  # Supabase error mapper
    │
    ├── srs/                  # FSRS spaced repetition algorithm (migrated from SM-2)
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # CardState, DueCard, SRSConfig (legacy)
    │   ├── algorithm.ts      # Legacy SM-2 (deprecated, kept for reference)
    │   ├── exercise-selection.ts # mapFSRSStateToPhase, selectExercise
    │   ├── multi-target.ts   # getTargetsToCredit, getTargetsToPenalize
    │   └── fsrs/             # FSRS implementation
    │       ├── index.ts      # Barrel export
    │       ├── types.ts      # FSRSCardState, FSRSState, FSRSRating, STATE_MAP
    │       ├── adapter.ts    # createEmptyFSRSCard, reviewCard, progressToCardState
    │       └── mapping.ts    # qualityToRating, inferRating, isPassingRating
    │
    ├── exercise/             # Exercise evaluation library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # AnswerResult, Quality inference types, GradingResult
    │   ├── normalize.ts      # normalizePython (whitespace handling)
    │   ├── matching.ts       # checkAnswer (normalized comparison)
    │   ├── quality.ts        # inferQuality (time-based + hint penalty)
    │   ├── grading.ts        # ✅ gradeAnswer (two-pass grading orchestrator)
    │   ├── construct-check.ts # ✅ checkConstruct, checkAnyConstruct (8 patterns)
    │   ├── execution.ts      # ✅ gradeAnswerAsync (Pyodide execution)
    │   └── log-attempt.ts    # ✅ logAttempt (audit logging)
    │
    ├── curriculum/           # Curriculum data & types
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # Concept, SubconceptTeaching, SubconceptDefinition
    │   ├── loader.ts         # getSubconceptTeaching, getSubconceptDefinition
    │   └── python.json       # Curriculum graph (10 concepts, 54 subconcepts)
    │
    ├── session/              # Session management library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # SessionCard, SessionStats, TeachingSessionCard types
    │   ├── interleave.ts     # interleaveCards (spread new among due)
    │   ├── anti-repeat.ts    # selectWithAntiRepeat (pattern diversity)
    │   ├── teaching-cards.ts # buildTeachingPair (teaching + practice card pairs)
    │   └── interleave-teaching.ts # interleaveWithTeaching (insert teaching pairs)
    │
    ├── generators/           # ✅ Dynamic exercise generation (5 generators)
    │   ├── index.ts          # Registry (getGenerator, registerGenerator, hasGenerator)
    │   ├── types.ts          # Generator, GeneratorParams, TargetConstruct
    │   ├── seed.ts           # createSeed, hashString (deterministic seeding)
    │   ├── utils.ts          # seededRandom (int, pick, shuffle)
    │   ├── render.ts         # renderExercise, renderExercises (Mustache)
    │   └── definitions/      # Generator implementations
    │       ├── slice-bounds.ts      # start/end indices for slicing
    │       ├── list-values.ts       # a/b/c integers (1-99)
    │       ├── variable-names.ts    # Python identifiers
    │       ├── index-values.ts      # single index (0-4)
    │       ├── arithmetic-values.ts # x/y with precomputed results
    │       └── ... (36 total generators)
    │
    ├── stats/                # Stats calculation library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # UserStats, DailyStats types
    │   ├── queries.ts        # getCardsReviewedToday, getTotalAccuracy
    │   ├── streak.ts         # calculateCurrentStreak, calculateLongestStreak
    │   ├── updateProfile.ts  # updateProfileStats (on session end)
    │   └── dynamic-metrics.ts # ✅ Dynamic exercise metrics (Phase 4)
    │
    ├── supabase/             # Supabase client & utilities
    │   ├── index.ts          # Barrel export
    │   ├── client.ts         # Browser client (createBrowserClient from @supabase/ssr)
    │   ├── server.ts         # Server client (createServerClient with cookies)
    │   ├── helpers.ts        # DbResult helper, type guards
    │   └── mappers.ts        # snake_case → camelCase mappers
    │
    └── types/                # Type definitions
        ├── index.ts          # Barrel export
        ├── database.generated.ts  # Auto-generated from Supabase
        └── app.types.ts      # App-level types (Profile, Exercise, etc.)
```

## Tests (`tests/`)
```
tests/
├── setup.ts                  # Vitest setup, safety checks
│
├── unit/                     # Unit tests
│   ├── app/                  # App component tests
│   ├── components/           # Component tests (exercise/, session/, dashboard/, stats/)
│   ├── hooks/                # Hook tests
│   ├── errors/               # Error handling tests
│   ├── context/              # Context tests
│   ├── srs/                  # SRS algorithm tests
│   │   └── fsrs/             # FSRS-specific tests (97 tests across 7 files)
│   │       ├── adapter.test.ts       # 16 tests - adapter functions
│   │       ├── mapping.test.ts       # 18 tests - quality→rating + boundary tests
│   │       ├── regression.test.ts    # 12 tests - pinned values for upgrades
│   │       ├── invariants.test.ts    # 14 tests - property-based tests
│   │       ├── edge-cases.test.ts    # 17 tests - corrupted data handling
│   │       ├── tsfsrs-contract.test.ts # 3 tests - ts-fsrs behavior docs
│   │       └── integration.test.ts   # 6 tests - cross-module flows
│   ├── exercise/             # Exercise library tests
│   ├── generators/           # Generator tests (59 tests)
│   │   ├── types.test.ts     # Type definitions tests
│   │   ├── seed.test.ts      # Seed generation tests
│   │   ├── utils.test.ts     # Seeded random utility tests
│   │   ├── slice-bounds.test.ts # slice-bounds generator + property tests
│   │   └── render.test.ts    # Render pipeline tests
│   ├── session/              # Session library tests
│   ├── stats/                # Stats library tests
│   └── helpers.test.ts       # Supabase helper tests
│
├── integration/              # Integration tests
│   ├── migrations/           # Database migration tests
│   ├── hooks/                # Hook integration tests
│   ├── srs/                  # SRS flow tests
│   │   └── fsrs-flow.test.ts # 11 tests - DB round-trip, field preservation
│   ├── rls/                  # Row-level security tests
│   ├── session/              # Session integration tests
│   └── seed/                 # Seed data tests
│
└── e2e/                      # Playwright E2E tests
    ├── critical-path.spec.ts # Login → Dashboard → Practice → Submit → Feedback
    ├── fsrs-integration.spec.ts # FSRS hard assertions (4 tests - progress, reps, attempts, scheduling)
    ├── full-session.spec.ts  # Complete session E2E
    ├── learning-mode.spec.ts # Teaching cards E2E
    └── utils/
        ├── auth.ts           # Test user create/delete via admin API
        └── index.ts          # Barrel export
```

## GitHub Actions (`.github/`)
```
.github/
└── workflows/
    ├── ci.yml                # Unit tests, typecheck, lint on PR
    └── e2e.yml               # Playwright E2E on Vercel deployment
```

## Supabase (`supabase/`)
```
supabase/
├── config.toml               # Local Supabase configuration
├── migrations/               # Database migrations (SQL)
│   └── 20260103100001_auto_generate_username.sql  # Username auto-gen trigger
└── seed.sql                  # Seed data (references YAML import)
```

## Exercises (`exercises/`)
```
exercises/
└── python/                   # Python exercises (355 total, 23 dynamic, restructured to match curriculum graph)
    ├── foundations.yaml      # variables, operators, expressions, io (4 subconcepts)
    ├── strings.yaml          # basics, indexing, slicing, methods, fstrings (5 subconcepts)
    ├── numbers-booleans.yaml # integers, floats, booleans, conversion, truthiness, comparisons (6 subconcepts)
    ├── collections.yaml      # lists, tuples, dictionaries, sets, mutability (5 subconcepts)
    ├── control-flow.yaml     # if, for, while, range, enumerate, zip, etc. (11 subconcepts)
    ├── functions.yaml        # defining, parameters, returns, scope, lambda, etc. (9 subconcepts)
    ├── comprehensions.yaml   # list, dict, set, generator, nested (5 subconcepts)
    ├── error-handling.yaml   # try-except, finally, raising, custom (4 subconcepts)
    ├── oop.yaml              # classes, methods, dunder, inheritance, etc. (6 subconcepts)
    └── modules-files.yaml    # importing, packages, reading, writing, etc. (6 subconcepts)

Exercise types: write (53%), fill-in (14%), predict (17%), dynamic (16%)

**Validation Commands:**
- `pnpm validate:exercises` - Schema validation (Ajv against schema.json)
- `pnpm validate:curriculum` - Curriculum consistency validation
- `pnpm validate:dynamic` - Dynamic exercise rendering validation
- `pnpm validate:all` - Run all validations
```

## Key Configuration Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `vitest.config.ts` | Vitest test configuration |
| `playwright.config.ts` | Playwright E2E config |
| `vercel.json` | Vercel deployment config |
| `CLAUDE.md` | Claude Code project context |
| `docs/DEPLOYMENT.md` | Deployment guide |
| `.env.local` | Environment variables (not committed) |

## Import Conventions
- Use barrel exports for cleaner imports: `from '@/lib/srs'`
- Direct imports acceptable for specific items: `from '@/lib/supabase/client'`
- Types use barrel exports: `from '@/lib/types'`
- Components use barrel exports: `from '@/components'`
