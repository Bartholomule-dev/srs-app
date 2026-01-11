# SRS-App Project Overview

## Purpose
SRS-App is a gamified web platform for practicing code syntax through spaced repetition. It helps AI-assisted developers maintain their programming fundamentals by providing short, repeatable practice sessions that reinforce muscle memory for programming patterns.

**Target Users:** Developers who use AI assistants (Copilot, Claude, ChatGPT) and want to prevent syntax atrophy.

## Current Status
- **Phase:** Production Ready (v0.1.0)
- **Auth System:** ✅ Complete (Magic Link via Supabase + auto-generated usernames)
- **Database Schema:** ✅ Complete (profiles, exercises, user_progress, subconcept_progress)
- **TypeScript Types:** ✅ Complete (auto-generated + camelCase mappers)
- **Test Infrastructure:** ✅ Complete (Vitest 2219 tests + Playwright E2E)
- **Error Handling:** ✅ Complete (AppError + ErrorBoundary + Toast)
- **Core SRS Engine:** ✅ Complete (FSRS algorithm + useConceptSRS hook)
- **Exercise Engine:** ✅ Complete (ExerciseCard + components)
- **Practice Session:** ✅ Complete (useConceptSession + /dashboard + /practice)
- **Exercise Library:** ✅ Complete (529 Python exercises, 109 dynamic, across 65 subconcepts)
- **Basic Stats:** ✅ Complete (StatsGrid + useStats + streak/accuracy)
- **Deployment:** ✅ Complete (Vercel + Supabase + GitHub Actions CI/E2E)
- **UI/UX Redesign:** ✅ Complete (Landing page, Header, Dashboard, Practice flow)
- **Phase 2 Curriculum:** ✅ Complete (concept-based SRS, 11 concepts, 65 subconcepts)
- **Phase 3 Gamification:** ✅ Complete (points, streaks, achievements, skill tree)
- **Blueprint + Skin System:** ✅ Complete (15 blueprints, 22 skins, 234 beats)
- **Dynamic Exercises:** ✅ Complete (38 generators, 109 dynamic exercises)
- **Multi-Language Infrastructure:** ✅ Complete (Python + JavaScript stub, per-language progress)

## Completed Milestones
1. **Milestone 1: Database & Types** - Migrations, RLS, types, seed data
2. **Milestone 2: Auth & Hooks** - AuthContext, useAuth, useProfile, ProtectedRoute
3. **Milestone 3: SRS Engine & Error Handling** - SM-2 algorithm, useSRS, AppError, Toast
4. **Milestone 4: Exercise Engine** - normalizePython, checkAnswer, ExerciseCard components
5. **Milestone 5: Practice Session** - useSession, SessionProgress, /dashboard, /practice pages
6. **Milestone 6: Exercise Library** - Python exercises in YAML, import script, validation
7. **Milestone 7: Basic Stats** - StatsCard, StatsGrid, useStats hook, streak/accuracy utilities
8. **Milestone 8: MVP Deployment** - Vercel config, GitHub Actions CI/E2E, Playwright tests
9. **Milestone 9: UI/UX Redesign** - Landing page, Header components, Dashboard improvements
10. **Milestone 10: Custom UI Components** - Premium Tailwind components, framer-motion animations
11. **Milestone 11: Theme System** - CSS variables, fonts, cn() utility, Card elevation
12. **Milestone 12: Answer Matching** - accepted_solutions, alternative syntax support
13. **Milestone 13: Phase 2 Curriculum** - Concept-based SRS, useConceptSession
14. **Milestone 14: Phase 2.5 Enhancement** - objective/targets fields, anti-repeat
15. **Milestone 15: Learning Mode** - Teaching cards, TeachingCard component
16. **Milestone 16: Phase 2.7 Exercise Variety** - write/fill-in/predict types, experience levels
17. **Milestone 17: Curriculum Restructure** - 11 exercise files matching curriculum graph
18. **Milestone 18: SM-2 to FSRS Migration** - FSRS algorithm with ts-fsrs library
19. **Milestone 19: Dedicated Teaching Examples** - exampleCode field
20. **Milestone 20-25: Dynamic Exercises** - 38 generators, two-pass grading, Pyodide, metrics
26. **Milestone 26: Skill Tree Visualization** - Badge tiers, dependency lines
27. **Milestone 27: Phase 3 Gamification** - Points, streaks, achievements, contribution graph
28. **Milestone 28: Blueprint + Skin System** - 15 blueprints, 22 skins, presentation layer
29-31. Milestones 29-31 documented in CLAUDE.md
32. **Milestone 32: Multi-Language Infrastructure** - Language-aware loaders, hooks, UI, JavaScript stub

## Next Up
- **JavaScript Exercises:** Create content for JavaScript curriculum
- **JavaScript Blueprints/Skins:** Presentation layer for JavaScript
- **Onboarding Flow:** Integrate ExperienceLevelSelector into user flow
- **Leaderboards:** Daily/weekly/all-time rankings

## Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Deployment | Vercel + GitHub Actions CI/E2E |
| Package Manager | pnpm |

## Page Structure (UI/UX)

### Home Page (`/`)
- **Unauthenticated:** Landing page with Hero, Features, HowItWorks, and AuthForm
- **Authenticated:** Redirects to `/dashboard`
- Uses LandingHeader (simple, no user stats)

### Dashboard (`/dashboard`)
- Protected route (redirects unauth to home)
- Header with user stats (streak, total cards, accuracy) + Sign Out
- Greeting component (time-based: "Good morning", "Good afternoon", "Good evening")
- PracticeCTA card with due/new card counts and Start Practice button
- StatsGrid with streak, accuracy, cards reviewed today, total mastered

### Practice (`/practice`)
- Protected route (redirects unauth to home)
- **Immersive mode:** No header during practice for focus
- SessionProgress bar with current/total counter
- ExerciseCard flow: answering → feedback → next
- "End Session" link to exit early
- SessionSummary on completion with celebration and encouraging messages

### Component Patterns
- Layout components in `src/components/layout/`
- Landing page components in `src/components/landing/`
- All component directories use barrel exports (`index.ts`)
- Time-based greetings use `Date.getHours()` (morning < 12, afternoon < 17, evening)

## Key Architectural Decisions
- **SRS Algorithm:** FSRS (Free Spaced Repetition Scheduler) via ts-fsrs library
- **Auth:** Passwordless Magic Link (email OTP) + auto-generated usernames
- **Database:** PostgreSQL with Row-Level Security (RLS) for data isolation
- **Client:** React Compiler enabled for auto-optimization
- **Exercise Library:** YAML files per category, slug-based identity, imported via pnpm script
- **E2E Testing:** Playwright with Supabase admin API for test user creation, session injection

## Deployment Architecture
```
GitHub Push → Vercel Preview Deploy → GitHub Actions E2E → (if pass) → Production
```

- **CI Workflow:** typecheck, lint, unit tests on every PR
- **E2E Workflow:** Playwright tests against Vercel preview deployment
- **Production:** Auto-deploy on merge to main

## Documentation
Primary documentation lives in Obsidian vault at `/SRS-app/`:
- Index.md - Project hub
- Architecture.md - System design
- Database-Schema.md - Schema details
- Testing-Strategy.md - Test approach
- docs/DEPLOYMENT.md - Deployment guide (in repo)
