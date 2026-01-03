# Exercise Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SQL seed data with YAML exercise files, add slug-based identity, and create an import script for idempotent database population.

**Architecture:** YAML files in `exercises/python/*.yaml` parsed and validated by TypeScript script, upserted to Supabase via composite key `(language, slug)`. Schema adds `slug` column with backfill migration. Normalization enhanced to match design spec.

**Tech Stack:** TypeScript, YAML parser, Supabase client, Vitest for testing, pnpm scripts.

---

## Phase 1: Enhanced Answer Normalization

### Task 1: Write failing tests for enhanced normalization

**Files:**
- Test: `tests/unit/exercise/matching.test.ts`

**Step 1: Write the failing tests**

Add these test cases to the existing `normalizePython` describe block:

```typescript
  it('trims leading and trailing whitespace from entire answer', () => {
    expect(normalizePython('  print(x)  ')).toBe('print(x)');
    expect(normalizePython('\n\nprint(x)\n\n')).toBe('print(x)');
  });

  it('collapses multiple consecutive blank lines to single blank line', () => {
    const input = 'def foo():\n    pass\n\n\n\ndef bar():\n    pass';
    const expected = 'def foo():\n    pass\n\ndef bar():\n    pass';
    expect(normalizePython(input)).toBe(expected);
  });

  it('handles real-world multi-line with all normalizations', () => {
    const input = '  for i in range(5):\r\n\tprint(i)  \n\n';
    const expected = 'for i in range(5):\n    print(i)';
    expect(normalizePython(input)).toBe(expected);
  });
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/matching.test.ts`
Expected: FAIL - "trims leading and trailing whitespace" and "collapses multiple consecutive blank lines" tests fail

**Step 3: Commit failing tests**

```bash
git add tests/unit/exercise/matching.test.ts
git commit -m "test(exercise): add failing tests for enhanced normalization"
```

---

### Task 2: Implement enhanced normalization

**Files:**
- Modify: `src/lib/exercise/matching.ts:10-17`

**Step 1: Update normalizePython function**

Replace the existing `normalizePython` function:

```typescript
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')           // CRLF → LF
    .replace(/\t/g, '    ')           // Tabs → 4 spaces
    .replace(/ +$/gm, '')             // Remove trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')       // Collapse 3+ newlines to 2
    .trim();                          // Trim leading/trailing whitespace
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test tests/unit/exercise/matching.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/lib/exercise/matching.ts
git commit -m "feat(exercise): enhance normalization with trim and blank line collapse"
```

---

## Phase 2: Database Schema Changes

### Task 3: Create slug migration SQL file

**Files:**
- Create: `supabase/migrations/20260103000001_add_exercise_slug.sql`

**Step 1: Create the migration file**

```sql
-- Add slug column with composite unique constraint for multi-language support
-- Slugs are manually authored in YAML, never auto-generated during import

-- Step 1: Add nullable slug column
ALTER TABLE exercises
ADD COLUMN slug TEXT;

-- Step 2: Backfill existing exercises with category-prefixed slugs
-- This guarantees uniqueness even if titles collide after normalization
UPDATE exercises
SET slug = LOWER(
  category || '-' ||
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9 -]', '', 'g'),
    ' +', '-', 'g'
  )
);

-- Step 3: Make slug required
ALTER TABLE exercises
ALTER COLUMN slug SET NOT NULL;

-- Step 4: Composite unique constraint (language, slug) for multi-language support
ALTER TABLE exercises
ADD CONSTRAINT exercises_language_slug_unique UNIQUE (language, slug);

-- Step 5: Update difficulty constraint to match design (1-3 not 1-5)
ALTER TABLE exercises
DROP CONSTRAINT IF EXISTS exercises_difficulty_check;

ALTER TABLE exercises
ADD CONSTRAINT exercises_difficulty_check CHECK (difficulty BETWEEN 1 AND 3);

-- Step 6: Add index for slug lookups
CREATE INDEX idx_exercises_slug ON exercises(slug);
CREATE INDEX idx_exercises_language_slug ON exercises(language, slug);
```

**Step 2: Apply migration locally**

Run: `pnpm db:reset`
Expected: Migration applies successfully, no errors

**Step 3: Commit**

```bash
git add supabase/migrations/20260103000001_add_exercise_slug.sql
git commit -m "feat(db): add slug column with composite unique constraint"
```

---

### Task 4: Regenerate TypeScript types

**Files:**
- Modify: `src/lib/types/database.generated.ts` (auto-generated)

**Step 1: Regenerate types from database**

Run: `pnpm db:types`
Expected: `database.generated.ts` updated with `slug` field in exercises type

**Step 2: Verify slug field exists**

Run: `grep -n "slug" src/lib/types/database.generated.ts`
Expected: Shows `slug: string` in Row, `slug: string` in Insert, `slug?: string` in Update

**Step 3: Commit**

```bash
git add src/lib/types/database.generated.ts
git commit -m "chore(types): regenerate database types with slug field"
```

---

### Task 5: Write failing test for Exercise type with slug

**Files:**
- Test: `tests/unit/exercise/types.test.ts`

**Step 1: Write the failing test**

Add this test case:

```typescript
describe('Exercise type', () => {
  it('includes slug field', () => {
    const exercise: Exercise = {
      id: 'test-id',
      slug: 'for-loop-range',
      language: 'python',
      category: 'loops',
      difficulty: 1,
      title: 'For Loop Range',
      prompt: 'Write a for loop',
      expectedAnswer: 'for i in range(5):',
      hints: ['Use range()'],
      explanation: null,
      tags: ['loops'],
      timesPracticed: 0,
      avgSuccessRate: null,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    expect(exercise.slug).toBe('for-loop-range');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/types.test.ts`
Expected: FAIL - Property 'slug' does not exist on type 'Exercise'

