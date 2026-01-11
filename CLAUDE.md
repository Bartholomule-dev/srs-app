# SRS-App - Claude Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## Documentation (Keep Updated!)

**Obsidian Vault** (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) is the source of truth. Key docs:
- `Index.md` - Project hub | `Architecture.md` - System design, SRS algorithm
- `Features.md` - Roadmap | `Database-Schema.md` - PostgreSQL schema, RLS
- `Grading-Rubric.md` - Exercise quality scoring (8 dimensions, 40-point scale)
- `Exercises/` - Auto-generated folder: `index.md` (compact summary) + per-concept files (regenerate with `pnpm generate:exercise-list`)
- `Blueprints.md` - Blueprint/skin content planning and coverage tracking

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

**Current Status:** Multi-Language Infrastructure Complete - Full multi-language support with JavaScript as second language. Language switcher in dashboard, view-only language tabs in skill tree, per-language stats. 524 Python exercises (109 dynamic with 38 generators). JavaScript curriculum stub ready for content. Next: JavaScript exercises, then onboarding flow.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, framer-motion |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (2219 unit/integration) + Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

---

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests (2219 tests)
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:headed  # Run E2E with browser visible
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML

# Exercise Management
pnpm validate:exercises      # Validate Python YAML against schema
pnpm validate:exercises:js   # Validate JavaScript YAML
pnpm validate:exercises:all  # Validate both languages
pnpm validate:dynamic        # Validate dynamic exercises
pnpm validate:paths          # Validate Python paths YAML
pnpm validate:paths:js       # Validate JavaScript paths
pnpm validate:paths:all      # Validate both languages
pnpm coverage:blueprints     # Check exercise coverage across blueprints
pnpm generate:exercise-list  # Generate Exercises/ folder to Obsidian vault
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
    ├── hooks/            # useAuth, useProfile, useActiveLanguage, useConceptSRS, useConceptSession, useStats, useLanguageStats, useDueCount, useSkillTree
    ├── srs/              # FSRS algorithm (ts-fsrs adapter)
    ├── exercise/         # Answer matching, quality inference, two-pass grading, construct detection
    ├── session/          # Session types, interleaving, teaching cards
    ├── curriculum/       # python.json, javascript.json (stub), types, loader (language-parameterized)
    ├── generators/       # Dynamic exercise generation (38 Python generators), language-scoped registry
    │   ├── python/       # Python generators (38 total)
    │   └── javascript/   # JavaScript generators (stub)
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

### Running Real Multi-AI Debates

**CRITICAL:** When running debates between Claude, Codex, and Gemini, you must ACTUALLY call the CLI tools to get real responses. Do NOT simulate other AIs by writing their responses yourself.

**Proper Debate Workflow:**
1. `init_debate` with topic and thread_id
2. Add YOUR opening position as Wind (Claude)
3. Get the current debate state and send to Codex:
   ```bash
   codex exec "You are Wall (skeptic/ETHOS) in a debate. Topic: [topic]

   Previous turns:
   [paste all previous turns]

   Respond to the arguments above. Challenge assumptions, find flaws, demand evidence."
   ```
4. Add Codex's ACTUAL response as a Wall turn
5. Send updated debate state to Gemini:
   ```bash
   gemini -p "You are Door (synthesizer/LOGOS) in a debate. Topic: [topic]

   Previous turns:
   [paste all previous turns including Codex's response]

   Synthesize the positions. Find common ground. Propose actionable resolution."
   ```
6. Add Gemini's ACTUAL response as a Door turn
7. Continue rounds: send full context to each AI so they respond to each other
8. `close_debate()` and save to Obsidian `Debate-Results/` folder

**Key Rules:**
- ALWAYS include previous turns when prompting Codex/Gemini so they can respond to each other
- NEVER write responses "as" another AI - get their real output
- Each AI must see what others said to create real back-and-forth

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

**Source of Truth:** `exercises/python/*.yaml` files (524 exercises across 11 files)

