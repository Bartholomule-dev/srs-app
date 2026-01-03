# MVP Deployment Design

> Design document for deploying SRS-app to production with Vercel + Supabase.

**Status:** Approved
**Date:** 2026-01-03
**Decision source:** Multi-model debate (Claude/Gemini/Codex) + brainstorming session

---

## Summary

Deploy the feature-complete SRS-app to production using Vercel for hosting and a new Supabase project for the database. Use Vercel preview deployments as staging, with one E2E test gating production deploys.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Preview Deploys    │    │     Production Deploy       │ │
│  │  (per PR/branch)    │    │     (main branch)           │ │
│  │  *.vercel.app       │    │     srs-app.vercel.app      │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
└─────────────┼───────────────────────────────┼───────────────┘
              │                               │
              └───────────┬───────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (Production)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │   Auth   │  │ Database │  │   RLS    │                  │
│  │(Magic    │  │(profiles,│  │(per-user │                  │
│  │  Link)   │  │exercises,│  │isolation)│                  │
│  │          │  │progress) │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | Vercel | Zero-config Next.js, automatic preview deploys |
| Database | Single Supabase project | Simpler than separate staging/prod |
| Staging | Vercel preview deployments | Free, automatic per PR |
| E2E auth | Supabase test helpers | Bypass Magic Link, test real auth state |
| Usernames | Auto-generate on signup | `user_abc123` format, migration-safe |
| RLS verification | Manual spot-check post-deploy | Quick sanity check, automated later |

---

## E2E Test Strategy

### Single Critical Path Test

One Playwright test covering the core user journey:

```
Login → Dashboard → Start Practice → Answer Card → Session Summary
```

### Test Setup

1. Use Supabase Admin API to create a test user (bypasses Magic Link)
2. Sign in programmatically with `supabase.auth.signInWithPassword()`
3. Run through the practice flow
4. Clean up test user after

### What This Validates

- Auth cookies work on Vercel's edge runtime
- Supabase connection configured correctly
- Protected routes redirect properly
- Database queries work (fetching exercises, saving progress)
- Session flow completes end-to-end

### What We're NOT Testing in E2E

Covered by existing unit/integration tests (377 passing):
- SRS algorithm calculations
- Individual component rendering
- Error handling edge cases

---

## Supabase Setup

### New Production Project

1. Create project at supabase.com
2. Apply migrations: `supabase db push`
3. Import exercises: `pnpm run import-exercises`

### Environment Variables

| Variable | Visibility | Purpose |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Admin operations |

### Username Auto-Generation

Update the `handle_new_user` trigger:

```sql
username := 'user_' || substring(NEW.id::text, 1, 8);
```

Creates usernames like `user_a1b2c3d4` from the user's UUID.

### RLS Verification (Post-Deploy)

Manual spot-check with two accounts:
1. Sign up with two different email addresses
2. Complete one practice session with each
3. Verify each user only sees their own progress

---

## Deployment Workflow

### Git Flow

```
feature-branch → PR → Preview Deploy → E2E passes → Merge → Production
```

### GitHub Actions CI

```yaml
on: pull_request

jobs:
  test:
    - Checkout code
    - Install dependencies (pnpm)
    - Run unit tests (pnpm test)
    - Run typecheck (pnpm typecheck)
    - Run lint (pnpm lint)

  e2e:
    - Wait for Vercel preview deployment
    - Run Playwright against preview URL
    - Upload test artifacts on failure
```

### Trigger Matrix

| Event | Action |
|-------|--------|
| Push to any branch | Vercel creates preview deployment |
| PR opened/updated | CI runs unit tests + E2E against preview |
| PR merged to main | Vercel deploys to production |

### Rollback Strategy

- Vercel keeps previous deployments accessible
- One-click rollback in Vercel dashboard
- No complex rollback scripts needed

---

## Manual vs Automated

### Manual Steps (One-Time, ~15 mins)

- Create Supabase project at supabase.com
- Create Vercel project and connect Git repo
- Copy 3 environment variables to Vercel

### Automated

- Migrations: `supabase db push`
- Exercise import: `pnpm run import-exercises`
- E2E tests: GitHub Actions
- Deployments: Automatic on git push

---

## What We're Shipping

- Full practice flow with 50 Python exercises
- SRS algorithm with streak/accuracy stats
- Auto-generated usernames

## What We're NOT Shipping Yet

- Username selection UI (deferred, create ticket)
- Full E2E test suite (one critical path only)
- Additional languages

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Auth cookies fail on edge runtime | E2E test catches before production |
| RLS policies misconfigured | Manual two-account verification |
| Environment variables wrong | Preview deploy fails visibly |
| Production breaks | One-click Vercel rollback |

---

## Next Steps

1. Create implementation plan with detailed tasks
2. Set up Supabase production project
3. Configure Vercel
4. Write E2E test
5. Set up GitHub Actions
6. Deploy and verify