**Step 3: Commit failing test**

```bash
git add tests/unit/exercise/types.test.ts
git commit -m "test(types): add failing test for Exercise slug field"
```

---

### Task 6: Add slug field to Exercise type

**Files:**
- Modify: `src/lib/types/app.types.ts:33-48`

**Step 1: Add slug field to Exercise interface**

Update the Exercise interface to include slug after id:

```typescript
export interface Exercise {
  id: string;
  slug: string;
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
```

**Step 2: Run test to verify it passes**

Run: `pnpm test tests/unit/exercise/types.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/types/app.types.ts
git commit -m "feat(types): add slug field to Exercise interface"
```

---

### Task 7: Write failing test for mapExercise with slug

**Files:**
- Test: `tests/unit/srs/mappers.test.ts`

**Step 1: Write the failing test**

Find the existing `mapExercise` tests and add:

```typescript
  it('maps slug field', () => {
    const dbExercise = {
      id: 'test-id',
      slug: 'for-loop-range',
      language: 'python',
      category: 'loops',
      difficulty: 1,
      title: 'For Loop Range',
      prompt: 'Write a for loop',
      expected_answer: 'for i in range(5):',
      hints: ['Use range()'],
      explanation: null,
      tags: ['loops'],
      times_practiced: 0,
      avg_success_rate: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    const result = mapExercise(dbExercise);
    expect(result.slug).toBe('for-loop-range');
  });
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/srs/mappers.test.ts`
Expected: FAIL - result.slug is undefined

**Step 3: Commit failing test**

```bash
git add tests/unit/srs/mappers.test.ts
git commit -m "test(mappers): add failing test for slug mapping"
```

---

### Task 8: Update mapExercise to include slug

**Files:**
- Modify: `src/lib/supabase/mappers.ts:30-47`

**Step 1: Add slug to mapExercise function**

Update the function to include slug mapping:

```typescript
export function mapExercise(db: DbExercise): Exercise {
  return {
    id: db.id,
    slug: db.slug,
    language: db.language,
    category: db.category,
    difficulty: db.difficulty,
    title: db.title,
    prompt: db.prompt,
    expectedAnswer: db.expected_answer,
    hints: (db.hints as string[]) ?? [],
    explanation: db.explanation,
    tags: db.tags ?? [],
    timesPracticed: db.times_practiced ?? 0,
    avgSuccessRate: db.avg_success_rate,
    createdAt: db.created_at ?? new Date().toISOString(),
    updatedAt: db.updated_at ?? new Date().toISOString(),
  };
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test tests/unit/srs/mappers.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/supabase/mappers.ts
git commit -m "feat(mappers): add slug field to mapExercise"
```

---

### Task 9: Write integration test for slug migration

**Files:**
- Modify: `tests/integration/migrations/exercises.test.ts`

**Step 1: Add slug migration test**

Add a new test to the existing describe block:

```typescript
  it('has slug column with unique constraint per language', async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('slug')
      .eq('language', 'python');

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    // Verify all slugs are non-null
    for (const exercise of data!) {
      expect(exercise.slug).toBeTruthy();
      expect(typeof exercise.slug).toBe('string');
    }

    // Verify slugs are unique within language
    const slugs = data!.map(e => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
```

**Step 2: Run test to verify it passes**

Run: `pnpm test tests/integration/migrations/exercises.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/migrations/exercises.test.ts
git commit -m "test(integration): add slug migration verification test"
```

---

## Phase 3: YAML Exercise Schema and Validation

### Task 10: Install yaml package

**Files:**
- Modify: `package.json`

**Step 1: Install yaml package**

Run: `pnpm add yaml`
Expected: Package installed successfully

**Step 2: Verify installation**

Run: `grep '"yaml"' package.json`
Expected: Shows `"yaml": "^X.X.X"` in dependencies

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add yaml package for exercise parsing"
```

---

### Task 11: Create YAML exercise types

**Files:**
- Create: `src/lib/exercise/yaml-types.ts`
- Modify: `src/lib/exercise/index.ts`

**Step 1: Create the types file**

```typescript
// src/lib/exercise/yaml-types.ts
// Types for YAML exercise file format

/**
 * Single exercise definition in YAML
 */
export interface YamlExercise {
  slug: string;
  title: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  expected_answer: string;
  hints: string[];
  tags?: string[];
}

/**
 * YAML file structure
 */
export interface YamlExerciseFile {
  language: string;
  category: string;
  exercises: YamlExercise[];
}

/**
 * Validation error for a single exercise
 */
export interface YamlValidationError {
  file: string;
  slug?: string;
  field: string;
  message: string;
}

/**
 * Result of validating all YAML files
 */
export interface YamlValidationResult {
  valid: boolean;
  errors: YamlValidationError[];
  exerciseCount: number;
}
```

**Step 2: Export from index**

Add to `src/lib/exercise/index.ts`:

```typescript
export * from './yaml-types';
```

**Step 3: Run typecheck to verify**

Run: `pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/exercise/yaml-types.ts src/lib/exercise/index.ts
git commit -m "feat(exercise): add YAML exercise types"
```

---

### Task 12: Write failing tests for YAML validation

**Files:**
- Create: `tests/unit/exercise/yaml-validation.test.ts`

**Step 1: Write the failing tests**

```typescript
// tests/unit/exercise/yaml-validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateYamlExercise, validateYamlFile } from '@/lib/exercise';
import type { YamlExercise, YamlExerciseFile } from '@/lib/exercise';

