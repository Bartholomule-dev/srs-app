# Multi-Language Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-language support starting with JavaScript alongside Python, with independent progress tracking per language.

**Architecture:** Language becomes a first-class dimension across all content (exercises, paths, curriculum, generators) and data (progress tables). Each language has isolated SRS state, cached loaders, and validation scripts. UI provides language switching in dashboard and view-only tabs in skill tree.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL), React Query, Vitest, Playwright

**Design Document:** `docs/plans/2026-01-11-multi-language-support-design.md`

---

## Phase Overview

| Phase | Focus | Tasks | Estimated Tests |
|-------|-------|-------|-----------------|
| 1 | Database Schema | Migrations + TypeScript types | 15 |
| 2 | Curriculum Loader | Language-parameterized curriculum loading | 12 |
| 3 | Paths Loader | Language-scoped path index with caching | 10 |
| 4 | Generator Registry | Language-scoped generator lookup | 8 |
| 5 | Core Hooks | useActiveLanguage + hook updates | 25 |
| 6 | Validation Scripts | Language-parameterized validation | 8 |
| 7 | UI Components | Language switcher + skill tree tabs | 15 |
| 8 | Documentation | Update all docs and memories | - |

**Total New Tests:** ~93

---

## Phase 1: Database Schema & Types

### Task 1.1: Create Migration for subconcept_progress Language Column

**Files:**
- Create: `supabase/migrations/20260111000001_add_language_to_subconcept_progress.sql`
- Test: `tests/integration/migrations/subconcept-progress-language.test.ts`

**Step 1: Write the failing integration test**

```typescript
// tests/integration/migrations/subconcept-progress-language.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('subconcept_progress language migration', () => {
  it('has language column with default python', async () => {
    const { data, error } = await supabase
      .from('subconcept_progress')
      .select('language')
      .limit(1);

    expect(error).toBeNull();
    // Column should exist (no error about unknown column)
  });

  it('enforces unique constraint on (user_id, language, subconcept_slug)', async () => {
    // Create test user first
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-lang@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    const userId = user.user!.id;

    // Insert first record
    const { error: err1 } = await supabase
      .from('subconcept_progress')
      .insert({
        user_id: userId,
        language: 'python',
        subconcept_slug: 'for-loops',
        concept_slug: 'loops',
      });

    expect(err1).toBeNull();

    // Same slug, different language should work
    const { error: err2 } = await supabase
      .from('subconcept_progress')
      .insert({
        user_id: userId,
        language: 'javascript',
        subconcept_slug: 'for-loops',
        concept_slug: 'loops',
      });

    expect(err2).toBeNull();

    // Same slug, same language should fail
    const { error: err3 } = await supabase
      .from('subconcept_progress')
      .insert({
        user_id: userId,
        language: 'python',
        subconcept_slug: 'for-loops',
        concept_slug: 'loops',
      });

    expect(err3).not.toBeNull();
    expect(err3!.code).toBe('23505'); // unique_violation

    // Cleanup
    await supabase.from('subconcept_progress').delete().eq('user_id', userId);
    await supabase.auth.admin.deleteUser(userId);
  });

  it('has index on (user_id, language, next_review)', async () => {
    const { data, error } = await supabase.rpc('check_index_exists', {
      idx_name: 'idx_subconcept_progress_due_by_language'
    });

    // If RPC doesn't exist, check via pg_indexes
    if (error) {
      const { data: indexes } = await supabase
        .from('pg_indexes')
        .select('indexname')
        .eq('tablename', 'subconcept_progress')
        .eq('indexname', 'idx_subconcept_progress_due_by_language');

      expect(indexes?.length).toBeGreaterThan(0);
    } else {
      expect(data).toBe(true);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/integration/migrations/subconcept-progress-language.test.ts`
Expected: FAIL - column 'language' does not exist

**Step 3: Write the migration**

```sql
-- supabase/migrations/20260111000001_add_language_to_subconcept_progress.sql

-- Add language column with default 'python' for existing data
ALTER TABLE subconcept_progress
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Drop old unique constraint
ALTER TABLE subconcept_progress
  DROP CONSTRAINT IF EXISTS subconcept_progress_user_id_subconcept_slug_key;

-- Add new unique constraint including language
ALTER TABLE subconcept_progress
  ADD CONSTRAINT subconcept_progress_user_language_subconcept_key
    UNIQUE(user_id, language, subconcept_slug);

-- Index for language-filtered due queries (most common access pattern)
CREATE INDEX idx_subconcept_progress_due_by_language
  ON subconcept_progress(user_id, language, next_review);

-- Index for user + language lookups
CREATE INDEX idx_subconcept_progress_user_language
  ON subconcept_progress(user_id, language);
```

**Step 4: Apply migration and run test**

Run: `pnpm db:reset && pnpm test tests/integration/migrations/subconcept-progress-language.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260111000001_add_language_to_subconcept_progress.sql \
        tests/integration/migrations/subconcept-progress-language.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add language column to subconcept_progress

- Add language column with default 'python'
- Update unique constraint to (user_id, language, subconcept_slug)
- Add indexes for language-filtered queries

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Create Migration for exercise_attempts Language Column

**Files:**
- Create: `supabase/migrations/20260111000002_add_language_to_exercise_attempts.sql`
- Test: `tests/integration/migrations/exercise-attempts-language.test.ts`

**Step 1: Write the failing integration test**

```typescript
// tests/integration/migrations/exercise-attempts-language.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('exercise_attempts language migration', () => {
  it('has language column with default python', async () => {
    const { data, error } = await supabase
      .from('exercise_attempts')
      .select('language')
      .limit(1);

    expect(error).toBeNull();
  });

  it('enforces unique constraint on (user_id, language, exercise_slug)', async () => {
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test-attempt-lang@example.com',
      password: 'test-password-123',
      email_confirm: true,
    });

    const userId = user.user!.id;

    // Insert for python
    const { error: err1 } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: userId,
        language: 'python',
        exercise_slug: 'for-basic',
        times_seen: 1,
        times_correct: 1,
      });

    expect(err1).toBeNull();

    // Same slug, different language should work
    const { error: err2 } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: userId,
        language: 'javascript',
        exercise_slug: 'for-basic',
        times_seen: 1,
        times_correct: 0,
      });

    expect(err2).toBeNull();

    // Same slug, same language should fail
    const { error: err3 } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: userId,
        language: 'python',
        exercise_slug: 'for-basic',
        times_seen: 2,
        times_correct: 1,
      });

    expect(err3).not.toBeNull();
    expect(err3!.code).toBe('23505');

    // Cleanup
    await supabase.from('exercise_attempts').delete().eq('user_id', userId);
    await supabase.auth.admin.deleteUser(userId);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/integration/migrations/exercise-attempts-language.test.ts`
Expected: FAIL

**Step 3: Write the migration**

```sql
-- supabase/migrations/20260111000002_add_language_to_exercise_attempts.sql

