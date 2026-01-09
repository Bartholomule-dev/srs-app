# Phase 3.3: Achievements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the achievement system with 18 achievements, unlock detection, and achievements page

**Architecture:** Achievement definitions seeded in database. Server-side RPC checks achievements idempotently. Client-side hook fetches and listens for unlocks.

**Tech Stack:** TypeScript, PostgreSQL RPC, React, Framer Motion, Vitest

**Prerequisite:** Phase 3.2 (Visualization) must be complete

---

## Task 1: Create Achievement Types

**Files:**
- Create: `src/lib/gamification/achievements.ts`
- Test: `tests/unit/gamification/achievements.test.ts`

**Step 1.1: Write the failing tests**

```typescript
// tests/unit/gamification/achievements.test.ts
import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  getAchievementsByCategory,
  type Achievement,
  type AchievementCategory,
} from '@/lib/gamification/achievements';

describe('Achievement types', () => {
  it('ACHIEVEMENTS has 18 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBe(18);
  });

  it('each achievement has required fields', () => {
    for (const [slug, achievement] of Object.entries(ACHIEVEMENTS)) {
      expect(achievement.slug).toBe(slug);
      expect(achievement.name).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(['habit', 'mastery', 'completionist']).toContain(achievement.category);
      expect(achievement.icon).toBeTruthy();
    }
  });
});

describe('getAchievementsByCategory', () => {
  it('returns habit achievements', () => {
    const habits = getAchievementsByCategory('habit');
    expect(habits.length).toBeGreaterThan(0);
    expect(habits.every((a) => a.category === 'habit')).toBe(true);
    expect(habits.find((a) => a.slug === 'first-steps')).toBeTruthy();
  });

  it('returns mastery achievements', () => {
    const mastery = getAchievementsByCategory('mastery');
    expect(mastery.length).toBeGreaterThan(0);
    expect(mastery.every((a) => a.category === 'mastery')).toBe(true);
    expect(mastery.find((a) => a.slug === 'gold-standard')).toBeTruthy();
  });

  it('returns completionist achievements', () => {
    const completionist = getAchievementsByCategory('completionist');
    expect(completionist.length).toBeGreaterThan(0);
    expect(completionist.every((a) => a.category === 'completionist')).toBe(true);
    expect(completionist.find((a) => a.slug === 'century')).toBeTruthy();
  });
});
```

**Step 1.2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/gamification/achievements.test.ts`
Expected: FAIL with "Cannot find module"

**Step 1.3: Write minimal implementation**

```typescript
// src/lib/gamification/achievements.ts
/**
 * Achievement definitions and types
 */

/**
 * Achievement category
 */
export type AchievementCategory = 'habit' | 'mastery' | 'completionist';

/**
 * Achievement definition
 */
export interface Achievement {
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  /** Hidden until unlocked */
  hidden?: boolean;
  /** Requirement metadata for server-side checking */
  requirement?: {
    type: 'streak' | 'count' | 'tier' | 'time' | 'variety';
    value: number;
    target?: string; // e.g., 'bronze', 'write'
  };
}

/**
 * User's unlocked achievement
 */
export interface UserAchievement {
  achievementSlug: string;
  unlockedAt: string;
}

/**
 * All 18 achievements
 */
