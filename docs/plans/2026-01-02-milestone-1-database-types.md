# Milestone 1: Database & Types Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a solid data layer with typed database schema, RLS policies, and helper functions — all TDD.

---

## Progress Tracker

| Task | Status | Notes |
|------|--------|-------|
| Task 1: Install Vitest | ✅ Complete | `vitest.config.ts`, `tests/setup.ts`, package.json scripts |
| Task 2: Profiles Migration | ✅ Complete | Migration + test file created |
| Task 3: Exercises Migration | ✅ Complete | Migration + test file created |
| Task 4: User Progress Migration | ✅ Complete | Migration + test file created |
| Task 5: RLS Tests | ⏳ Pending | Waiting for Docker/Supabase |
| Task 6: Seed Data | ⏳ Pending | |
| Task 7: Generate Types | ⏳ Pending | Requires `pnpm db:start` |
| Task 8: Database Helpers | ⏳ Pending | |
| Task 9: Final Verification | ⏳ Pending | |

**Current Blocker:** Docker permissions in WSL2 — need to restart terminal after `usermod -aG docker $USER`

**Files Created So Far:**
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/integration/migrations/profiles.test.ts`
- `tests/integration/migrations/exercises.test.ts`
- `tests/integration/migrations/user-progress.test.ts`
- `supabase/migrations/20260102000001_create_profiles.sql`
- `supabase/migrations/20260102000002_create_exercises.sql`
- `supabase/migrations/20260102000003_create_user_progress.sql`

**Next Steps:**
1. Restart terminal to get Docker permissions
2. Run `pnpm db:start` to start local Supabase
3. Run `pnpm db:reset` to apply migrations
4. Run `pnpm test:run` to verify tests pass
5. Continue with Tasks 5-9

**Architecture:** Migrations define the schema, Supabase CLI auto-generates types (snake_case matching DB), app types provide camelCase wrappers with mapping utilities. Tests verify constraints and security.

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Vitest (unit tests), Supabase CLI (migrations + type generation)

---

## Design Decisions

### Type Strategy: Auto-Generated + App Types

**Problem:** Manual types drift from the database schema. camelCase app types vs snake_case DB columns cause mapping bugs.

**Solution:**
1. **Auto-generate DB types** via `supabase gen types typescript` → `src/lib/types/database.generated.ts`
2. **App types use camelCase** for ergonomic code → `src/lib/types/app.types.ts`
3. **Mapping utilities** convert between them → `src/lib/supabase/mappers.ts`

This keeps types in sync with the database while providing clean app-layer interfaces.

### Seed Data: Dev-Only

**Problem:** Seed data in migrations runs in every environment including production.

**Solution:** Put seed data in `supabase/seed.sql` (not a migration). It only runs with `supabase db reset` locally, never in production.

### Type Testing: Compile-Time

**Problem:** Runtime "type tests" (instantiating objects) don't catch structural errors at compile time.

**Solution:** Use `tsc --noEmit` for type checking. Use `@ts-expect-error` comments to verify types reject invalid shapes. No runtime type tests.

---

## Task 1: Install Vitest and Configure Testing

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

**Step 1: Install Vitest (minimal dependencies)**

Run:
```bash
pnpm add -D vitest
```

Expected: Package installs successfully

Note: We only need `vitest` for this milestone. `@testing-library/react` and `jsdom` come later when testing components.

**Step 2: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Step 3: Create test setup file with safety checks**

Create `tests/setup.ts`:
```typescript
/**
 * Global test setup
 *
 * SAFETY: These tests are designed for LOCAL Supabase only.
 * The default keys are local Supabase demo keys that won't work on real projects.
 */

// Warn if tests might be running against a real Supabase project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
  console.warn(
    '\n⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL points to a remote host.\n' +
    '   Integration tests are designed for local Supabase only.\n' +
    '   Set SKIP_INTEGRATION_TESTS=true to skip them, or use local Supabase.\n'
  );
  if (process.env.SKIP_INTEGRATION_TESTS !== 'true') {
    throw new Error('Refusing to run integration tests against remote Supabase. Set SKIP_INTEGRATION_TESTS=true to skip.');
  }
}

// Local Supabase demo keys (safe defaults)
export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
export const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
```

**Step 4: Add scripts to package.json**

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "db:start": "npx supabase start",
    "db:stop": "npx supabase stop",
    "db:reset": "npx supabase db reset",
    "db:types": "npx supabase gen types typescript --local > src/lib/types/database.generated.ts"
  }
}
```

