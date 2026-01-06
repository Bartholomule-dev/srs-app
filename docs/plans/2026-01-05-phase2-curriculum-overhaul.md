# Phase 2: Curriculum Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the exercise library from a loose 50-question collection into a structured 170-220 exercise curriculum with concept-based SRS, proper taxonomy, and multi-AI review.

**Architecture:** Add concept/subconcept layer above exercises. SRS tracks subconcept mastery (not individual questions). Exercises become "question pools" for each subconcept. New tables: `subconcept_progress` (SRS state per subconcept), `exercise_attempts` (usage tracking). Fill-in exercise type added alongside existing write type.

**Tech Stack:** Supabase (PostgreSQL), TypeScript, Vitest, YAML + JSON Schema validation, React components.

---

## Phase Overview

| Part | Focus | Tasks |
|------|-------|-------|
| **Part 1** | Infrastructure | JSON Schema, TypeScript types, DB migrations |
| **Part 2** | Concept-Based SRS | New tables, hooks, selection algorithm |
| **Part 3** | Fill-In Exercises | New exercise type, UI component, validation |
| **Part 4** | Content Migration | Migrate 50 exercises, taxonomy fields |
| **Part 5** | Content Creation | Create 120-170 new exercises |
| **Part 6** | Documentation | Update CLAUDE.md, Obsidian docs |

---

## Part 1: Infrastructure (JSON Schema + Types)

### Task 1.1: Create JSON Schema for Exercise Validation

**Files:**
- Create: `exercises/schema.json`
- Create: `scripts/validate-exercises.ts`

