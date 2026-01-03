# SRS-App - Claude Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## CRITICAL: Documentation Must Stay Current

**This is extremely high priority.** All three documentation sources MUST be kept up to date:

1. **Obsidian Vault (`/SRS-app/`)** - Project docs, architecture, features, status
2. **Serena Memories (`.serena/memories/`)** - Codebase structure, conventions, overview
3. **CLAUDE.md** - Quick reference, commands, patterns, milestones

**Requirements:**
- Factor documentation updates into ALL implementation plans
- Update docs immediately after completing any feature or milestone
- When making changes, update all three sources (not just one)
- Include doc updates in task completion checklists

**After any significant work:**
```
1. Update Obsidian: Index.md status, Features.md checkboxes, relevant docs
2. Update Serena: project_overview.md, codebase_structure.md if structure changed
3. Update CLAUDE.md: Status, structure, milestones, any new patterns
```

---

## Source of Truth

**Obsidian Vault: `/SRS-app/`** - All project documentation lives in Obsidian.

Use `mcp__obsidian__*` tools to read/update documentation:
- `Index.md` - Project hub and status overview
- `Vision.md` - Product philosophy and target audience
- `Tech-Stack.md` - Technology decisions and rationale
- `Architecture.md` - System design and SRS algorithm
- `Database-Schema.md` - PostgreSQL schema and RLS policies
- `Features.md` - Feature roadmap and implementation status
- `Development-Setup.md` - Local environment guide
- `Business-Model.md` - Monetization and growth strategy
- `Testing-Strategy.md` - Testing approach with examples

**Always check Obsidian first** for project context before making significant changes.

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
| UI | React 19, Tailwind CSS 4 |
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
    └── supabase/         # Client (browser), server, helpers, mappers

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

### Styling
Tailwind CSS 4 with CSS variables for theming. Dark mode via `prefers-color-scheme`.

### Components
- Use `"use client"` directive for interactive components
- Server Components for static/metadata content
- React Compiler enabled for auto-optimization

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Skills (Invoke with `Skill` tool)

**CRITICAL: Check if a skill applies BEFORE taking any action.** Even 1% chance = invoke the skill.

### Process Skills (Use First - Determine HOW to approach)

| Skill | When to Use |
|-------|-------------|
| `superpowers:brainstorming` | **MANDATORY** before ANY creative work - features, components, modifications |
| `superpowers:systematic-debugging` | When encountering ANY bug, test failure, or unexpected behavior |
| `superpowers:test-driven-development` | Before writing implementation code for features/bugfixes |
| `superpowers:writing-plans` | When you have spec/requirements for a multi-step task |

### Implementation Skills (Use Second - Guide execution)

| Skill | When to Use |
|-------|-------------|
| `frontend-design:frontend-design` | Creating web components, pages, or applications with high design quality |
| `superpowers:executing-plans` | Execute a written plan with review checkpoints |
| `superpowers:subagent-driven-development` | Execute plans with independent tasks in current session |
| `superpowers:dispatching-parallel-agents` | When facing 2+ independent tasks without shared state |

### Workflow Skills

| Skill | When to Use |
|-------|-------------|
| `superpowers:verification-before-completion` | **MANDATORY** before claiming work is complete/fixed/passing |
| `superpowers:requesting-code-review` | After completing tasks, before merging |
| `superpowers:receiving-code-review` | When receiving feedback, before implementing suggestions |
| `superpowers:finishing-a-development-branch` | When implementation complete and tests pass |
| `superpowers:using-git-worktrees` | Starting feature work needing isolation |
| `superpowers:writing-skills` | Creating or editing skills |

### Utility Skills

| Skill | When to Use |
|-------|-------------|
| `gemini` | Delegate to Gemini for searching, file exploration, simple tasks (saves context) |
| `playwright-cli` | Running browser tests, debugging UI, checking page behavior |

---

## MCP Servers

### Daem0n MCP (Project Memory)

Persistent semantic memory for decisions, patterns, warnings, and learnings across sessions.

**Session Start:**
- `mcp__daem0nmcp__get_briefing` - **Call first** to get session context, recent decisions, active warnings

**Remembering:**
- `mcp__daem0nmcp__remember` - Store decision/pattern/warning/learning
- `mcp__daem0nmcp__remember_batch` - Store multiple memories at once
- `mcp__daem0nmcp__record_outcome` - Record if a decision worked or failed

**Recalling:**
- `mcp__daem0nmcp__recall` - Semantic search for relevant memories by topic
- `mcp__daem0nmcp__recall_for_file` - Get all memories for a specific file
- `mcp__daem0nmcp__search_memories` - Full-text search across all memories
- `mcp__daem0nmcp__context_check` - Quick pre-flight check before making changes

