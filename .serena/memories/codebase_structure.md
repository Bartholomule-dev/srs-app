# Codebase Structure

## Root Directory
```
srs-app/
├── src/                  # Application source code
├── tests/                # Test files
├── supabase/             # Supabase configuration & migrations
├── exercises/            # YAML exercise definitions (planned)
├── public/               # Static assets
├── docs/                 # Implementation plans
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
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard with stats + practice CTA
│   ├── practice/
│   │   └── page.tsx          # Practice session flow
│   └── favicon.ico
│
├── components/               # Reusable UI components
│   ├── index.ts              # Barrel export (all components)
│   ├── ProtectedRoute.tsx    # Auth-gated route wrapper
│   ├── ErrorBoundary.tsx     # React error boundary
│   ├── Toast.tsx             # Toast notification component
│   │
│   ├── exercise/             # Exercise display components
│   │   ├── index.ts          # Barrel export
│   │   ├── CodeInput.tsx     # Textarea with Enter-to-submit
│   │   ├── ExercisePrompt.tsx # Language/category + prompt display
│   │   ├── HintButton.tsx    # Hint reveal with SRS penalty warning
│   │   ├── ExerciseFeedback.tsx # Correct/incorrect + next review
│   │   └── ExerciseCard.tsx  # Orchestrator (answering → feedback)
│   │
│   ├── session/              # Session flow components
│   │   ├── index.ts          # Barrel export
│   │   ├── SessionProgress.tsx # Progress bar with counter
│   │   └── SessionSummary.tsx  # End-of-session stats
│   │
│   └── dashboard/            # Dashboard components
│       ├── index.ts          # Barrel export
│       ├── DueCardsBanner.tsx # CTA with due/new counts
│       └── EmptyState.tsx    # All-caught-up / mastered-all states
│
└── lib/                      # Shared libraries
    ├── context/              # React context providers
    │   ├── index.ts          # Barrel export
    │   ├── AuthContext.tsx   # Auth state provider
    │   ├── auth.types.ts     # Auth type definitions
    │   ├── ToastContext.tsx  # Toast notification provider
    │   └── toast.types.ts    # Toast type definitions
    │
    ├── hooks/                # Custom React hooks
    │   ├── index.ts          # Barrel export
    │   ├── useAuth.ts        # Auth context consumer
    │   ├── useProfile.ts     # User profile CRUD
    │   ├── useRequireAuth.ts # Auth guard with redirect
    │   ├── useSRS.ts         # SRS session management (due cards)
    │   └── useSession.ts     # Practice session state
    │
    ├── errors/               # Error handling utilities
    │   ├── index.ts          # Barrel export
    │   ├── AppError.ts       # Custom error class with codes
    │   └── handleSupabaseError.ts  # Supabase error mapper
    │
    ├── srs/                  # SM-2 spaced repetition algorithm
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # CardState, DueCard, SRSConfig
    │   └── algorithm.ts      # calculateNextReview, getDueCards, getNewCards
    │
    ├── exercise/             # Exercise evaluation library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # AnswerResult, Quality inference types
    │   ├── normalize.ts      # normalizePython (whitespace handling)
    │   ├── matching.ts       # checkAnswer (normalized comparison)
    │   └── quality.ts        # inferQuality (time-based + hint penalty)
    │
    ├── session/              # Session management library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # SessionCard, SessionStats types
    │   └── interleave.ts     # interleaveCards (spread new among due)
    │
    ├── supabase/             # Supabase client & utilities
    │   ├── index.ts          # Barrel export
    │   ├── client.ts         # Supabase client initialization
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
├── example.spec.ts           # Playwright E2E example
│
├── unit/
│   ├── app/                  # App component tests
│   │   ├── page.test.tsx
│   │   └── layout.test.tsx
│   ├── components/           # Component tests
│   │   ├── ProtectedRoute.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   ├── Toast.test.tsx
│   │   ├── exercise/         # Exercise component tests
│   │   │   ├── CodeInput.test.tsx
│   │   │   ├── ExercisePrompt.test.tsx
│   │   │   ├── HintButton.test.tsx
│   │   │   ├── ExerciseFeedback.test.tsx
│   │   │   └── ExerciseCard.test.tsx
│   │   ├── session/          # Session component tests
│   │   │   ├── SessionProgress.test.tsx
│   │   │   └── SessionSummary.test.tsx
│   │   └── dashboard/        # Dashboard component tests
│   │       ├── DueCardsBanner.test.tsx
│   │       └── EmptyState.test.tsx
│   ├── hooks/                # Hook tests
│   │   ├── useAuth.test.tsx
│   │   ├── useProfile.test.tsx
│   │   ├── useRequireAuth.test.tsx
│   │   ├── useSRS.test.tsx
│   │   └── useSession.test.tsx
│   ├── errors/               # Error handling tests
│   │   ├── AppError.test.ts
│   │   └── handleSupabaseError.test.ts
│   ├── context/              # Context tests
│   │   └── auth.types.test.ts
│   ├── srs/                  # SRS algorithm tests
│   │   ├── algorithm.test.ts
│   │   ├── types.test.ts
│   │   └── mappers.test.ts
│   ├── exercise/             # Exercise library tests
│   │   ├── normalize.test.ts
│   │   ├── matching.test.ts
│   │   └── quality.test.ts
│   ├── session/              # Session library tests
│   │   └── interleave.test.ts
│   └── helpers.test.ts       # Supabase helper tests
│
└── integration/
    ├── migrations/           # Database migration tests
    │   ├── profiles.test.ts
    │   ├── exercises.test.ts
    │   └── user-progress.test.ts
    ├── hooks/                # Hook integration tests
    │   └── profile-creation.test.ts
    ├── srs/                  # SRS flow tests
    │   └── srs-flow.test.ts
    ├── rls/                  # Row-level security tests
    │   ├── test-utils.ts
    │   ├── profiles-rls.test.ts
    │   └── user-progress-rls.test.ts
    ├── session/              # Session integration tests
    │   └── session-flow.test.ts
    └── seed/
        └── exercises-seed.test.ts
```

## Supabase (`supabase/`)
```
supabase/
├── config.toml               # Local Supabase configuration
├── migrations/               # Database migrations (SQL)
└── seed.sql                  # Seed data (references YAML import)
```

## Key Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `vitest.config.ts` | Vitest test configuration |
| `playwright.config.ts` | Playwright E2E config |
| `CLAUDE.md` | Claude Code project context |
| `.env.local` | Environment variables (not committed) |

## Import Conventions
- Use barrel exports for cleaner imports: `from '@/lib/srs'`
- Direct imports acceptable for specific items: `from '@/lib/supabase/client'`
- Types use barrel exports: `from '@/lib/types'`
- Components use barrel exports: `from '@/components'`
