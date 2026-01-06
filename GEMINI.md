# SRS-App - Gemini Code Context

> Spaced Repetition Code Syntax Practice Platform

---

## Documentation & Source of Truth

**Obsidian Vault** (`/home/brett/GoogleDrive/Obsidian Vault/SRS-app/`) is the primary source of truth.
- `Index.md` - Project hub
- `Architecture.md` - System design & SRS algorithm
- `Features.md` - Roadmap
- `Database-Schema.md` - PostgreSQL schema & RLS

**Post-task actions:** Update Obsidian docs, Serena memories, and this file if significant changes occurred.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (Strict Mode) |
| UI | React 19, Tailwind CSS 4, framer-motion |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Testing | Vitest (Unit/Integration) + Playwright (E2E) |
| Deployment | Vercel |
| Package Manager | pnpm |

---

## Essential Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm typecheck        # TypeScript type checking
pnpm test             # Run Vitest tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm db:start         # Start local Supabase
pnpm db:reset         # Reset database with migrations
pnpm db:import-exercises  # Import exercises from YAML
pnpm validate:exercises    # Validate exercise YAML schema
```

---

## Project Structure

- `src/app/`: Next.js App Router pages and layouts.
- `src/components/`: React components.
  - `ui/`: Custom UI components.
  - `exercise/`, `session/`, `dashboard/`: Feature-specific components.
- `src/lib/`: Core logic, hooks, and utilities.
  - `srs/`: SM-2 algorithm implementation.
  - `curriculum/`: Exercise content and hierarchy.
  - `supabase/`: Database clients and mappers.
- `tests/`: Vitest (unit/integration) and Playwright (e2e) tests.
- `supabase/`: Migrations, seed data, and configuration.

---

## Key Patterns & Guidelines

### 1. UI & Components
- Use custom UI components via `@/components/ui/`.
- Use the `cn()` utility from `@/lib/utils` for tailwind class merging.
- **Theme:** Dark mode is the default. Use CSS variables from `globals.css` (e.g., `--bg-base`, `--accent-primary`).
- **Elevation:** Use the `elevation` prop (1, 2, 3) on `Card` components.

### 2. TypeScript & Data
- **Strict mode is non-negotiable.** No `any`.
- Database schema: `snake_case` in DB, `camelCase` in app. Use mappers in `src/lib/supabase/mappers.ts`.
- Generated DB types: `src/lib/types/database.generated.ts`.

### 3. Authentication
- Supabase Magic Link with PKCE.
- SSR supported via `@supabase/ssr`.
- State managed via `useAuth` hook.

### 4. Spaced Repetition (SRS)
- Concept-based SRS: Tracking subconcept mastery rather than individual exercises.
- Algorithm: SM-2 (modified).
- Multi-target support: Integrated exercises credit multiple subconcepts on success.

### 5. Coding Style
- **Files:** `kebab-case`
- **Components:** `PascalCase`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

---

## Gemini-Specific Tips

- **Parallelism:** Use parallel tool calls for searching and reading files to speed up context gathering.
- **Verification:** Always run `pnpm typecheck` and `pnpm test` after modifications.
- **Knowledge Retrieval:** Use `grep` or `search_file_content` to find existing patterns before implementing new ones.
- **Context:** If architectural decisions are needed, check `debates/` or use the Debate Hall MCP (if available).

---

## Current Status & Roadmap

**Status:** Phase 2.5 Complete (Curriculum Overhaul, Learning Mode). 218 Python exercises across 54 subconcepts.
**Next:** Phase 3 - Content expansion (fill-in exercises), Gamification (achievements, points), and Mastery criteria.