describe('validateYamlExercise', () => {
  const validExercise: YamlExercise = {
    slug: 'for-loop-range',
    title: 'For Loop Range',
    difficulty: 1,
    prompt: 'Write a for loop',
    expected_answer: 'for i in range(5):',
    hints: ['Use range()'],
    tags: ['loops'],
  };

  it('returns empty errors for valid exercise', () => {
    const errors = validateYamlExercise(validExercise, 'test.yaml');
    expect(errors).toHaveLength(0);
  });

  describe('slug validation', () => {
    it('errors on missing slug', () => {
      const exercise = { ...validExercise, slug: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'slug',
        message: expect.stringContaining('required'),
      }));
    });

    it('errors on non-kebab-case slug', () => {
      const exercise = { ...validExercise, slug: 'ForLoopRange' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'slug',
        message: expect.stringContaining('kebab-case'),
      }));
    });

    it('accepts valid kebab-case slugs', () => {
      const slugs = ['simple', 'with-dash', 'multi-word-slug', 'with-123-numbers'];
      for (const slug of slugs) {
        const exercise = { ...validExercise, slug };
        const errors = validateYamlExercise(exercise, 'test.yaml');
        expect(errors.filter(e => e.field === 'slug')).toHaveLength(0);
      }
    });
  });

  describe('difficulty validation', () => {
    it('errors on difficulty out of range', () => {
      const exercise = { ...validExercise, difficulty: 4 as 1 | 2 | 3 };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'difficulty',
        message: expect.stringContaining('1, 2, or 3'),
      }));
    });

    it('errors on difficulty of 0', () => {
      const exercise = { ...validExercise, difficulty: 0 as 1 | 2 | 3 };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'difficulty',
      }));
    });
  });

  describe('required fields', () => {
    it('errors on missing title', () => {
      const exercise = { ...validExercise, title: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'title',
      }));
    });

    it('errors on missing prompt', () => {
      const exercise = { ...validExercise, prompt: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'prompt',
      }));
    });

    it('errors on missing expected_answer', () => {
      const exercise = { ...validExercise, expected_answer: '' };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'expected_answer',
      }));
    });
  });

  describe('hints validation', () => {
    it('errors on empty hints array', () => {
      const exercise = { ...validExercise, hints: [] };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'hints',
        message: expect.stringContaining('at least 1'),
      }));
    });

    it('accepts hints with one or more items', () => {
      const exercise = { ...validExercise, hints: ['Single hint'] };
      const errors = validateYamlExercise(exercise, 'test.yaml');
      expect(errors.filter(e => e.field === 'hints')).toHaveLength(0);
    });
  });
});

describe('validateYamlFile', () => {
  const validFile: YamlExerciseFile = {
    language: 'python',
    category: 'loops',
    exercises: [
      {
        slug: 'for-loop-range',
        title: 'For Loop Range',
        difficulty: 1,
        prompt: 'Write a for loop',
        expected_answer: 'for i in range(5):',
        hints: ['Use range()'],
      },
    ],
  };

  it('returns valid result for valid file', () => {
    const result = validateYamlFile(validFile, 'loops.yaml');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.exerciseCount).toBe(1);
  });

  it('errors on missing language', () => {
    const file = { ...validFile, language: '' };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'language',
    }));
  });

  it('errors on missing category', () => {
    const file = { ...validFile, category: '' };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'category',
    }));
  });

  it('errors on empty exercises array', () => {
    const file = { ...validFile, exercises: [] };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'exercises',
    }));
  });

  it('detects duplicate slugs within file', () => {
    const file: YamlExerciseFile = {
      ...validFile,
      exercises: [
        { ...validFile.exercises[0], slug: 'same-slug' },
        { ...validFile.exercises[0], slug: 'same-slug', title: 'Different Title' },
      ],
    };
    const result = validateYamlFile(file, 'loops.yaml');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'slug',
      message: expect.stringContaining('duplicate'),
    }));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`
Expected: FAIL - validateYamlExercise and validateYamlFile not found

**Step 3: Commit failing tests**

```bash
git add tests/unit/exercise/yaml-validation.test.ts
git commit -m "test(exercise): add failing tests for YAML validation"
```

---

### Task 13: Implement YAML validation functions

**Files:**
- Create: `src/lib/exercise/yaml-validation.ts`
- Modify: `src/lib/exercise/index.ts`

**Step 1: Create the validation module**

```typescript
// src/lib/exercise/yaml-validation.ts
import type {
  YamlExercise,
  YamlExerciseFile,
  YamlValidationError,
  YamlValidationResult
} from './yaml-types';

const KEBAB_CASE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validate a single exercise from YAML
 */
export function validateYamlExercise(
  exercise: YamlExercise,
  file: string
): YamlValidationError[] {
  const errors: YamlValidationError[] = [];
  const slug = exercise.slug || '(missing)';

  // Slug validation
  if (!exercise.slug) {
    errors.push({ file, slug, field: 'slug', message: 'slug is required' });
  } else if (!KEBAB_CASE_REGEX.test(exercise.slug)) {
    errors.push({
      file,
      slug,
      field: 'slug',
      message: 'slug must be kebab-case (lowercase letters, numbers, and hyphens)'
    });
  }

  // Required string fields
  if (!exercise.title) {
    errors.push({ file, slug, field: 'title', message: 'title is required' });
  }
  if (!exercise.prompt) {
    errors.push({ file, slug, field: 'prompt', message: 'prompt is required' });
  }
  if (!exercise.expected_answer) {
    errors.push({ file, slug, field: 'expected_answer', message: 'expected_answer is required' });
  }

  // Difficulty validation
  if (![1, 2, 3].includes(exercise.difficulty)) {
    errors.push({
      file,
      slug,
      field: 'difficulty',
      message: 'difficulty must be 1, 2, or 3'
    });
  }

  // Hints validation
  if (!exercise.hints || exercise.hints.length === 0) {
    errors.push({
      file,
      slug,
      field: 'hints',
      message: 'hints must have at least 1 item'
    });
  }

  return errors;
}