**Step 1: Create the JSON Schema file**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Exercise File",
  "type": "object",
  "required": ["language", "category", "exercises"],
  "properties": {
    "language": {
      "type": "string",
      "enum": ["python", "javascript", "sql"]
    },
    "category": {
      "type": "string",
      "description": "Legacy category field (kept for backward compatibility)"
    },
    "exercises": {
      "type": "array",
      "items": { "$ref": "#/definitions/exercise" },
      "minItems": 1
    }
  },
  "definitions": {
    "exercise": {
      "type": "object",
      "required": ["slug", "title", "prompt", "expected_answer", "hints", "concept", "subconcept", "level", "prereqs", "type", "pattern"],
      "properties": {
        "slug": {
          "type": "string",
          "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$",
          "description": "Unique identifier (kebab-case)"
        },
        "title": { "type": "string", "minLength": 1 },
        "difficulty": { "type": "integer", "minimum": 1, "maximum": 3 },
        "prompt": { "type": "string", "minLength": 1 },
        "expected_answer": { "type": "string", "minLength": 1 },
        "accepted_solutions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "hints": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "concept": {
          "type": "string",
          "enum": ["foundations", "strings", "numbers-booleans", "collections", "control-flow", "functions", "comprehensions", "error-handling", "oop", "modules-files"],
          "description": "Primary milestone/concept"
        },
        "subconcept": {
          "type": "string",
          "description": "Specific skill within concept (e.g., 'for', 'enumerate', 'list-comp')"
        },
        "level": {
          "type": "string",
          "enum": ["intro", "practice", "edge", "integrated"],
          "description": "Difficulty progression within subconcept"
        },
        "prereqs": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Subconcepts that must be mastered first"
        },
        "type": {
          "type": "string",
          "enum": ["write", "fill-in", "predict", "debug"],
          "description": "Exercise format"
        },
        "pattern": {
          "type": "string",
          "enum": ["accumulator", "filtering", "indexing", "mapping", "lookup", "iteration", "mutation", "construction", "comparison", "conversion", "io", "definition", "invocation", "handling"],
          "description": "Programming pattern being practiced"
        },
        "template": {
          "type": "string",
          "description": "For fill-in exercises: code with ___ blanks"
        },
        "blank_position": {
          "type": "integer",
          "minimum": 0,
          "description": "For fill-in exercises: which blank (0-indexed)"
        }
      },
      "allOf": [
        {
          "if": { "properties": { "type": { "const": "fill-in" } } },
          "then": { "required": ["template", "blank_position"] }
        }
      ]
    }
  }
}
```

**Step 2: Create validation script**

```typescript
// scripts/validate-exercises.ts
import Ajv from 'ajv';
import { readFileSync, readdirSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

const ajv = new Ajv({ allErrors: true });

async function validateExercises() {
  const schemaPath = join(process.cwd(), 'exercises/schema.json');
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
  const validate = ajv.compile(schema);

  const exercisesDir = join(process.cwd(), 'exercises/python');
  const files = readdirSync(exercisesDir).filter(f => f.endsWith('.yaml'));

  let hasErrors = false;
  const allSlugs = new Set<string>();

  for (const file of files) {
    const filePath = join(exercisesDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const data = parse(content);

    const valid = validate(data);
    if (!valid) {
      console.error(`\n❌ ${file}:`);
      validate.errors?.forEach(err => {
        console.error(`  ${err.instancePath}: ${err.message}`);
      });
      hasErrors = true;
    } else {
      console.log(`✓ ${file}`);
    }

    // Check for duplicate slugs
    for (const exercise of data.exercises || []) {
      if (allSlugs.has(exercise.slug)) {
        console.error(`\n❌ Duplicate slug: ${exercise.slug} in ${file}`);
        hasErrors = true;
      }
      allSlugs.add(exercise.slug);
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validation failed');
    process.exit(1);
  } else {
    console.log('\n✓ All exercises valid');
  }
}

validateExercises();
```

**Step 3: Add ajv dependency**

Run: `pnpm add -D ajv`

**Step 4: Add npm script**

Modify: `package.json`

```json
{
  "scripts": {
    "validate:exercises": "npx tsx scripts/validate-exercises.ts"
  }
}
```

**Step 5: Run validation (expect failures - exercises not migrated yet)**

Run: `pnpm validate:exercises`
Expected: Failures for missing fields (concept, subconcept, level, prereqs, type, pattern)

**Step 6: Commit**

```bash
git add exercises/schema.json scripts/validate-exercises.ts package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(schema): add JSON Schema for exercise validation

- Define full taxonomy: concept, subconcept, level, prereqs, type, pattern
- Support fill-in exercise type with template/blank_position
- Add validation script with duplicate slug detection
- Exercises will fail validation until migrated

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1.2: Update TypeScript Types for New Taxonomy

**Files:**
- Modify: `src/lib/exercise/yaml-types.ts`
- Modify: `src/lib/types/app.types.ts`
- Create: `src/lib/curriculum/types.ts`

**Step 1: Create curriculum types**

```typescript
// src/lib/curriculum/types.ts

/** Concept (milestone) in the curriculum DAG */
export type ConceptSlug =
  | 'foundations'
  | 'strings'
  | 'numbers-booleans'
  | 'collections'
  | 'control-flow'
  | 'functions'
  | 'comprehensions'
  | 'error-handling'
  | 'oop'
  | 'modules-files';

/** Exercise difficulty level within a subconcept */
export type ExerciseLevel = 'intro' | 'practice' | 'edge' | 'integrated';

/** Exercise format/type */
export type ExerciseType = 'write' | 'fill-in' | 'predict' | 'debug';

/** Programming pattern being practiced */
export type ExercisePattern =
  | 'accumulator'
  | 'filtering'
  | 'indexing'
  | 'mapping'
  | 'lookup'
  | 'iteration'
  | 'mutation'
  | 'construction'
  | 'comparison'
  | 'conversion'
  | 'io'
  | 'definition'
  | 'invocation'
  | 'handling';

/** SRS learning phase for a subconcept */
export type LearningPhase = 'learning' | 'review';

/** Concept definition in curriculum graph */
export interface Concept {
  slug: ConceptSlug;
  name: string;
  description: string;
  prereqs: ConceptSlug[];
  subconcepts: string[];
}

/** Subconcept progress (SRS state) */
export interface SubconceptProgress {
  userId: string;
  subconceptSlug: string;
  conceptSlug: ConceptSlug;
  phase: LearningPhase;
  easeFactor: number;
  interval: number;
  nextReview: Date;
  lastReviewed: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Exercise attempt tracking */
export interface ExerciseAttempt {
  id: string;
  userId: string;
  exerciseSlug: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Date;
}

/** Curriculum graph for a language */
export interface CurriculumGraph {
  language: string;
  concepts: Concept[];
}
```

**Step 2: Update YAML types**

```typescript
// src/lib/exercise/yaml-types.ts
import type { ConceptSlug, ExerciseLevel, ExerciseType, ExercisePattern } from '../curriculum/types';

/** Raw exercise from YAML file */
export interface YamlExercise {
  slug: string;
  title: string;
  difficulty?: number;
  prompt: string;
  expected_answer: string;
  accepted_solutions?: string[];
  hints: string[];
  tags?: string[];
  // New taxonomy fields
  concept: ConceptSlug;
  subconcept: string;
  level: ExerciseLevel;
  prereqs: string[];
  type: ExerciseType;
  pattern: ExercisePattern;
  // Fill-in specific
  template?: string;
  blank_position?: number;
}

/** Parsed YAML file structure */
export interface YamlExerciseFile {
  language: string;
  category: string;
  exercises: YamlExercise[];
}
```

**Step 3: Update app types**

Modify: `src/lib/types/app.types.ts`

Add to Exercise interface:
```typescript
export interface Exercise {
  // ... existing fields ...

  // New taxonomy fields
  concept: ConceptSlug;
  subconcept: string;
  level: ExerciseLevel;
  prereqs: string[];
  exerciseType: ExerciseType; // 'type' is reserved, use 'exerciseType'
  pattern: ExercisePattern;

  // Fill-in specific (optional)
  template: string | null;
  blankPosition: number | null;
}
```

**Step 4: Create barrel export**

```typescript
// src/lib/curriculum/index.ts
export * from './types';
```

**Step 5: Run type check**

Run: `pnpm typecheck`
Expected: Errors in mappers (new fields not mapped yet)

**Step 6: Commit**

```bash
git add src/lib/curriculum/ src/lib/exercise/yaml-types.ts src/lib/types/app.types.ts
git commit -m "$(cat <<'EOF'
feat(types): add curriculum and taxonomy TypeScript types

- Add ConceptSlug, ExerciseLevel, ExerciseType, ExercisePattern
- Add SubconceptProgress and ExerciseAttempt types
- Update YamlExercise with new taxonomy fields
- Update Exercise app type with new fields

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Part 2: Concept-Based SRS (Database + Hooks)

### Task 2.1: Create Database Migrations

**Files:**
- Create: `supabase/migrations/20260106000001_add_taxonomy_to_exercises.sql`
- Create: `supabase/migrations/20260106000002_create_subconcept_progress.sql`
- Create: `supabase/migrations/20260106000003_create_exercise_attempts.sql`

**Step 1: Add taxonomy columns to exercises table**

```sql
-- supabase/migrations/20260106000001_add_taxonomy_to_exercises.sql

-- Add new taxonomy columns to exercises table
ALTER TABLE exercises
ADD COLUMN concept TEXT,
ADD COLUMN subconcept TEXT,
ADD COLUMN level TEXT CHECK (level IN ('intro', 'practice', 'edge', 'integrated')),
ADD COLUMN prereqs TEXT[] DEFAULT '{}',
ADD COLUMN exercise_type TEXT DEFAULT 'write' CHECK (exercise_type IN ('write', 'fill-in', 'predict', 'debug')),
ADD COLUMN pattern TEXT,
ADD COLUMN template TEXT,
ADD COLUMN blank_position INTEGER;

-- Create index for concept-based queries
CREATE INDEX idx_exercises_concept ON exercises(concept);
CREATE INDEX idx_exercises_subconcept ON exercises(subconcept);
CREATE INDEX idx_exercises_concept_subconcept ON exercises(concept, subconcept);

-- Comment for documentation
COMMENT ON COLUMN exercises.concept IS 'Primary milestone/concept slug';
COMMENT ON COLUMN exercises.subconcept IS 'Specific skill within concept';
COMMENT ON COLUMN exercises.level IS 'Difficulty progression: intro, practice, edge, integrated';
COMMENT ON COLUMN exercises.prereqs IS 'Array of subconcept slugs that must be mastered first';
COMMENT ON COLUMN exercises.exercise_type IS 'Exercise format: write, fill-in, predict, debug';
COMMENT ON COLUMN exercises.pattern IS 'Programming pattern: accumulator, filtering, etc.';
COMMENT ON COLUMN exercises.template IS 'For fill-in: code with ___ blanks';
COMMENT ON COLUMN exercises.blank_position IS 'For fill-in: which blank (0-indexed)';
```

**Step 2: Create subconcept_progress table**

```sql
-- supabase/migrations/20260106000002_create_subconcept_progress.sql

-- Subconcept-level SRS tracking (replaces exercise-level for scheduling)
CREATE TABLE subconcept_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subconcept_slug TEXT NOT NULL,
  concept_slug TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'learning' CHECK (phase IN ('learning', 'review')),
  ease_factor REAL NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3 AND ease_factor <= 3.0),
  interval INTEGER NOT NULL DEFAULT 0,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, subconcept_slug)
);

-- Indexes for efficient querying
CREATE INDEX idx_subconcept_progress_user_id ON subconcept_progress(user_id);
CREATE INDEX idx_subconcept_progress_next_review ON subconcept_progress(next_review);
CREATE INDEX idx_subconcept_progress_concept ON subconcept_progress(concept_slug);
CREATE INDEX idx_subconcept_progress_due ON subconcept_progress(user_id, next_review)
  WHERE next_review <= NOW();