**Rules (Automatic Guidance):**
- `mcp__daem0nmcp__add_rule` - Create rule with must_do/must_not/ask_first
- `mcp__daem0nmcp__check_rules` - Check if action triggers any rules
- `mcp__daem0nmcp__list_rules` - List all configured rules
- `mcp__daem0nmcp__update_rule` - Modify existing rule

**Knowledge Graph:**
- `mcp__daem0nmcp__link_memories` - Create relationship between memories (led_to, supersedes, depends_on, conflicts_with)
- `mcp__daem0nmcp__trace_chain` - Traverse memory graph to understand causal chains
- `mcp__daem0nmcp__find_related` - Find semantically related memories
- `mcp__daem0nmcp__get_graph` - Get subgraph for visualization (JSON or Mermaid)

**Maintenance:**
- `mcp__daem0nmcp__health` - Check server status
- `mcp__daem0nmcp__scan_todos` - Find TODO/FIXME/HACK comments in codebase
- `mcp__daem0nmcp__propose_refactor` - Get refactoring suggestions based on memory context
- `mcp__daem0nmcp__cleanup_memories` - Find and merge duplicate memories
- `mcp__daem0nmcp__export_data` / `mcp__daem0nmcp__import_data` - Backup/restore

### Obsidian (Documentation Vault)

All project documentation lives in Obsidian vault `/SRS-app/`.

**Reading:**
- `mcp__obsidian__read_note` - Read a single note
- `mcp__obsidian__read_multiple_notes` - Batch read (max 10)
- `mcp__obsidian__get_frontmatter` - Extract frontmatter only
- `mcp__obsidian__get_notes_info` - Get metadata without content

**Writing:**
- `mcp__obsidian__write_note` - Create/overwrite note (modes: overwrite, append, prepend)
- `mcp__obsidian__patch_note` - Efficient partial update via string replacement
- `mcp__obsidian__update_frontmatter` - Update frontmatter only

**Navigation:**
- `mcp__obsidian__list_directory` - Browse vault structure
- `mcp__obsidian__search_notes` - Search by content or frontmatter
- `mcp__obsidian__move_note` - Rename/move notes

**Organization:**
- `mcp__obsidian__manage_tags` - Add/remove/list tags
- `mcp__obsidian__delete_note` - Delete with confirmation

### Serena (Code Intelligence)

Semantic code analysis and editing - prefer over raw file operations.

**Understanding Code:**
- `mcp__serena__get_symbols_overview` - **Start here** for new files - get high-level symbol list
- `mcp__serena__find_symbol` - Find symbols by name path pattern (supports depth, include_body)
- `mcp__serena__find_referencing_symbols` - Find all references to a symbol
- `mcp__serena__search_for_pattern` - Regex search with context lines

**Editing Code:**
- `mcp__serena__replace_symbol_body` - Replace entire symbol definition
- `mcp__serena__replace_content` - Regex-based replacement (preferred for partial edits)
- `mcp__serena__insert_before_symbol` / `mcp__serena__insert_after_symbol` - Add code relative to symbols
- `mcp__serena__rename_symbol` - Rename across entire codebase

**File Operations:**
- `mcp__serena__read_file` - Read file or chunk (prefer symbols when possible)
- `mcp__serena__create_text_file` - Create new file
- `mcp__serena__list_dir` - List directory contents
- `mcp__serena__find_file` - Find files by mask