/**
 * Validate an entire YAML exercise file
 */
export function validateYamlFile(
  fileContent: YamlExerciseFile,
  fileName: string
): YamlValidationResult {
  const errors: YamlValidationError[] = [];

  // File-level validation
  if (!fileContent.language) {
    errors.push({ file: fileName, field: 'language', message: 'language is required' });
  }
  if (!fileContent.category) {
    errors.push({ file: fileName, field: 'category', message: 'category is required' });
  }
  if (!fileContent.exercises || fileContent.exercises.length === 0) {
    errors.push({ file: fileName, field: 'exercises', message: 'exercises array is required and must not be empty' });
  }

  // Validate each exercise
  const slugsSeen = new Set<string>();
  for (const exercise of fileContent.exercises || []) {
    const exerciseErrors = validateYamlExercise(exercise, fileName);
    errors.push(...exerciseErrors);

    // Check for duplicate slugs within file
    if (exercise.slug) {
      if (slugsSeen.has(exercise.slug)) {
        errors.push({
          file: fileName,
          slug: exercise.slug,
          field: 'slug',
          message: `duplicate slug "${exercise.slug}" in file`,
        });
      }
      slugsSeen.add(exercise.slug);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    exerciseCount: fileContent.exercises?.length || 0,
  };
}
```

**Step 2: Export from index**

Add to `src/lib/exercise/index.ts`:

```typescript
export * from './yaml-validation';
```

**Step 3: Run tests to verify they pass**

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/lib/exercise/yaml-validation.ts src/lib/exercise/index.ts
git commit -m "feat(exercise): implement YAML validation functions"
```

---

## Phase 4: Import Script

### Task 14: Create import script with tests

**Files:**
- Create: `scripts/import-exercises.ts`
- Modify: `package.json`

**Step 1: Create the import script**

```typescript
// scripts/import-exercises.ts
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import { createClient } from '@supabase/supabase-js';
import type { YamlExerciseFile, YamlValidationError } from '../src/lib/exercise/yaml-types';
import { validateYamlFile } from '../src/lib/exercise/yaml-validation';

// Configuration
const EXERCISES_DIR = join(process.cwd(), 'exercises');
const isProd = process.argv.includes('--prod');

// Supabase client setup
const supabaseUrl = isProd
  ? process.env.SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = isProd
  ? process.env.SUPABASE_SERVICE_ROLE_KEY!
  : process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (isProd && (!supabaseUrl || !supabaseKey)) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for --prod');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

interface ImportStats {
  inserted: number;
  updated: number;
  errors: number;
}

/**
 * Find all YAML files in exercises directory
 */
function findYamlFiles(baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(baseDir)) {
    return files;
  }

  for (const language of readdirSync(baseDir)) {
    const langDir = join(baseDir, language);
    if (!existsSync(langDir)) continue;

    for (const file of readdirSync(langDir)) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        files.push(join(langDir, file));
      }
    }
  }

  return files;
}

/**
 * Parse and validate all YAML files
 */
function loadAndValidateFiles(files: string[]): {
  valid: boolean;
  errors: YamlValidationError[];
  fileData: Array<{ path: string; content: YamlExerciseFile }>;
  totalExercises: number;
} {
  const allErrors: YamlValidationError[] = [];
  const fileData: Array<{ path: string; content: YamlExerciseFile }> = [];
  let totalExercises = 0;

  for (const filePath of files) {
    const fileName = basename(filePath);
    console.log(`  Parsing ${filePath}...`);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = parseYaml(content) as YamlExerciseFile;
      const result = validateYamlFile(parsed, fileName);

      if (!result.valid) {
        allErrors.push(...result.errors);
      } else {
        fileData.push({ path: filePath, content: parsed });
        totalExercises += result.exerciseCount;
        console.log(`    ✓ ${result.exerciseCount} exercises`);
      }
    } catch (err) {
      allErrors.push({
        file: fileName,
        field: 'parse',
        message: `Failed to parse YAML: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }

  // Check for duplicate slugs across all files within same language
  const slugsByLanguage = new Map<string, Set<string>>();
  for (const { content, path } of fileData) {
    const lang = content.language;
    if (!slugsByLanguage.has(lang)) {
      slugsByLanguage.set(lang, new Set());
    }
    const slugs = slugsByLanguage.get(lang)!;

    for (const exercise of content.exercises) {
      if (slugs.has(exercise.slug)) {
        allErrors.push({
          file: basename(path),
          slug: exercise.slug,
          field: 'slug',
          message: `duplicate slug "${exercise.slug}" across files for language "${lang}"`,
        });
      }
      slugs.add(exercise.slug);
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    fileData,
    totalExercises,
  };
}

/**
 * Import exercises to database
 */
async function importToDatabase(
  fileData: Array<{ path: string; content: YamlExerciseFile }>
): Promise<ImportStats> {
  const stats: ImportStats = { inserted: 0, updated: 0, errors: 0 };

  for (const { content } of fileData) {
    for (const exercise of content.exercises) {
      const row = {
        language: content.language,
        category: content.category,
        slug: exercise.slug,
        title: exercise.title,
        difficulty: exercise.difficulty,
        prompt: exercise.prompt,
        expected_answer: exercise.expected_answer,
        hints: exercise.hints,
        tags: exercise.tags || [],
        explanation: null, // Omitted for MVP
      };

      // Upsert on (language, slug) - check if exists first
      const { data: existing } = await supabase
        .from('exercises')
        .select('id')
        .eq('language', row.language)
        .eq('slug', row.slug)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('exercises')
          .update(row)
          .eq('id', existing.id);

        if (error) {
          console.error(`  ✗ Error updating ${exercise.slug}: ${error.message}`);
          stats.errors++;
        } else {
          stats.updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('exercises')
          .insert(row);

        if (error) {
          console.error(`  ✗ Error inserting ${exercise.slug}: ${error.message}`);
          stats.errors++;
        } else {
          stats.inserted++;
        }
      }
    }
  }

  return stats;
}