**Workflow for adding/modifying exercises:**
1. Edit the appropriate YAML file in `exercises/python/`
2. Run `pnpm validate:exercises` to check schema compliance
3. Run `pnpm validate:dynamic` if adding dynamic exercises
4. Run `pnpm generate:exercise-list` to regenerate Exercises/ folder
5. Commit both YAML changes and generated docs

**Auto-Generated Files (DO NOT EDIT DIRECTLY):**
- Obsidian `SRS-app/Exercises/` - Folder with index.md + per-concept files
- Obsidian `SRS-app/Blueprints.md` - Blueprint/skin documentation
- Obsidian `SRS-app/Grading-Rubric.md` - Exercise quality rubric

**Exercise Types:**
- `write` (319): Write code from scratch
- `fill-in` (71): Complete blanks in template
- `predict` (139): Predict code output
- **Dynamic** (109): Values change per user/day via generators

**Generators (38 total):** slice-bounds, list-values, variable-names, index-values, arithmetic-values, loop-simulation, comparison-logic, string-ops, dict-values, comp-mapping, comp-filter, try-except-flow, oop-instance, lambda-expr, zip-lists, any-all, bool-logic, class-method, conditional-chain, default-args, dict-comp, exception-scenario, file-io, finally-flow, function-call, inheritance-method, list-method, list-transform, nested-access, operator-chain, path-ops, set-ops, sorted-list, string-format, string-slice, truthiness, tuple-access, type-conversion

---

## Database (Implemented)

See `Database-Schema.md` in Obsidian for full schema. Key tables:

- `profiles` - User data with auto-generated username, stats (streak, accuracy, total), `preferred_language`
- `exercises` - Exercise content with slug-based identity, `language` column
- `user_progress` - SRS state per user/exercise (FSRS algorithm)
- `subconcept_progress` - Concept-based SRS state per subconcept PER LANGUAGE (unique: user_id, language, subconcept_slug)
- `exercise_attempts` - Exercise usage tracking PER LANGUAGE (unique: user_id, language, exercise_slug)

**Multi-Language Schema:** Both `subconcept_progress` and `exercise_attempts` include a `language` column with indexes for language-filtered queries. This allows users to track progress independently per language.

RLS enabled on all user tables. Auto-generated usernames on signup (`user_` + UUID prefix).

---

## Curriculum System (Multi-Language)

**Concept-Based SRS:** Tracks subconcept mastery via `useConceptSRS(language)` hook. Tables: `subconcept_progress`, `exercise_attempts` (both with language column). Hybrid selection (level progression + least-seen).

**Supported Languages:**
- **Python:** Full curriculum - 11 concepts, 65 subconcepts, 524 exercises
- **JavaScript:** Curriculum stub - 3 concepts, 9 subconcepts (ready for exercises)

**Taxonomy Fields:**
| Field | Description |
|-------|-------------|
| `language` | `python` or `javascript` |
| `concept` | Primary milestone (e.g., `conditionals`, `functions`) |
| `subconcept` | Specific skill (e.g., `for`, `enumerate`, `lambda`) |
| `level` | `intro` → `practice` → `edge` |
| `type` | `write`, `fill-in`, or `predict` |
| `objective` | Learning target, 10-150 chars starting with verb |

**Curriculum Files:**
- `src/lib/curriculum/python.json` - 11 concepts, 65 subconcepts
- `src/lib/curriculum/javascript.json` - 3 concepts, 9 subconcepts (stub)

**Key Functions:**
- `loadCurriculum(language)` - Load curriculum for specified language
- `getSubconceptTeaching(slug, language)` - Get teaching content
- `isValidConcept(slug, language)` - Validate concept exists for language

**Exercise Levels:** intro (207), practice (237), edge (80)

**Algorithm Features:** Anti-repeat pattern selection, level-based progression

---

## Blueprint + Skin System (Complete)

A presentation layer that wraps atomic exercises in narrative context.

