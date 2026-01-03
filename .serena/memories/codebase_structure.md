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
│   │   ├── ExercisePrompt.tsx # Language/category + prompt display
│   │   ├── HintButton.tsx    # Hint reveal with SRS penalty warning
│   │   ├── ExerciseFeedback.tsx # Correct/incorrect + next review
│   │   └── ExerciseCard.tsx  # Orchestrator (answering → feedback)
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
    │   └── toast.types.ts    # Toast type definitions
    │
    ├── hooks/                # Custom React hooks
    │   ├── index.ts          # Barrel export
    │   ├── useAuth.ts        # Auth context consumer
    │   ├── useProfile.ts     # User profile CRUD
    │   ├── useRequireAuth.ts # Auth guard with redirect
    │   ├── useSRS.ts         # SRS session management (due cards)
    │   ├── useSession.ts     # Practice session state
    │   └── useStats.ts       # User stats fetching
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
    ├── stats/                # Stats calculation library
    │   ├── index.ts          # Barrel export
    │   ├── types.ts          # UserStats, DailyStats types
    │   ├── queries.ts        # getCardsReviewedToday, getTotalAccuracy
    │   ├── streak.ts         # calculateCurrentStreak, calculateLongestStreak
    │   └── updateProfile.ts  # updateProfileStats (on session end)
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
│   ├── exercise/             # Exercise library tests
│   ├── session/              # Session library tests
│   ├── stats/                # Stats library tests
│   └── helpers.test.ts       # Supabase helper tests
│
├── integration/              # Integration tests
│   ├── migrations/           # Database migration tests
│   ├── hooks/                # Hook integration tests
│   ├── srs/                  # SRS flow tests
│   ├── rls/                  # Row-level security tests
│   ├── session/              # Session integration tests
│   └── seed/                 # Seed data tests
│
└── e2e/                      # Playwright E2E tests
    ├── critical-path.spec.ts # Login → Dashboard → Practice → Submit → Feedback
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
└── python/                   # Python exercises (50 total)
    ├── basics.yaml           # 5 exercises
    ├── operators.yaml        # 5 exercises
    ├── strings.yaml          # 5 exercises
    ├── lists.yaml            # 5 exercises
    ├── dictionaries.yaml     # 5 exercises
    ├── loops.yaml            # 5 exercises
    ├── functions.yaml        # 5 exercises
    ├── classes.yaml          # 5 exercises
    ├── comprehensions.yaml   # 5 exercises
    └── exceptions.yaml       # 5 exercises
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
