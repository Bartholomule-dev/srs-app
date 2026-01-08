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

**Current Status:** Skill Tree Visualization Complete - Dashboard now shows visual skill tree with 54 subconcept nodes across 10 concepts. Four node states (locked, available, in-progress, mastered) based on FSRS stability (>=7 days = mastered). Interactive tooltips, SVG dependency lines, staggered animations. Next: Gamification (achievements, points, leaderboards).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4, framer-motion |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (1472 unit/integration) + Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

---

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests (1472 tests)
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:headed  # Run E2E with browser visible
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML

# Exercise Management
pnpm validate:exercises   # Validate YAML against schema
pnpm validate:dynamic     # Validate dynamic exercises
pnpm generate:exercise-list           # Generate docs/EXERCISES.md from YAML
pnpm generate:exercise-list:obsidian  # Also generate to Obsidian vault
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
│   ├── ui/               # Custom UI components (Button, Card, Input, etc.)
│   ├── layout/           # Header, LandingHeader
│   ├── landing/          # Hero, Features, HowItWorks, AuthForm
│   ├── exercise/         # ExerciseCard, CodeInput, FillInExercise, TeachingCard, CoachingFeedback
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

**MANDATORY - Always use:**
| Skill | When |
|-------|------|
| `superpowers:brainstorming` | Before ANY creative work (features, components, modifications) |
| `superpowers:verification-before-completion` | Before claiming work is complete/fixed/passing |
| `daem0nmcp-protocol` | When Daem0nMCP tools available (enforces sacred covenant) |

**Development Workflow:**
| Skill | When |
|-------|------|
| `superpowers:writing-plans` | Have spec/requirements, before touching code |
| `superpowers:executing-plans` | Have written plan, need separate session with checkpoints |
| `superpowers:dispatching-parallel-agents` | 2+ independent tasks without shared state |
| `superpowers:subagent-driven-development` | Execute plan with independent tasks in current session |
| `superpowers:using-git-worktrees` | Need isolation from current workspace |
| `superpowers:finishing-a-development-branch` | Implementation complete, tests pass, ready to integrate |

**Code Quality:**
| Skill | When |
|-------|------|
| `superpowers:test-driven-development` | Implementing any feature or bugfix |
| `superpowers:systematic-debugging` | Any bug, test failure, or unexpected behavior |
| `superpowers:requesting-code-review` | Completing tasks, major features, before merging |
| `superpowers:receiving-code-review` | Received feedback, before implementing suggestions |

**Design & Writing:**
| Skill | When |
|-------|------|
| `frontend-design:frontend-design` | Building web components, pages, applications |
| `design-principles` | Building dashboards, admin UIs (Linear/Notion/Stripe style) |
| `elements-of-style:writing-clearly-and-concisely` | Any prose humans read (docs, commits, errors, UI text) |
| `superpowers:writing-skills` | Creating/editing skills |

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

### Daem0n MCP Tools Reference (v2.10.0)

**Core Memory:**
| Tool | When to Use |
|------|-------------|
| `remember` | Store decision/pattern/warning/learning after context_check |
| `remember_batch` | Bulk import multiple memories atomically |
| `recall` | Semantic search - find relevant past decisions |
| `search_memories` | Full-text search with TF-IDF ranking |
| `recall_for_file` | Get all memories for a specific file |
| `find_related` | Find semantically similar memories |

**Session & Context:**
| Tool | When to Use |
|------|-------------|
| `get_briefing` | **FIRST CALL** - stats, warnings, recent decisions, git changes |
| `context_check` | **BEFORE remember/add_rule** - preflight check for conflicts |
| `set_active_context` | Pin memory to always-hot working context |
| `get_active_context` | List all hot memories |
| `clear_active_context` | Clear when switching focus areas |

**Rules Engine:**
| Tool | When to Use |
|------|-------------|
| `add_rule` | Create decision tree rule (semantic trigger matching) |
| `check_rules` | Before significant changes - check if rules apply |
| `list_rules` | See all configured project rules |
| `update_rule` | Modify existing rule |

**Memory Lifecycle:**
| Tool | When to Use |
|------|-------------|
| `record_outcome` | After decision plays out - track if it worked |
| `pin_memory` | Protect critical memory from pruning |
| `archive_memory` | Hide but preserve (soft delete) |
| `prune_memories` | Clean old low-value memories (dry_run first!) |
| `cleanup_memories` | Merge duplicates |
| `compact_memories` | Consolidate episodic memories into summary |

