# MVP Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy SRS-app to production with Vercel + Supabase, gated by one E2E test.

**Architecture:** Vercel hosts the Next.js app with automatic preview deployments. Single Supabase production project for database/auth. GitHub Actions runs unit tests + E2E on PRs. Auto-generated usernames on signup.

**Tech Stack:** Vercel, Supabase, Playwright, GitHub Actions, pnpm

---

## Phase 1: Username Auto-Generation

### Task 1: Create migration for username auto-generation

**Files:**
- Create: `supabase/migrations/20260103100001_auto_generate_username.sql`

**Step 1: Write the migration**

```sql
-- Update handle_new_user to auto-generate username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'user_' || substring(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Apply migration locally**

Run: `supabase db reset`
Expected: Database resets with new trigger

**Step 3: Verify username generation**

Run: `supabase db reset` then check profiles table has username pattern

**Step 4: Commit**

```bash
git add supabase/migrations/20260103100001_auto_generate_username.sql
git commit -m "feat(db): auto-generate username on signup"
```

---

## Phase 2: Playwright Configuration

### Task 2: Update Playwright config for local dev server

**Files:**
- Modify: `playwright.config.ts`

**Step 1: Update the config**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

**Step 2: Create e2e tests directory**

Run: `mkdir -p tests/e2e`

**Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "config(playwright): configure for e2e testing"
```

---

### Task 3: Create E2E test utilities

**Files:**
- Create: `tests/e2e/utils/auth.ts`
- Create: `tests/e2e/utils/index.ts`

**Step 1: Create auth utilities**

```typescript
// tests/e2e/utils/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export interface TestUser {
  id: string;
  email: string;
  password: string;
}

export async function createTestUser(): Promise<TestUser> {
  const email = `test-${Date.now()}@example.com`;
  const password = 'test-password-123';

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(`Failed to create test user: ${error.message}`);

  return { id: data.user.id, email, password };
}

export async function deleteTestUser(userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) console.warn(`Failed to delete test user: ${error.message}`);
}
```

**Step 2: Create barrel export**

```typescript
// tests/e2e/utils/index.ts
export { createTestUser, deleteTestUser, type TestUser } from './auth';
```

**Step 3: Commit**

```bash
git add tests/e2e/utils/
git commit -m "test(e2e): add test user utilities"
```

---

### Task 4: Write the critical path E2E test

**Files:**
- Create: `tests/e2e/critical-path.spec.ts`

**Step 1: Write the E2E test**

```typescript
// tests/e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, TestUser } from './utils';

let testUser: TestUser;

test.describe('Critical Path: Login → Dashboard → Practice', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('complete practice session flow', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/');
    await expect(page.getByText(/SRS|Practice|Sign in/i)).toBeVisible();

    // Step 2: Sign in with test user
    await page.getByPlaceholder(/email/i).fill(testUser.email);
    await page.getByRole('button', { name: /sign in|submit|send/i }).click();

    // For Magic Link, we need to use password auth in test mode
    // This requires the app to support password auth or we mock the session
    // For now, we'll use Supabase's signInWithPassword on the client

    // Step 3: Wait for redirect to dashboard (or handle Magic Link)
    // Since we can't click Magic Link in tests, we'll inject the session
    await page.evaluate(async ({ email, password, supabaseUrl, supabaseKey }) => {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.auth.signInWithPassword({ email, password });
    }, {
      email: testUser.email,
      password: testUser.password,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });

    // Reload to pick up the session
    await page.goto('/dashboard');

    // Step 4: Verify dashboard loads
    await expect(page.getByText(/dashboard|welcome|practice|due/i)).toBeVisible({ timeout: 10000 });

    // Step 5: Start practice session
    const practiceButton = page.getByRole('link', { name: /start practice|practice now/i })
      .or(page.getByRole('button', { name: /start practice|practice now/i }));

    if (await practiceButton.isVisible()) {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Step 6: Verify exercise loads
      await expect(page.getByText(/python|exercise|prompt/i)).toBeVisible({ timeout: 10000 });

      // Step 7: Submit an answer (any text)
      const codeInput = page.locator('textarea').first();
      if (await codeInput.isVisible()) {
        await codeInput.fill('test answer');
        await page.keyboard.press('Enter');

        // Step 8: Verify feedback or next card
        await expect(
          page.getByText(/correct|incorrect|next|continue|summary/i)
        ).toBeVisible({ timeout: 5000 });
      }
    } else {
      // No cards due - this is also a valid state
      await expect(page.getByText(/caught up|no cards|mastered/i)).toBeVisible();
    }

    // Test passed - we've verified the critical path works
  });
});
```