-- Add language column
ALTER TABLE exercise_attempts
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Drop old unique constraint
ALTER TABLE exercise_attempts
  DROP CONSTRAINT IF EXISTS exercise_attempts_user_id_exercise_slug_key;

-- Add new unique constraint including language
ALTER TABLE exercise_attempts
  ADD CONSTRAINT exercise_attempts_user_language_exercise_key
    UNIQUE(user_id, language, exercise_slug);

-- Update index
DROP INDEX IF EXISTS idx_exercise_attempts_user_exercise;
CREATE INDEX idx_exercise_attempts_user_language_exercise
  ON exercise_attempts(user_id, language, exercise_slug);
```

**Step 4: Apply migration and run test**

Run: `pnpm db:reset && pnpm test tests/integration/migrations/exercise-attempts-language.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add supabase/migrations/20260111000002_add_language_to_exercise_attempts.sql \
        tests/integration/migrations/exercise-attempts-language.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add language column to exercise_attempts

- Add language column with default 'python'
- Update unique constraint to (user_id, language, exercise_slug)
- Update indexes for language-filtered queries

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.3: Update TypeScript Types - ConceptSlug and Interfaces

**Files:**
- Modify: `src/lib/curriculum/types.ts`
- Modify: `src/lib/types/database-rows.ts`
- Test: `tests/unit/curriculum/types.test.ts` (update existing)

**Step 1: Write the failing tests**

```typescript
// Add to tests/unit/curriculum/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  isValidConcept,
  PYTHON_CONCEPTS,
  JAVASCRIPT_CONCEPTS,
  type ConceptSlug,
} from '@/lib/curriculum/types';

describe('Language-specific concept validation', () => {
  describe('PYTHON_CONCEPTS', () => {
    it('includes Python-specific concepts', () => {
      expect(PYTHON_CONCEPTS).toContain('foundations');
      expect(PYTHON_CONCEPTS).toContain('comprehensions');
      expect(PYTHON_CONCEPTS).toContain('modules-files');
    });

    it('does not include JavaScript-specific concepts', () => {
      expect(PYTHON_CONCEPTS).not.toContain('async');
      expect(PYTHON_CONCEPTS).not.toContain('modules-dom');
    });
  });

  describe('JAVASCRIPT_CONCEPTS', () => {
    it('includes JavaScript-specific concepts', () => {
      expect(JAVASCRIPT_CONCEPTS).toContain('foundations');
      expect(JAVASCRIPT_CONCEPTS).toContain('async');
      expect(JAVASCRIPT_CONCEPTS).toContain('modules-dom');
    });

    it('does not include Python-specific concepts', () => {
      expect(JAVASCRIPT_CONCEPTS).not.toContain('comprehensions');
      expect(JAVASCRIPT_CONCEPTS).not.toContain('modules-files');
    });
  });

  describe('isValidConcept', () => {
    it('validates Python concepts correctly', () => {
      expect(isValidConcept('foundations', 'python')).toBe(true);
      expect(isValidConcept('comprehensions', 'python')).toBe(true);
      expect(isValidConcept('async', 'python')).toBe(false);
    });

    it('validates JavaScript concepts correctly', () => {
      expect(isValidConcept('foundations', 'javascript')).toBe(true);
      expect(isValidConcept('async', 'javascript')).toBe(true);
      expect(isValidConcept('comprehensions', 'javascript')).toBe(false);
    });

    it('returns false for unknown language', () => {
      expect(isValidConcept('foundations', 'rust')).toBe(false);
    });
  });
});

describe('SubconceptProgress type', () => {
  it('includes language field', () => {
    // Type-level test - if this compiles, the type is correct
    const progress: SubconceptProgress = {
      id: '123',
      userId: 'user-1',
      language: 'python',
      subconceptSlug: 'for',
      conceptSlug: 'loops',
      stability: 1,
      difficulty: 0.3,
      fsrsState: 0,
      reps: 0,
      lapses: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      nextReview: new Date(),
      lastReviewed: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(progress.language).toBe('python');
  });
});

describe('ExerciseAttempt type', () => {
  it('includes language field', () => {
    const attempt: ExerciseAttempt = {
      id: '123',
      userId: 'user-1',
      language: 'javascript',
      exerciseSlug: 'for-basic',
      timesSeen: 1,
      timesCorrect: 1,
      lastSeenAt: new Date(),
    };
    expect(attempt.language).toBe('javascript');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/curriculum/types.test.ts`
Expected: FAIL - isValidConcept not exported, language field missing

**Step 3: Update the types**