**Memory Graph:**
| Tool | When to Use |
|------|-------------|
| `link_memories` | Connect related memories (led_to, supersedes, depends_on, conflicts_with) |
| `unlink_memories` | Remove relationship |
| `trace_chain` | Follow causal chains forward/backward |
| `get_graph` | Export as JSON or Mermaid diagram |

**Time Travel:**
| Tool | When to Use |
|------|-------------|
| `get_memory_versions` | See how a memory evolved |
| `get_memory_at_time` | Point-in-time memory state |

**Communities (GraphRAG):**
| Tool | When to Use |
|------|-------------|
| `rebuild_communities` | Detect clusters via tag co-occurrence |
| `list_communities` | See all memory clusters |
| `get_community_details` | Expand community with all members |
| `recall_hierarchical` | Layered recall (summaries first, then details) |

**Entity Extraction:**
| Tool | When to Use |
|------|-------------|
| `recall_by_entity` | Find memories mentioning a class/function/file |
| `list_entities` | Most frequently mentioned entities |
| `backfill_entities` | Extract entities from existing memories |

**Code Intelligence:**
| Tool | When to Use |
|------|-------------|
| `index_project` | Index codebase with tree-sitter (run when stale) |
| `find_code` | Semantic search across indexed code |
| `analyze_impact` | Blast radius analysis before changes |

**Cross-Project:**
| Tool | When to Use |
|------|-------------|
| `link_projects` | Enable cross-project memory reading |
| `list_linked_projects` | See linked projects |
| `consolidate_linked_databases` | Merge for monorepo transitions |

**Automation:**
| Tool | When to Use |
|------|-------------|
| `add_context_trigger` | Auto-recall when file/tag/entity matches pattern |
| `list_context_triggers` | See configured triggers |
| `check_context_triggers` | Evaluate triggers for current context |

**Utilities:**
| Tool | When to Use |
|------|-------------|
| `scan_todos` | Find TODO/FIXME/HACK/BUG comments |
| `ingest_doc` | Import external docs from URL |
| `propose_refactor` | Generate refactor suggestions for a file |
| `rebuild_index` | Force rebuild TF-IDF/vector indexes |
| `export_data` / `import_data` | Backup/restore memories |
| `health` | Check server status and stats |

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

## Phase 2: Curriculum System (Complete)

**Concept-Based SRS:**
- SRS tracks subconcept mastery, not individual exercises
- Tables: `subconcept_progress` (SRS state), `exercise_attempts` (usage)
- Hook: `useConceptSRS` for concept-based scheduling
- Selection: Hybrid algorithm (level progression for learning, least-seen for review)

**Taxonomy Fields (all exercises):**
| Field | Description |
|-------|-------------|
| `concept` | Primary milestone (e.g., `control-flow`, `functions`) |
| `subconcept` | Specific skill (e.g., `for`, `enumerate`, `lambda`) |
| `level` | `intro` → `practice` → `edge` → `integrated` |
| `prereqs` | Subconcepts that must be mastered first |
| `type` | `write`, `fill-in`, or `predict` |
| `pattern` | Programming pattern (e.g., `iteration`, `accumulator`) |
| `objective` | **(Phase 2.5)** Learning target, 10-150 chars starting with verb |
| `targets` | **(Phase 2.5)** Subconcepts tested (required for `integrated` level) |

**Exercise Types:**
- `write`: Write code from scratch (CodeInput component)
- `fill-in`: Complete blanks in template (FillInExercise component)
- `predict`: Predict code output (PredictOutputExercise component)

**Curriculum Graph:** `src/lib/curriculum/python.json` - 10 concepts, 54 subconcepts with DAG structure

**Implementation Plan:** `docs/plans/2026-01-05-phase2-curriculum-overhaul.md`

---

## Phase 2.5: Curriculum Enhancement (Complete)

**New Exercise Fields:**
- `objective` (required): Learning target, 10-150 chars starting with verb
- `targets` (conditional): Array of subconcepts for integrated exercises

**Algorithm Improvements:**
- **Anti-repeat pattern**: Sessions avoid showing same pattern consecutively (`src/lib/session/anti-repeat.ts`)
- **Multi-subconcept SRS**: Integrated exercises credit all `targets` on success (`src/lib/srs/multi-target.ts`)

**New Subconcepts Added (11 total):**
| Concept | New Subconcepts |
|---------|-----------------|
| control-flow | `zip`, `reversed`, `sorted`, `any-all` |
| collections | `mutability` |
| numbers-booleans | `truthiness`, `comparisons` |
| functions | `defaults`, `args-kwargs` |
| modules-files | `pathlib`, `main-guard` |

