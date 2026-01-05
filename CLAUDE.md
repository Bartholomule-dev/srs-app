# SRS-App - Claude Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## Documentation (Keep Updated!)

**Obsidian Vault** (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) is the source of truth. Key docs:
- `Index.md` - Project hub | `Architecture.md` - System design, SRS algorithm
- `Features.md` - Roadmap | `Database-Schema.md` - PostgreSQL schema, RLS

**After significant work**, update: Obsidian docs, Serena memories (if structure changed), CLAUDE.md milestones.

---

## Project Overview

A gamified web platform for practicing code syntax through spaced repetition. Target users are AI-assisted developers who want to maintain their programming fundamentals.

**Current Status:** Production Ready - Full practice flow complete with 50 Python exercises, 429 tests passing, UI/UX redesign complete, Vercel + Supabase deployment configured.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, **darwin-ui** (@pikoloo/darwin-ui) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (429 unit/integration) + Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

---

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests (429 tests)
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:headed  # Run E2E with browser visible
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout (AuthProvider, ToastProvider)
│   ├── page.tsx          # Home/auth page
│   ├── auth/callback/route.ts  # Magic link PKCE code exchange
│   ├── dashboard/page.tsx # Dashboard with stats + practice CTA
│   └── practice/page.tsx  # Practice session flow
├── middleware.ts         # Supabase session refresh
├── components/
│   ├── ui/               # darwin-ui wrappers with project defaults
│   ├── layout/           # Header, LandingHeader
│   ├── landing/          # Hero, Features, HowItWorks, AuthForm
│   ├── exercise/         # ExerciseCard, CodeInput, etc.
│   ├── session/          # SessionProgress, SessionSummary (immersive mode)
│   ├── dashboard/        # Greeting, PracticeCTA, DueCardsBanner, EmptyState
│   └── stats/            # StatsCard, StatsGrid
└── lib/
    ├── hooks/            # useAuth, useProfile, useSRS, useSession, useStats
    ├── srs/              # SM-2 algorithm
    ├── exercise/         # Answer matching, quality inference
    ├── session/          # Session types, interleaving
    ├── stats/            # Stats queries, streak calculation
    ├── errors/           # AppError, handleSupabaseError
    ├── supabase/         # Client (browser), server, helpers, mappers
    ├── confetti.ts       # Celebration effects (fireConfetti, fireConfettiMini)
    └── utils.ts          # cn() class utility

tests/
├── unit/                 # Vitest unit tests
├── integration/          # Vitest integration tests
└── e2e/                  # Playwright E2E tests
    ├── critical-path.spec.ts
    └── utils/auth.ts     # Test user creation

.github/workflows/
├── ci.yml               # Unit tests, lint, typecheck
└── e2e.yml              # E2E on Vercel deployment
```

---

## Key Patterns

### Authentication (Magic Link with SSR)
Using Supabase Magic Link (passwordless email OTP) with `@supabase/ssr` for production-ready SSR support.

**Key Files:**
- `lib/supabase/client.ts` - Browser client (`createBrowserClient`)
- `lib/supabase/server.ts` - Server client (`createServerClient` with cookies)
- `app/auth/callback/route.ts` - PKCE code exchange endpoint
- `src/middleware.ts` - Session refresh on page load

**Supabase Dashboard Config Required:**
1. Site URL: `https://your-app.vercel.app`
2. Redirect URLs: Add `https://your-app.vercel.app/auth/callback`

Auth state managed via `onAuthStateChange`.

### Styling & Theme System

**Tailwind CSS 4** with CSS variables defined in `globals.css`. Dark mode is the default.

**Theme CSS Variables (use these, not hardcoded colors):**
```css
/* Backgrounds */
--bg-base, --bg-surface-1, --bg-surface-2, --bg-surface-3

/* Text */
--text-primary, --text-secondary, --text-tertiary

/* Accents */
--accent-primary, --accent-success, --accent-warning, --accent-error

/* Syntax highlighting */
--syntax-keyword, --syntax-string, --syntax-function, --syntax-number, --syntax-comment
```

**Font Stack:**
- `font-display` - Space Grotesk (headings, hero text)
- `font-body` - DM Sans (body text, default)
- `font-mono` - JetBrains Mono (code)

**cn() Utility:** Use `cn()` from `@/lib/utils` for conditional class merging:
```tsx
import { cn } from '@/lib/utils';
className={cn('base-classes', condition && 'conditional-class')}
```

### Components
- Use `"use client"` directive for interactive components
- Server Components for static/metadata content
- React Compiler enabled for auto-optimization

### darwin-ui (CRITICAL: Always Prefer)

**darwin-ui (@pikoloo/darwin-ui) provides macOS-inspired components. ALWAYS use darwin-ui components instead of building custom ones.**