export const ACHIEVEMENTS: Record<string, Achievement> = {
  // === Habit Achievements (7) ===
  'first-steps': {
    slug: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first graded exercise',
    category: 'habit',
    icon: '👣',
    requirement: { type: 'count', value: 1 },
  },
  'week-warrior': {
    slug: 'week-warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    category: 'habit',
    icon: '🔥',
    requirement: { type: 'streak', value: 7 },
  },
  'fortnight-fighter': {
    slug: 'fortnight-fighter',
    name: 'Fortnight Fighter',
    description: 'Achieve a 14-day streak',
    category: 'habit',
    icon: '⚔️',
    requirement: { type: 'streak', value: 14 },
  },
  'monthly-master': {
    slug: 'monthly-master',
    name: 'Monthly Master',
    description: 'Achieve a 30-day streak',
    category: 'habit',
    icon: '🏆',
    requirement: { type: 'streak', value: 30 },
  },
  'perfect-day': {
    slug: 'perfect-day',
    name: 'Perfect Day',
    description: '100% first-attempt accuracy in a session (min 10 cards)',
    category: 'habit',
    icon: '⭐',
    requirement: { type: 'count', value: 10, target: 'perfect-session' },
  },
  'early-bird': {
    slug: 'early-bird',
    name: 'Early Bird',
    description: 'Practice between 5:00 AM and 7:59 AM',
    category: 'habit',
    icon: '🌅',
    requirement: { type: 'time', value: 5, target: '05:00-07:59' },
  },
  'night-owl': {
    slug: 'night-owl',
    name: 'Night Owl',
    description: 'Practice between 12:00 AM and 4:59 AM',
    category: 'habit',
    icon: '🦉',
    requirement: { type: 'time', value: 0, target: '00:00-04:59' },
  },

  // === Mastery Achievements (6) ===
  'bronze-age': {
    slug: 'bronze-age',
    name: 'Bronze Age',
    description: 'Earn your first Bronze badge',
    category: 'mastery',
    icon: '🥉',
    requirement: { type: 'tier', value: 1, target: 'bronze' },
  },
  'silver-lining': {
    slug: 'silver-lining',
    name: 'Silver Lining',
    description: 'Earn your first Silver badge',
    category: 'mastery',
    icon: '🥈',
    requirement: { type: 'tier', value: 1, target: 'silver' },
  },
  'gold-standard': {
    slug: 'gold-standard',
    name: 'Gold Standard',
    description: 'Earn your first Gold badge',
    category: 'mastery',
    icon: '🥇',
    requirement: { type: 'tier', value: 1, target: 'gold' },
  },
  'platinum-club': {
    slug: 'platinum-club',
    name: 'Platinum Club',
    description: 'Earn your first Platinum badge',
    category: 'mastery',
    icon: '💎',
    requirement: { type: 'tier', value: 1, target: 'platinum' },
  },
  'concept-master': {
    slug: 'concept-master',
    name: 'Concept Master',
    description: 'Master all subconcepts in any concept',
    category: 'mastery',
    icon: '👑',
    requirement: { type: 'tier', value: 1, target: 'concept-gold' },
  },
  'pythonista': {
    slug: 'pythonista',
    name: 'Pythonista',
    description: 'Master all 65 Python subconcepts',
    category: 'mastery',
    icon: '🐍',
    requirement: { type: 'tier', value: 65, target: 'gold' },
  },

  // === Completionist Achievements (5) ===
  'century': {
    slug: 'century',
    name: 'Century',
    description: 'Complete 100 graded exercises',
    category: 'completionist',
    icon: '💯',
    requirement: { type: 'count', value: 100 },
  },
  'half-k': {
    slug: 'half-k',
    name: 'Half K',
    description: 'Complete 500 graded exercises',
    category: 'completionist',
    icon: '🎯',
    requirement: { type: 'count', value: 500 },
  },
  'thousand-strong': {
    slug: 'thousand-strong',
    name: 'Thousand Strong',
    description: 'Complete 1000 graded exercises',
    category: 'completionist',
    icon: '🏅',
    requirement: { type: 'count', value: 1000 },
  },
  'explorer': {
    slug: 'explorer',
    name: 'Explorer',
    description: 'Try all 3 exercise types (write, fill-in, predict)',
    category: 'completionist',
    icon: '🧭',
    requirement: { type: 'variety', value: 3, target: 'exercise-types' },
  },
  'well-rounded': {
    slug: 'well-rounded',
    name: 'Well Rounded',
    description: 'Complete exercises in all 11 concepts',
    category: 'completionist',
    icon: '🌐',
    requirement: { type: 'variety', value: 11, target: 'concepts' },
  },
};

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

