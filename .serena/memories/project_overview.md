# SRS-App Project Overview

## Purpose
SRS-App is a gamified web platform for practicing code syntax through spaced repetition. It helps AI-assisted developers maintain their programming fundamentals by providing short, repeatable practice sessions that reinforce muscle memory for programming patterns.

**Target Users:** Developers who use AI assistants (Copilot, Claude, ChatGPT) and want to prevent syntax atrophy.

## Current Status
- **Phase:** Early Development (v0.1.0)
- **Auth System:** ✅ Complete (Magic Link via Supabase)
- **Database Schema:** ✅ Complete (profiles, exercises, user_progress)
- **TypeScript Types:** ✅ Complete (auto-generated + camelCase mappers)
- **Test Infrastructure:** ✅ Complete (Vitest + 33 tests)
- **Core SRS Engine:** ⏳ Next up
- **Seed Data:** 16 Python exercises across 6 categories

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

## Documentation
Primary documentation lives in Obsidian vault at `/SRS-app/`:
- Index.md - Project hub
- Architecture.md - System design
- Database-Schema.md - Schema details
- Testing-Strategy.md - Test approach
