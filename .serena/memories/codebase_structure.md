# Codebase Structure

## Root Directory
```
srs-app/
├── src/                  # Application source code
├── tests/                # Test files
├── supabase/             # Supabase configuration & migrations
├── public/               # Static assets
├── docs/                 # Additional documentation
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
│   └── favicon.ico
│
├── components/               # Reusable UI components
│   ├── index.ts              # Barrel export
│   ├── ProtectedRoute.tsx    # Auth-gated route wrapper
│   ├── ErrorBoundary.tsx     # React error boundary
│   └── Toast.tsx             # Toast notification component
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
    │   └── useSRS.ts         # SRS session management
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
│   │   └── Toast.test.tsx
│   ├── hooks/                # Hook tests
│   │   ├── useAuth.test.tsx
│   │   ├── useProfile.test.tsx
│   │   ├── useRequireAuth.test.tsx
│   │   └── useSRS.test.tsx
│   ├── errors/               # Error handling tests
│   │   ├── AppError.test.ts
│   │   └── handleSupabaseError.test.ts
│   ├── context/              # Context tests
│   │   └── auth.types.test.ts
│   ├── srs/                  # SRS algorithm tests
│   │   ├── algorithm.test.ts
│   │   ├── types.test.ts
│   │   └── mappers.test.ts
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
    └── seed/
        └── exercises-seed.test.ts
```

## Supabase (`supabase/`)
```
supabase/
├── config.toml               # Local Supabase configuration
├── migrations/               # Database migrations (SQL)
└── seed.sql                  # Seed data for exercises
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