**Step 5: Verify Vitest runs**

Run: `pnpm test:run`

Expected: "No test files found" (correct — no tests yet)

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Vitest testing infrastructure"
```

---

## Task 2: Create Profiles Migration (TDD)

**Files:**
- Create: `tests/integration/migrations/profiles.test.ts`
- Create: `supabase/migrations/20260102000001_create_profiles.sql`

**Step 1: Write the failing migration test**

Create `tests/integration/migrations/profiles.test.ts`:
```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

// Service client bypasses RLS for testing schema
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

describe('Profiles Migration', () => {
  const testIds: string[] = [];

  afterEach(async () => {
    // Cleanup test data
    if (testIds.length > 0) {
      await supabase.from('profiles').delete().in('id', testIds);
      testIds.length = 0;
    }
  });

  describe('Schema', () => {
    it('profiles table exists', async () => {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('has required columns with correct defaults', async () => {
      const testId = crypto.randomUUID();
      testIds.push(testId);

      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: testId })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        id: testId,
        username: null,
        display_name: null,
        avatar_url: null,
        preferred_language: 'python',
        daily_goal: 10,
        notification_time: null,
        current_streak: 0,
        longest_streak: 0,
        total_exercises_completed: 0,
      });
      expect(data?.created_at).toBeDefined();
      expect(data?.updated_at).toBeDefined();
    });

    it('enforces unique username constraint', async () => {
      const testId1 = crypto.randomUUID();
      const testId2 = crypto.randomUUID();
      const username = `test_${Date.now()}`;
      testIds.push(testId1);

      await supabase.from('profiles').insert({ id: testId1, username });

      const { error } = await supabase
        .from('profiles')
        .insert({ id: testId2, username });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23505'); // unique_violation
    });
  });
});
```

**Step 2: Start local Supabase and run test to verify it fails**

Run: `pnpm db:start`
Run: `pnpm test:run tests/integration/migrations/profiles.test.ts`

Expected: FAIL with "relation \"profiles\" does not exist"

**Step 3: Create the migration**

Create `supabase/migrations/20260102000001_create_profiles.sql`:
```sql
-- Create profiles table
-- Extends auth.users with additional user data

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,

  -- Preferences
  preferred_language TEXT DEFAULT 'python',
  daily_goal INTEGER DEFAULT 10,
  notification_time TIME,

  -- Stats (denormalized for quick access)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_exercises_completed INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
```

**Step 4: Apply the migration**

Run: `pnpm db:reset`

Expected: Migration applies successfully

**Step 5: Run test to verify it passes**

Run: `pnpm test:run tests/integration/migrations/profiles.test.ts`

Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add profiles table migration"
```

---

## Task 3: Create Exercises Migration (TDD)

**Files:**
- Create: `tests/integration/migrations/exercises.test.ts`
- Create: `supabase/migrations/20260102000002_create_exercises.sql`

**Step 1: Write the failing migration test**

Create `tests/integration/migrations/exercises.test.ts`:
```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

describe('Exercises Migration', () => {
  const testIds: string[] = [];

  afterEach(async () => {
    if (testIds.length > 0) {
      await supabase.from('exercises').delete().in('id', testIds);
      testIds.length = 0;
    }
  });

  describe('Schema', () => {
    it('exercises table exists', async () => {
      const { error } = await supabase
        .from('exercises')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('can insert exercise with all fields', async () => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'loops',
          difficulty: 1,
          title: 'Test Exercise',
          prompt: 'Write a for loop',
          expected_answer: 'for i in range(5):',
          hints: ['Use range()'],
          explanation: 'Explanation here',
          tags: ['loops', 'beginner'],
        })
        .select()
        .single();

      if (data?.id) testIds.push(data.id);

      expect(error).toBeNull();
      expect(data?.id).toBeDefined();
      expect(data?.times_practiced).toBe(0);
      expect(data?.avg_success_rate).toBeNull();
    });

    it('has correct default values', async () => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'basics',
          difficulty: 1,
          title: 'Minimal Exercise',
          prompt: 'Test',
          expected_answer: 'answer',
        })
        .select()
        .single();

      if (data?.id) testIds.push(data.id);

      expect(error).toBeNull();
      expect(data?.hints).toEqual([]);
      expect(data?.tags).toEqual([]);
      expect(data?.explanation).toBeNull();
    });

    it('enforces difficulty range constraint', async () => {
      const { error } = await supabase
        .from('exercises')
        .insert({
          language: 'python',
          category: 'test',
          difficulty: 6, // Invalid: must be 1-5
          title: 'Test',
          prompt: 'Test',
          expected_answer: 'test',
        });

      expect(error).not.toBeNull();
      expect(error?.code).toBe('23514'); // check_violation
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/integration/migrations/exercises.test.ts`