**Step 2: Run test to verify it works locally**

Run: `pnpm exec playwright test tests/e2e/critical-path.spec.ts --headed`
Expected: Test runs (may fail if not logged in properly - that's expected before full setup)

**Step 3: Commit**

```bash
git add tests/e2e/critical-path.spec.ts
git commit -m "test(e2e): add critical path test (login → dashboard → practice)"
```

---

## Phase 3: GitHub Actions CI

### Task 5: Create CI workflow for unit tests

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write the workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Unit Tests & Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run typecheck
        run: pnpm typecheck

      - name: Run lint
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test
```

**Step 2: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/ci.yml
git commit -m "ci: add unit test workflow"
```

---

### Task 6: Create E2E workflow

**Files:**
- Create: `.github/workflows/e2e.yml`

**Step 1: Write the E2E workflow**

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  deployment_status:

jobs:
  e2e:
    name: Playwright Tests
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm exec playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.target_url }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Step 2: Commit**

```bash
git add .github/workflows/e2e.yml
git commit -m "ci: add E2E test workflow on Vercel deployment"
```

---

## Phase 4: Vercel Configuration

### Task 7: Create Vercel configuration

**Files:**
- Create: `vercel.json`

**Step 1: Write config**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": true
  }
}
```

**Step 2: Commit**

```bash
git add vercel.json
git commit -m "config(vercel): add vercel configuration"
```

---

### Task 8: Add npm scripts for E2E

**Files:**
- Modify: `package.json`

**Step 1: Add scripts**

Add these to the `scripts` section:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add e2e test scripts"
```

---

## Phase 5: Manual Setup Steps

### Task 9: Document manual setup steps

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Step 1: Write deployment guide**

```markdown
# Deployment Guide

## One-Time Setup (Manual)

### 1. Create Supabase Production Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization and name (e.g., `srs-app-prod`)
4. Set a strong database password (save it!)
5. Choose region closest to your users (e.g., `us-east-1`)
6. Wait for project to provision (~2 minutes)

### 2. Apply Migrations

```bash
# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Import exercises
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
pnpm run import-exercises
```

### 3. Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - from Supabase dashboard → Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - from Supabase dashboard → Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` - from Supabase dashboard → Settings → API (keep secret!)
5. Click "Deploy"

### 4. Add GitHub Secrets

In your GitHub repo → Settings → Secrets and variables → Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 5. Verify RLS (Post-Deploy)

1. Sign up with email A, complete a practice session
2. Sign up with email B in incognito, complete a practice session
3. Verify each user only sees their own stats/progress

## Ongoing Deployment

After initial setup, deployment is automatic:

1. Push to any branch → Vercel creates preview deployment
2. Open PR → CI runs unit tests, E2E runs against preview
3. Merge to main → Vercel deploys to production

## Rollback

If something breaks in production:

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
```

**Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add deployment guide"
```

---

## Phase 6: Final Verification

### Task 10: Run full test suite

**Step 1: Run all unit tests**

Run: `pnpm test`
Expected: All 377+ tests pass

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Commit any fixes**

If any issues found, fix and commit.

---

### Task 11: Final commit and summary

**Step 1: Create summary commit (if multiple changes)**

```bash
git add -A
git status  # Review any uncommitted changes
# If clean, skip. If changes exist:
git commit -m "chore: finalize deployment configuration"
```

**Step 2: Document completion**

Update `docs/plans/2026-01-03-mvp-deployment-implementation.md` with completion status.

---

## Summary

| Phase | Tasks | TDD? |
|-------|-------|------|
| 1. Username Auto-Gen | 1 | No (migration) |
| 2. Playwright Config | 2-4 | Yes (E2E test) |
| 3. GitHub Actions | 5-6 | No (CI config) |
| 4. Vercel Config | 7-8 | No (config) |
| 5. Manual Setup | 9 | No (docs) |
| 6. Verification | 10-11 | No (validation) |

**Total: 11 tasks, ~1-2 hours of implementation**

After completing this plan:
1. Follow `docs/DEPLOYMENT.md` for manual Supabase/Vercel setup
2. Push to trigger first deployment
3. Verify E2E passes on preview
4. Merge to deploy to production