/**
 * Get all achievement slugs
 */
export function getAllAchievementSlugs(): string[] {
  return Object.keys(ACHIEVEMENTS);
}

/**
 * Get achievement by slug
 */
export function getAchievement(slug: string): Achievement | undefined {
  return ACHIEVEMENTS[slug];
}
```

**Step 1.4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/gamification/achievements.test.ts`
Expected: PASS

**Step 1.5: Add to barrel export**

Update `src/lib/gamification/index.ts`:
```typescript
// Add:
export type { Achievement, AchievementCategory, UserAchievement } from './achievements';
export {
  ACHIEVEMENTS,
  getAchievementsByCategory,
  getAllAchievementSlugs,
  getAchievement,
} from './achievements';
```

**Step 1.6: Commit**

```bash
git add src/lib/gamification/achievements.ts src/lib/gamification/index.ts tests/unit/gamification/achievements.test.ts
git commit -m "$(cat <<'EOF'
feat(gamification): add achievement type definitions

18 achievements across 3 categories:
- Habit (7): first-steps, streak milestones, perfect day, time-based
- Mastery (6): badge tiers, concept master, pythonista
- Completionist (5): exercise counts, variety

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create Achievement Database Tables

**Files:**
- Create: `supabase/migrations/20260108300001_achievement_tables.sql`
- Test: `tests/integration/migrations/achievement-tables.test.ts`

**Step 2.1: Write the failing tests**

```typescript
// tests/integration/migrations/achievement-tables.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Achievement tables migration', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-achievements-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('achievement_definitions table', () => {
    it('has seeded achievements', async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*');

      expect(error).toBeNull();
      expect(data?.length).toBe(18);
    });

    it('has correct categories', async () => {
      const { data } = await supabase
        .from('achievement_definitions')
        .select('category')
        .order('category');

      const categories = [...new Set(data?.map((d) => d.category))];
      expect(categories).toContain('habit');
      expect(categories).toContain('mastery');
      expect(categories).toContain('completionist');
    });

    it('first-steps achievement exists', async () => {
      const { data } = await supabase
        .from('achievement_definitions')
        .select('*')
        .eq('slug', 'first-steps')
        .single();

      expect(data?.name).toBe('First Steps');
      expect(data?.category).toBe('habit');
      expect(data?.icon).toBe('👣');
    });
  });

  describe('user_achievements table', () => {
    beforeEach(async () => {
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', testUserId);
    });

    it('can insert user achievement', async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: testUserId,
          achievement_slug: 'first-steps',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.achievement_slug).toBe('first-steps');
      expect(data?.unlocked_at).toBeTruthy();
    });

    it('enforces unique user + achievement', async () => {
      await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'first-steps',
      });

      const { error } = await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'first-steps',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate');
    });

    it('enforces foreign key to achievement_definitions', async () => {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: testUserId,
        achievement_slug: 'nonexistent-achievement',
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates foreign key');
    });
  });
});
```

**Step 2.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/migrations/achievement-tables.test.ts`
Expected: FAIL with "relation does not exist"

**Step 2.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108300001_achievement_tables.sql
-- Create achievement tables and seed definitions

-- Achievement definitions (static, seeded)
CREATE TABLE achievement_definitions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('habit', 'mastery', 'completionist')),
  icon TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User unlocked achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL REFERENCES achievement_definitions(slug),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_slug)
);

-- RLS for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievement definitions are public read
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_slug ON user_achievements(achievement_slug);
CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);