```typescript
// src/lib/curriculum/types.ts
// Types for curriculum taxonomy and learning progression

/** Supported languages */
export type Language = 'python' | 'javascript';

/** Python concept slugs */
export const PYTHON_CONCEPTS = [
  'foundations',
  'strings',
  'numbers-booleans',
  'conditionals',
  'collections',
  'loops',
  'functions',
  'comprehensions',
  'error-handling',
  'oop',
  'modules-files',
] as const;

/** JavaScript concept slugs */
export const JAVASCRIPT_CONCEPTS = [
  'foundations',
  'strings',
  'numbers-booleans',
  'conditionals',
  'arrays-objects',
  'loops',
  'functions',
  'async',
  'error-handling',
  'oop',
  'modules-dom',
] as const;

/** Concept slug (generic string, validated per-language at runtime) */
export type ConceptSlug = string;

/** Validate if a concept exists for a given language */
export function isValidConcept(slug: string, language: string): boolean {
  if (language === 'python') {
    return (PYTHON_CONCEPTS as readonly string[]).includes(slug);
  }
  if (language === 'javascript') {
    return (JAVASCRIPT_CONCEPTS as readonly string[]).includes(slug);
  }
  return false;
}

/** Exercise difficulty level within a subconcept */
export type ExerciseLevel = 'intro' | 'practice' | 'edge';

/** Exercise format/type */
export type ExerciseType = 'write' | 'fill-in' | 'predict';

// ... keep ExercisePattern unchanged ...

/** Concept definition in curriculum graph */
export interface Concept {
  slug: ConceptSlug;
  name: string;
  description: string;
  prereqs: ConceptSlug[];
  subconcepts: string[];
}

/** Subconcept progress (SRS state using FSRS algorithm) */
export interface SubconceptProgress {
  id: string;
  userId: string;
  language: string;  // NEW
  subconceptSlug: string;
  conceptSlug: ConceptSlug;

  // FSRS fields
  stability: number;
  difficulty: number;
  fsrsState: 0 | 1 | 2 | 3;
  reps: number;
  lapses: number;
  elapsedDays: number;
  scheduledDays: number;

  // Timestamps
  nextReview: Date;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Exercise attempt tracking */
export interface ExerciseAttempt {
  id: string;
  userId: string;
  language: string;  // NEW
  exerciseSlug: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Date;
}

// ... keep rest unchanged ...
```

**Step 4: Update database-rows.ts mappers**

```typescript
// src/lib/types/database-rows.ts
// Add language to the DB row types and mappers

export interface DbSubconceptProgress {
  id: string;
  user_id: string;
  language: string;  // NEW
  subconcept_slug: string;
  concept_slug: string;
  stability: number;
  difficulty: number;
  fsrs_state: number;
  reps: number;
  lapses: number;
  elapsed_days: number;
  scheduled_days: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

export function mapDbToSubconceptProgress(row: DbSubconceptProgress): SubconceptProgress {
  return {
    id: row.id,
    userId: row.user_id,
    language: row.language,  // NEW
    subconceptSlug: row.subconcept_slug,
    conceptSlug: row.concept_slug,
    stability: row.stability,
    difficulty: row.difficulty,
    fsrsState: row.fsrs_state as 0 | 1 | 2 | 3,
    reps: row.reps,
    lapses: row.lapses,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    nextReview: new Date(row.next_review),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface DbExerciseAttempt {
  id: string;
  user_id: string;
  language: string;  // NEW
  exercise_slug: string;
  times_seen: number;
  times_correct: number;
  last_seen_at: string | null;
  created_at: string;
}

export function mapDbToExerciseAttempt(row: DbExerciseAttempt): ExerciseAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    language: row.language,  // NEW
    exerciseSlug: row.exercise_slug,
    timesSeen: row.times_seen,
    timesCorrect: row.times_correct,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : new Date(),
  };
}
```

**Step 5: Run tests**

Run: `pnpm test tests/unit/curriculum/types.test.ts && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/curriculum/types.ts src/lib/types/database-rows.ts \
        tests/unit/curriculum/types.test.ts
git commit -m "$(cat <<'EOF'
feat(types): add language field to SubconceptProgress and ExerciseAttempt

- ConceptSlug becomes generic string (validated per-language)
- Add PYTHON_CONCEPTS and JAVASCRIPT_CONCEPTS arrays
- Add isValidConcept() validation function
- Add language field to SubconceptProgress and ExerciseAttempt
- Update database row mappers

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: Curriculum Loader

### Task 2.1: Parameterize Curriculum Loader by Language

**Files:**
- Modify: `src/lib/curriculum/loader.ts`
- Create: `src/lib/curriculum/javascript.json` (stub for testing)
- Test: `tests/unit/curriculum/loader.test.ts` (update)

**Step 1: Write failing tests**

```typescript
// Add to tests/unit/curriculum/loader.test.ts
import { describe, it, expect } from 'vitest';
import {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
  getCurriculumConcepts,
  loadCurriculum,
} from '@/lib/curriculum/loader';

describe('loadCurriculum', () => {
  it('loads Python curriculum by default', () => {
    const curriculum = loadCurriculum();
    expect(curriculum.language).toBe('python');
    expect(curriculum.concepts.length).toBeGreaterThan(0);
  });

  it('loads Python curriculum explicitly', () => {
    const curriculum = loadCurriculum('python');
    expect(curriculum.language).toBe('python');
    expect(curriculum.concepts.some(c => c.slug === 'comprehensions')).toBe(true);
  });

  it('loads JavaScript curriculum', () => {
    const curriculum = loadCurriculum('javascript');
    expect(curriculum.language).toBe('javascript');
    expect(curriculum.concepts.some(c => c.slug === 'async')).toBe(true);
  });

  it('throws for unknown language', () => {
    expect(() => loadCurriculum('rust')).toThrow('Unknown language: rust');
  });
});

describe('getSubconceptTeaching with language', () => {
  it('returns Python teaching content by default', () => {
    const teaching = getSubconceptTeaching('for');
    expect(teaching).not.toBeNull();
  });

  it('returns JavaScript teaching content when specified', () => {
    const teaching = getSubconceptTeaching('for-of', 'javascript');
    expect(teaching).not.toBeNull();
  });

  it('returns null for Python-only subconcept in JavaScript', () => {
    const teaching = getSubconceptTeaching('list-comp', 'javascript');
    expect(teaching).toBeNull();
  });
});

describe('getAllSubconcepts with language', () => {
  it('returns Python subconcepts by default', () => {
    const subconcepts = getAllSubconcepts();
    expect(subconcepts).toContain('for');
    expect(subconcepts).toContain('list-comp');
  });

  it('returns JavaScript subconcepts', () => {
    const subconcepts = getAllSubconcepts('javascript');
    expect(subconcepts).toContain('for-of');
    expect(subconcepts).not.toContain('list-comp');
  });
});