**Available Components (use these first):**
- `Button`, `IconButton` - All button variants
- `Card`, `CardContent`, `CardHeader`, `CardFooter` - Container components
- `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `Slider` - Form controls
- `Dialog`, `Popover`, `Tooltip`, `ContextMenu` - Overlays
- `Tabs`, `Accordion`, `Collapsible` - Navigation/disclosure
- `Badge`, `Avatar`, `Skeleton` - Display elements
- `Alert`, `Separator`, `ScrollArea` - Utility components

**Wrapper Pattern:**
All darwin-ui components are re-exported via `src/components/ui/` with project defaults:
```tsx
// Import from our wrappers, not directly from darwin-ui
import { Button, Card, Input } from '@/components/ui';
```

**Custom Implementations (exceptions):**
- `Toast/ToastProvider` - Keep custom (darwin-ui requires breaking context change)
- `Progress` - Custom wrapper for proper aria-progressbar attributes
- `CodeEditor` - IDE-styled textarea with line numbers, focus glow

**When creating new UI:**
1. Check if darwin-ui has the component first
2. If yes, use it via `@/components/ui/` wrapper
3. If no, build custom with Tailwind following darwin-ui aesthetic
4. Never duplicate functionality darwin-ui already provides

### Component Patterns

**Card Elevation:** Use `elevation` prop (1, 2, 3) for progressive depth:
```tsx
<Card elevation={2} interactive>Content</Card>
```

**CodeEditor:** IDE-styled input for code:
```tsx
<CodeEditor value={code} onChange={setCode} onSubmit={handleSubmit} showLineNumbers />
```

**Confetti Celebration:** Use for success moments:
```tsx
import { fireConfetti, fireConfettiMini } from '@/lib/confetti';
fireConfetti();           // Large burst (session complete)
fireConfettiMini();       // Small burst (correct answer)
```

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Skills (Invoke with `Skill` tool)

**MANDATORY skills - always use these:**
- `superpowers:brainstorming` - Before ANY creative work (features, components, modifications)
- `superpowers:verification-before-completion` - Before claiming work is complete/fixed/passing

**Other useful skills:** `systematic-debugging`, `test-driven-development`, `frontend-design:frontend-design`, `executing-plans`

---

## MCP Servers

| Server | Purpose | Key Tool |
|--------|---------|----------|
| **Daem0n MCP** | Project memory - decisions, patterns, warnings | `get_briefing`, `remember`, `recall` |
| **Obsidian** | Documentation vault at `/home/brett/GoogleDrive/Obsidian Vault/SRS-app/` | `read_note`, `patch_note` |
| **Serena** | Semantic code analysis - prefer over raw file ops | `get_symbols_overview`, `find_symbol` |
| **Context7** | Library docs lookup | `resolve-library-id` → `query-docs` |
| **Debate Hall** | Multi-perspective deliberation (Wind/Wall/Door) | For architectural decisions |

### Multi-AI Consultation

**CLI Tools for external AI perspectives:**
```bash
# Codex (OpenAI) - use 'exec' for non-interactive
codex exec "Your prompt here"

# Gemini - use '-p' flag for prompt
gemini -p "Your prompt here"
```

**Debate Hall MCP - Wind/Wall/Door pattern:**
```typescript
// Thread ID MUST be date-first: YYYY-MM-DD-topic
init_debate({ thread_id: "2026-01-05-feature-name", topic: "..." })

// Fixed mode order: Wind (advocate) → Wall (skeptic) → Door (synthesizer)
add_turn({ role: "Wind", content: "...", cognition: "PATHOS" })
add_turn({ role: "Wall", content: "...", cognition: "ETHOS" })
add_turn({ role: "Door", content: "...", cognition: "LOGOS" })

close_debate({ synthesis: "Final recommendation..." })
```

**Daem0n MCP - Sacred Covenant (CRITICAL):**

**ALWAYS call `context_check()` BEFORE `remember()` or `add_rule()`:**
```typescript
// Step 1: REQUIRED - Seek counsel first
context_check({ description: "Recording decision about X" })

// Step 2: Only AFTER context_check succeeds, call remember
remember({ category: "decision", content: "...", rationale: "..." })
```

**If you skip context_check, the call WILL BE BLOCKED.** The covenant prevents contradicting existing project wisdom.

To disable (not recommended): `export DAEM0NMCP_DISABLE_COVENANT=1` in `~/.bashrc`

---

## Database (Implemented)

See `Database-Schema.md` in Obsidian for full schema. Key tables:

- `profiles` - User data with auto-generated username, stats (streak, accuracy, total)
- `exercises` - Exercise content with slug-based identity (50 Python exercises)
- `user_progress` - SRS state per user/exercise (SM-2 algorithm)

RLS enabled on all user tables. Auto-generated usernames on signup (`user_` + UUID prefix).

---

## Coding Conventions

- TypeScript strict mode - no `any` types
- Functional components with hooks
- Tailwind for styling (no CSS modules)
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Path alias: `@/*` maps to `src/*`

---

## Completed Milestones

1. ✅ Database & Types - Migrations, RLS, auto-generated types
2. ✅ Auth & Hooks - Magic Link, useAuth, useProfile, ProtectedRoute
3. ✅ SRS Engine - SM-2 algorithm, useSRS hook
4. ✅ Exercise Engine - CodeInput, ExerciseCard, answer matching
5. ✅ Practice Session - useSession, /dashboard, /practice pages
6. ✅ Exercise Library - 50 Python exercises in YAML
7. ✅ Basic Stats - StatsGrid, useStats, streak/accuracy
8. ✅ MVP Deployment - Vercel, GitHub Actions CI/E2E, Playwright
9. ✅ UI/UX Redesign - "IDE-Inspired Premium" aesthetic with dark-first theme, Space Grotesk/DM Sans/JetBrains Mono fonts, bento grids, segmented progress bars, confetti celebrations
10. ✅ darwin-ui Migration - Migrated to @pikoloo/darwin-ui for macOS-inspired aesthetic, wrapper components in src/components/ui/
11. ✅ Theme System - CSS variables for colors/fonts, cn() utility, CodeEditor component, Card elevation variants

## Next Steps

1. Username selection UI (auto-generated for now)
2. Advanced gamification (achievements, leaderboards)
3. Additional languages (JavaScript/TypeScript, SQL)