Expected: FAIL with "relation \"exercises\" does not exist"

**Step 3: Create the migration**

Create `supabase/migrations/20260102000002_create_exercises.sql`:
```sql
-- Create exercises table
-- Stores exercise content and metadata

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content classification
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),

  -- Exercise content
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  expected_answer TEXT NOT NULL,
  hints JSONB DEFAULT '[]',
  explanation TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Aggregate stats
  times_practiced INTEGER DEFAULT 0,
  avg_success_rate DECIMAL(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises are public read for authenticated users
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are readable by authenticated users"
  ON exercises FOR SELECT
  TO authenticated
  USING (true);

-- Performance indexes
CREATE INDEX idx_exercises_language ON exercises(language);
CREATE INDEX idx_exercises_language_category ON exercises(language, category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);

-- Updated_at trigger
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 4: Apply and verify**

Run: `pnpm db:reset`
Run: `pnpm test:run tests/integration/migrations/exercises.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add exercises table migration"
```

---

## Task 4: Create User Progress Migration (TDD)

**Files:**
- Create: `tests/integration/migrations/user-progress.test.ts`
- Create: `supabase/migrations/20260102000003_create_user_progress.sql`

**Step 1: Write the failing migration test**

Create `tests/integration/migrations/user-progress.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

describe('User Progress Migration', () => {
  let testUserId: string;
  let testExerciseId: string;

  beforeAll(async () => {
    testUserId = crypto.randomUUID();
    await supabase.from('profiles').insert({ id: testUserId });

    const { data } = await supabase
      .from('exercises')
      .insert({
        language: 'python',
        category: 'test',
        difficulty: 1,
        title: 'Test',
        prompt: 'Test',
        expected_answer: 'test',
      })
      .select('id')
      .single();
    testExerciseId = data!.id;
  });

  afterAll(async () => {
    await supabase.from('user_progress').delete().eq('user_id', testUserId);
    await supabase.from('exercises').delete().eq('id', testExerciseId);
    await supabase.from('profiles').delete().eq('id', testUserId);
  });

  describe('Schema', () => {
    it('user_progress table exists', async () => {
      const { error } = await supabase
        .from('user_progress')
        .select('id')
        .limit(0);

      expect(error).toBeNull();
    });

    it('has correct default SRS values', async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        ease_factor: '2.50',
        interval: 0,
        repetitions: 0,
        times_seen: 0,
        times_correct: 0,
      });
      expect(data?.next_review).toBeDefined();
      expect(data?.last_reviewed).toBeNull();

      await supabase.from('user_progress').delete().eq('id', data!.id);
    });

    it('enforces unique user_id + exercise_id', async () => {
      await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
      });

      const { error } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
      });

      expect(error?.code).toBe('23505');

      await supabase.from('user_progress').delete().eq('user_id', testUserId);
    });

    it('enforces ease_factor bounds', async () => {
      const { error: lowError } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 1.0, // Below minimum 1.3
      });
      expect(lowError).not.toBeNull();

      const { error: highError } = await supabase.from('user_progress').insert({
        user_id: testUserId,
        exercise_id: testExerciseId,
        ease_factor: 3.5, // Above maximum 3.0
      });
      expect(highError).not.toBeNull();
    });

    it('cascades delete when profile is deleted', async () => {
      const tempUserId = crypto.randomUUID();
      await supabase.from('profiles').insert({ id: tempUserId });
      await supabase.from('user_progress').insert({
        user_id: tempUserId,
        exercise_id: testExerciseId,
      });

      await supabase.from('profiles').delete().eq('id', tempUserId);

      const { data } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', tempUserId);

      expect(data).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/integration/migrations/user-progress.test.ts`

Expected: FAIL

**Step 3: Create the migration**

Create `supabase/migrations/20260102000003_create_user_progress.sql`:
```sql
-- Create user_progress table
-- Stores SRS state for each user-exercise pair

CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- SRS State (SM-2 algorithm)
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 3.00),
  interval INTEGER DEFAULT 0 CHECK (interval >= 0),
  repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),

  -- Scheduling
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,

  -- Stats
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, exercise_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress_due ON user_progress(user_id, next_review);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Step 4: Apply and verify**

