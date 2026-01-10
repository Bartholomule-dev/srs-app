# SRS-App - Claude Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## Documentation (Keep Updated!)

**Obsidian Vault** (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) is the source of truth. Key docs:
- `Index.md` - Project hub | `Architecture.md` - System design, SRS algorithm
- `Features.md` - Roadmap | `Database-Schema.md` - PostgreSQL schema, RLS

**After significant work**, update: Obsidian docs, Serena memories (if structure changed), CLAUDE.md milestones.

---

## Exercise Quality Review

**Exercise List:** Obsidian vault `Exercise-List.md` (auto-generated) contains all exercises with stats.

**Grading Process:** To review exercise quality by subconcept:
1. Read the rubric in Obsidian `Grading-Rubric.md` (8 dimensions + Code Correctness Gate)
2. Find exercises: `grep "subconcept: <name>" exercises/python/*.yaml`
3. Grade each exercise against the rubric (max 40 points)
4. Fix issues, then run `pnpm validate:exercises && pnpm generate:exercise-list`

**Rubric Dimensions:** Tr (Transfer), Cg (Cognitive Match), Dd (Decision Depth), Nv (Narrative Versatility), Ad (Answer Determinism), Cc (Coverage Completeness), Id (Idiom Quality), Pc (Prompt Clarity)

**Thresholds:** 35-40 Excellent | 28-34 Good | 20-27 Acceptable | <20 Needs rework

---

## Project Overview

A gamified web platform for practicing code syntax through spaced repetition. Target users are AI-assisted developers who want to maintain their programming fundamentals.

**Current Status:** Blueprint + Skin System Complete - Presentation layer wraps atomic exercises in narrative context through 4 mega-blueprints (65 beats total) and 7 skins (5 domain-specific + 2 global). Phase 3 Gamification complete. Next: Onboarding flow, then JavaScript/TypeScript exercises.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, framer-motion |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (2182 unit/integration) + Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

---

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests (2182 tests)
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:headed  # Run E2E with browser visible
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML

# Exercise Management
pnpm validate:exercises   # Validate YAML against schema
pnpm validate:dynamic     # Validate dynamic exercises
pnpm validate:paths       # Validate blueprint/skin YAML files
pnpm coverage:blueprints  # Check exercise coverage across blueprints
pnpm generate:exercise-list  # Generate Exercise-List.md to Obsidian vault
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
│   ├── ui/               # Custom UI components (Button, Card, Input, FeatureErrorBoundary, etc.)
│   ├── layout/           # Header, LandingHeader
│   ├── landing/          # Hero, Features, HowItWorks, AuthForm
│   ├── exercise/         # ExerciseCard, CodeInput, FillInExercise, TeachingCard, CoachingFeedback, BeatHeader, ContextHint
│   ├── session/          # SessionProgress, SessionSummary (immersive mode)
│   ├── dashboard/        # Greeting, PracticeCTA, DueCardsBanner, EmptyState
│   └── stats/            # StatsCard, StatsGrid
└── lib/
    ├── hooks/            # useAuth, useProfile, useConceptSRS, useConceptSession, useStats
    ├── srs/              # FSRS algorithm (ts-fsrs adapter)
    ├── exercise/         # Answer matching, quality inference, two-pass grading, construct detection
    ├── session/          # Session types, interleaving, teaching cards
    ├── curriculum/       # python.json curriculum graph, types, loader
    ├── generators/       # Dynamic exercise generation (types, seed, utils, render, registry)
    ├── paths/            # Blueprint + Skin system (types, loader, grouping, apply-skin)
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
- Backgrounds: `--bg-base`, `--bg-surface-1/2/3`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Accents: `--accent-primary`, `--accent-success/warning/error`
- Syntax: `--syntax-keyword/string/function/number/comment`

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

### Component Patterns

- **Card Elevation:** `<Card elevation={2} interactive>` (1, 2, 3 for progressive depth)
- **CodeEditor:** `<CodeEditor value={code} onChange={setCode} onSubmit={handleSubmit} showLineNumbers />`
- **Confetti:** `fireConfetti()` (session complete) / `fireConfettiMini()` (correct answer) from `@/lib/confetti`

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Playwright MCP Testing

**Interactive browser testing** via the Playwright MCP plugin for verifying UI features.

### Authentication Workflow

Supabase blocks secret API keys in browser contexts. Use this two-step approach:

**Step 1: Create test user via bash (server-side):**
```bash
TEST_EMAIL="test-playwright-$(date +%s)@example.com"
curl -X POST "https://{PROJECT_REF}.supabase.co/auth/v1/admin/users" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$TEST_EMAIL'","password":"test-password-123","email_confirm":true}'
```

