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
│   ├── layout.tsx            # Root layout with fonts/metadata
│   ├── page.tsx              # Home/auth page (client component)
│   ├── globals.css           # Tailwind imports & CSS variables
│   └── favicon.ico
│
└── lib/                      # Shared libraries
    ├── supabase/
    │   ├── client.ts         # Supabase client initialization
    │   ├── helpers.ts        # DbResult helper, type guards
    │   ├── mappers.ts        # snake_case → camelCase mappers
    │   └── index.ts          # Barrel export
    │
    └── types/
        ├── database.generated.ts  # Auto-generated from Supabase
        ├── app.types.ts           # App-level types (camelCase)
        └── index.ts               # Barrel export
```

## Tests (`tests/`)
```
tests/
├── setup.ts                  # Vitest setup, safety checks
├── example.spec.ts           # Playwright E2E example
│
├── unit/
│   └── helpers.test.ts       # Unit tests for helpers
│
└── integration/
    ├── migrations/
    │   ├── profiles.test.ts       # Profile table tests
    │   ├── exercises.test.ts      # Exercise table tests
    │   └── user-progress.test.ts  # User progress tests
    │
    ├── rls/
    │   ├── test-utils.ts          # RLS test utilities
    │   ├── profiles-rls.test.ts   # Profile RLS policy tests
    │   └── user-progress-rls.test.ts  # Progress RLS tests
    │
    └── seed/
        └── exercises-seed.test.ts # Seed data verification
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

## Planned Future Directories
```
src/
├── app/
│   ├── dashboard/            # User dashboard
│   ├── practice/             # Exercise session
│   └── settings/             # User preferences
│
└── lib/
    ├── srs/                  # SM-2 algorithm implementation
    ├── exercises/            # Exercise loading/evaluation
    └── hooks/                # React hooks (useAuth, useExercise)
```