-- Seed achievement definitions
INSERT INTO achievement_definitions (slug, name, description, category, icon, sort_order, metadata) VALUES
-- Habit (7)
('first-steps', 'First Steps', 'Complete your first graded exercise', 'habit', '👣', 1, '{"type": "count", "value": 1}'),
('week-warrior', 'Week Warrior', 'Achieve a 7-day streak', 'habit', '🔥', 2, '{"type": "streak", "value": 7}'),
('fortnight-fighter', 'Fortnight Fighter', 'Achieve a 14-day streak', 'habit', '⚔️', 3, '{"type": "streak", "value": 14}'),
('monthly-master', 'Monthly Master', 'Achieve a 30-day streak', 'habit', '🏆', 4, '{"type": "streak", "value": 30}'),
('perfect-day', 'Perfect Day', '100% first-attempt accuracy in a session (min 10 cards)', 'habit', '⭐', 5, '{"type": "perfect_session", "value": 10}'),
('early-bird', 'Early Bird', 'Practice between 5:00 AM and 7:59 AM', 'habit', '🌅', 6, '{"type": "time_range", "start": 5, "end": 7}'),
('night-owl', 'Night Owl', 'Practice between 12:00 AM and 4:59 AM', 'habit', '🦉', 7, '{"type": "time_range", "start": 0, "end": 4}'),
-- Mastery (6)
('bronze-age', 'Bronze Age', 'Earn your first Bronze badge', 'mastery', '🥉', 8, '{"type": "tier", "tier": "bronze", "count": 1}'),
('silver-lining', 'Silver Lining', 'Earn your first Silver badge', 'mastery', '🥈', 9, '{"type": "tier", "tier": "silver", "count": 1}'),
('gold-standard', 'Gold Standard', 'Earn your first Gold badge', 'mastery', '🥇', 10, '{"type": "tier", "tier": "gold", "count": 1}'),
('platinum-club', 'Platinum Club', 'Earn your first Platinum badge', 'mastery', '💎', 11, '{"type": "tier", "tier": "platinum", "count": 1}'),
('concept-master', 'Concept Master', 'Master all subconcepts in any concept', 'mastery', '👑', 12, '{"type": "concept_mastery", "count": 1}'),
('pythonista', 'Pythonista', 'Master all 65 Python subconcepts', 'mastery', '🐍', 13, '{"type": "tier", "tier": "gold", "count": 65}'),
-- Completionist (5)
('century', 'Century', 'Complete 100 graded exercises', 'completionist', '💯', 14, '{"type": "count", "value": 100}'),
('half-k', 'Half K', 'Complete 500 graded exercises', 'completionist', '🎯', 15, '{"type": "count", "value": 500}'),
('thousand-strong', 'Thousand Strong', 'Complete 1000 graded exercises', 'completionist', '🏅', 16, '{"type": "count", "value": 1000}'),
('explorer', 'Explorer', 'Try all 3 exercise types (write, fill-in, predict)', 'completionist', '🧭', 17, '{"type": "variety", "target": "exercise_types", "count": 3}'),
('well-rounded', 'Well Rounded', 'Complete exercises in all 11 concepts', 'completionist', '🌐', 18, '{"type": "variety", "target": "concepts", "count": 11}');

COMMENT ON TABLE achievement_definitions IS
  'Static achievement definitions. Seeded on migration.';
COMMENT ON TABLE user_achievements IS
  'User unlocked achievements. Inserted by check_achievements RPC.';
```

**Step 2.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/migrations/achievement-tables.test.ts`
Expected: PASS

**Step 2.5: Commit**