**Step 2: Sign in and inject session via Playwright:**
```javascript
// In browser_run_code - use anon key (allowed in browser)
const signInRes = await page.request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
  headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
  data: { email: testEmail, password: testPassword }
});
const session = await signInRes.json();

// Inject session cookie
await page.context().addCookies([{
  name: `sb-${projectRef}-auth-token`,
  value: encodeURIComponent(JSON.stringify(session)),
  domain: 'localhost',
  path: '/',
  httpOnly: false,
  secure: false,
  sameSite: 'Lax'
}]);
```

**Step 3: Clean up test user after testing:**
```bash
curl -X DELETE "https://{PROJECT_REF}.supabase.co/auth/v1/admin/users/{USER_ID}" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
```

### Key Playwright MCP Tips

| Tool | Use For |
|------|---------|
| `browser_navigate` | Go to URL |
| `browser_snapshot` | Get accessibility tree (better than screenshot for element refs) |
| `browser_click` | Click element by `ref` from snapshot |
| `browser_type` | Type into input by `ref` |
| `browser_run_code` | Custom Playwright code (loops, waits, complex flows) |
| `browser_take_screenshot` | Visual verification (`fullPage: true` for long pages) |

**Important:**
- Always wait for page loads (`waitForTimeout`) before taking snapshots
- Use `page.request` for API calls within `browser_run_code` (not `fetch`)
- Element `ref` values come from `browser_snapshot` output
- Screenshots saved to `.playwright-mcp/` directory

---

## Skills (Invoke with `Skill` tool)

| Category | Skill | When |
|----------|-------|------|
| **Mandatory** | `superpowers:brainstorming` | Before ANY creative work |
| | `superpowers:verification-before-completion` | Before claiming work complete |
| | `daem0nmcp-protocol` | When Daem0nMCP tools available |
| **Workflow** | `superpowers:writing-plans` | Have spec, before coding |
| | `superpowers:executing-plans` | Have plan, need checkpoints |
| | `superpowers:dispatching-parallel-agents` | 2+ independent tasks |
| | `superpowers:subagent-driven-development` | Execute plan in current session |
| | `superpowers:finishing-a-development-branch` | Tests pass, ready to integrate |
| **Quality** | `superpowers:test-driven-development` | Implementing feature/bugfix |
| | `superpowers:systematic-debugging` | Any bug or test failure |
| | `superpowers:requesting-code-review` | Before merging |
| **Design** | `frontend-design:frontend-design` | Building web components/pages |
| | `design-principles` | Dashboards, admin UIs |
| | `elements-of-style:writing-clearly-and-concisely` | Prose humans read |

---

## MCP Servers

| Server | Purpose | Key Tools |
|--------|---------|-----------|
| **Daem0n MCP** | Project memory - decisions, patterns, warnings | `get_briefing`, `remember`, `recall`, `context_check` |
| **Serena** | Semantic code analysis | `get_symbols_overview`, `find_symbol`, `replace_symbol_body` |
| **Obsidian** | Documentation vault (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) | `read_note`, `patch_note`, `search_notes` |
| **Context7** | Library docs lookup | `resolve-library-id` → `query-docs` |
| **Supabase** | Database management, migrations, edge functions | `execute_sql`, `apply_migration`, `list_tables` |
| **Debate Hall** | Multi-perspective deliberation (Wind/Wall/Door) | `init_debate`, `add_turn`, `close_debate` |
| **Sequential Thinking** | Step-by-step reasoning for complex problems | `sequentialthinking` |

### Serena Usage (IMPORTANT)

**Always use `mcp__plugin_serena_serena__*` tools** (the plugin version). Two instances exist due to plugin architecture, but use the `plugin_serena_serena` prefix consistently.

**Prefer Serena over Claude's native file tools for code operations:**
| Task | Use Serena | Not Claude Native |
|------|------------|-------------------|
| Explore code structure | `get_symbols_overview`, `find_symbol` | Glob, Grep |
| Read symbol definitions | `find_symbol` with `include_body=True` | Read |
| Edit functions/classes | `replace_symbol_body`, `insert_after_symbol` | Edit |
| Find references | `find_referencing_symbols` | Grep |
| Search patterns | `search_for_pattern` | Grep |

**When to use Claude's native tools instead:**
- Non-code files (JSON, YAML, Markdown, config)
- Quick file existence checks
- Reading entire files when symbol structure unknown
- Files Serena doesn't index (node_modules, build artifacts)