**Content Expansion:**
- 278 total exercises (was 171, +107 new across Phases 2.5-2.7)
- All exercises now have `objective` field
- Integrated exercises have `targets` arrays

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
10. ✅ Custom UI Components - Premium Tailwind components with warm amber theme, framer-motion animations
11. ✅ Theme System - CSS variables for colors/fonts, cn() utility, CodeEditor component, Card elevation variants
12. ✅ Phase 2.5 Curriculum Enhancement - objective/targets fields, anti-repeat pattern selection, multi-target SRS credit, 47 new exercises (218 total)
13. ✅ Learning Mode - Teaching cards for new subconcepts (explanation + example), TeachingCard component with blue styling, SessionProgress blue segments, interleaved teaching pairs, curriculum loader for teaching content
14. ✅ Phase 2.7 Exercise Variety - Three exercise types (write, fill-in, predict), PredictOutputExercise component, user-selectable experience levels controlling type ratios, type-balanced session selection algorithm, 60 new exercises (30 fill-in + 30 predict)
15. ✅ Curriculum Restructure - Restructured 10 exercise files to match curriculum graph exactly, renamed files (loops→control-flow, classes→oop, exceptions→error-handling), deleted redundant files, added 84 new exercises including OOP (inheritance, classmethod, properties) and error-handling (finally, raising), fill-in/predict for all concepts. 332 total exercises.
16. ✅ SM-2 to FSRS Migration - Migrated SRS algorithm from SM-2 to FSRS (ts-fsrs library). Adapter pattern isolates library (`src/lib/srs/fsrs/`), Quality→Rating mapping (0-2→Again, 3→Hard, 4→Good, 5→Easy), new DB columns (stability, difficulty, fsrs_state, reps, lapses), validateFsrsState guard for corrupted data. 97 FSRS tests across 8 files (adapter, mapping, regression, invariants, edge-cases, tsfsrs-contract, integration, fsrs-flow). 797 total tests.
17. ✅ Dedicated Teaching Examples - Added `exampleCode` field to `SubconceptTeaching` type for dedicated instructional examples. Teaching cards now show curated examples instead of exercise answers, preventing "see example → do exact same thing" anti-pattern. All 54 subconcepts updated with dedicated `exampleCode` content. TeachingCard prefers exampleCode, session supports exampleCode-only teaching cards. Design doc: `docs/plans/2026-01-07-dedicated-teaching-examples.md`.
18. ✅ Dynamic Exercises Phase 1 (Foundation) - Generator infrastructure for parameterized exercises preventing rote memorization. Deterministic seeding (`sha256(userId:exerciseSlug:date)`), Mustache template rendering (`{{param}}`), seeded random utilities (seedrandom library), slice-bounds generator with property-based tests (fast-check, 1000 seeds). 59 new generator tests, 870 total tests. Files: `src/lib/generators/` (types, seed, utils, render, index, definitions/slice-bounds). Design docs: `docs/plans/2026-01-06-dynamic-exercise-system-design.md`, `docs/plans/2026-01-07-dynamic-exercises-master-plan.md`.
19. ✅ Dynamic Exercises Phase 2 (Grading Infrastructure) - Two-pass grading system (Pass 1: correctness, Pass 2: construct coaching). 8 construct detection patterns (slice, comprehension, f-string, ternary, enumerate, zip, lambda, generator-expr). `gradeAnswer()` orchestrator, `checkConstruct()`/`checkAnyConstruct()` functions, `CoachingFeedback` React component. Types: `GradingMethod`, `GradingResult`, `ConstructCheckResult`. Multi-AI review (Codex + Gemini) confirmed implementation solid with known limitations acceptable for coaching. 131 Phase 2 tests (types: 12, construct-check: 68, grading: 26, integration: 25), 998 total tests. Files: `src/lib/exercise/grading.ts`, `construct-check.ts`, `src/components/exercise/CoachingFeedback.tsx`. Design doc: `docs/plans/2026-01-07-dynamic-exercises-phase2-grading.md`.
20. ✅ Dynamic Exercises Phase 3 (Pyodide Integration) - Lazy-loaded Python execution for predict exercises. PyodideContext provider with CDN loading, `usePyodide` hook, `gradeAnswerAsync()` with execution-based grading, graceful fallback to string matching on failure. Execution verification for predict exercises and opt-in write exercises. Files: `src/lib/context/PyodideContext.tsx`, `src/lib/exercise/execution.ts`. Design doc: `docs/plans/2026-01-07-dynamic-exercises-phase3-pyodide.md`.
21. ✅ Dynamic Exercises Phase 4 (Metrics & Logging) - Audit logging for dynamic exercises via `logAttempt()`, dynamic metrics queries for retention/transfer analysis, construct adoption tracking. Files: `src/lib/exercise/log-attempt.ts`, `src/lib/stats/dynamic-metrics.ts`. Design doc: `docs/plans/2026-01-07-dynamic-exercises-phase4-metrics.md`.
22. ✅ Dynamic Exercises Phase 5 (Content Migration) - 23 dynamic exercises across 4 concept files (strings, collections, numbers-booleans, control-flow). 5 generators: slice-bounds, list-values, variable-names, index-values, arithmetic-values. Each generator with property-based tests (fast-check). Dynamic validation script (`pnpm validate:dynamic`). 1088 total tests. Design doc: `docs/plans/2026-01-07-dynamic-exercises-phase5-content.md`.
23. ✅ Dynamic Exercise Expansion (Phase 6) - Variant support architecture (one slug, multiple prompts via generator's `variant` param). 4 new generators: loop-simulation (range output), comparison-logic (boolean expressions), string-ops (method calls), dict-values (dictionary access). 6 new dynamic exercises using new and existing generators. Removed duplicate exercises. Totals: 9 generators, 33 dynamic exercises, 353 total exercises, 143 generator tests. Design doc: `docs/plans/2026-01-07-dynamic-exercise-expansion.md`.
24. ✅ Exercise-List.md Auto-Generation - Created `scripts/generate-exercise-list.ts` to generate Exercise-List.md from YAML source of truth. Audit found documentation claimed 383 exercises but YAML only had 353. Script parses all YAML, computes counts, detects duplicates, generates Obsidian-formatted markdown with "AUTO-GENERATED: DO NOT EDIT" header. Commands: `pnpm generate:exercise-list`, `pnpm generate:exercise-list:obsidian`. Created `docs/plans/exercise-backlog.md` for future exercise ideas.
25. ✅ Skill Tree Progress Visualization - Visual skill tree on dashboard showing all 54 subconcepts as connected nodes organized by 10 concepts. Four node states (locked, available, in-progress, mastered) based on FSRS stability threshold (>=7 days). useSkillTree hook for data fetching, buildSkillTreeData for transformation. Components: SkillTree (main), ConceptCluster, SubconceptNode, DependencyLines (SVG bezier curves). Horizontal scroll, Framer Motion animations, tooltips with state info. Design doc: `docs/plans/2026-01-07-skill-tree-progress-design.md`.
26. ✅ Premium Curriculum Restructure - Multi-AI analysis (Claude, Gemini, Codex) restructured curriculum for optimal learning flow. Split control-flow into `conditionals` and `loops` concepts. 11 concepts, 65 subconcepts (was 10/54). Reordered concept dependencies: conditionals before collections, imports earlier, relaxed error-handling prereqs. Added 157 new exercises (510 total). New subconcepts: if-elif-else, match-case, == vs is, while-loops, nested-loops. All exercises reviewed for pedagogical quality. Design docs: `docs/plans/2026-01-08-premium-curriculum-restructure.md`, `docs/plans/2026-01-08-premium-curriculum-enhancements.md`.

## Phase 2.7: Exercise Variety (Complete)

**Exercise Types:**
- `write`: Write code from scratch (CodeInput) - core skill
- `fill-in`: Complete blanks in template (FillInExercise) - cued recall for learning
- `predict`: Predict code output (PredictOutputExercise) - mental execution for maintenance

**Experience Levels (user-selectable):**
| Level | Write | Fill-in | Predict | Target Persona |
|-------|-------|---------|---------|----------------|
| `refresher` | 80% | 10% | 10% | Rusty Senior |
| `learning` | 50% | 25% | 25% | Intermediate |
| `beginner` | 30% | 35% | 35% | AI-Native Junior |

**New Components:**
- `PredictOutputExercise` - Code display + answer input
- `ExperienceLevelSelector` - Onboarding component

**New Hooks/Functions:**
- `updateExperienceLevel` in useProfile
- `selectExerciseByType` for type-balanced selection
- `checkPredictAnswer` for predict answer matching

**Content:** 60 new exercises across foundations, strings, numbers-booleans

**Design Docs:**
- `docs/plans/2026-01-06-phase27-exercise-variety-design.md`
- `docs/plans/2026-01-06-phase27-implementation-plan.md`

---

## Next Steps

1. **Onboarding:** Integrate ExperienceLevelSelector into user flow
2. **Gamification:** Achievements system, points, leaderboards
3. **Languages:** JavaScript/TypeScript exercises
4. **More Dynamic Exercises:** Continue migrating static exercises to use generators

