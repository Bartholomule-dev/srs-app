# SRS-App - Claude Code Context

> Spaced Repetition Code Syntax Practice Platform

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

**Current Status:** Early development - Auth scaffold complete, core SRS features pending.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Playwright |
| Package Manager | pnpm |

---

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint check
pnpm test         # Run Playwright tests
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with fonts/metadata
│   ├── page.tsx        # Home/auth page (client component)
│   └── globals.css     # Tailwind imports
└── lib/
    └── supabase/
        └── client.ts   # Supabase client initialization

supabase/
└── config.toml         # Local Supabase configuration

tests/
└── example.spec.ts     # Playwright E2E tests
```

---

## Key Patterns

### Authentication
Using Supabase Magic Link (passwordless email OTP). Auth state managed via `onAuthStateChange`.

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

## Available MCP Tools

### Obsidian (Documentation)
- `mcp__obsidian__read_note` - Read documentation
- `mcp__obsidian__write_note` - Update documentation
- `mcp__obsidian__search_notes` - Search across docs
- `mcp__obsidian__list_directory` - Browse vault structure

### Serena (Code Intelligence)
- `mcp__serena__find_symbol` - Find code symbols by name
- `mcp__serena__get_symbols_overview` - Get file symbol overview
- `mcp__serena__find_referencing_symbols` - Find symbol references
- `mcp__serena__replace_symbol_body` - Edit symbol definitions
- `mcp__serena__search_for_pattern` - Regex search codebase

### Playwright (Browser Testing)
- `mcp__plugin_playwright_playwright__browser_navigate` - Navigate to URL
- `mcp__plugin_playwright_playwright__browser_snapshot` - Get page accessibility tree
- `mcp__plugin_playwright_playwright__browser_click` - Click elements
- `mcp__plugin_playwright_playwright__browser_type` - Type text

### Context7 (Framework Docs)
- `mcp__plugin_context7_context7__resolve-library-id` - Find library ID
- `mcp__plugin_context7_context7__query-docs` - Query library documentation

### Forgetful (Semantic Memory)
- `mcp__forgetful__execute_forgetful_tool` - Execute memory operations
- `mcp__forgetful__discover_forgetful_tools` - List available tools

### IDE Integration
- `mcp__ide__getDiagnostics` - Get TypeScript/ESLint errors

---

## Database (Planned)

See `Database-Schema.md` in Obsidian for full schema. Key tables:

- `profiles` - Extended user data, preferences, stats
- `exercises` - Exercise content and metadata
- `user_progress` - SRS state per user/exercise (SM-2 algorithm)
- `sessions` - Practice session logs
- `achievements` - Gamification unlocks

RLS enabled on all user tables.

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

## Next Implementation Steps

1. Create database migrations (profiles, exercises, user_progress)
2. Build SRS algorithm in `src/lib/srs/`
3. Create exercise UI components
4. Implement practice session flow
5. Add basic stats dashboard

---

## Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright](https://playwright.dev/docs)