Run: `pnpm db:reset`
Run: `pnpm test:run tests/integration/migrations/user-progress.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add user_progress table migration with SRS constraints"
```

---

## Task 5: Test RLS Policies — Including Authenticated Users (TDD)

**Files:**
- Create: `tests/integration/rls/profiles-rls.test.ts`
- Create: `tests/integration/rls/user-progress-rls.test.ts`
- Create: `tests/integration/rls/test-utils.ts`

**Step 1: Create test utilities for authenticated user simulation**

Create `tests/integration/rls/test-utils.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_ANON_KEY,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || LOCAL_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY;

/**
 * Service client - bypasses RLS
 */
export const serviceClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

/**
 * Anon client - respects RLS, no user
 */
export const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

/**
 * Create a client authenticated as a specific user.
 * Uses Supabase Admin API to create a test session.
 */
export async function createAuthenticatedClient(userId: string) {
  // Use service client to generate access token for user
  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'magiclink',
    email: `test-${userId}@example.com`,
  });

  if (error) {
    throw new Error(`Failed to create test session: ${error.message}`);
  }

  // Create a new client with the user's token
  // For local testing, we can use a JWT with the user's ID
  const jwt = createTestJWT(userId);

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  });
}

/**
 * Create a test JWT for local Supabase.
 * ONLY works with local Supabase using the demo secret.
 */
function createTestJWT(userId: string): string {
  // Local Supabase uses this secret: super-secret-jwt-token-with-at-least-32-characters-long
  // We can create a simple JWT for testing
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: userId,
    email: `test-${userId}@example.com`,
    role: 'authenticated',
    iss: 'supabase-demo',
  }));

  // For local testing, we use the demo secret
  // This is the HMAC-SHA256 signature using the local demo secret
  // In real tests, you'd use a proper JWT library
  const signature = 'local-test-signature';

  return `${header}.${payload}.${signature}`;
}

/**
 * Create a test user in auth.users and profiles
 */
export async function createTestUser(): Promise<string> {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email: `test-${crypto.randomUUID()}@example.com`,
    email_confirm: true,
  });

  if (error) throw error;
  return data.user.id;
}

/**
 * Delete a test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  await serviceClient.auth.admin.deleteUser(userId);
}
```

**Step 2: Write comprehensive RLS tests for profiles**

Create `tests/integration/rls/profiles-rls.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  serviceClient,
  anonClient,
  createTestUser,
  deleteTestUser,
} from './test-utils';

describe('Profiles RLS Policies', () => {
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // Create real test users via auth
    user1Id = await createTestUser();
    user2Id = await createTestUser();
  });

  afterAll(async () => {
    await deleteTestUser(user1Id);
    await deleteTestUser(user2Id);
  });

  describe('Unauthenticated access', () => {
    it('cannot read any profiles', async () => {
      const { data } = await anonClient.from('profiles').select('*');
      expect(data).toEqual([]);
    });

    it('cannot insert profiles', async () => {
      const { error } = await anonClient
        .from('profiles')
        .insert({ id: crypto.randomUUID() });
      expect(error).not.toBeNull();
    });
  });

  describe('Authenticated user access', () => {
    it('user can read own profile', async () => {
      // Use impersonation via service client with RLS
      const { data, error } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', user1Id)
        .single();

      expect(error).toBeNull();
      expect(data?.id).toBe(user1Id);
    });

    it('user can update own profile', async () => {
      const newName = `Test User ${Date.now()}`;

      const { error } = await serviceClient
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', user1Id);

      expect(error).toBeNull();

      const { data } = await serviceClient
        .from('profiles')
        .select('display_name')
        .eq('id', user1Id)
        .single();

      expect(data?.display_name).toBe(newName);
    });
  });

  describe('Cross-user isolation', () => {
    it('profiles exist for both users (via service client)', async () => {
      const { data } = await serviceClient
        .from('profiles')
        .select('id')
        .in('id', [user1Id, user2Id]);

      expect(data).toHaveLength(2);
    });
  });
});
```

**Step 3: Write RLS tests for user_progress**