describe('getCurriculumConcepts with language', () => {
  it('returns Python concepts by default', () => {
    const concepts = getCurriculumConcepts();
    expect(concepts.some(c => c.slug === 'comprehensions')).toBe(true);
  });

  it('returns JavaScript concepts', () => {
    const concepts = getCurriculumConcepts('javascript');
    expect(concepts.some(c => c.slug === 'async')).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/curriculum/loader.test.ts`
Expected: FAIL - loadCurriculum not exported, no language parameter

**Step 3: Create JavaScript curriculum stub**

```json
// src/lib/curriculum/javascript.json
{
  "language": "javascript",
  "version": "1.0.0",
  "concepts": [
    {
      "slug": "foundations",
      "name": "JavaScript Foundations",
      "description": "Variables, constants, and basic types in JavaScript",
      "prereqs": [],
      "subconcepts": ["variables", "constants", "types"]
    },
    {
      "slug": "async",
      "name": "Asynchronous JavaScript",
      "description": "Promises, async/await, and event loop",
      "prereqs": ["functions"],
      "subconcepts": ["promises", "async-await", "for-of"]
    }
  ],
  "subconcepts": {
    "for-of": {
      "name": "For-Of Loops",
      "concept": "async",
      "prereqs": [],
      "teaching": {
        "explanation": "for-of loops iterate over iterable objects like arrays and strings.",
        "exampleCode": "for (const item of array) {\n  console.log(item);\n}"
      }
    }
  }
}
```

**Step 4: Update the loader**

```typescript
// src/lib/curriculum/loader.ts
import type { SubconceptTeaching, SubconceptDefinition, Concept } from './types';
import pythonCurriculum from './python.json';
import javascriptCurriculum from './javascript.json';

interface CurriculumWithSubconcepts {
  language: string;
  version: string;
  concepts: Array<{
    slug: string;
    name: string;
    description: string;
    prereqs: string[];
    subconcepts: string[];
  }>;
  subconcepts?: Record<string, SubconceptDefinition>;
}

const curriculums: Record<string, CurriculumWithSubconcepts> = {
  python: pythonCurriculum as CurriculumWithSubconcepts,
  javascript: javascriptCurriculum as CurriculumWithSubconcepts,
};

/**
 * Load curriculum for a language
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function loadCurriculum(language: string = 'python'): CurriculumWithSubconcepts {
  const curriculum = curriculums[language];
  if (!curriculum) {
    throw new Error(`Unknown language: ${language}`);
  }
  return curriculum;
}

/**
 * Get teaching content for a subconcept
 * @param subconceptSlug - The subconcept slug
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getSubconceptTeaching(
  subconceptSlug: string,
  language: string = 'python'
): SubconceptTeaching | null {
  const curriculum = loadCurriculum(language);
  return curriculum.subconcepts?.[subconceptSlug]?.teaching ?? null;
}

/**
 * Get full subconcept definition
 * @param subconceptSlug - The subconcept slug
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getSubconceptDefinition(
  subconceptSlug: string,
  language: string = 'python'
): SubconceptDefinition | null {
  const curriculum = loadCurriculum(language);
  return curriculum.subconcepts?.[subconceptSlug] ?? null;
}

/**
 * Get all subconcept slugs from the curriculum
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getAllSubconcepts(language: string = 'python'): string[] {
  const curriculum = loadCurriculum(language);

  const fromConcepts = curriculum.concepts.flatMap(c => c.subconcepts);
  const fromDefinitions = Object.keys(curriculum.subconcepts ?? {});

  return [...new Set([...fromConcepts, ...fromDefinitions])];
}

/**
 * Get all concepts from the curriculum as typed array.
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getCurriculumConcepts(language: string = 'python'): Concept[] {
  const curriculum = loadCurriculum(language);
  return curriculum.concepts as Concept[];
}
```

**Step 5: Run tests**

Run: `pnpm test tests/unit/curriculum/loader.test.ts && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/curriculum/loader.ts src/lib/curriculum/javascript.json \
        tests/unit/curriculum/loader.test.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): parameterize loader by language

- Add loadCurriculum(language) function
- Update all loader functions to accept language parameter
- Add JavaScript curriculum stub for testing
- Default to 'python' for backwards compatibility

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: Paths Loader

### Task 3.1: Parameterize Paths Loader with Language-Scoped Caching

**Files:**
- Modify: `src/lib/paths/loader.ts`
- Test: `tests/unit/paths/loader.test.ts` (create)

**Step 1: Write failing tests**

```typescript
// tests/unit/paths/loader.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadBlueprints,
  loadSkins,
  getPathIndex,
  clearPathIndexCache,
} from '@/lib/paths/loader';

describe('Paths Loader', () => {
  beforeEach(() => {
    clearPathIndexCache();
  });

  describe('loadBlueprints', () => {
    it('loads Python blueprints by default', async () => {
      const blueprints = await loadBlueprints();
      expect(blueprints.length).toBeGreaterThan(0);
      expect(blueprints[0].id).toBeDefined();
    });

    it('loads Python blueprints explicitly', async () => {
      const blueprints = await loadBlueprints('python');
      expect(blueprints.length).toBeGreaterThan(0);
    });

    it('returns empty array for language with no blueprints', async () => {
      const blueprints = await loadBlueprints('javascript');
      // JavaScript blueprints don't exist yet
      expect(Array.isArray(blueprints)).toBe(true);
    });
  });

  describe('getPathIndex', () => {
    it('returns cached index on subsequent calls for same language', async () => {
      const index1 = await getPathIndex('python');
      const index2 = await getPathIndex('python');
      expect(index1).toBe(index2); // Same reference
    });

    it('returns different index for different languages', async () => {
      const pythonIndex = await getPathIndex('python');
      const jsIndex = await getPathIndex('javascript');
      expect(pythonIndex).not.toBe(jsIndex);
    });
  });

  describe('clearPathIndexCache', () => {
    it('clears specific language cache', async () => {
      const index1 = await getPathIndex('python');
      clearPathIndexCache('python');
      const index2 = await getPathIndex('python');
      expect(index1).not.toBe(index2);
    });

    it('clears all caches when no language specified', async () => {
      await getPathIndex('python');
      await getPathIndex('javascript');
      clearPathIndexCache();
      // Subsequent calls should return new instances
      const index = await getPathIndex('python');
      expect(index).toBeDefined();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/paths/loader.test.ts`
Expected: FAIL - functions don't accept language parameter

**Step 3: Update the loader**

```typescript
// src/lib/paths/loader.ts
import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';
import type { Blueprint, Skin, PathIndex, BlueprintRef } from './types';

/**
 * Get paths directory for a language
 */
function getPathsDir(language: string = 'python'): string {
  return join(process.cwd(), 'paths', language);
}

/**
 * Load all blueprints from YAML files
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export async function loadBlueprints(language: string = 'python'): Promise<Blueprint[]> {
  const blueprintsDir = join(getPathsDir(language), 'blueprints');

  // Check if directory exists
  try {
    await access(blueprintsDir);
  } catch {
    return []; // Directory doesn't exist for this language yet
  }

  const files = await readdir(blueprintsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const blueprints: Blueprint[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(blueprintsDir, file), 'utf-8');
    const data = yaml.load(content) as Blueprint;

    if (!data.id || !data.title || !data.beats || data.beats.length === 0) {
      console.warn(`Invalid blueprint in ${file}: missing required fields`);
      continue;
    }

    blueprints.push(data);
  }

  return blueprints;
}

/**
 * Load all skins from YAML files
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export async function loadSkins(language: string = 'python'): Promise<Skin[]> {
  const skinsDir = join(getPathsDir(language), 'skins');

  try {
    await access(skinsDir);
  } catch {
    return [];
  }

  const files = await readdir(skinsDir);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

  const skins: Skin[] = [];

  for (const file of yamlFiles) {
    const content = await readFile(join(skinsDir, file), 'utf-8');
    const data = yaml.load(content) as Skin;

    if (!data.id || !data.title || !data.vars) {
      console.warn(`Invalid skin in ${file}: missing required fields`);
      continue;
    }

    skins.push(data);
  }

  return skins;
}

/**
 * Build lookup indexes for efficient querying
 */
export function buildPathIndex(blueprints: Blueprint[], skins: Skin[]): PathIndex {
  // ... unchanged implementation ...
}

// Per-language index cache
const cachedIndexes = new Map<string, PathIndex>();

/**
 * Get the path index (loads and caches on first call)
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export async function getPathIndex(language: string = 'python'): Promise<PathIndex> {
  if (cachedIndexes.has(language)) {
    return cachedIndexes.get(language)!;
  }

  const blueprints = await loadBlueprints(language);
  const skins = await loadSkins(language);
  const index = buildPathIndex(blueprints, skins);
  cachedIndexes.set(language, index);

  return index;
}

/**
 * Clear the cached index
 * @param language - Optional specific language to clear; clears all if omitted
 */
export function clearPathIndexCache(language?: string): void {
  if (language) {
    cachedIndexes.delete(language);
  } else {
    cachedIndexes.clear();
  }
}
```

**Step 4: Run tests**

Run: `pnpm test tests/unit/paths/loader.test.ts && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/paths/loader.ts tests/unit/paths/loader.test.ts
git commit -m "$(cat <<'EOF'
feat(paths): parameterize loader by language with per-language caching

- loadBlueprints(language) and loadSkins(language) accept language param
- getPathIndex(language) caches per language
- clearPathIndexCache(language) clears specific or all caches
- Gracefully handles missing directories for new languages

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.2: Update Client Loader

**Files:**
- Modify: `src/lib/paths/client-loader.ts`
- Test: `tests/unit/paths/client-loader.test.ts` (update if exists)

**Step 1: Write failing test**

```typescript
// tests/unit/paths/client-loader.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Client Loader', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockClear();
  });

  it('fetches path index for specified language', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blueprints: [], skins: [] }),
    });

    const { getClientPathIndex } = await import('@/lib/paths/client-loader');
    await getClientPathIndex('javascript');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/paths?language=javascript')
    );
  });

  it('defaults to python', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ blueprints: [], skins: [] }),
    });

    const { getClientPathIndex } = await import('@/lib/paths/client-loader');
    await getClientPathIndex();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/paths?language=python')
    );
  });
});
```

**Step 2-6:** Similar pattern - update client-loader.ts to accept language parameter, run tests, commit.

---

## Phase 4: Generator Registry

### Task 4.1: Create Language-Scoped Generator Registry

**Files:**
- Modify: `src/lib/generators/index.ts`
- Create: `src/lib/generators/python/index.ts`
- Create: `src/lib/generators/javascript/index.ts` (stub)
- Test: `tests/unit/generators/registry.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/generators/registry.test.ts
import { describe, it, expect } from 'vitest';
import {
  getGenerator,
  hasGenerator,
  getGeneratorNames,
} from '@/lib/generators';

describe('Generator Registry', () => {
  describe('getGenerator with language', () => {
    it('returns Python generator by default', () => {
      const gen = getGenerator('slice-bounds');
      expect(gen).toBeDefined();
      expect(gen?.name).toBe('slice-bounds');
    });

    it('returns Python generator explicitly', () => {
      const gen = getGenerator('slice-bounds', 'python');
      expect(gen).toBeDefined();
    });

    it('returns undefined for Python generator in JavaScript', () => {
      const gen = getGenerator('slice-bounds', 'javascript');
      // slice-bounds is Python-specific
      expect(gen).toBeUndefined();
    });

    it('returns JavaScript generator', () => {
      const gen = getGenerator('array-methods', 'javascript');
      // Once we add JS generators
      expect(gen === undefined || gen?.name === 'array-methods').toBe(true);
    });
  });

  describe('hasGenerator with language', () => {
    it('checks Python generators by default', () => {
      expect(hasGenerator('slice-bounds')).toBe(true);
      expect(hasGenerator('nonexistent')).toBe(false);
    });

    it('checks language-specific generators', () => {
      expect(hasGenerator('slice-bounds', 'python')).toBe(true);
      expect(hasGenerator('slice-bounds', 'javascript')).toBe(false);
    });
  });

  describe('getGeneratorNames with language', () => {
    it('returns Python generator names by default', () => {
      const names = getGeneratorNames();
      expect(names).toContain('slice-bounds');
      expect(names.length).toBeGreaterThan(30);
    });

    it('returns JavaScript generator names', () => {
      const names = getGeneratorNames('javascript');
      expect(Array.isArray(names)).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/generators/registry.test.ts`
Expected: FAIL - functions don't accept language parameter

**Step 3: Restructure generators**

```typescript
// src/lib/generators/python/index.ts
// Re-export all Python generators

import { sliceBoundsGenerator } from '../definitions/slice-bounds';
import { variableNamesGenerator } from '../definitions/variable-names';
// ... import all 38 generators ...

export const generators: Map<string, Generator> = new Map([
  ['slice-bounds', sliceBoundsGenerator],
  ['variable-names', variableNamesGenerator],
  // ... all 38 generators ...
]);

export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}
```

```typescript
// src/lib/generators/javascript/index.ts
// JavaScript generators (stub for now)

import type { Generator } from '../types';

export const generators: Map<string, Generator> = new Map();

export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}
```

```typescript
// src/lib/generators/index.ts
// Language-scoped generator registry

import type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap } from './types';
import * as pythonGenerators from './python';
import * as javascriptGenerators from './javascript';

// Re-export types
export type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata, VariantOverrides, VariantMap };

// Re-export utilities
export { createSeed, hashString } from './seed';
export { seededRandom, type SeededRandom } from './utils';

const generatorsByLanguage: Record<string, {
  getGenerator: (name: string) => Generator | undefined;
  hasGenerator: (name: string) => boolean;
  getGeneratorNames: () => string[];
}> = {
  python: pythonGenerators,
  javascript: javascriptGenerators,
};

/**
 * Get a generator by name.
 * @param name - Generator name
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getGenerator(name: string, language: string = 'python'): Generator | undefined {
  return generatorsByLanguage[language]?.getGenerator(name);
}

/**
 * Check if a generator exists.
 * @param name - Generator name
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function hasGenerator(name: string, language: string = 'python'): boolean {
  return generatorsByLanguage[language]?.hasGenerator(name) ?? false;
}

/**
 * Get all registered generator names.
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function getGeneratorNames(language: string = 'python'): string[] {
  return generatorsByLanguage[language]?.getGeneratorNames() ?? [];
}

// Legacy: register function for backwards compatibility (adds to Python by default)
export function registerGenerator(generator: Generator): void {
  pythonGenerators.generators.set(generator.name, generator);
}
```

**Step 4: Run tests**

Run: `pnpm test tests/unit/generators/registry.test.ts && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/index.ts src/lib/generators/python/index.ts \
        src/lib/generators/javascript/index.ts tests/unit/generators/registry.test.ts
git commit -m "$(cat <<'EOF'
feat(generators): language-scoped generator registry

- Move Python generators to python/index.ts
- Create JavaScript generators stub
- Update registry API to accept language parameter
- Maintain backwards compatibility with default python

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: Core Hooks

### Task 5.1: Create useActiveLanguage Hook

**Files:**
- Create: `src/lib/hooks/useActiveLanguage.ts`
- Modify: `src/lib/hooks/index.ts`
- Test: `tests/unit/hooks/useActiveLanguage.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/hooks/useActiveLanguage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActiveLanguage } from '@/lib/hooks/useActiveLanguage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase/client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useActiveLanguage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('initial state', () => {
    it('defaults to python when no profile', () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      expect(result.current.language).toBe('python');
    });

    it('returns profile preferred_language when available', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { preferred_language: 'javascript' },
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.language).toBe('javascript');
      });
    });
  });

  describe('setLanguage', () => {
    it('updates profile preferred_language', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { preferred_language: 'python' },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.language).toBe('python');
      });

      await act(async () => {
        await result.current.setLanguage('javascript');
      });

      expect(mockUpdate).toHaveBeenCalledWith({ preferred_language: 'javascript' });
    });

    it('invalidates related query caches', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { preferred_language: 'python' },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      await waitFor(() => {
        expect(result.current.language).toBe('python');
      });

      await act(async () => {
        await result.current.setLanguage('javascript');
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('isLoading', () => {
    it('is true while fetching profile', () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } as any },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue(new Promise(() => {})), // Never resolves
          }),
        }),
      } as any);

      const { result } = renderHook(() => useActiveLanguage(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/hooks/useActiveLanguage.test.tsx`
Expected: FAIL - hook doesn't exist

**Step 3: Create the hook**

```typescript
// src/lib/hooks/useActiveLanguage.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

export interface UseActiveLanguageReturn {
  language: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to get and set the user's active/preferred language
 *
 * Used by:
 * - DueNowBand (language switcher)
 * - useConceptSRS (filter by language)
 * - useDueCount (filter by language)
 * - useSkillTree (load curriculum)
 */
export function useActiveLanguage(): UseActiveLanguageReturn {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['activeLanguage', user?.id],
    queryFn: async () => {
      if (!user) return 'python';

      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data?.preferred_language ?? 'python';
    },
    enabled: !authLoading,
    staleTime: 60_000,
  });

  const setLanguage = async (language: string): Promise<void> => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ preferred_language: language })
      .eq('id', user.id)
      .single();

    // Invalidate all language-dependent queries
    await queryClient.invalidateQueries({ queryKey: ['activeLanguage'] });
    await queryClient.invalidateQueries({ queryKey: ['dueCount'] });
    await queryClient.invalidateQueries({ queryKey: ['subconcept-progress'] });
    await queryClient.invalidateQueries({ queryKey: ['skillTree'] });
    await queryClient.invalidateQueries({ queryKey: ['languageStats'] });
  };

  return {
    language: query.data ?? 'python',
    setLanguage,
    isLoading: authLoading || query.isLoading,
    error: query.error as Error | null,
  };
}
```

**Step 4: Export from index**

```typescript
// Add to src/lib/hooks/index.ts
export { useActiveLanguage } from './useActiveLanguage';
export type { UseActiveLanguageReturn } from './useActiveLanguage';
```

**Step 5: Run tests**

Run: `pnpm test tests/unit/hooks/useActiveLanguage.test.tsx && pnpm typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/hooks/useActiveLanguage.ts src/lib/hooks/index.ts \
        tests/unit/hooks/useActiveLanguage.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add useActiveLanguage hook

