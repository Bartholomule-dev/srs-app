# Task Completion Checklist

Before considering a task complete, verify the following:

## 1. Code Quality
- [ ] TypeScript compiles without errors: `pnpm typecheck`
- [ ] ESLint passes: `pnpm lint`
- [ ] No `any` types introduced

## 2. Testing
- [ ] All existing tests pass: `pnpm test:run`
- [ ] New tests added for new functionality
- [ ] RLS tests if database changes involve permissions

## 3. Database Changes (if applicable)
- [ ] Migration created via `npx supabase migration new <name>`
- [ ] RLS policies added/updated
- [ ] TypeScript types regenerated: `pnpm db:types`
- [ ] Mappers updated in `src/lib/supabase/mappers.ts` if new tables

## 4. Documentation (CRITICAL - All Three Sources)
**All three must be updated after any significant work:**

- [ ] **Obsidian Vault** (`/SRS-app/`)
  - Index.md - Update status, recent changes
  - Features.md - Check off completed items
  - Relevant topic docs (Architecture, Database-Schema, etc.)

- [ ] **Serena Memories** (`.serena/memories/`)
  - project_overview.md - Current status, milestones
  - codebase_structure.md - If file structure changed

- [ ] **CLAUDE.md**
  - Project status
  - Commands (if new scripts added)
  - Structure (if new directories/files)
  - Milestones (if feature completed)
  - Patterns (if new conventions)

## 5. Git
- [ ] Conventional commit message used
- [ ] Commit focused on single concern
- [ ] No sensitive data (env vars, keys) committed

## 6. Final Verification
- [ ] Dev server runs without errors: `pnpm dev`
- [ ] Feature works as expected in browser
- [ ] No console errors/warnings

## Quick Command Sequence
```bash
pnpm typecheck && pnpm lint && pnpm test:run
```