### Multi-AI Consultation

**CLI Tools:**
```bash
codex exec "prompt"      # OpenAI Codex (non-interactive)
gemini -p "prompt"       # Google Gemini
```

**Debate Hall MCP:** Thread ID format `YYYY-MM-DD-topic`. Order: Wind (advocate/PATHOS) → Wall (skeptic/ETHOS) → Door (synthesizer/LOGOS) → `close_debate()`

**Daem0n MCP Covenant (CRITICAL):** ALWAYS call `context_check({ description: "..." })` BEFORE `remember()` or `add_rule()`. Skipping = blocked. Disable: `export DAEM0NMCP_DISABLE_COVENANT=1`

### Daem0n MCP Tools (Key Tools)

| Category | Tool | When to Use |
|----------|------|-------------|
| **Session** | `get_briefing` | **FIRST CALL** - stats, warnings, decisions, git changes |
| | `context_check` | **BEFORE remember/add_rule** - preflight conflict check |
| **Memory** | `remember` | Store decision/pattern/warning after context_check |
| | `recall` | Semantic search for past decisions |
| | `search_memories` | Full-text search with TF-IDF |
| | `record_outcome` | Track if decision worked/failed |
| **Rules** | `add_rule` / `check_rules` | Decision tree rules with semantic triggers |
| **Graph** | `link_memories` | Connect memories (led_to, supersedes, depends_on) |
| | `trace_chain` | Follow causal chains |
| **Code** | `index_project` | Index codebase with tree-sitter |
| | `find_code` | Semantic code search |
| | `analyze_impact` | Blast radius before changes |

Full tool list: run `mcp__daem0nmcp__health` or see Daem0n docs.

---

## Exercise Content Management

**Source of Truth:** `exercises/python/*.yaml` files (510 exercises across 11 files)

**Workflow for adding/modifying exercises:**
1. Edit the appropriate YAML file in `exercises/python/`
2. Run `pnpm validate:exercises` to check schema compliance
3. Run `pnpm validate:dynamic` if adding dynamic exercises
4. Run `pnpm generate:exercise-list:obsidian` to regenerate documentation
5. Commit both YAML changes and generated docs

**Auto-Generated Files (DO NOT EDIT DIRECTLY):**
- `docs/EXERCISES.md` - Exercise list in repo
- Obsidian `SRS-app/Exercise-List.md` - Same content for Obsidian vault

**Exercise Types:**
- `write` (221): Write code from scratch
- `fill-in` (58): Complete blanks in template
- `predict` (73): Predict code output
- **Dynamic** (37): Values change per user/day via generators

**Generators:** slice-bounds, list-values, variable-names, index-values, arithmetic-values, loop-simulation, comparison-logic, string-ops, dict-values, comp-mapping, comp-filter, try-except-flow, oop-instance

---

## Database (Implemented)

See `Database-Schema.md` in Obsidian for full schema. Key tables:

- `profiles` - User data with auto-generated username, stats (streak, accuracy, total)
- `exercises` - Exercise content with slug-based identity (510 Python exercises)
- `user_progress` - SRS state per user/exercise (SM-2 algorithm)
- `subconcept_progress` - **(Phase 2)** Concept-based SRS state per subconcept
- `exercise_attempts` - **(Phase 2)** Exercise usage tracking for selection algorithm

RLS enabled on all user tables. Auto-generated usernames on signup (`user_` + UUID prefix).

---

## Curriculum System (Phase 2/2.5)

**Concept-Based SRS:** Tracks subconcept mastery via `useConceptSRS` hook. Tables: `subconcept_progress`, `exercise_attempts`. Hybrid selection (level progression + least-seen).

**Taxonomy Fields:**
| Field | Description |
|-------|-------------|
| `concept` | Primary milestone (e.g., `conditionals`, `functions`) |
| `subconcept` | Specific skill (e.g., `for`, `enumerate`, `lambda`) |
| `level` | `intro` → `practice` → `edge` → `integrated` |
| `type` | `write`, `fill-in`, or `predict` |
| `objective` | Learning target, 10-150 chars starting with verb |
| `targets` | Subconcepts tested (required for `integrated` level) |

**Curriculum:** `src/lib/curriculum/python.json` - 11 concepts, 65 subconcepts (DAG structure)

**Algorithm Features:** Anti-repeat pattern selection, multi-subconcept SRS credit for integrated exercises

---

## Blueprint + Skin System (Complete)

A presentation layer that wraps atomic exercises in narrative context.

