# Foundation Roadmap

> Short-term iterative plan to build SRS-App's infrastructure before features.

## Approach

**Philosophy:** Build the foundation first. Database + types + hooks + auth context + error handling + testing setup. More upfront work, but features slot in cleanly afterward.

**Testing:** TDD from the start. Write tests before implementation for everything.

**Structure:** Layered milestones with natural checkpoints. Each layer is independently useful.

---

## Milestone 1: Database & Types

**Goal:** Get the data layer solid so everything else has a stable foundation.

### Deliverables

1. **Supabase Migrations** (`supabase/migrations/`)
   - `profiles` — user preferences, display name, streak data
   - `exercises` — exercise content, language, category, difficulty
   - `user_progress` — SRS state per user/exercise (ease factor, interval, next review)
   - Seed data: 10-20 Python exercises for testing

2. **TypeScript Types** (`src/lib/types/`)
   - `database.types.ts` — auto-generated from Supabase schema
   - `srs.types.ts` — CardState, Quality rating, scheduling types
   - `exercise.types.ts` — Exercise, Category, Language enums

3. **Database Helpers** (`src/lib/supabase/`)
   - Typed query functions for each table
   - Error handling wrappers that return consistent shapes

4. **RLS Policies**
   - Users see only their own progress
   - Exercises are public read
   - Profiles are private to owner

### TDD Approach

- Write migration tests that verify schema constraints
- Write RLS tests that verify policy enforcement
- Types are self-documenting (no tests needed)

---

## Milestone 2: Auth & Hooks

**Goal:** Wrap authentication in a clean abstraction and create reusable data hooks.

### Deliverables

1. **AuthContext** (`src/lib/context/`)
   - `AuthProvider` wrapping the app in `layout.tsx`
   - Exposes: `user`, `loading`, `signIn`, `signOut`
   - Handles auth state subscription cleanup

2. **Hooks** (`src/lib/hooks/`)
   - `useAuth()` — access auth context
   - `useProfile()` — fetch/update current user's profile
   - `useRequireAuth()` — redirect to login if not authenticated

3. **Protected Routes** (`src/components/`)
   - `ProtectedRoute` wrapper component
   - Shows loading state while checking auth
   - Redirects unauthenticated users

4. **Profile Auto-Creation**
   - Supabase trigger: create profile row on user signup
   - Or client-side: create profile on first authenticated load

### TDD Approach

- Write hook tests first (mock Supabase client)
- Write E2E test for: sign in → profile created → redirect to dashboard
- Write test for protected route redirect behavior

---

## Milestone 3: Core Engine & Error Handling

**Goal:** Implement the SRS brain and make the app resilient to failures.

### Deliverables

1. **SRS Algorithm** (`src/lib/srs/`)
   - `algorithm.ts` — SM-2 implementation
     - `calculateNextReview(quality, currentState)` → new state
     - `getDueCards(userProgress[])` → cards ready for review
     - `getNewCards(exercises[], limit)` → new cards to introduce
   - `scheduler.ts` — orchestrates card queue for a session

2. **SRS Hook** (`src/lib/hooks/`)
   - `useSRS(userId)` — fetches due cards, provides `recordAnswer()` function
   - Handles optimistic updates and server sync

3. **Error Handling** (`src/components/`)
   - `ErrorBoundary` — catches React errors, shows fallback UI
   - `Toast` / notification component for user feedback
   - Consistent error shapes across all async operations

4. **Error Utilities** (`src/lib/errors/`)
   - `AppError` class with error codes
   - `handleSupabaseError()` — translates Supabase errors to user-friendly messages

### TDD Approach

- SRS algorithm gets the most thorough tests:
  - Edge cases: first review, failing streaks, ease factor bounds
  - Property-based tests: interval always increases on success
- Error boundary tests: verify fallback renders on throw
- Toast tests: verify correct messages for error types

---

## After Foundation: First Feature

Once the three milestones are complete, you'll have:
- Database with typed queries
- Auth abstraction with hooks
- SRS engine ready to schedule cards
- Error handling throughout

### First Feature: Exercise Engine (MVP)

With the foundation in place:
- Fetch due cards → `useSRS()` hook already provides this
- Display exercise → new UI component, data comes from typed queries
- Check answer → simple string comparison to start
- Update progress → `recordAnswer()` from `useSRS()` handles SRS + persistence

### Dependency Order

```
Milestone 1 (Database & Types)
    ↓ types flow into
Milestone 2 (Auth & Hooks)
    ↓ hooks use types, auth gates data
Milestone 3 (SRS Engine)
    ↓ engine uses hooks + types
Exercise Engine Feature
```

---

## Success Criteria

Foundation is complete when:
- [ ] All tests pass
- [ ] Can authenticate and see profile data
- [ ] Can manually trigger SRS calculation and see correct scheduling
- [ ] Errors display gracefully instead of crashing

---

## Related

- [[Features]] — Full feature roadmap
- [[Architecture]] — System design
- [[Database-Schema]] — Data models
- [[Testing-Strategy]] — Testing approach