```bash
git add supabase/migrations/20260108300001_achievement_tables.sql tests/integration/migrations/achievement-tables.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add achievement tables with 18 seeded achievements

- achievement_definitions: static definitions with metadata
- user_achievements: user unlocks with foreign key constraint
- RLS: users see own unlocks, everyone can read definitions
- 18 achievements seeded (7 habit, 6 mastery, 5 completionist)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create check_achievements RPC Function

**Files:**
- Create: `supabase/migrations/20260108300002_check_achievements.sql`
- Test: `tests/integration/gamification/check-achievements.test.ts`

**Step 3.1: Write the failing tests**

```typescript
// tests/integration/gamification/check-achievements.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('check_achievements RPC', () => {
  let testUserId: string;

  beforeAll(async () => {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: `test-check-ach-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true,
    });
    testUserId = authData.user!.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.from('user_achievements').delete().eq('user_id', testUserId);
      await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
      await supabase.from('subconcept_progress').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  beforeEach(async () => {
    await supabase.from('user_achievements').delete().eq('user_id', testUserId);
    await supabase.from('exercise_attempts').delete().eq('user_id', testUserId);
    await supabase.from('subconcept_progress').delete().eq('user_id', testUserId);
    await supabase.from('profiles').update({
      current_streak: 0,
      total_exercises_completed: 0,
    }).eq('id', testUserId);
  });

  it('unlocks first-steps after first graded exercise', async () => {
    // Add a graded exercise attempt
    await supabase.from('exercise_attempts').insert({
      user_id: testUserId,
      exercise_slug: 'test-exercise',
      is_correct: true,
    });
    await supabase.from('profiles').update({
      total_exercises_completed: 1,
    }).eq('id', testUserId);

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(error).toBeNull();
    expect(data.newly_unlocked).toContain('first-steps');
  });

  it('unlocks week-warrior at 7-day streak', async () => {
    await supabase.from('profiles').update({
      current_streak: 7,
    }).eq('id', testUserId);

    const { data } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(data.newly_unlocked).toContain('week-warrior');
  });

  it('unlocks bronze-age for first bronze badge', async () => {
    await supabase.from('subconcept_progress').insert({
      user_id: testUserId,
      subconcept_slug: 'test-subconcept',
      concept_slug: 'test-concept',
      stability: 2, // Bronze = >= 1 day
      difficulty: 0.5,
      fsrs_state: 2,
      reps: 3,
      lapses: 0,
    });

    const { data } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(data.newly_unlocked).toContain('bronze-age');
  });

  it('unlocks century for 100 exercises', async () => {
    await supabase.from('profiles').update({
      total_exercises_completed: 100,
    }).eq('id', testUserId);

    const { data } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(data.newly_unlocked).toContain('century');
  });

  it('is idempotent - does not re-unlock already unlocked', async () => {
    await supabase.from('profiles').update({
      current_streak: 7,
    }).eq('id', testUserId);

    // First check
    const { data: first } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });
    expect(first.newly_unlocked).toContain('week-warrior');

    // Second check - should not unlock again
    const { data: second } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });
    expect(second.newly_unlocked).not.toContain('week-warrior');
  });

  it('returns all_unlocked list', async () => {
    await supabase.from('profiles').update({
      current_streak: 7,
      total_exercises_completed: 100,
    }).eq('id', testUserId);

    const { data } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(data.all_unlocked).toContain('week-warrior');
    expect(data.all_unlocked).toContain('century');
  });

  it('unlocks multiple achievements in one call', async () => {
    await supabase.from('profiles').update({
      current_streak: 14, // week-warrior + fortnight-fighter
      total_exercises_completed: 1, // first-steps
    }).eq('id', testUserId);

    const { data } = await supabase.rpc('check_achievements', {
      p_user_id: testUserId,
    });

    expect(data.newly_unlocked).toContain('first-steps');
    expect(data.newly_unlocked).toContain('week-warrior');
    expect(data.newly_unlocked).toContain('fortnight-fighter');
  });
});
```

**Step 3.2: Run test to verify it fails**

Run: `pnpm vitest run tests/integration/gamification/check-achievements.test.ts`
Expected: FAIL with "function check_achievements does not exist"

**Step 3.3: Write minimal implementation**

```sql
-- supabase/migrations/20260108300002_check_achievements.sql
-- RPC function to check and unlock achievements

CREATE OR REPLACE FUNCTION check_achievements(
  p_user_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_newly_unlocked TEXT[] := ARRAY[]::TEXT[];
  v_all_unlocked TEXT[];
  v_current_streak INTEGER;
  v_total_exercises INTEGER;
  v_bronze_count INTEGER;
  v_silver_count INTEGER;
  v_gold_count INTEGER;
  v_platinum_count INTEGER;
  v_concept_mastered BOOLEAN;
  v_exercise_types INTEGER;
  v_concepts_practiced INTEGER;
BEGIN
  -- Get user stats
  SELECT current_streak, total_exercises_completed
  INTO v_current_streak, v_total_exercises
  FROM profiles WHERE id = p_user_id;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_total_exercises := COALESCE(v_total_exercises, 0);

  -- Count badge tiers
  SELECT
    COUNT(*) FILTER (WHERE stability >= 1),
    COUNT(*) FILTER (WHERE stability >= 7),
    COUNT(*) FILTER (WHERE stability >= 30),
    COUNT(*) FILTER (WHERE stability >= 90)
  INTO v_bronze_count, v_silver_count, v_gold_count, v_platinum_count
  FROM subconcept_progress WHERE user_id = p_user_id;

  -- Check for concept mastery (all subconcepts in any concept at gold)
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT concept_slug, COUNT(*) as subconcept_count
      FROM subconcept_progress
      WHERE user_id = p_user_id AND stability >= 30
      GROUP BY concept_slug
    ) mastered
    -- Would need curriculum data to verify all subconcepts
    -- For now, require at least 4 gold subconcepts in same concept
    WHERE subconcept_count >= 4
  ) INTO v_concept_mastered;

  -- Count distinct exercise types practiced
  SELECT COUNT(DISTINCT SPLIT_PART(exercise_slug, '-', 1))
  INTO v_exercise_types
  FROM exercise_attempts
  WHERE user_id = p_user_id AND is_correct IS NOT NULL;

  -- Count distinct concepts practiced
  SELECT COUNT(DISTINCT SPLIT_PART(exercise_slug, '-', 1))
  INTO v_concepts_practiced
  FROM exercise_attempts
  WHERE user_id = p_user_id AND is_correct IS NOT NULL;

  -- Check each achievement and insert if not already unlocked

  -- first-steps
  IF v_total_exercises >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'first-steps'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'first-steps');
    v_newly_unlocked := array_append(v_newly_unlocked, 'first-steps');
  END IF;

  -- week-warrior
  IF v_current_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'week-warrior'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'week-warrior');
    v_newly_unlocked := array_append(v_newly_unlocked, 'week-warrior');
  END IF;

  -- fortnight-fighter
  IF v_current_streak >= 14 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'fortnight-fighter'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'fortnight-fighter');
    v_newly_unlocked := array_append(v_newly_unlocked, 'fortnight-fighter');
  END IF;

  -- monthly-master
  IF v_current_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'monthly-master'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'monthly-master');
    v_newly_unlocked := array_append(v_newly_unlocked, 'monthly-master');
  END IF;

  -- bronze-age
  IF v_bronze_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'bronze-age'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'bronze-age');
    v_newly_unlocked := array_append(v_newly_unlocked, 'bronze-age');
  END IF;

  -- silver-lining
  IF v_silver_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'silver-lining'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'silver-lining');
    v_newly_unlocked := array_append(v_newly_unlocked, 'silver-lining');
  END IF;

  -- gold-standard
  IF v_gold_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'gold-standard'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'gold-standard');
    v_newly_unlocked := array_append(v_newly_unlocked, 'gold-standard');
  END IF;

  -- platinum-club
  IF v_platinum_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'platinum-club'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'platinum-club');
    v_newly_unlocked := array_append(v_newly_unlocked, 'platinum-club');
  END IF;

  -- concept-master
  IF v_concept_mastered AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'concept-master'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'concept-master');
    v_newly_unlocked := array_append(v_newly_unlocked, 'concept-master');
  END IF;

  -- pythonista
  IF v_gold_count >= 65 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'pythonista'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'pythonista');
    v_newly_unlocked := array_append(v_newly_unlocked, 'pythonista');
  END IF;

  -- century
  IF v_total_exercises >= 100 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'century'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'century');
    v_newly_unlocked := array_append(v_newly_unlocked, 'century');
  END IF;

  -- half-k
  IF v_total_exercises >= 500 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'half-k'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'half-k');
    v_newly_unlocked := array_append(v_newly_unlocked, 'half-k');
  END IF;

  -- thousand-strong
  IF v_total_exercises >= 1000 AND NOT EXISTS (
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_slug = 'thousand-strong'
  ) THEN
    INSERT INTO user_achievements (user_id, achievement_slug) VALUES (p_user_id, 'thousand-strong');
    v_newly_unlocked := array_append(v_newly_unlocked, 'thousand-strong');
  END IF;

  -- Note: explorer, well-rounded, perfect-day, early-bird, night-owl
  -- require more complex logic - will be added in follow-up

  -- Get all unlocked achievements
  SELECT array_agg(achievement_slug) INTO v_all_unlocked
  FROM user_achievements WHERE user_id = p_user_id;

  RETURN json_build_object(
    'newly_unlocked', COALESCE(v_newly_unlocked, ARRAY[]::TEXT[]),
    'all_unlocked', COALESCE(v_all_unlocked, ARRAY[]::TEXT[])
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_achievements TO authenticated;

COMMENT ON FUNCTION check_achievements IS
  'Check and unlock achievements for a user. Idempotent - safe to call multiple times.';
```

**Step 3.4: Apply migration and run tests**

Run: `pnpm db:reset && pnpm vitest run tests/integration/gamification/check-achievements.test.ts`
Expected: PASS

**Step 3.5: Commit**

```bash
git add supabase/migrations/20260108300002_check_achievements.sql tests/integration/gamification/check-achievements.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add check_achievements RPC function

Idempotent achievement checker:
- Checks streak milestones, exercise counts, badge tiers
- Inserts to user_achievements only if not already unlocked
- Returns newly_unlocked and all_unlocked arrays

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 4-30: Remaining Achievement Tasks

### Task 4-6: useAchievements Hook
- Fetch user achievements via RPC
- Listen for new unlocks after session
- Provide achievement data with definitions

### Task 7-9: AchievementCard Component
- Display single achievement (locked/unlocked states)
- Icon, name, description, unlock date
- Grayscale for locked, color for unlocked

### Task 10-12: AchievementToast Component
- Animated toast for new unlock
- Show icon, name, celebratory text
- Auto-dismiss after 5 seconds

### Task 13-15: AchievementsPage
- Grid of all 18 achievements
- Grouped by category (Habit, Mastery, Completionist)
- Progress indicator (X/18 unlocked)

### Task 16-18: Dashboard Recent Achievements
- Show last 3 unlocked achievements
- Link to full achievements page
- Empty state if none unlocked

### Task 19-21: Session Integration
- Call check_achievements at session end
- Show AchievementToast for new unlocks
- Update useAchievements cache

### Task 22-24: Time-Based Achievements
- Early Bird (05:00-07:59)
- Night Owl (00:00-04:59)
- Use timezone from exercise_attempts

### Task 25-27: Perfect Day Achievement
- Track first-attempt accuracy per session
- Check if >= 10 cards and 100% accuracy
- Store session metadata for validation

### Task 28-30: E2E Tests
- E2E: first-steps unlock flow
- E2E: achievement toast displays
- E2E: achievements page renders

---

## Phase 3.3 Completion Checklist

Before moving to Phase 3.4:

- [ ] All 30 tasks completed
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] Lint clean (`pnpm lint`)
- [ ] E2E tests passing (`pnpm test:e2e`)
- [ ] CLAUDE.md updated
- [ ] Obsidian docs updated
- [ ] Daem0nMCP decision recorded
- [ ] PR merged to main

---

## Related Documents

- [Master Plan](./2026-01-08-phase3-gamification-implementation.md)
- [Phase 3.2: Visualization](./2026-01-08-phase32-visualization.md)
- [Phase 3.4: Polish](./2026-01-08-phase34-polish.md)