**Three-Layer Architecture:**
- **Exercise:** Atomic FSRS-scheduled unit (unchanged)
- **Blueprint:** Ordered sequence of exercises forming a "build something" narrative
- **Skin:** Domain theming - variable values, context text, and data packs for exercises

**Content Summary:**
- **4 Blueprints** (65 beats total):
  - `collection-cli-app` (20 beats) - Beginner CLI app from scratch
  - `data-processor` (18 beats) - Intermediate log parsing pipeline
  - `text-adventure` (15 beats) - Intermediate interactive game
  - `module-library` (12 beats) - Advanced reusable module design
- **7 Skins** (5 domain-specific + 2 global):
  - Domain-specific: task-manager, shopping-cart, playlist-app, recipe-book, game-inventory
  - Global (any blueprint): fantasy-game, music-app
- **19 exercises** converted to use skin templates

**Directory Structure:**
```
paths/python/
├── blueprints/
│   ├── collection-cli-app.yaml  # 20 beats (beginner)
│   ├── data-processor.yaml      # 18 beats (intermediate)
│   ├── text-adventure.yaml      # 15 beats (intermediate)
│   └── module-library.yaml      # 12 beats (advanced)
└── skins/
    ├── task-manager.yaml        # Domain-specific
    ├── shopping-cart.yaml
    ├── playlist-app.yaml
    ├── recipe-book.yaml
    ├── game-inventory.yaml
    ├── fantasy-game.yaml        # Global skin
    └── music-app.yaml           # Global skin
```

**Key Types (`src/lib/paths/types.ts`):**
- `Blueprint` - id, title, description, difficulty, concepts, beats[]
- `Beat` - beat number, exercise slug, title, sideQuests[] (optional bonus exercises)
- `Skin` - id, title, icon, blueprints[] (optional - omit for global), vars, contexts, dataPack
- `SkinVars` - Core fields + extended optional slots (attr_key_1/2, id_var, filename, user_role, etc.)
- `SkinDataPack` - list_sample, dict_sample, records_sample, string_samples (for predict exercises)
- `SkinnedCard` - exerciseSlug + skin/blueprint context + isSideQuest flag

**Key Features:**
- **Side-quests:** Optional bonus exercises attached to beats via `sideQuests` array
- **Global skins:** Skins without `blueprints` field work with any blueprint
- **DataPack:** Themed sample data for predict exercises (lists, dicts, records, strings)
- **Role-based variables:** Extended SkinVars include user_role, action_verb, entity_name

**Key Functions:**
- `loadPathIndex()` - Load all blueprints and skins from YAML
- `groupByBlueprint()` - Group session cards by blueprint, sort by beat
- `applySkinContext()` - Apply skin variables to exercises via Mustache
- `pickSkin()` - Select skin avoiding recent (last 3 sessions), supports global skins

**Components:**
- `BeatHeader` - Shows "Beat 1 of 20: Create storage" during practice
- `ContextHint` - Shows skin-specific context text for each exercise

**Database:**
- `profiles.recent_skins` - Array of last 3 skin IDs (for rotation)

---

## Coding Conventions

- TypeScript strict mode - no `any` types
- Functional components with hooks
- Tailwind for styling (no CSS modules)
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Path alias: `@/*` maps to `src/*`

---

## Completed Milestones (28)

1. Database & Types | 2. Auth & Hooks | 3. SRS Engine | 4. Exercise Engine | 5. Practice Session | 6. Exercise Library | 7. Basic Stats | 8. MVP Deployment | 9. UI/UX Redesign | 10. Custom UI Components | 11. Theme System | 12. Phase 2.5 Curriculum Enhancement | 13. Learning Mode | 14. Phase 2.7 Exercise Variety | 15. Curriculum Restructure | 16. SM-2→FSRS Migration | 17. Dedicated Teaching Examples | 18-23. Dynamic Exercises (Phases 1-6) | 24. Exercise-List Auto-Gen | 25. Skill Tree Visualization | 26. Premium Curriculum Restructure | 27. Phase 3 Gamification | 28. Blueprint + Skin System

*Details in design docs: `docs/plans/`*

---

## Next Steps

1. **Onboarding:** Integrate ExperienceLevelSelector into user flow
2. **Languages:** JavaScript/TypeScript exercises
3. **More Dynamic Exercises:** Continue migrating static exercises to use generators
4. **More Blueprints/Skins:** Expand content coverage for additional concepts
5. **Leaderboards:** Daily/weekly/all-time rankings (deferred from Phase 3)