**Memory (Serena's own):**
- `mcp__serena__list_memories` / `mcp__serena__read_memory` / `mcp__serena__write_memory`

**Utilities:**
- `mcp__serena__execute_shell_command` - Run shell commands
- `mcp__serena__activate_project` - Switch active project
- `mcp__serena__check_onboarding_performed` / `mcp__serena__onboarding` - Project setup

### Context7 (Library Documentation)

Query up-to-date docs for any library/framework.

- `mcp__plugin_context7_context7__resolve-library-id` - **Call first** to get library ID
- `mcp__plugin_context7_context7__query-docs` - Query docs with the resolved ID

**Example flow:**
```
1. resolve-library-id(libraryName="react", query="how to use useEffect")
2. query-docs(libraryId="/facebook/react", query="useEffect cleanup")
```

### IDE Integration

- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint errors (optionally for specific file)
- `mcp__ide__executeCode` - Execute Python in Jupyter kernel (for notebooks)

### Debate Hall (Multi-Perspective Deliberation)

Structured AI-mediated debates using Wind/Wall/Door dialectic for architectural decisions, design exploration, and RFC ratification.

**The Three Roles:**
- **Wind (PATHOS)**: Expansive visionary - "What if..." - explores possibilities without constraints
- **Wall (ETHOS)**: Grounding critic - "Yes, but..." - identifies obstacles and practical limits
- **Door (LOGOS)**: Synthesizing decider - "Therefore..." - integrates viewpoints into action

**Core Operations:**
- `mcp__debate-hall__init_debate` - Start debate (thread_id must be `YYYY-MM-DD-topic` format)
- `mcp__debate-hall__add_turn` - Record contribution (role: Wind/Wall/Door, cognition: PATHOS/ETHOS/LOGOS)
- `mcp__debate-hall__get_debate` - View state and transcript
- `mcp__debate-hall__close_debate` - Finalize with Door's synthesis

**Orchestration:**
- `mcp__debate-hall__pick_next_speaker` - Control speaker sequence (mediated mode only)

**Administrative:**
- `mcp__debate-hall__force_close_debate` - Emergency shutdown
- `mcp__debate-hall__tombstone_turn` - Redact content preserving hash chain

**GitHub Integration:**
- `mcp__debate-hall__github_sync_debate` - Post turns to Discussions/Issues
- `mcp__debate-hall__ratify_rfc` - Generate ADR as PR from closed debate
- `mcp__debate-hall__human_interject` - Inject human GitHub comments into debate

**Modes:**
- **Fixed**: Predetermined Wind→Wall→Door progression (default)
- **Mediated**: Dynamic speaker selection via `pick_next_speaker`

**Multi-Agent Debates with CLI Tools:**

Claude can autonomously orchestrate multi-model debates using `gemini` and `codex` CLIs:

```bash
# CLI commands for non-interactive AI responses:
gemini -p "prompt"       # Gemini response
codex exec "prompt"      # Codex response
```

**Autonomous orchestration flow:**
1. Claude initializes debate via `init_debate`
2. Claude plays Wind (visionary) and adds turn
3. Claude runs `gemini -p "..."` → captures Wall's critique → adds turn
4. Claude runs `codex exec "..."` → captures Door's synthesis → adds turn
5. Claude closes debate with final synthesis

**Role assignments by model strength:**

| Role | Model | Why |
|------|-------|-----|
| Wind (PATHOS) | Claude | Strong at expansive thinking, exploring possibilities |
| Wall (ETHOS) | Gemini | Practical constraints, grounding, broad knowledge |
| Door (LOGOS) | Codex | Code-focused, action-oriented, implementation details |

**Use Cases:**
- Architectural decisions requiring multiple perspectives
- RFC exploration before implementation
- Risk analysis (Wind=opportunity, Wall=risk, Door=mitigation)
- Design review with structured critique

---

## Tool Selection Guide

### When exploring codebase:
1. **Open-ended exploration** → Use `Task` with `subagent_type=Explore`
2. **Find specific symbol** → `mcp__serena__find_symbol`
3. **Understand file structure** → `mcp__serena__get_symbols_overview`
4. **Find pattern in code** → `mcp__serena__search_for_pattern` or `Grep`

### When editing code:
1. **Replace whole function/class** → `mcp__serena__replace_symbol_body`
2. **Partial edit within symbol** → `mcp__serena__replace_content` (regex mode)
3. **Add new code** → `mcp__serena__insert_after_symbol`
4. **Rename across codebase** → `mcp__serena__rename_symbol`

### When starting work:
1. **Get session context** → `mcp__daem0nmcp__get_briefing`
2. **Check for relevant memories** → `mcp__daem0nmcp__recall` or `mcp__daem0nmcp__context_check`
3. **Read project docs** → `mcp__obsidian__read_note`

### When completing work:
1. **Record decisions** → `mcp__daem0nmcp__remember`
2. **Verify before claiming done** → Use `superpowers:verification-before-completion` skill
3. **Update documentation** → `mcp__obsidian__patch_note`

---

## Database (Implemented)

See `Database-Schema.md` in Obsidian for full schema. Key tables:

- `profiles` - User data with auto-generated username, stats (streak, accuracy, total)
- `exercises` - Exercise content with slug-based identity (50 Python exercises)
- `user_progress` - SRS state per user/exercise (SM-2 algorithm)

RLS enabled on all user tables. Auto-generated usernames on signup (`user_` + UUID prefix).

---

## SRS Algorithm (SM-2)

Core scheduling logic (see `Architecture.md`):
- `easeFactor`: 1.3-3.0 difficulty modifier
- `interval`: Days until next review
- `repetitions`: Consecutive correct answers
- Quality 0-2 = fail (reset), 3-5 = pass (increase interval)

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
9. ✅ UI/UX Redesign - Landing page (Hero, Features, HowItWorks), dashboard with Greeting/PracticeCTA, immersive practice mode, celebration session summary

## Next Steps

1. Username selection UI (auto-generated for now)
2. Advanced gamification (achievements, leaderboards)
3. Additional languages (JavaScript/TypeScript, SQL)

---

## Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright](https://playwright.dev/docs)