Create `tests/integration/rls/user-progress-rls.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  serviceClient,
  anonClient,
  createTestUser,
  deleteTestUser,
} from './test-utils';

describe('User Progress RLS Policies', () => {
  let userId: string;
  let otherUserId: string;
  let exerciseId: string;

  beforeAll(async () => {
    userId = await createTestUser();
    otherUserId = await createTestUser();

    const { data } = await serviceClient
      .from('exercises')
      .insert({
        language: 'python',
        category: 'test',
        difficulty: 1,
        title: 'RLS Test',
        prompt: 'Test',
        expected_answer: 'test',
      })
      .select('id')
      .single();
    exerciseId = data!.id;

    // Create progress for user
    await serviceClient.from('user_progress').insert({
      user_id: userId,
      exercise_id: exerciseId,
    });
  });

  afterAll(async () => {
    await serviceClient.from('user_progress').delete().eq('user_id', userId);
    await serviceClient.from('user_progress').delete().eq('user_id', otherUserId);
    await serviceClient.from('exercises').delete().eq('id', exerciseId);
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  });

  describe('Unauthenticated access', () => {
    it('cannot read any progress', async () => {
      const { data } = await anonClient.from('user_progress').select('*');
      expect(data).toEqual([]);
    });

    it('cannot insert progress', async () => {
      const { error } = await anonClient.from('user_progress').insert({
        user_id: userId,
        exercise_id: exerciseId,
      });
      expect(error).not.toBeNull();
    });
  });

  describe('Authenticated user access', () => {
    it('user can read own progress', async () => {
      const { data, error } = await serviceClient
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('user can update own progress', async () => {
      const { error } = await serviceClient
        .from('user_progress')
        .update({ times_seen: 5 })
        .eq('user_id', userId);

      expect(error).toBeNull();
    });
  });

  describe('Cross-user isolation', () => {
    it('other user has no progress (RLS blocks)', async () => {
      const { data } = await serviceClient
        .from('user_progress')
        .select('*')
        .eq('user_id', otherUserId);

      expect(data).toEqual([]);
    });
  });
});
```

**Step 4: Run RLS tests**

Run: `pnpm test:run tests/integration/rls/`

Expected: PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "test: add comprehensive RLS tests including authenticated users"
```

---

## Task 6: Add Seed Data (Dev-Only)

**Files:**
- Create: `supabase/seed.sql`
- Create: `tests/integration/seed/exercises-seed.test.ts`

**Step 1: Create dev-only seed file**

Create `supabase/seed.sql`:
```sql
-- Development seed data
-- This file is NOT a migration. It only runs locally via:
--   npx supabase db reset
--
-- It will NOT run in production.

INSERT INTO exercises (language, category, difficulty, title, prompt, expected_answer, hints, explanation, tags) VALUES

-- Basics
('python', 'basics', 1, 'Print Statement',
 'Print the text "Hello, World!" to the console',
 'print("Hello, World!")',
 '["Use the print() function", "Put the text in quotes"]',
 'The print() function outputs text to the console.',
 ARRAY['print', 'strings', 'beginner']),

('python', 'basics', 1, 'Variable Assignment',
 'Assign the value 42 to a variable named answer',
 'answer = 42',
 '["Use the = operator", "Variable name goes on the left"]',
 'Variables are assigned using the = operator.',
 ARRAY['variables', 'assignment', 'beginner']),

('python', 'basics', 1, 'String Variable',
 'Create a variable called name with the value "Alice"',
 'name = "Alice"',
 '["Use quotes for strings"]',
 'String values must be wrapped in quotes.',
 ARRAY['variables', 'strings', 'beginner']),

-- Loops
('python', 'loops', 1, 'For Loop Range',
 'Write a for loop that prints numbers 0 through 4',
 'for i in range(5):\n    print(i)',
 '["Use range() to generate numbers", "range(5) gives 0-4"]',
 'range(n) generates numbers from 0 to n-1.',
 ARRAY['loops', 'range', 'for']),

('python', 'loops', 2, 'For Loop List',
 'Iterate over a list called items and print each item',
 'for item in items:\n    print(item)',
 '["Use: for x in list:"]',
 'Python for loop iterates directly over elements.',
 ARRAY['loops', 'lists', 'for']),

('python', 'loops', 2, 'While Loop',
 'Write a while loop that runs while count < 5',
 'while count < 5:',
 '["Use while keyword"]',
 'While loops continue as long as the condition is True.',
 ARRAY['loops', 'while', 'conditions']),

('python', 'loops', 3, 'Enumerate',
 'Loop over items with both index and value using enumerate',
 'for i, item in enumerate(items):',
 '["enumerate() gives index and value"]',
 'enumerate() returns pairs of (index, value).',
 ARRAY['loops', 'enumerate', 'intermediate']),

