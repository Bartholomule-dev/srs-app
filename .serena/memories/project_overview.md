# SRS-App Project Overview

## Purpose
SRS-App is a gamified web platform for practicing code syntax through spaced repetition. It helps AI-assisted developers maintain their programming fundamentals by providing short, repeatable practice sessions that reinforce muscle memory for programming patterns.

**Target Users:** Developers who use AI assistants (Copilot, Claude, ChatGPT) and want to prevent syntax atrophy.

## Current Status
- **Phase:** Early Development (v0.1.0)
- **Auth System:** ✅ Complete (Magic Link via Supabase)
- **Database Schema:** ✅ Complete (profiles, exercises, user_progress)
- **TypeScript Types:** ✅ Complete (auto-generated + camelCase mappers)
- **Test Infrastructure:** ✅ Complete (Vitest + 304 tests passing)
- **Error Handling:** ✅ Complete (AppError + ErrorBoundary + Toast)
- **Core SRS Engine:** ✅ Complete (SM-2 algorithm + useSRS hook)
- **Exercise Engine:** ✅ Complete (ExerciseCard + components)
- **Practice Session:** ✅ Complete (useSession + /dashboard + /practice)
- **Seed Data:** 16 Python exercises across 6 categories

## Completed Milestones
1. **Milestone 1: Database & Types** - Migrations, RLS, types, seed data
2. **Milestone 2: Auth & Hooks** - AuthContext, useAuth, useProfile, ProtectedRoute
3. **Milestone 3: SRS Engine & Error Handling** - SM-2 algorithm, useSRS, AppError, Toast
4. **Milestone 4: Exercise Engine** - normalizePython, checkAnswer, ExerciseCard components
5. **Milestone 5: Practice Session** - useSession, SessionProgress, /dashboard, /practice pages
6. **Milestone 6: Exercise Library** - 50 Python exercises in YAML, import script, validation

## Next Up
- **Gamification:** Scoring system, streaks, achievements
- **Username Selection UI**
- **E2E Tests**

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Package Manager | pnpm |

## Key Architectural Decisions
- **SRS Algorithm:** SM-2 variant with easeFactor (1.3-3.0), interval scheduling
- **Auth:** Passwordless Magic Link (email OTP)
- **Database:** PostgreSQL with Row-Level Security (RLS) for data isolation
- **Client:** React Compiler enabled for auto-optimization
- **Exercise Library:** YAML files per category, slug-based identity, imported via pnpm script

## Documentation
Primary documentation lives in Obsidian vault at `/SRS-app/`:
- Index.md - Project hub
- Architecture.md - System design
- Database-Schema.md - Schema details
- Testing-Strategy.md - Test approach