-- RLS policies
ALTER TABLE subconcept_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subconcept progress"
  ON subconcept_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subconcept progress"
  ON subconcept_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subconcept progress"
  ON subconcept_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_subconcept_progress_updated_at
  BEFORE UPDATE ON subconcept_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Step 3: Create exercise_attempts table**

```sql
-- supabase/migrations/20260106000003_create_exercise_attempts.sql

-- Track individual exercise usage for selection algorithm
CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_slug TEXT NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, exercise_slug)
);

-- Indexes
CREATE INDEX idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX idx_exercise_attempts_exercise ON exercise_attempts(exercise_slug);
CREATE INDEX idx_exercise_attempts_user_exercise ON exercise_attempts(user_id, exercise_slug);

-- RLS policies
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise attempts"
  ON exercise_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise attempts"
  ON exercise_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise attempts"
  ON exercise_attempts FOR UPDATE
  USING (auth.uid() = user_id);
```

**Step 4: Apply migrations locally**

Run: `pnpm db:reset`
Expected: All migrations apply successfully

**Step 5: Regenerate TypeScript types**

Run: `pnpm db:types`
Expected: New tables appear in database.generated.ts

**Step 6: Commit**

```bash
git add supabase/migrations/20260106*.sql src/lib/types/database.generated.ts
git commit -m "$(cat <<'EOF'
feat(db): add concept-based SRS tables

- Add taxonomy columns to exercises table
- Create subconcept_progress table (SRS state per subconcept)
- Create exercise_attempts table (usage tracking)
- Add RLS policies for new tables
- Add indexes for efficient queries

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.2: Write Tests for Concept-Based SRS

**Files:**
- Create: `tests/unit/srs/concept-srs.test.ts`
- Create: `src/lib/srs/concept-algorithm.ts`

**Step 1: Write failing tests for concept-based SRS**

```typescript
// tests/unit/srs/concept-srs.test.ts
import { describe, it, expect } from 'vitest';
import {
  getDueSubconcepts,
  selectExercise,
  calculateSubconceptReview,
  createInitialSubconceptState,
} from '@/lib/srs/concept-algorithm';
import type { SubconceptProgress, Exercise, ExerciseAttempt } from '@/lib/types';