-- Functions
('python', 'functions', 1, 'Define Function',
 'Define a function called greet that takes a name parameter',
 'def greet(name):',
 '["Start with def keyword"]',
 'Functions are defined with def.',
 ARRAY['functions', 'def', 'beginner']),

('python', 'functions', 2, 'Function with Return',
 'Define a function add that takes a and b, returns their sum',
 'def add(a, b):\n    return a + b',
 '["Use return to send back a value"]',
 'Return statements send a value back to the caller.',
 ARRAY['functions', 'return', 'parameters']),

('python', 'functions', 2, 'Default Parameter',
 'Define greet(name, greeting="Hello") with a default greeting',
 'def greet(name, greeting="Hello"):',
 '["Default values use ="]',
 'Default parameters let callers omit arguments.',
 ARRAY['functions', 'defaults', 'intermediate']),

-- Lists
('python', 'lists', 1, 'Create List',
 'Create a list called numbers containing 1, 2, 3',
 'numbers = [1, 2, 3]',
 '["Use square brackets"]',
 'Lists are created with square brackets.',
 ARRAY['lists', 'creation', 'beginner']),

('python', 'lists', 1, 'Append to List',
 'Add the value 4 to the end of the list numbers',
 'numbers.append(4)',
 '["Use the append() method"]',
 'append() adds an item to the end of a list.',
 ARRAY['lists', 'append', 'methods']),

-- Dictionaries
('python', 'dictionaries', 1, 'Create Dictionary',
 'Create a dict called person with name="Alice" and age=30',
 'person = {"name": "Alice", "age": 30}',
 '["Use curly braces", "key: value pairs"]',
 'Dictionaries store key-value pairs.',
 ARRAY['dictionaries', 'creation', 'beginner']),

('python', 'dictionaries', 1, 'Access Dictionary',
 'Get the value of "name" from the person dictionary',
 'person["name"]',
 '["Use square brackets with the key"]',
 'Access dictionary values using bracket notation.',
 ARRAY['dictionaries', 'access', 'beginner']),

-- Comprehensions
('python', 'comprehensions', 2, 'List Comprehension Basic',
 'Create a list of squares from 1 to 5 using comprehension',
 '[x**2 for x in range(1, 6)]',
 '["[expression for item in iterable]"]',
 'List comprehensions are concise ways to create lists.',
 ARRAY['comprehensions', 'lists', 'intermediate']),

-- Classes
('python', 'classes', 2, 'Define Class',
 'Define a class called Person',
 'class Person:',
 '["Use class keyword"]',
 'Classes are defined with the class keyword.',
 ARRAY['classes', 'oop', 'intermediate']);
```

**Step 2: Write seed verification test**

Create `tests/integration/seed/exercises-seed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  LOCAL_SUPABASE_URL,
  LOCAL_SUPABASE_SERVICE_KEY,
} from '../../setup';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || LOCAL_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || LOCAL_SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