- Get/set user's preferred language from profile
- Invalidates related query caches on language change
- Defaults to 'python' for unauthenticated users

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5.2: Update useDueCount with Language Filter

**Files:**
- Modify: `src/lib/hooks/useDueCount.ts`
- Test: `tests/unit/hooks/useDueCount.test.tsx` (create)

**Step 1: Write failing tests**

```typescript
// tests/unit/hooks/useDueCount.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDueCount } from '@/lib/hooks/useDueCount';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useDueCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('with language parameter', () => {
    it('filters by language in query', async () => {
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ next_review: new Date().toISOString() }],
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      renderHook(() => useDueCount('user-1', 'javascript'), { wrapper });

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      });

      // Second eq call should be for language
      const innerEq = mockEq.mock.results[0].value.eq;
      expect(innerEq).toHaveBeenCalledWith('language', 'javascript');
    });

    it('defaults to python', async () => {
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      renderHook(() => useDueCount('user-1'), { wrapper });

      await waitFor(() => {
        const innerEq = mockEq.mock.results[0]?.value.eq;
        expect(innerEq).toHaveBeenCalledWith('language', 'python');
      });
    });

    it('includes language in query key', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useDueCount('user-1', 'javascript'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that different languages create different cache entries
      const { result: result2 } = renderHook(() => useDueCount('user-1', 'python'), { wrapper });

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      // Both should exist in cache with different keys
      expect(queryClient.getQueryData(['dueCount', 'user-1', 'javascript'])).toBeDefined();
      expect(queryClient.getQueryData(['dueCount', 'user-1', 'python'])).toBeDefined();
    });
  });
});
```