/**
 * Main entry point
 */
async function main() {
  console.log(`\n🔍 Scanning ${EXERCISES_DIR}...\n`);

  const files = findYamlFiles(EXERCISES_DIR);
  if (files.length === 0) {
    console.log('No YAML files found in exercises directory.');
    console.log('Expected structure: exercises/{language}/*.yaml');
    process.exit(0);
  }

  console.log(`Found ${files.length} YAML file(s)\n`);
  console.log('📖 Parsing and validating...\n');

  const { valid, errors, fileData, totalExercises } = loadAndValidateFiles(files);

  if (!valid) {
    console.log('\n❌ Validation failed:\n');
    for (const error of errors) {
      console.log(`  ${error.file}${error.slug ? ` [${error.slug}]` : ''}: ${error.field} - ${error.message}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ Validation passed: ${totalExercises} exercises in ${fileData.length} files\n`);
  console.log(`📤 Importing to database (${isProd ? 'PRODUCTION' : 'local'})...\n`);

  const stats = await importToDatabase(fileData);

  console.log('\n📊 Import complete:\n');
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Updated:  ${stats.updated}`);
  console.log(`  Errors:   ${stats.errors}`);
  console.log(`\n✨ Done! ${stats.inserted + stats.updated} exercises in database.\n`);

  if (stats.errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

**Step 2: Add script to package.json**

Add to the "scripts" section:

```json
"db:import-exercises": "npx tsx scripts/import-exercises.ts"
```

**Step 3: Install tsx for running TypeScript**

Run: `pnpm add -D tsx`

**Step 4: Verify script exists but fails (no files yet)**

Run: `pnpm db:import-exercises`
Expected: Shows "No YAML files found" message

**Step 5: Commit**

```bash
git add scripts/import-exercises.ts package.json pnpm-lock.yaml
git commit -m "feat(scripts): add exercise import script from YAML"
```

---

## Phase 5: Exercise YAML Files

### Task 15: Create directory structure and first YAML file

**Files:**
- Create: `exercises/python/basics.yaml`

**Step 1: Create directory and first file**

```yaml
# exercises/python/basics.yaml
language: python
category: basics

exercises:
  - slug: print-hello-world
    title: Print Hello World
    difficulty: 1
    prompt: Print the text "Hello, World!" to the console
    expected_answer: print("Hello, World!")
    hints:
      - Use the print() function
      - Put the text in quotes
    tags: [print, strings, beginner]

  - slug: variable-assignment
    title: Variable Assignment
    difficulty: 1
    prompt: Assign the value 42 to a variable named answer
    expected_answer: answer = 42
    hints:
      - Use the = operator
      - Variable name goes on the left
    tags: [variables, assignment, beginner]

  - slug: string-variable
    title: String Variable
    difficulty: 1
    prompt: Create a variable called name with the value "Alice"
    expected_answer: name = "Alice"
    hints:
      - Use quotes for strings
    tags: [variables, strings, beginner]

  - slug: type-check
    title: Type Check
    difficulty: 1
    prompt: Get the type of the variable x
    expected_answer: type(x)
    hints:
      - Use the type() function
    tags: [types, functions, beginner]

  - slug: user-input
    title: User Input
    difficulty: 2
    prompt: Get input from user with the prompt "Enter name:"
    expected_answer: input("Enter name:")
    hints:
      - Use the input() function
      - Pass the prompt as a string argument
    tags: [input, functions, beginner]
```

**Step 2: Run import to verify it works**

Run: `pnpm db:import-exercises`
Expected: Shows 5 exercises parsed, validation passed, inserted 5

**Step 3: Commit**

```bash
git add exercises/python/basics.yaml
git commit -m "content(exercises): add Python basics exercises (5)"
```

---

### Task 16: Create operators.yaml

**Files:**
- Create: `exercises/python/operators.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/operators.yaml
language: python
category: operators

exercises:
  - slug: floor-division
    title: Floor Division
    difficulty: 1
    prompt: Divide 17 by 5 using floor division
    expected_answer: 17 // 5
    hints:
      - Use // for floor division
    tags: [operators, division, beginner]

  - slug: modulo-operator
    title: Modulo Operator
    difficulty: 1
    prompt: Get the remainder of 17 divided by 5
    expected_answer: 17 % 5
    hints:
      - Use % for modulo
    tags: [operators, modulo, beginner]

  - slug: exponentiation
    title: Exponentiation
    difficulty: 1
    prompt: Calculate 2 to the power of 10
    expected_answer: 2 ** 10
    hints:
      - Use ** for exponentiation
    tags: [operators, power, beginner]

  - slug: comparison-chain
    title: Comparison Chain
    difficulty: 2
    prompt: Check if x is between 1 and 10 (inclusive) using chained comparison
    expected_answer: 1 <= x <= 10
    hints:
      - Python supports chained comparisons
      - Use <= for inclusive bounds
    tags: [operators, comparison, intermediate]

  - slug: logical-and
    title: Logical And
    difficulty: 1
    prompt: Check if both a and b are True
    expected_answer: a and b
    hints:
      - Use the 'and' keyword
    tags: [operators, logical, beginner]
```

**Step 2: Run import**

Run: `pnpm db:import-exercises`
Expected: 10 exercises total

**Step 3: Commit**

```bash
git add exercises/python/operators.yaml
git commit -m "content(exercises): add Python operators exercises (5)"
```

---

### Task 17: Create strings.yaml

**Files:**
- Create: `exercises/python/strings.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/strings.yaml
language: python
category: strings

exercises:
  - slug: string-indexing
    title: String Indexing
    difficulty: 1
    prompt: Get the first character of string s
    expected_answer: s[0]
    hints:
      - Use square bracket indexing
      - Indices start at 0
    tags: [strings, indexing, beginner]

  - slug: string-slicing
    title: String Slicing
    difficulty: 2
    prompt: Get characters from index 1 to 4 (exclusive) of string s
    expected_answer: s[1:4]
    hints:
      - Use slice notation [start:end]
      - End index is exclusive
    tags: [strings, slicing, intermediate]

  - slug: string-upper
    title: String Uppercase
    difficulty: 1
    prompt: Convert string s to uppercase
    expected_answer: s.upper()
    hints:
      - Use the upper() method
    tags: [strings, methods, beginner]

  - slug: f-string-basic
    title: F-String Basic
    difficulty: 2
    prompt: Create an f-string that includes the variable name
    expected_answer: f"Hello, {name}"
    hints:
      - Start string with f
      - Use curly braces for variables
    tags: [strings, f-strings, intermediate]

  - slug: string-split
    title: String Split
    difficulty: 2
    prompt: Split string s by comma
    expected_answer: s.split(",")
    hints:
      - Use the split() method
      - Pass the delimiter as argument
    tags: [strings, methods, intermediate]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/strings.yaml
git commit -m "content(exercises): add Python strings exercises (5)"
```

---

### Task 18: Create lists.yaml

**Files:**
- Create: `exercises/python/lists.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/lists.yaml
language: python
category: lists

exercises:
  - slug: list-creation
    title: List Creation
    difficulty: 1
    prompt: Create a list called numbers containing 1, 2, 3
    expected_answer: numbers = [1, 2, 3]
    hints:
      - Use square brackets
    tags: [lists, creation, beginner]

  - slug: list-append
    title: List Append
    difficulty: 1
    prompt: Add the value 4 to the end of the list numbers
    expected_answer: numbers.append(4)
    hints:
      - Use the append() method
    tags: [lists, methods, beginner]

  - slug: list-indexing
    title: List Indexing
    difficulty: 1
    prompt: Get the second element of list items
    expected_answer: items[1]
    hints:
      - Use square bracket indexing
      - Remember indices start at 0
    tags: [lists, indexing, beginner]

  - slug: list-slicing
    title: List Slicing
    difficulty: 2
    prompt: Get the first 3 elements of list items
    expected_answer: items[:3]
    hints:
      - Use slice notation
      - Omit start to begin at 0
    tags: [lists, slicing, intermediate]

  - slug: list-extend
    title: List Extend
    difficulty: 2
    prompt: Add all elements from list b to list a
    expected_answer: a.extend(b)
    hints:
      - Use extend() to add multiple items
      - Don't use append() for lists
    tags: [lists, methods, intermediate]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/lists.yaml
git commit -m "content(exercises): add Python lists exercises (5)"
```

---

### Task 19: Create dictionaries.yaml

**Files:**
- Create: `exercises/python/dictionaries.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/dictionaries.yaml
language: python
category: dictionaries

exercises:
  - slug: dict-creation
    title: Dictionary Creation
    difficulty: 1
    prompt: Create a dict called person with name="Alice" and age=30
    expected_answer: person = {"name": "Alice", "age": 30}
    hints:
      - Use curly braces
      - Use key: value pairs
    tags: [dictionaries, creation, beginner]

  - slug: dict-access
    title: Dictionary Access
    difficulty: 1
    prompt: Get the value of "name" from the person dictionary
    expected_answer: person["name"]
    hints:
      - Use square brackets with the key
    tags: [dictionaries, access, beginner]

  - slug: dict-get
    title: Dictionary Get
    difficulty: 2
    prompt: Get the value of "age" from person, defaulting to 0 if missing
    expected_answer: person.get("age", 0)
    hints:
      - Use the get() method
      - Second argument is the default
    tags: [dictionaries, methods, intermediate]

  - slug: dict-keys
    title: Dictionary Keys
    difficulty: 1
    prompt: Get all keys from the person dictionary
    expected_answer: person.keys()
    hints:
      - Use the keys() method
    tags: [dictionaries, methods, beginner]

  - slug: dict-update
    title: Dictionary Update
    difficulty: 2
    prompt: Update person dict with {"city": "NYC"}
    expected_answer: person.update({"city": "NYC"})
    hints:
      - Use the update() method
      - Pass a dict as argument
    tags: [dictionaries, methods, intermediate]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/dictionaries.yaml
git commit -m "content(exercises): add Python dictionaries exercises (5)"
```

---

### Task 20: Create loops.yaml

**Files:**
- Create: `exercises/python/loops.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/loops.yaml
language: python
category: loops

exercises:
  - slug: for-loop-range
    title: For Loop Range
    difficulty: 1
    prompt: Write a for loop that prints numbers 0 through 4
    expected_answer: |
      for i in range(5):
          print(i)
    hints:
      - Use range() to generate numbers
      - range(5) gives 0-4
    tags: [loops, range, for]

  - slug: for-loop-list
    title: For Loop List
    difficulty: 1
    prompt: Iterate over a list called items and print each item
    expected_answer: |
      for item in items:
          print(item)
    hints:
      - Use for x in list syntax
    tags: [loops, lists, for]

  - slug: while-loop
    title: While Loop
    difficulty: 2
    prompt: Write a while loop that runs while count < 5
    expected_answer: "while count < 5:"
    hints:
      - Use the while keyword
      - Condition comes after while
    tags: [loops, while, conditions]

  - slug: enumerate-loop
    title: Enumerate Loop
    difficulty: 2
    prompt: Loop over items with both index and value using enumerate
    expected_answer: "for i, item in enumerate(items):"
    hints:
      - enumerate() gives index and value
      - Use tuple unpacking
    tags: [loops, enumerate, intermediate]

  - slug: break-statement
    title: Break Statement
    difficulty: 2
    prompt: Exit a loop early using a statement
    expected_answer: break
    hints:
      - Use the break keyword
    tags: [loops, control, intermediate]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/loops.yaml
git commit -m "content(exercises): add Python loops exercises (5)"
```

---

### Task 21: Create functions.yaml

**Files:**
- Create: `exercises/python/functions.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/functions.yaml
language: python
category: functions

exercises:
  - slug: define-function
    title: Define Function
    difficulty: 1
    prompt: Define a function called greet that takes a name parameter
    expected_answer: "def greet(name):"
    hints:
      - Start with the def keyword
    tags: [functions, def, beginner]

  - slug: function-return
    title: Function with Return
    difficulty: 2
    prompt: Define a function add that takes a and b, returns their sum
    expected_answer: |
      def add(a, b):
          return a + b
    hints:
      - Use return to send back a value
    tags: [functions, return, parameters]

  - slug: default-parameter
    title: Default Parameter
    difficulty: 2
    prompt: Define greet(name, greeting="Hello") with a default greeting
    expected_answer: 'def greet(name, greeting="Hello"):'
    hints:
      - Default values use =
    tags: [functions, defaults, intermediate]

  - slug: args-function
    title: Variable Arguments
    difficulty: 3
    prompt: Define a function sum_all that accepts any number of arguments
    expected_answer: "def sum_all(*args):"
    hints:
      - Use *args for variable arguments
    tags: [functions, args, advanced]

  - slug: kwargs-function
    title: Keyword Arguments
    difficulty: 3
    prompt: Define a function config that accepts any keyword arguments
    expected_answer: "def config(**kwargs):"
    hints:
      - Use **kwargs for keyword arguments
    tags: [functions, kwargs, advanced]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/functions.yaml
git commit -m "content(exercises): add Python functions exercises (5)"
```

---

### Task 22: Create classes.yaml

**Files:**
- Create: `exercises/python/classes.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/classes.yaml
language: python
category: classes

exercises:
  - slug: define-class
    title: Define Class
    difficulty: 2
    prompt: Define a class called Person
    expected_answer: "class Person:"
    hints:
      - Use the class keyword
    tags: [classes, oop, intermediate]

  - slug: init-method
    title: Init Method
    difficulty: 2
    prompt: Define __init__ that takes self and name parameter
    expected_answer: "def __init__(self, name):"
    hints:
      - Use double underscores
      - self is always first parameter
    tags: [classes, init, intermediate]

  - slug: instance-attribute
    title: Instance Attribute
    difficulty: 2
    prompt: Set self.name to the name parameter inside __init__
    expected_answer: self.name = name
    hints:
      - Use self.attribute = value
    tags: [classes, attributes, intermediate]

  - slug: instance-method
    title: Instance Method
    difficulty: 2
    prompt: Define a method called greet that takes self
    expected_answer: "def greet(self):"
    hints:
      - Methods always take self as first parameter
    tags: [classes, methods, intermediate]

  - slug: class-inheritance
    title: Class Inheritance
    difficulty: 3
    prompt: Define class Student that inherits from Person
    expected_answer: "class Student(Person):"
    hints:
      - Put parent class in parentheses
    tags: [classes, inheritance, advanced]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/classes.yaml
git commit -m "content(exercises): add Python classes exercises (5)"
```

---

### Task 23: Create comprehensions.yaml

**Files:**
- Create: `exercises/python/comprehensions.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/comprehensions.yaml
language: python
category: comprehensions

exercises:
  - slug: list-comp-basic
    title: List Comprehension Basic
    difficulty: 2
    prompt: Create a list of squares from 1 to 5 using comprehension
    expected_answer: "[x**2 for x in range(1, 6)]"
    hints:
      - Use [expression for item in iterable]
    tags: [comprehensions, lists, intermediate]

  - slug: list-comp-conditional
    title: List Comprehension Conditional
    difficulty: 2
    prompt: Create a list of even numbers from 1 to 10 using comprehension
    expected_answer: "[x for x in range(1, 11) if x % 2 == 0]"
    hints:
      - Add if condition at the end
    tags: [comprehensions, conditionals, intermediate]

  - slug: dict-comp-basic
    title: Dict Comprehension
    difficulty: 3
    prompt: Create a dict mapping numbers 1-3 to their squares
    expected_answer: "{x: x**2 for x in range(1, 4)}"
    hints:
      - Use {key: value for item in iterable}
    tags: [comprehensions, dicts, advanced]

  - slug: set-comp-basic
    title: Set Comprehension
    difficulty: 3
    prompt: Create a set of first letters from list of words
    expected_answer: "{word[0] for word in words}"
    hints:
      - Use curly braces like dict but without colon
    tags: [comprehensions, sets, advanced]

  - slug: nested-comp
    title: Nested Comprehension
    difficulty: 3
    prompt: Flatten a 2D list called matrix using comprehension
    expected_answer: "[item for row in matrix for item in row]"
    hints:
      - Use multiple for clauses
      - Outer loop comes first
    tags: [comprehensions, nested, advanced]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/comprehensions.yaml
git commit -m "content(exercises): add Python comprehensions exercises (5)"
```

---

### Task 24: Create exceptions.yaml

**Files:**
- Create: `exercises/python/exceptions.yaml`

**Step 1: Create the file**

```yaml
# exercises/python/exceptions.yaml
language: python
category: exceptions

exercises:
  - slug: try-except-basic
    title: Try Except Basic
    difficulty: 2
    prompt: Write a try block that catches any exception
    expected_answer: |
      try:
          pass
      except:
          pass
    hints:
      - Use try and except keywords
    tags: [exceptions, try, intermediate]

  - slug: except-specific
    title: Except Specific Error
    difficulty: 2
    prompt: Catch a ValueError exception
    expected_answer: "except ValueError:"
    hints:
      - Specify the exception type after except
    tags: [exceptions, specific, intermediate]

  - slug: raise-exception
    title: Raise Exception
    difficulty: 2
    prompt: Raise a ValueError with message "Invalid value"
    expected_answer: raise ValueError("Invalid value")
    hints:
      - Use the raise keyword
      - Pass message to exception constructor
    tags: [exceptions, raise, intermediate]

  - slug: try-finally
    title: Try Finally
    difficulty: 3
    prompt: Write a finally block that always runs
    expected_answer: "finally:"
    hints:
      - finally runs whether exception occurs or not
    tags: [exceptions, finally, advanced]

  - slug: except-as
    title: Except with Alias
    difficulty: 2
    prompt: Catch Exception and assign it to variable e
    expected_answer: "except Exception as e:"
    hints:
      - Use as to give exception a name
    tags: [exceptions, alias, intermediate]
```

**Step 2: Run import and commit**

Run: `pnpm db:import-exercises`

```bash
git add exercises/python/exceptions.yaml
git commit -m "content(exercises): add Python exceptions exercises (5)"
```

---

## Phase 6: Integration Tests and Cleanup

### Task 25: Write integration test for import

**Files:**
- Modify: `tests/integration/seed/exercises-seed.test.ts`

**Step 1: Update integration tests**

Replace the existing content to test the new YAML-based exercises:

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
  it('has at least 50 Python exercises', async () => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id')
      .eq('language', 'python');

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(50);
  });

  it('has exercises in all 10 categories', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('category')
      .eq('language', 'python');

    const categories = new Set(data!.map(e => e.category));
    const expectedCategories = [
      'basics', 'operators', 'strings', 'lists', 'dictionaries',
      'loops', 'functions', 'classes', 'comprehensions', 'exceptions'
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat)).toBe(true);
    }
  });

  it('has exercises at all difficulty levels (1, 2, 3)', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('difficulty')
      .eq('language', 'python');

    const difficulties = new Set(data!.map(e => e.difficulty));
    expect(difficulties.has(1)).toBe(true);
    expect(difficulties.has(2)).toBe(true);
    expect(difficulties.has(3)).toBe(true);
  });

  it('all exercises have valid slugs', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('slug')
      .eq('language', 'python');

    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const exercise of data!) {
      expect(exercise.slug).toMatch(slugRegex);
    }
  });

  it('all exercises have at least one hint', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('hints, slug')
      .eq('language', 'python');

    for (const exercise of data!) {
      const hints = exercise.hints as string[];
      expect(hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('slugs are unique within language', async () => {
    const { data } = await supabase
      .from('exercises')
      .select('slug')
      .eq('language', 'python');

    const slugs = data!.map(e => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });
});
```

**Step 2: Run tests**

Run: `pnpm test tests/integration/seed/exercises-seed.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add tests/integration/seed/exercises-seed.test.ts
git commit -m "test(integration): update exercise seed tests for YAML import"
```

---

### Task 26: Update seed.sql to reference import script

**Files:**
- Modify: `supabase/seed.sql`

**Step 1: Replace seed.sql content**

```sql
-- Development seed data
-- This file is NOT a migration. It only runs locally via:
--   npx supabase db reset
--
-- It will NOT run in production.
--
-- NOTE: Exercise data is now imported via YAML files.
-- After running 'pnpm db:reset', run:
--   pnpm db:import-exercises
--
-- YAML files location: exercises/python/*.yaml

-- No seed data here - exercises come from YAML import
-- This file is kept to document the workflow
```

**Step 2: Commit**

```bash
git add supabase/seed.sql
git commit -m "docs(seed): update seed.sql to reference YAML import"
```

---

### Task 27: Final verification

**Step 1: Reset database and import**

Run: `pnpm db:reset && pnpm db:import-exercises`
Expected: Database reset and 50 exercises imported

**Step 2: Run all tests**

Run: `pnpm test:run`
Expected: All tests pass

**Step 3: Run type check and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: No errors

**Step 4: Build**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(exercises): complete exercise library implementation

- Add slug column with composite unique constraint
- Enhance answer normalization (trim, blank line collapse)
- Add YAML validation functions
- Create import script with upsert logic
- Add 50 Python exercises across 10 categories
- Update integration tests for new import workflow"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-2 | Enhanced answer normalization |
| 2 | 3-9 | Database schema changes (slug column, types, mappers) |
| 3 | 10-13 | YAML types and validation |
| 4 | 14 | Import script |
| 5 | 15-24 | 50 exercises in 10 YAML files |
| 6 | 25-27 | Integration tests and cleanup |

**Total: 27 tasks, ~50 commits, 50 exercises**

**Files created:**
- `supabase/migrations/20260103000001_add_exercise_slug.sql`
- `src/lib/exercise/yaml-types.ts`
- `src/lib/exercise/yaml-validation.ts`
- `scripts/import-exercises.ts`
- `exercises/python/*.yaml` (10 files)
- `tests/unit/exercise/yaml-validation.test.ts`

**Files modified:**
- `src/lib/exercise/matching.ts` (enhanced normalization)
- `src/lib/types/app.types.ts` (slug field)
- `src/lib/supabase/mappers.ts` (slug mapping)
- `src/lib/exercise/index.ts` (exports)
- `package.json` (scripts and deps)
- `tests/unit/exercise/matching.test.ts`
- `tests/unit/exercise/types.test.ts`
- `tests/unit/srs/mappers.test.ts`
- `tests/integration/migrations/exercises.test.ts`
- `tests/integration/seed/exercises-seed.test.ts`
- `supabase/seed.sql`