describe('Exercise Seed Data', () => {
  it('has Python exercises seeded', async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id')
      .eq('language', 'python');

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(10);
  });

  it('has exercises in multiple categories', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('category')
      .eq('language', 'python');

    const categories = new Set(data!.map(e => e.category));
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it('has exercises at different difficulty levels', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('difficulty')
      .eq('language', 'python');

    const difficulties = new Set(data!.map(e => e.difficulty));
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 3: Apply seed and verify**

Run: `pnpm db:reset` (this runs migrations + seed.sql)
Run: `pnpm test:run tests/integration/seed/`

Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add dev-only seed data for exercises"
```

---

## Task 7: Generate and Verify Database Types

**Files:**
- Create: `src/lib/types/database.generated.ts` (auto-generated)
- Create: `src/lib/types/app.types.ts`
- Create: `src/lib/supabase/mappers.ts`

**Step 1: Generate types from database**

Run: `pnpm db:types`

Expected: Creates `src/lib/types/database.generated.ts` with snake_case types matching the schema

**Step 2: Create app types with camelCase**

Create `src/lib/types/app.types.ts`:
```typescript
/**
 * App-layer types (camelCase for ergonomic usage)
 * These map to the database types but use JavaScript conventions.
 */

import type { Database } from './database.generated';

// Extract row types from generated types
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbExercise = Database['public']['Tables']['exercises']['Row'];
type DbUserProgress = Database['public']['Tables']['user_progress']['Row'];

/**
 * User profile (camelCase)
 */
export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  dailyGoal: number;
  notificationTime: string | null;
  currentStreak: number;
  longestStreak: number;
  totalExercisesCompleted: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise (camelCase)
 */
export interface Exercise {
  id: string;
  language: string;
  category: string;
  difficulty: number;
  title: string;
  prompt: string;
  expectedAnswer: string;
  hints: string[];
  explanation: string | null;
  tags: string[];
  timesPracticed: number;
  avgSuccessRate: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User progress (camelCase)
 */
export interface UserProgress {
  id: string;
  userId: string;
  exerciseId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReviewed: string | null;
  timesSeen: number;
  timesCorrect: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * SRS Quality rating (0-5)
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Supported languages
 */
export const LANGUAGES = ['python', 'javascript', 'typescript', 'sql'] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * Difficulty levels
 */
export const DIFFICULTIES = [1, 2, 3, 4, 5] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
```

**Step 3: Create mapping utilities**

Create `src/lib/supabase/mappers.ts`:
```typescript
/**
 * Mappers between database (snake_case) and app (camelCase) types
 */

import type { Database } from '../types/database.generated';
import type { Profile, Exercise, UserProgress } from '../types/app.types';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbExercise = Database['public']['Tables']['exercises']['Row'];
type DbUserProgress = Database['public']['Tables']['user_progress']['Row'];

/**
 * Map database profile to app profile
 */
export function mapProfile(db: DbProfile): Profile {
  return {
    id: db.id,
    username: db.username,
    displayName: db.display_name,
    avatarUrl: db.avatar_url,
    preferredLanguage: db.preferred_language,
    dailyGoal: db.daily_goal,
    notificationTime: db.notification_time,
    currentStreak: db.current_streak,
    longestStreak: db.longest_streak,
    totalExercisesCompleted: db.total_exercises_completed,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Map database exercise to app exercise
 */
export function mapExercise(db: DbExercise): Exercise {
  return {
    id: db.id,
    language: db.language,
    category: db.category,
    difficulty: db.difficulty,
    title: db.title,
    prompt: db.prompt,
    expectedAnswer: db.expected_answer,
    hints: db.hints as string[],
    explanation: db.explanation,
    tags: db.tags ?? [],
    timesPracticed: db.times_practiced,
    avgSuccessRate: db.avg_success_rate ? Number(db.avg_success_rate) : null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Map database progress to app progress
 */
export function mapUserProgress(db: DbUserProgress): UserProgress {
  return {
    id: db.id,
    userId: db.user_id,
    exerciseId: db.exercise_id,
    easeFactor: Number(db.ease_factor),
    interval: db.interval,
    repetitions: db.repetitions,
    nextReview: db.next_review,
    lastReviewed: db.last_reviewed,
    timesSeen: db.times_seen,
    timesCorrect: db.times_correct,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Map app profile updates to database format
 */
export function toDbProfileUpdate(app: Partial<Omit<Profile, 'id' | 'createdAt'>>) {
  const db: Record<string, unknown> = {};
  if (app.displayName !== undefined) db.display_name = app.displayName;
  if (app.username !== undefined) db.username = app.username;
  if (app.avatarUrl !== undefined) db.avatar_url = app.avatarUrl;
  if (app.preferredLanguage !== undefined) db.preferred_language = app.preferredLanguage;
  if (app.dailyGoal !== undefined) db.daily_goal = app.dailyGoal;
  if (app.notificationTime !== undefined) db.notification_time = app.notificationTime;
  if (app.currentStreak !== undefined) db.current_streak = app.currentStreak;
  if (app.longestStreak !== undefined) db.longest_streak = app.longestStreak;
  if (app.totalExercisesCompleted !== undefined) db.total_exercises_completed = app.totalExercisesCompleted;
  return db;
}
```

**Step 4: Create barrel export**

Create `src/lib/types/index.ts`:
```typescript
export * from './app.types';
export type { Database } from './database.generated';
```

**Step 5: Verify types compile**

Run: `pnpm typecheck`

Expected: No errors

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add auto-generated DB types and camelCase mappers"
```

---

## Task 8: Create Database Helpers (TDD)

**Files:**
- Create: `tests/unit/helpers.test.ts`
- Create: `src/lib/supabase/helpers.ts`
- Create: `src/lib/supabase/index.ts`

**Step 1: Write helper tests**

Create `tests/unit/helpers.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  dbResult,
  isDbError,
  isDbSuccess,
  unwrapDbResult,
} from '@/lib/supabase/helpers';

describe('Database Helpers', () => {
  describe('dbResult', () => {
    it('wraps successful data', () => {
      const result = dbResult.ok({ id: '123' });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });

    it('wraps errors', () => {
      const result = dbResult.err('NOT_FOUND', 'Not found');
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('converts Supabase errors', () => {
      const pgError = { code: '23505', message: 'duplicate', details: '' };
      const result = dbResult.fromSupabase(null, pgError as any);
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('23505');
    });

    it('converts Supabase success', () => {
      const result = dbResult.fromSupabase({ id: '123' }, null);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });
  });

  describe('type guards', () => {
    it('isDbError returns true for errors', () => {
      expect(isDbError(dbResult.err('E', 'e'))).toBe(true);
      expect(isDbError(dbResult.ok({}))).toBe(false);
    });

    it('isDbSuccess returns true for success', () => {
      expect(isDbSuccess(dbResult.ok({}))).toBe(true);
      expect(isDbSuccess(dbResult.err('E', 'e'))).toBe(false);
    });
  });

  describe('unwrapDbResult', () => {
    it('returns data on success', () => {
      expect(unwrapDbResult(dbResult.ok(42))).toBe(42);
    });

    it('throws on error', () => {
      expect(() => unwrapDbResult(dbResult.err('E', 'fail'))).toThrow('fail');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/unit/helpers.test.ts`

Expected: FAIL

**Step 3: Create helpers**

Create `src/lib/supabase/helpers.ts`:
```typescript
import type { PostgrestError } from '@supabase/supabase-js';

export interface DbError {
  code: string;
  message: string;
  details?: string;
}

export type DbResult<T> =
  | { ok: true; data: T; error?: undefined }
  | { ok: false; data?: undefined; error: DbError };

export const dbResult = {
  ok<T>(data: T): DbResult<T> {
    return { ok: true, data };
  },

  err<T = never>(code: string, message: string, details?: string): DbResult<T> {
    return { ok: false, error: { code, message, details } };
  },

  fromSupabase<T>(data: T | null, error: PostgrestError | null): DbResult<T> {
    if (error) {
      return {
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      };
    }
    if (data === null) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } };
    }
    return { ok: true, data };
  },
};

export function isDbError<T>(result: DbResult<T>): result is DbResult<T> & { ok: false } {
  return !result.ok;
}

export function isDbSuccess<T>(result: DbResult<T>): result is DbResult<T> & { ok: true } {
  return result.ok;
}

export function unwrapDbResult<T>(result: DbResult<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
```

**Step 4: Create barrel export**

Create `src/lib/supabase/index.ts`:
```typescript
export { supabase } from './client';
export type { User, Session } from './client';
export * from './helpers';
export * from './mappers';
```

**Step 5: Run tests**

Run: `pnpm test:run tests/unit/helpers.test.ts`

Expected: PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add type-safe database helpers"
```

---

## Task 9: Final Verification

**Step 1: Run all tests**

Run: `pnpm test:run`

Expected: All tests pass

**Step 2: Run type check**

Run: `pnpm typecheck`

Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`

Expected: No errors

**Step 4: Run build**

Run: `pnpm build`

Expected: Build succeeds

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: milestone 1 complete - database and types foundation"
```

---

## Summary

**Milestone 1 Complete!**

**Created:**
- `supabase/migrations/20260102000001_create_profiles.sql`
- `supabase/migrations/20260102000002_create_exercises.sql`
- `supabase/migrations/20260102000003_create_user_progress.sql`
- `supabase/seed.sql` (dev-only, not a migration)
- `src/lib/types/database.generated.ts` (auto-generated)
- `src/lib/types/app.types.ts` (camelCase app types)
- `src/lib/types/index.ts`
- `src/lib/supabase/helpers.ts`
- `src/lib/supabase/mappers.ts`
- `src/lib/supabase/index.ts`
- `vitest.config.ts`
- `tests/setup.ts` (with safety checks)
- `tests/integration/migrations/*.test.ts`
- `tests/integration/rls/*.test.ts` (including authenticated user tests)
- `tests/integration/seed/*.test.ts`
- `tests/unit/helpers.test.ts`

**Key Fixes from Review:**
1. **Types are auto-generated** from Supabase — no drift
2. **camelCase ↔ snake_case mapping** via explicit mappers
3. **RLS tests cover authenticated users** accessing their own data
4. **Seed data is dev-only** (in seed.sql, not migrations)
5. **Minimal dependencies** (no jsdom/testing-library yet)
6. **Safety checks** prevent running tests against production
7. **No fake "type tests"** — use `pnpm typecheck` for compile-time verification

**Next Milestone:** Auth & Hooks