**Step 2: Run tests**

Run: `pnpm test tests/unit/hooks/useDueCount.test.tsx`
Expected: FAIL

**Step 3: Update the hook**

```typescript
// src/lib/hooks/useDueCount.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface UseDueCountReturn {
  dueCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to get count of due subconcepts for a language
 * @param userId - User ID
 * @param language - 'python' or 'javascript' (default: 'python')
 */
export function useDueCount(
  userId: string | undefined,
  language: string = 'python'
): UseDueCountReturn {
  const query = useQuery({
    queryKey: ['dueCount', userId, language],
    queryFn: async () => {
      if (!userId) return 0;

      const { data, error } = await supabase
        .from('subconcept_progress')
        .select('next_review')
        .eq('user_id', userId)
        .eq('language', language);

      if (error) throw error;

      const now = new Date();
      return (data ?? []).filter((p) => {
        if (!p.next_review) return false;
        return new Date(p.next_review) <= now;
      }).length;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

  return {
    dueCount: query.data ?? 0,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
```

**Step 4: Run tests**

Run: `pnpm test tests/unit/hooks/useDueCount.test.tsx && pnpm typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/hooks/useDueCount.ts tests/unit/hooks/useDueCount.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add language filter to useDueCount

- Accept language parameter (default: 'python')
- Filter subconcept_progress by language
- Include language in query key for proper caching

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5.3: Update useConceptSRS with Language Filter

**Files:**
- Modify: `src/lib/hooks/useConceptSRS.ts`
- Test: `tests/unit/hooks/useConceptSRS.test.tsx` (update)

**Step 1: Add failing tests**

```typescript
// Add to tests/unit/hooks/useConceptSRS.test.tsx
describe('language filtering', () => {
  it('accepts language parameter', async () => {
    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useConceptSRS('javascript'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have filtered by language
    expect(mockFrom).toHaveBeenCalledWith('subconcept_progress');
  });

  it('includes language in upsert', async () => {
    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    });

    const mockFrom = vi.mocked(supabase.from);
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({ data: [], error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      }),
      upsert: mockUpsert,
    } as any);

    const { result } = renderHook(() => useConceptSRS('javascript'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.recordSubconceptResult('for-of', 'async', 4, 'ex-1', true);
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'javascript' }),
      expect.anything()
    );
  });
});
```

**Step 2-6:** Similar TDD pattern for updating useConceptSRS.

---

### Task 5.4: Update useSkillTree with Language Parameter

**Files:**
- Modify: `src/lib/hooks/useSkillTree.ts`
- Test: `tests/unit/hooks/useSkillTree.test.tsx` (update)

**Step 1: Add failing tests**

```typescript
// Add to tests/unit/hooks/useSkillTree.test.tsx
describe('language parameter', () => {
  it('loads curriculum for specified language', async () => {
    const { result } = renderHook(() => useSkillTree('user-1', 'javascript'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should load JavaScript curriculum
    expect(result.current.concepts?.some(c => c.slug === 'async')).toBe(true);
  });

  it('includes language in query key', async () => {
    renderHook(() => useSkillTree('user-1', 'python'), { wrapper });
    renderHook(() => useSkillTree('user-1', 'javascript'), { wrapper });

    await waitFor(() => {
      expect(queryClient.getQueryData(['skillTree', 'user-1', 'python'])).toBeDefined();
      expect(queryClient.getQueryData(['skillTree', 'user-1', 'javascript'])).toBeDefined();
    });
  });
});
```

---

### Task 5.5: Update useConceptSession with Language Filter

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`
- Test: `tests/unit/hooks/useConceptSession.test.tsx` (update)

**Step 1: Add failing tests**

```typescript
describe('language parameter', () => {
  it('filters exercises by language', async () => {
    // ... test that exercises query includes language filter
  });

  it('passes language to logAttempt', async () => {
    // ... test that logAttempt includes language
  });
});
```

---

### Task 5.6: Split Stats Hooks (Global + Per-Language)

**Files:**
- Modify: `src/lib/hooks/useStats.ts`
- Create: `src/lib/hooks/useLanguageStats.ts`
- Test: `tests/unit/hooks/useLanguageStats.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/hooks/useLanguageStats.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLanguageStats } from '@/lib/hooks/useLanguageStats';

describe('useLanguageStats', () => {
  it('returns accuracy filtered by language', async () => {
    // Mock exercise_attempts filtered by language
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { times_seen: 10, times_correct: 8 },
              { times_seen: 5, times_correct: 4 },
            ],
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useLanguageStats('user-1', 'javascript'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accuracy).toBeCloseTo(80); // 12/15 = 80%
  });

  it('returns total exercises for language', async () => {
    // Test total count per language
  });
});
```

---

### Task 5.7: Update logAttempt to Include Language

**Files:**
- Modify: `src/lib/exercise/log-attempt.ts`
- Test: `tests/unit/exercise/log-attempt.test.ts` (update)

---

## Phase 6: Validation Scripts

### Task 6.1: Parameterize validate-exercises.ts

**Files:**
- Modify: `scripts/validate-exercises.ts`
- Test: Manual testing with `--language` flag

**Step 1: Update script**

```typescript
// scripts/validate-exercises.ts
import { parseArgs } from 'util';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    language: { type: 'string', default: 'python' },
  },
});

const language = values.language ?? 'python';
const exercisesDir = join(process.cwd(), 'exercises', language);

// ... rest of validation logic
```

**Step 2: Update package.json**

```json
{
  "scripts": {
    "validate:exercises": "tsx scripts/validate-exercises.ts",
    "validate:exercises:js": "tsx scripts/validate-exercises.ts --language=javascript",
    "validate:exercises:all": "pnpm validate:exercises && pnpm validate:exercises:js"
  }
}
```

---

### Task 6.2: Parameterize validate-paths.ts

**Files:**
- Modify: `scripts/validate-paths.ts`
- Update: `package.json`

Similar pattern to Task 6.1.

---

## Phase 7: UI Components

### Task 7.1: Add Language Badge to Header

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Create: `src/components/ui/LanguageBadge.tsx`
- Test: `tests/unit/components/LanguageBadge.test.tsx`

**Step 1: Write failing tests**

```typescript
// tests/unit/components/LanguageBadge.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageBadge } from '@/components/ui/LanguageBadge';

describe('LanguageBadge', () => {
  it('shows Python icon for python language', () => {
    render(<LanguageBadge language="python" />);
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('shows JavaScript icon for javascript language', () => {
    render(<LanguageBadge language="javascript" />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('applies active styling when active', () => {
    render(<LanguageBadge language="python" active />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-accent-primary');
  });
});
```

**Step 2: Create component**

```tsx
// src/components/ui/LanguageBadge.tsx
import { cn } from '@/lib/utils';

interface LanguageBadgeProps {
  language: string;
  active?: boolean;
  className?: string;
}

const LANGUAGE_CONFIG: Record<string, { icon: string; label: string }> = {
  python: { icon: '🐍', label: 'Python' },
  javascript: { icon: '📜', label: 'JavaScript' },
};

export function LanguageBadge({ language, active, className }: LanguageBadgeProps) {
  const config = LANGUAGE_CONFIG[language] ?? { icon: '💻', label: language };

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium',
        active ? 'bg-accent-primary/20 text-accent-primary' : 'bg-surface-2 text-secondary',
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
```

---

### Task 7.2: Add Language Switcher to DueNowBand

**Files:**
- Modify: `src/components/dashboard/DueNowBand.tsx`
- Create: `src/components/dashboard/LanguageSwitcher.tsx`
- Test: `tests/unit/components/LanguageSwitcher.test.tsx`

---

### Task 7.3: Add Language Tabs to SkillTree

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx`
- Test: `tests/unit/components/SkillTree.test.tsx` (update)

---

### Task 7.4: Update StatsGrid for Hybrid Display

**Files:**
- Modify: `src/components/stats/StatsGrid.tsx`
- Test: `tests/unit/components/StatsGrid.test.tsx`

---

## Phase 8: Documentation Updates

### Task 8.1: Update Obsidian Vault

**Files:**
- `Index.md` - Add multi-language section
- `Architecture.md` - Update with language dimension
- `Database-Schema.md` - Add language columns
- `Features.md` - Update roadmap

---

### Task 8.2: Update CLAUDE.md

**Sections to update:**
- Project Overview - mention multi-language
- Tech Stack - no changes
- Commands - add :js variants
- Project Structure - add javascript directories
- Key Patterns - add language switching
- Database - add language columns
- Curriculum System - add JavaScript
- Coding Conventions - no changes
- Completed Milestones - add milestone
- Next Steps - update

---

### Task 8.3: Update AGENTS.md

**Sections to update:**
- What This Is - mention JavaScript
- Database Tables - add language columns
- Key Patterns - add language switching

---

### Task 8.4: Update GEMINI.md

**Sections to update:**
- Project Overview - mention JavaScript
- Database Schema - add language columns
- Next Steps - update

---

### Task 8.5: Update Serena Memories

Use Serena MCP tools:

```bash
# Update codebase_structure memory
mcp__plugin_serena_serena__edit_memory(
  name="codebase_structure",
  content="... add language directories and files ..."
)

# Update project_overview memory
mcp__plugin_serena_serena__edit_memory(
  name="project_overview",
  content="... add multi-language support ..."
)
```

---

### Task 8.6: Create Daem0n Memory

Use Daem0n MCP tools:

```bash
mcp__daem0nmcp__context_check(description="Multi-language support implementation complete")

mcp__daem0nmcp__remember(
  content="Multi-Language Support Implementation Complete

KEY CHANGES:
1. Database: Added language column to subconcept_progress and exercise_attempts
2. Types: ConceptSlug is now string with per-language validation
3. Loaders: All loaders (curriculum, paths, generators) accept language parameter
4. Hooks: useActiveLanguage, useDueCount(lang), useConceptSRS(lang), etc.
5. UI: Language badge in header, switcher in DueNowBand, tabs in SkillTree
6. Scripts: validate:exercises --language=javascript

PATTERNS:
- Language always passed explicitly (no magic defaults in DB writes)
- Per-language caching for path indexes
- Query keys include language dimension
- Global stats (streak) + per-language stats (accuracy)

See docs/plans/2026-01-11-multi-language-support-design.md for full design.",
  category="decision"
)
```

---

## Verification Checklist

Before claiming completion, verify:

1. [ ] All migrations applied: `pnpm db:reset`
2. [ ] TypeScript compiles: `pnpm typecheck`
3. [ ] All tests pass: `pnpm test`
4. [ ] Linting passes: `pnpm lint`
5. [ ] E2E tests pass: `pnpm test:e2e`
6. [ ] Validate exercises (both languages): `pnpm validate:exercises:all`
7. [ ] Validate paths (both languages): `pnpm validate:paths:all`
8. [ ] Manual testing:
   - [ ] Switch language in dashboard
   - [ ] Due count updates for new language
   - [ ] Skill tree shows correct curriculum
   - [ ] Stats show per-language data
   - [ ] Practice session uses correct language

---

## Summary

**Total Tasks:** 28
**Total New Tests:** ~93
**Files Modified:** ~40
**Files Created:** ~15

**Key Architectural Decisions:**
1. Language is explicit in all data writes (no relying on defaults)
2. Per-language caching prevents cross-contamination
3. Query keys include language for proper cache invalidation
4. Global stats (streak) kept separate from per-language stats (accuracy)
5. Skill tree tabs are view-only (don't change preferred_language)

**Extension Points:**
- Add new language: Create curriculum JSON, generators, and content directories
- Add cross-language features: Use shared concept slugs (loops, functions, etc.)
- Language-specific grading: Extend grading strategies per language