describe('Concept-Based SRS', () => {
  describe('getDueSubconcepts', () => {
    it('returns subconcepts where next_review <= now', () => {
      const now = new Date();
      const progress: SubconceptProgress[] = [
        { subconceptSlug: 'for', nextReview: new Date(now.getTime() - 1000), phase: 'review' } as SubconceptProgress,
        { subconceptSlug: 'while', nextReview: new Date(now.getTime() + 86400000), phase: 'review' } as SubconceptProgress,
        { subconceptSlug: 'range', nextReview: now, phase: 'learning' } as SubconceptProgress,
      ];

      const due = getDueSubconcepts(progress);

      expect(due).toHaveLength(2);
      expect(due.map(d => d.subconceptSlug)).toContain('for');
      expect(due.map(d => d.subconceptSlug)).toContain('range');
    });

    it('sorts by most overdue first', () => {
      const now = new Date();
      const progress: SubconceptProgress[] = [
        { subconceptSlug: 'a', nextReview: new Date(now.getTime() - 1000), phase: 'review' } as SubconceptProgress,
        { subconceptSlug: 'b', nextReview: new Date(now.getTime() - 5000), phase: 'review' } as SubconceptProgress,
      ];

      const due = getDueSubconcepts(progress);

      expect(due[0].subconceptSlug).toBe('b'); // More overdue
    });
  });

  describe('selectExercise', () => {
    const exercises: Exercise[] = [
      { slug: 'for-intro-1', subconcept: 'for', level: 'intro' } as Exercise,
      { slug: 'for-intro-2', subconcept: 'for', level: 'intro' } as Exercise,
      { slug: 'for-practice-1', subconcept: 'for', level: 'practice' } as Exercise,
      { slug: 'for-edge-1', subconcept: 'for', level: 'edge' } as Exercise,
    ];

    it('returns intro exercises first when phase is learning', () => {
      const progress: SubconceptProgress = {
        subconceptSlug: 'for',
        phase: 'learning'
      } as SubconceptProgress;
      const attempts: ExerciseAttempt[] = [];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.level).toBe('intro');
    });

    it('returns unseen intro exercise before seen intro', () => {
      const progress: SubconceptProgress = {
        subconceptSlug: 'for',
        phase: 'learning'
      } as SubconceptProgress;
      const attempts: ExerciseAttempt[] = [
        { exerciseSlug: 'for-intro-1', timesSeen: 2 } as ExerciseAttempt,
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.slug).toBe('for-intro-2');
    });

    it('progresses to practice after all intro seen', () => {
      const progress: SubconceptProgress = {
        subconceptSlug: 'for',
        phase: 'learning'
      } as SubconceptProgress;
      const attempts: ExerciseAttempt[] = [
        { exerciseSlug: 'for-intro-1', timesSeen: 1 } as ExerciseAttempt,
        { exerciseSlug: 'for-intro-2', timesSeen: 1 } as ExerciseAttempt,
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.level).toBe('practice');
    });

    it('returns least-seen exercise when phase is review', () => {
      const progress: SubconceptProgress = {
        subconceptSlug: 'for',
        phase: 'review'
      } as SubconceptProgress;
      const attempts: ExerciseAttempt[] = [
        { exerciseSlug: 'for-intro-1', timesSeen: 5 } as ExerciseAttempt,
        { exerciseSlug: 'for-practice-1', timesSeen: 2 } as ExerciseAttempt,
        { exerciseSlug: 'for-edge-1', timesSeen: 1 } as ExerciseAttempt,
      ];

      const exercise = selectExercise(progress, exercises, attempts);

      expect(exercise?.slug).toBe('for-edge-1');
    });
  });

  describe('calculateSubconceptReview', () => {
    it('updates SRS state based on quality', () => {
      const state: SubconceptProgress = {
        easeFactor: 2.5,
        interval: 1,
        phase: 'learning',
        nextReview: new Date(),
      } as SubconceptProgress;

      const result = calculateSubconceptReview(4, state); // Quality 4 = Good

      expect(result.easeFactor).toBeCloseTo(2.5, 1);
      expect(result.interval).toBeGreaterThan(1);
    });

    it('transitions to review phase after graduating interval', () => {
      const state: SubconceptProgress = {
        easeFactor: 2.5,
        interval: 6, // Graduating interval
        phase: 'learning',
        nextReview: new Date(),
      } as SubconceptProgress;

      const result = calculateSubconceptReview(4, state);

      expect(result.phase).toBe('review');
    });

    it('resets to learning phase on quality < 3', () => {
      const state: SubconceptProgress = {
        easeFactor: 2.5,
        interval: 10,
        phase: 'review',
        nextReview: new Date(),
      } as SubconceptProgress;

      const result = calculateSubconceptReview(2, state); // Quality 2 = Failed

      expect(result.phase).toBe('learning');
      expect(result.interval).toBe(1);
    });
  });

  describe('createInitialSubconceptState', () => {
    it('creates state with default values', () => {
      const state = createInitialSubconceptState('for', 'control-flow', 'user-123');

      expect(state.subconceptSlug).toBe('for');
      expect(state.conceptSlug).toBe('control-flow');
      expect(state.userId).toBe('user-123');
      expect(state.phase).toBe('learning');
      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(0);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/srs/concept-srs.test.ts`
Expected: FAIL - module not found

**Step 3: Implement concept-based SRS algorithm**

```typescript
// src/lib/srs/concept-algorithm.ts
import type { SubconceptProgress, Exercise, ExerciseAttempt } from '@/lib/types';
import type { ConceptSlug, LearningPhase, ExerciseLevel } from '@/lib/curriculum/types';

const LEVEL_ORDER: ExerciseLevel[] = ['intro', 'practice', 'edge', 'integrated'];
const GRADUATING_INTERVAL = 6;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3.0;

/**
 * Get all subconcepts that are due for review (next_review <= now)
 * Sorted by most overdue first
 */
export function getDueSubconcepts(
  progress: SubconceptProgress[],
  now: Date = new Date()
): SubconceptProgress[] {
  return progress
    .filter(p => new Date(p.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
}

/**
 * Select the next exercise for a subconcept based on phase and attempts
 *
 * Learning phase: Level progression (intro → practice → edge → integrated)
 * Review phase: Least-seen exercise with randomization for ties
 */
export function selectExercise(
  subconceptProgress: SubconceptProgress,
  exercises: Exercise[],
  attempts: ExerciseAttempt[]
): Exercise | null {
  // Filter to exercises for this subconcept
  const subconceptExercises = exercises.filter(
    e => e.subconcept === subconceptProgress.subconceptSlug
  );

  if (subconceptExercises.length === 0) return null;

  const attemptMap = new Map(attempts.map(a => [a.exerciseSlug, a]));

  if (subconceptProgress.phase === 'learning') {
    return selectLearningExercise(subconceptExercises, attemptMap);
  } else {
    return selectReviewExercise(subconceptExercises, attemptMap);
  }
}

function selectLearningExercise(
  exercises: Exercise[],
  attemptMap: Map<string, ExerciseAttempt>
): Exercise | null {
  // Try each level in order
  for (const level of LEVEL_ORDER) {
    const levelExercises = exercises.filter(e => e.level === level);

    // Find unseen exercise at this level
    const unseen = levelExercises.find(e => !attemptMap.has(e.slug));
    if (unseen) return unseen;

    // Find least-seen exercise at this level
    const withAttempts = levelExercises.map(e => ({
      exercise: e,
      timesSeen: attemptMap.get(e.slug)?.timesSeen ?? 0
    }));

    // If any exercise at this level has been seen less than others, use it
    const minSeen = Math.min(...withAttempts.map(a => a.timesSeen));
    const leastSeen = withAttempts.filter(a => a.timesSeen === minSeen);

    // Check if we should progress to next level
    // (all exercises at this level seen at least once)
    const allSeenOnce = levelExercises.every(e => (attemptMap.get(e.slug)?.timesSeen ?? 0) >= 1);
    if (!allSeenOnce && leastSeen.length > 0) {
      return leastSeen[Math.floor(Math.random() * leastSeen.length)].exercise;
    }
  }

  // All levels exhausted, return any exercise (shouldn't happen in practice)
  return exercises[0];
}

function selectReviewExercise(
  exercises: Exercise[],
  attemptMap: Map<string, ExerciseAttempt>
): Exercise | null {
  const withAttempts = exercises.map(e => ({
    exercise: e,
    timesSeen: attemptMap.get(e.slug)?.timesSeen ?? 0
  }));

  // Find minimum times seen
  const minSeen = Math.min(...withAttempts.map(a => a.timesSeen));
  const leastSeen = withAttempts.filter(a => a.timesSeen === minSeen);

  // Random selection among ties
  return leastSeen[Math.floor(Math.random() * leastSeen.length)].exercise;
}

/**
 * Calculate next review for a subconcept based on quality (SM-2 algorithm)
 */
export function calculateSubconceptReview(
  quality: number,
  currentState: SubconceptProgress
): Partial<SubconceptProgress> {
  // SM-2 ease factor adjustment
  let easeFactor = currentState.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, easeFactor));

  let interval: number;
  let phase: LearningPhase = currentState.phase;

  if (quality < 3) {
    // Failed - reset to learning
    interval = 1;
    phase = 'learning';
  } else {
    // Success - increase interval
    if (currentState.interval === 0) {
      interval = 1;
    } else if (currentState.interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(currentState.interval * easeFactor);
    }

    // Transition to review phase after graduating
    if (interval >= GRADUATING_INTERVAL && phase === 'learning') {
      phase = 'review';
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    phase,
    nextReview,
    lastReviewed: new Date(),
  };
}

/**
 * Create initial subconcept progress state
 */
export function createInitialSubconceptState(
  subconceptSlug: string,
  conceptSlug: ConceptSlug,
  userId: string
): SubconceptProgress {
  return {
    userId,
    subconceptSlug,
    conceptSlug,
    phase: 'learning',
    easeFactor: 2.5,
    interval: 0,
    nextReview: new Date(),
    lastReviewed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as SubconceptProgress;
}
```

**Step 4: Update SRS index exports**

Modify: `src/lib/srs/index.ts`

```typescript
export * from './types';
export * from './algorithm';
export * from './concept-algorithm';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/srs/concept-srs.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add tests/unit/srs/concept-srs.test.ts src/lib/srs/concept-algorithm.ts src/lib/srs/index.ts
git commit -m "$(cat <<'EOF'
feat(srs): implement concept-based SRS algorithm

- Add getDueSubconcepts() for subconcept-level scheduling
- Add selectExercise() with hybrid algorithm:
  - Learning phase: level progression (intro→practice→edge→integrated)
  - Review phase: least-seen with random tie-breaking
- Add calculateSubconceptReview() using SM-2
- Add createInitialSubconceptState() factory
- 12 tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2.3: Create useConceptSRS Hook

**Files:**
- Create: `src/lib/hooks/useConceptSRS.ts`
- Create: `tests/unit/hooks/useConceptSRS.test.ts`

**Step 1: Write failing tests**

```typescript
// tests/unit/hooks/useConceptSRS.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConceptSRS } from '@/lib/hooks/useConceptSRS';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  }),
}));

describe('useConceptSRS', () => {
  it('exposes dueSubconcepts and loading state', async () => {
    const { result } = renderHook(() => useConceptSRS('user-123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.dueSubconcepts).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('provides recordSubconceptResult function', async () => {
    const { result } = renderHook(() => useConceptSRS('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.recordSubconceptResult).toBe('function');
  });

  it('provides getNextExercise function', async () => {
    const { result } = renderHook(() => useConceptSRS('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.getNextExercise).toBe('function');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/hooks/useConceptSRS.test.ts`
Expected: FAIL - module not found

**Step 3: Implement useConceptSRS hook**

```typescript
// src/lib/hooks/useConceptSRS.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getDueSubconcepts,
  selectExercise,
  calculateSubconceptReview,
  createInitialSubconceptState,
} from '@/lib/srs/concept-algorithm';
import type { SubconceptProgress, Exercise, ExerciseAttempt } from '@/lib/types';
import type { ConceptSlug } from '@/lib/curriculum/types';

interface UseConceptSRSReturn {
  dueSubconcepts: SubconceptProgress[];
  loading: boolean;
  error: Error | null;
  recordSubconceptResult: (
    subconceptSlug: string,
    conceptSlug: ConceptSlug,
    exerciseSlug: string,
    quality: number,
    wasCorrect: boolean
  ) => Promise<void>;
  getNextExercise: (subconceptProgress: SubconceptProgress) => Promise<Exercise | null>;
  refreshDue: () => Promise<void>;
}

export function useConceptSRS(userId: string | undefined): UseConceptSRSReturn {
  const [dueSubconcepts, setDueSubconcepts] = useState<SubconceptProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [attempts, setAttempts] = useState<ExerciseAttempt[]>([]);

  const supabase = createClient();

  // Fetch due subconcepts
  const fetchDueSubconcepts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch subconcept progress
      const { data: progressData, error: progressError } = await supabase
        .from('subconcept_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Fetch exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*');

      if (exercisesError) throw exercisesError;

      // Fetch exercise attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('exercise_attempts')
        .select('*')
        .eq('user_id', userId);

      if (attemptsError) throw attemptsError;

      // Map to app types (simplified - would use actual mappers)
      const progress = (progressData || []).map(mapSubconceptProgress);
      const exercisesList = (exercisesData || []).map(mapExercise);
      const attemptsList = (attemptsData || []).map(mapExerciseAttempt);

      setExercises(exercisesList);
      setAttempts(attemptsList);
      setDueSubconcepts(getDueSubconcepts(progress));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchDueSubconcepts();
  }, [fetchDueSubconcepts]);

  // Record result for a subconcept
  const recordSubconceptResult = useCallback(async (
    subconceptSlug: string,
    conceptSlug: ConceptSlug,
    exerciseSlug: string,
    quality: number,
    wasCorrect: boolean
  ) => {
    if (!userId) return;

    // Get or create subconcept progress
    const { data: existing } = await supabase
      .from('subconcept_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subconcept_slug', subconceptSlug)
      .single();

    const currentState = existing
      ? mapSubconceptProgress(existing)
      : createInitialSubconceptState(subconceptSlug, conceptSlug, userId);

    // Calculate new SRS state
    const updates = calculateSubconceptReview(quality, currentState);

    // Upsert subconcept progress
    await supabase.from('subconcept_progress').upsert({
      user_id: userId,
      subconcept_slug: subconceptSlug,
      concept_slug: conceptSlug,
      phase: updates.phase,
      ease_factor: updates.easeFactor,
      interval: updates.interval,
      next_review: updates.nextReview?.toISOString(),
      last_reviewed: updates.lastReviewed?.toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update exercise attempt
    const { data: existingAttempt } = await supabase
      .from('exercise_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_slug', exerciseSlug)
      .single();

    const timesSeen = (existingAttempt?.times_seen ?? 0) + 1;
    const timesCorrect = (existingAttempt?.times_correct ?? 0) + (wasCorrect ? 1 : 0);

    await supabase.from('exercise_attempts').upsert({
      user_id: userId,
      exercise_slug: exerciseSlug,
      times_seen: timesSeen,
      times_correct: timesCorrect,
      last_seen_at: new Date().toISOString(),
    });

    // Refresh due list
    await fetchDueSubconcepts();
  }, [userId, supabase, fetchDueSubconcepts]);

  // Get next exercise for a subconcept
  const getNextExercise = useCallback(async (
    subconceptProgress: SubconceptProgress
  ): Promise<Exercise | null> => {
    return selectExercise(subconceptProgress, exercises, attempts);
  }, [exercises, attempts]);

  return {
    dueSubconcepts,
    loading,
    error,
    recordSubconceptResult,
    getNextExercise,
    refreshDue: fetchDueSubconcepts,
  };
}

// Mapper functions (simplified versions)
function mapSubconceptProgress(row: any): SubconceptProgress {
  return {
    userId: row.user_id,
    subconceptSlug: row.subconcept_slug,
    conceptSlug: row.concept_slug,
    phase: row.phase,
    easeFactor: row.ease_factor,
    interval: row.interval,
    nextReview: new Date(row.next_review),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapExercise(row: any): Exercise {
  return {
    id: row.id,
    slug: row.slug,
    language: row.language,
    category: row.category,
    difficulty: row.difficulty,
    title: row.title,
    prompt: row.prompt,
    expectedAnswer: row.expected_answer,
    acceptedSolutions: row.accepted_solutions || [],
    hints: row.hints || [],
    explanation: row.explanation,
    tags: row.tags || [],
    timesPracticed: row.times_practiced,
    avgSuccessRate: row.avg_success_rate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // New taxonomy fields
    concept: row.concept,
    subconcept: row.subconcept,
    level: row.level,
    prereqs: row.prereqs || [],
    exerciseType: row.exercise_type,
    pattern: row.pattern,
    template: row.template,
    blankPosition: row.blank_position,
  };
}

function mapExerciseAttempt(row: any): ExerciseAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseSlug: row.exercise_slug,
    timesSeen: row.times_seen,
    timesCorrect: row.times_correct,
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : new Date(),
  };
}
```

**Step 4: Export from hooks index**

Modify: `src/lib/hooks/index.ts`

```typescript
export { useConceptSRS } from './useConceptSRS';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/hooks/useConceptSRS.test.ts`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/lib/hooks/useConceptSRS.ts tests/unit/hooks/useConceptSRS.test.ts src/lib/hooks/index.ts
git commit -m "$(cat <<'EOF'
feat(hooks): add useConceptSRS hook for concept-based SRS

- Fetch due subconcepts from subconcept_progress table
- Record subconcept results with SM-2 calculation
- Track exercise attempts for selection algorithm
- Get next exercise using hybrid selection
- 3 tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Part 3: Fill-In Exercise Type

### Task 3.1: Create FillInExercise Component

**Files:**
- Create: `src/components/exercise/FillInExercise.tsx`
- Create: `tests/unit/components/FillInExercise.test.tsx`

**Step 1: Write failing component tests**

```typescript
// tests/unit/components/FillInExercise.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FillInExercise } from '@/components/exercise/FillInExercise';

describe('FillInExercise', () => {
  const defaultProps = {
    template: 'for ___ in range(5):\n    print(i)',
    blankPosition: 0,
    onSubmit: vi.fn(),
    disabled: false,
  };

  it('renders template with blank highlighted', () => {
    render(<FillInExercise {...defaultProps} />);

    expect(screen.getByText(/for/)).toBeInTheDocument();
    expect(screen.getByText(/in range\(5\):/)).toBeInTheDocument();
  });

  it('shows input field for blank', () => {
    render(<FillInExercise {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('calls onSubmit with input value on Enter', () => {
    const onSubmit = vi.fn();
    render(<FillInExercise {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'i' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('i');
  });

  it('disables input when disabled prop is true', () => {
    render(<FillInExercise {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('auto-focuses input on mount', () => {
    render(<FillInExercise {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(document.activeElement).toBe(input);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/components/FillInExercise.test.tsx`
Expected: FAIL - module not found

**Step 3: Implement FillInExercise component**

```typescript
// src/components/exercise/FillInExercise.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FillInExerciseProps {
  template: string;
  blankPosition: number;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FillInExercise({
  template,
  blankPosition,
  onSubmit,
  disabled = false,
  className,
}: FillInExerciseProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answer.trim()) {
      onSubmit(answer.trim());
    }
  };

  // Parse template and split around blanks
  const parts = parseTemplate(template);

  return (
    <div className={cn('font-mono text-sm', className)}>
      <div className="bg-bg-surface-2 rounded-lg p-4 border border-border">
        <pre className="whitespace-pre-wrap">
          {parts.map((part, index) => {
            if (part.type === 'blank' && part.position === blankPosition) {
              return (
                <span key={index} className="inline-block">
                  <input
                    ref={inputRef}
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                      'w-20 px-2 py-0.5 rounded',
                      'bg-bg-surface-3 border-2 border-accent-primary',
                      'text-text-primary font-mono text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-accent-primary/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    placeholder="..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                </span>
              );
            } else if (part.type === 'blank') {
              return (
                <span key={index} className="text-text-tertiary">
                  ___
                </span>
              );
            } else {
              return (
                <span key={index} className="text-text-primary">
                  {part.content}
                </span>
              );
            }
          })}
        </pre>
      </div>
    </div>
  );
}

interface TemplatePart {
  type: 'text' | 'blank';
  content?: string;
  position?: number;
}

function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const regex = /___/g;
  let lastIndex = 0;
  let blankIndex = 0;
  let match;

  while ((match = regex.exec(template)) !== null) {
    // Add text before blank
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: template.slice(lastIndex, match.index),
      });
    }
    // Add blank
    parts.push({
      type: 'blank',
      position: blankIndex++,
    });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      content: template.slice(lastIndex),
    });
  }

  return parts;
}
```

**Step 4: Export from components**

Modify: `src/components/exercise/index.ts`

```typescript
export { FillInExercise } from './FillInExercise';
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test tests/unit/components/FillInExercise.test.tsx`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/components/exercise/FillInExercise.tsx tests/unit/components/FillInExercise.test.tsx src/components/exercise/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add FillInExercise component for fill-in exercise type

- Parse template with ___ blanks
- Render inline input for active blank
- Support Enter key submission
- Auto-focus input on mount
- 5 tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.2: Add Fill-In Validation Logic

**Files:**
- Modify: `src/lib/exercise/matching.ts`
- Create: `tests/unit/exercise/fill-in-matching.test.ts`

**Step 1: Write failing tests for fill-in matching**

```typescript
// tests/unit/exercise/fill-in-matching.test.ts
import { describe, it, expect } from 'vitest';
import { checkFillInAnswer } from '@/lib/exercise/matching';

describe('checkFillInAnswer', () => {
  it('matches exact answer', () => {
    const result = checkFillInAnswer('for', 'for');
    expect(result).toBe(true);
  });

  it('trims whitespace', () => {
    const result = checkFillInAnswer('  for  ', 'for');
    expect(result).toBe(true);
  });

  it('is case-sensitive for keywords', () => {
    const result = checkFillInAnswer('For', 'for');
    expect(result).toBe(false);
  });

  it('matches accepted alternatives', () => {
    const result = checkFillInAnswer('i', 'i', ['j', 'x', 'item']);
    expect(result).toBe(true);

    const result2 = checkFillInAnswer('item', 'i', ['j', 'x', 'item']);
    expect(result2).toBe(true);
  });

  it('rejects incorrect answer', () => {
    const result = checkFillInAnswer('while', 'for');
    expect(result).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/exercise/fill-in-matching.test.ts`
Expected: FAIL - checkFillInAnswer not found

**Step 3: Implement fill-in matching**

Modify: `src/lib/exercise/matching.ts`

Add at end of file:

```typescript
/**
 * Check if a fill-in-the-blank answer is correct
 * @param userAnswer - User's input for the blank
 * @param expectedAnswer - Expected answer
 * @param acceptedAlternatives - Optional alternative correct answers
 */
export function checkFillInAnswer(
  userAnswer: string,
  expectedAnswer: string,
  acceptedAlternatives: string[] = []
): boolean {
  const normalized = userAnswer.trim();
  const expected = expectedAnswer.trim();

  // Check against primary answer
  if (normalized === expected) {
    return true;
  }

  // Check against alternatives
  return acceptedAlternatives.some(alt => normalized === alt.trim());
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/exercise/fill-in-matching.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/exercise/matching.ts tests/unit/exercise/fill-in-matching.test.ts
git commit -m "$(cat <<'EOF'
feat(matching): add fill-in answer validation

- checkFillInAnswer() for fill-in exercise type
- Trim whitespace from input
- Support accepted alternatives
- Case-sensitive matching
- 5 tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3.3: Update ExerciseCard to Support Fill-In Type

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`
- Create: `tests/unit/components/ExerciseCard-fill-in.test.tsx`

**Step 1: Write failing tests for fill-in support**

```typescript
// tests/unit/components/ExerciseCard-fill-in.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import type { Exercise } from '@/lib/types';

describe('ExerciseCard fill-in support', () => {
  const fillInExercise: Exercise = {
    id: '1',
    slug: 'for-loop-fill',
    title: 'For Loop Fill-In',
    prompt: 'Complete the for loop header',
    expectedAnswer: 'for',
    acceptedSolutions: [],
    hints: ['What keyword starts a loop?'],
    exerciseType: 'fill-in',
    template: '___ i in range(5):\n    print(i)',
    blankPosition: 0,
    // ... other required fields
  } as Exercise;

  it('renders FillInExercise for fill-in type', () => {
    render(
      <ExerciseCard
        exercise={fillInExercise}
        onResult={vi.fn()}
      />
    );

    // Should show template code, not regular CodeInput
    expect(screen.getByText(/in range\(5\):/)).toBeInTheDocument();
  });

  it('renders CodeInput for write type', () => {
    const writeExercise = {
      ...fillInExercise,
      exerciseType: 'write',
      template: null,
      blankPosition: null,
    } as Exercise;

    render(
      <ExerciseCard
        exercise={writeExercise}
        onResult={vi.fn()}
      />
    );

    // Should show regular code input
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test tests/unit/components/ExerciseCard-fill-in.test.tsx`
Expected: FAIL - ExerciseCard doesn't handle exerciseType

**Step 3: Update ExerciseCard component**

Modify: `src/components/exercise/ExerciseCard.tsx`

Add import:
```typescript
import { FillInExercise } from './FillInExercise';
import { checkFillInAnswer } from '@/lib/exercise/matching';
```

In the component, update the rendering logic:

```typescript
// In the "answering" phase render section, replace CodeInput with:

{exercise.exerciseType === 'fill-in' && exercise.template ? (
  <FillInExercise
    template={exercise.template}
    blankPosition={exercise.blankPosition ?? 0}
    onSubmit={handleFillInSubmit}
    disabled={phase !== 'answering'}
  />
) : (
  <CodeInput
    value={userAnswer}
    onChange={setUserAnswer}
    onSubmit={handleSubmit}
    disabled={phase !== 'answering'}
  />
)}
```

Add handler:
```typescript
const handleFillInSubmit = useCallback((answer: string) => {
  const isCorrect = checkFillInAnswer(
    answer,
    exercise.expectedAnswer,
    exercise.acceptedSolutions
  );

  const quality = inferQuality({
    isCorrect,
    hintUsed,
    responseTimeMs: Date.now() - startTime,
  });

  setResult({ isCorrect, quality, userAnswer: answer });
  setPhase('feedback');
}, [exercise, hintUsed, startTime]);
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test tests/unit/components/ExerciseCard-fill-in.test.tsx`
Expected: All tests PASS

**Step 5: Run all exercise component tests**

Run: `pnpm test tests/unit/components/Exercise`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx tests/unit/components/ExerciseCard-fill-in.test.tsx
git commit -m "$(cat <<'EOF'
feat(exercise): add fill-in exercise support to ExerciseCard

- Render FillInExercise for exerciseType='fill-in'
- Keep CodeInput for exerciseType='write'
- Add handleFillInSubmit with checkFillInAnswer
- 2 new tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Part 4: Content Migration (Existing 50 Exercises)

### Task 4.1: Update YAML Import Script for New Taxonomy

**Files:**
- Modify: `scripts/import-exercises.ts`

**Step 1: Update import script to handle new fields**

Modify: `scripts/import-exercises.ts`

Update the upsert to include new columns:

```typescript
const exerciseData = {
  language: file.language,
  slug: exercise.slug,
  category: file.category,
  difficulty: exercise.difficulty ?? 1,
  title: exercise.title,
  prompt: exercise.prompt,
  expected_answer: exercise.expected_answer,
  accepted_solutions: exercise.accepted_solutions ?? [],
  hints: exercise.hints,
  tags: exercise.tags ?? [],
  // New taxonomy fields
  concept: exercise.concept,
  subconcept: exercise.subconcept,
  level: exercise.level,
  prereqs: exercise.prereqs ?? [],
  exercise_type: exercise.type ?? 'write',
  pattern: exercise.pattern,
  template: exercise.template ?? null,
  blank_position: exercise.blank_position ?? null,
};
```

**Step 2: Test import script still works**

Run: `pnpm db:import-exercises`
Expected: Success (existing exercises imported, new fields null until migrated)

**Step 3: Commit**

```bash
git add scripts/import-exercises.ts
git commit -m "$(cat <<'EOF'
feat(import): update exercise import for new taxonomy fields

- Add concept, subconcept, level, prereqs, type, pattern
- Add template and blank_position for fill-in exercises
- Backward compatible (null for unmigrated exercises)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4.2: Migrate Existing Exercises to New Taxonomy

**Files:**
- Modify: `exercises/python/basics.yaml`
- Modify: `exercises/python/strings.yaml`
- Modify: `exercises/python/operators.yaml`
- Modify: `exercises/python/lists.yaml`
- Modify: `exercises/python/dictionaries.yaml`
- Modify: `exercises/python/loops.yaml`
- Modify: `exercises/python/functions.yaml`
- Modify: `exercises/python/classes.yaml`
- Modify: `exercises/python/comprehensions.yaml`
- Modify: `exercises/python/exceptions.yaml`

**Step 1: Migrate basics.yaml**

Example migration for first exercise:

```yaml
# Before
- slug: print-hello-world
  title: Print Hello World
  difficulty: 1
  prompt: Print the text "Hello, World!" to the console
  expected_answer: print("Hello, World!")
  accepted_solutions:
    - "print('Hello, World!')"
  hints:
    - Use the print() function
    - Put the text in quotes
  tags: [print, strings, beginner]

# After
- slug: print-hello-world
  title: Print Hello World
  difficulty: 1
  prompt: Print the text "Hello, World!" to the console
  expected_answer: print("Hello, World!")
  accepted_solutions:
    - "print('Hello, World!')"
  hints:
    - Use the print() function
    - Put the text in quotes
  tags: [print, strings, beginner]
  # New taxonomy fields
  concept: foundations
  subconcept: io
  level: intro
  prereqs: []
  type: write
  pattern: io
```

**Step 2: Create migration mapping document**

This is a content task - apply the following mapping to each category:

| Current Category | Maps to Concept | Subconcepts |
|-----------------|-----------------|-------------|
| basics | foundations | variables, operators, expressions, io |
| operators | foundations | operators |
| strings | strings | basics, indexing, slicing, methods, fstrings |
| lists | collections | lists |
| dictionaries | collections | dicts |
| loops | control-flow | for, while, iteration |
| functions | functions | basics, arguments |
| classes | oop | classes, methods |
| comprehensions | comprehensions | list-comp |
| exceptions | error-handling | try-except, raising |

**Step 3: Migrate all 50 exercises**

(This is manual content work - each exercise needs:)
- `concept`: From mapping above
- `subconcept`: Specific skill being tested
- `level`: intro/practice/edge based on difficulty and complexity
- `prereqs`: What must be learned first (usually empty for intro)
- `type`: 'write' for all existing exercises
- `pattern`: Best fit from defined patterns

**Step 4: Run validation**

Run: `pnpm validate:exercises`
Expected: All 50 exercises pass validation

**Step 5: Import to database**

Run: `pnpm db:import-exercises`
Expected: All 50 exercises updated with new fields

**Step 6: Commit**

```bash
git add exercises/python/*.yaml
git commit -m "$(cat <<'EOF'
feat(exercises): migrate 50 exercises to new taxonomy

- Add concept, subconcept, level, prereqs, type, pattern to all exercises
- Map categories to concepts per curriculum design
- All exercises pass schema validation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Part 5: Content Creation (120-170 New Exercises)

### Task 5.1: Create Curriculum Graph Definition

**Files:**
- Create: `src/lib/curriculum/python.json`

**Step 1: Create curriculum definition**

```json
{
  "language": "python",
  "version": "1.0.0",
  "concepts": [
    {
      "slug": "foundations",
      "name": "Foundations",
      "description": "Variables, operators, expressions, and basic I/O",
      "prereqs": [],
      "subconcepts": ["variables", "operators", "expressions", "io"]
    },
    {
      "slug": "strings",
      "name": "Strings",
      "description": "String manipulation, formatting, and f-strings",
      "prereqs": ["foundations"],
      "subconcepts": ["basics", "indexing", "slicing", "methods", "fstrings"]
    },
    {
      "slug": "numbers-booleans",
      "name": "Numbers & Booleans",
      "description": "Numeric types, boolean logic, and type conversion",
      "prereqs": ["foundations"],
      "subconcepts": ["integers", "floats", "booleans", "conversion"]
    },
    {
      "slug": "collections",
      "name": "Collections",
      "description": "Lists, tuples, dictionaries, and sets",
      "prereqs": ["strings", "numbers-booleans"],
      "subconcepts": ["lists", "tuples", "dicts", "sets", "unpacking"]
    },
    {
      "slug": "control-flow",
      "name": "Control Flow",
      "description": "Conditionals, loops, and iteration",
      "prereqs": ["collections"],
      "subconcepts": ["conditionals", "for", "while", "iteration"]
    },
    {
      "slug": "functions",
      "name": "Functions",
      "description": "Function definitions, parameters, and scope",
      "prereqs": ["collections"],
      "subconcepts": ["basics", "arguments", "scope", "lambda", "typehints"]
    },
    {
      "slug": "comprehensions",
      "name": "Comprehensions",
      "description": "List, dict, and set comprehensions",
      "prereqs": ["control-flow", "functions"],
      "subconcepts": ["list-comp", "dict-comp", "set-comp", "generator-exp"]
    },
    {
      "slug": "error-handling",
      "name": "Error Handling",
      "description": "Exception handling and error management",
      "prereqs": ["comprehensions"],
      "subconcepts": ["try-except", "finally", "raising"]
    },
    {
      "slug": "oop",
      "name": "OOP",
      "description": "Classes, objects, and inheritance",
      "prereqs": ["comprehensions"],
      "subconcepts": ["classes", "methods", "inheritance", "classmethod", "properties"]
    },
    {
      "slug": "modules-files",
      "name": "Modules & Files",
      "description": "Imports, file I/O, and context managers",
      "prereqs": ["error-handling", "oop"],
      "subconcepts": ["imports", "reading", "writing", "context"]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
feat(curriculum): add Python curriculum graph definition

- 10 concepts with prerequisite relationships
- Subconcepts defined per concept
- Forms DAG structure for milestone unlocking

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5.2: Create Exercise Templates for Each Subconcept

**This is a large content creation task. For each subconcept:**

1. Create 2-3 `intro` level exercises
2. Create 3-5 `practice` level exercises
3. Create 1-2 `edge` level exercises
4. Create 1 `integrated` level exercise

**Each exercise must have:**
- Multi-AI review (Claude + Codex + Gemini)
- Clear, unambiguous prompt
- `accepted_solutions` for quote variants
- Proper prereqs

**Process:**
1. Use AI to generate exercise drafts
2. Review for clarity and correctness
3. Add to YAML files
4. Run validation
5. Import to database
6. Commit in batches

**Target per milestone:**
- Foundations: 18-22 exercises
- Strings: 18-22 exercises
- Numbers & Booleans: 12-15 exercises
- Collections: 25-30 exercises
- Control Flow: 20-25 exercises
- Functions: 22-28 exercises
- Comprehensions: 12-18 exercises
- Error Handling: 10-15 exercises
- OOP: 18-24 exercises
- Modules & Files: 12-18 exercises

**Total: 170-220 exercises**

---

## Part 6: Documentation Updates

### Task 6.1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add Phase 2 information**

Add to "Current Status" section:
```markdown
**Current Status:** Phase 2 In Progress - Curriculum overhaul with concept-based SRS, 170-220 exercises, DAG structure.
```

Add new section:
```markdown
## Phase 2: Curriculum System

**Concept-Based SRS:**
- SRS tracks subconcept mastery, not individual exercises
- Tables: `subconcept_progress` (SRS state), `exercise_attempts` (usage)
- Hook: `useConceptSRS` for concept-based scheduling

**Taxonomy Fields (all exercises):**
- `concept`: Primary milestone (e.g., `control-flow`)
- `subconcept`: Specific skill (e.g., `for`, `enumerate`)
- `level`: `intro` | `practice` | `edge` | `integrated`
- `prereqs`: Subconcepts that must be mastered first
- `type`: `write` | `fill-in` (future: `predict`, `debug`)
- `pattern`: Programming pattern (e.g., `iteration`, `accumulator`)

**Exercise Types:**
- `write`: Write code from scratch (CodeInput)
- `fill-in`: Complete blanks in template (FillInExercise)

**Curriculum Graph:** `src/lib/curriculum/python.json`
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs(claude): add Phase 2 curriculum system documentation

- Document concept-based SRS architecture
- Document taxonomy fields
- Document exercise types
- Reference curriculum graph file

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6.2: Update Obsidian Documentation

**Files:**
- Update: `SRS-app/Product-A-Plus-Implementation.md` (via Obsidian MCP)
- Update: `SRS-app/Database-Schema.md` (via Obsidian MCP)

**Step 1: Update Product-A-Plus-Implementation.md**

Add section noting Phase 1A complete, Phase 2 begun.

**Step 2: Update Database-Schema.md**

Add new tables:
- `subconcept_progress`
- `exercise_attempts`
- Updated `exercises` table schema with new columns

**Step 3: Commit (local docs folder if synced)**

---

## Execution Checklist

### Part 1: Infrastructure
- [ ] Task 1.1: JSON Schema + validation script
- [ ] Task 1.2: TypeScript types for taxonomy

### Part 2: Concept-Based SRS
- [ ] Task 2.1: Database migrations
- [ ] Task 2.2: Concept SRS algorithm + tests
- [ ] Task 2.3: useConceptSRS hook + tests

### Part 3: Fill-In Exercises
- [ ] Task 3.1: FillInExercise component + tests
- [ ] Task 3.2: Fill-in validation logic + tests
- [ ] Task 3.3: ExerciseCard fill-in support + tests

### Part 4: Content Migration
- [ ] Task 4.1: Update import script
- [ ] Task 4.2: Migrate 50 existing exercises

### Part 5: Content Creation
- [ ] Task 5.1: Curriculum graph definition
- [ ] Task 5.2: Create 120-170 new exercises (batched)

### Part 6: Documentation
- [ ] Task 6.1: Update CLAUDE.md
- [ ] Task 6.2: Update Obsidian docs

---

**Total Estimated Tasks:** 12 main tasks + content creation batches
**Test Coverage:** ~30 new tests across algorithm, hooks, components

---

Plan complete and saved to `docs/plans/2026-01-05-phase2-curriculum-overhaul.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