**Three-Layer Architecture:**
- **Exercise:** Atomic FSRS-scheduled unit (unchanged)
- **Blueprint:** Ordered sequence of exercises forming a "build something" narrative
- **Skin:** Domain theming - variable values, context text, and data packs for exercises

**Content Summary:**
- **15 Blueprints** (234 beats total):
  - `python-basics` (16 beats), `collection-cli-app` (20 beats), `calculator-app` (18 beats)
  - `data-processor` (18 beats), `data-transformer` (13 beats), `data-store` (18 beats)
  - `text-adventure` (15 beats), `text-formatter` (14 beats)
  - `file-manager` (16 beats), `module-library` (12 beats), `api-functions` (18 beats)
  - `automation-script` (18 beats), `form-validator` (11 beats), `error-handler` (12 beats)
  - `oop-entity` (15 beats)
- **22 Skins** (domain-specific + global):
  - Domain: task-manager, shopping-cart, playlist-app, recipe-book, game-inventory, calculator-app, hello-python, pet-simulator, etc.
  - Global: fantasy-game, music-app, dungeon-crawler, api-guardian, batch-processor, etc.

**Directory Structure:**
```
paths/python/
├── blueprints/               # 15 blueprint files (234 total beats)
│   ├── python-basics.yaml, collection-cli-app.yaml, calculator-app.yaml
│   ├── data-processor.yaml, data-transformer.yaml, data-store.yaml
│   ├── text-adventure.yaml, text-formatter.yaml, file-manager.yaml
│   ├── module-library.yaml, api-functions.yaml, automation-script.yaml
│   ├── form-validator.yaml, error-handler.yaml, oop-entity.yaml
└── skins/                    # 22 skin files
    ├── task-manager.yaml, shopping-cart.yaml, playlist-app.yaml
    ├── recipe-book.yaml, game-inventory.yaml, calculator-app.yaml
    ├── hello-python.yaml, pet-simulator.yaml, fantasy-game.yaml
    ├── music-app.yaml, dungeon-crawler.yaml, api-guardian.yaml
    ├── batch-processor.yaml, config-manager.yaml, csv-parser.yaml
    ├── devops-toolkit.yaml, log-analyzer.yaml, markdown-editor.yaml
    ├── sdk-builder.yaml, signup-form.yaml, user-database.yaml, api-client.yaml
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

## Completed Milestones (32+)

1. Database & Types | 2. Auth & Hooks | 3. SRS Engine | 4. Exercise Engine | 5. Practice Session | 6. Exercise Library | 7. Basic Stats | 8. MVP Deployment | 9. UI/UX Redesign | 10. Custom UI Components | 11. Theme System | 12. Phase 2.5 Curriculum Enhancement | 13. Learning Mode | 14. Phase 2.7 Exercise Variety | 15. Curriculum Restructure | 16. SM-2→FSRS Migration | 17. Dedicated Teaching Examples | 18-23. Dynamic Exercises (Phases 1-6) | 24. Exercise-List Auto-Gen | 25. Skill Tree Visualization | 26. Premium Curriculum Restructure | 27. Phase 3 Gamification | 28. Blueprint + Skin System | 29. Robust Answer Grading System (strategy-based grading, AST normalization, 5 failure modes fixed) | 30. Integrated Level Removal (simplified to intro→practice→edge) | 31. Structural Skin Mapping (TinyStore lexicon, 488 placeholder contexts replaced, 11 generators using TinyStore) | 32. **Multi-Language Infrastructure** (database schema, language-parameterized loaders, useActiveLanguage hook, LanguageSwitcher, SkillTree tabs, per-language stats)

*Details in design docs: `docs/plans/`*

---

## Next Steps

1. **JavaScript Exercises:** Create exercises for the JavaScript curriculum
2. **JavaScript Blueprints/Skins:** Build narrative content for JavaScript
3. **Onboarding:** Integrate ExperienceLevelSelector into user flow
4. **More Dynamic Exercises:** Continue migrating static exercises to use generators
5. **Leaderboards:** Daily/weekly/all-time rankings (deferred from Phase 3)

