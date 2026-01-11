# Multi-Language Support Design

> Adding JavaScript (and future languages) to the SRS-app platform

**Date:** 2026-01-11
**Status:** Approved
**Updated:** 2026-01-11 (Added schema details per Codex review)

---

## Overview

This design adds multi-language support to allow users to practice code syntax in multiple programming languages (starting with JavaScript alongside Python). Each language has independent progress tracking, and users can switch between languages from the dashboard.

### Core Principles

- **Language as first-class dimension:** All content organized by language
- **Separate progress:** No cross-training; each language has independent SRS state
- **Parallel structure:** Exercises, paths, curriculum, and generators follow the same directory pattern per language

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Progress tracking | Separate per language |
| Subconcept identification | Language column on `subconcept_progress` table |
| Exercise attempt tracking | Language column on `exercise_attempts` table |
| Language switcher location | DueNowBand (dashboard), display badge in Header |
| Skill tree tabs | View-only (does NOT change preferred_language) |
| Stats | Hybrid: global streak/achievements, per-language accuracy/totals |
| Content organization | Fully separate per language |
| Curriculum files | Separate JSON per language |
| Concept slugs | Shared where concepts overlap (loops, functions), language-specific otherwise |
| Exercise slugs | Unique within language only (same slug can exist in Python and JS) |
| New user default | Python (easy to switch) |
| Generators | Language-specific with shared utilities |

---

## Open Questions Resolved

| Question | Answer |
|----------|--------|
| Are exercise slugs globally unique? | **No.** Schema allows same slug across languages via `UNIQUE(language, slug)`. Therefore `exercise_attempts` needs language column. |
| Will concept slugs be identical across languages? | **Partially.** Shared concepts (conditionals, loops, functions) use same slugs. Language-specific concepts (list-comprehension, arrow-functions) are unique. `ConceptSlug` type becomes `string` with per-language validation. |
| Are achievements/points/contribution graph global or per-language? | **Global.** Consistent with "streak is global" decision. Contribution graph shows all practice activity regardless of language. |
| Is skill tree tab selection view-only? | **Yes.** Viewing other language's tree is local UI state, does NOT update `preferred_language`. |

---

## Database Schema Changes

### Table: `subconcept_progress`

```sql
-- Add language column
ALTER TABLE subconcept_progress
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Update unique constraint to include language
ALTER TABLE subconcept_progress
  DROP CONSTRAINT subconcept_progress_user_id_subconcept_slug_key,
  ADD CONSTRAINT subconcept_progress_user_language_subconcept_key
    UNIQUE(user_id, language, subconcept_slug);

-- Index for language-filtered due queries (most common access pattern)
CREATE INDEX idx_subconcept_progress_due_by_language
  ON subconcept_progress(user_id, language, next_review);

-- Drop old index, add language-aware one
DROP INDEX IF EXISTS idx_subconcept_progress_language;
CREATE INDEX idx_subconcept_progress_user_language
  ON subconcept_progress(user_id, language);
```

### Table: `exercise_attempts` (CHANGE REQUIRED)

The exercises table allows same slug across languages (`UNIQUE(language, slug)`). Therefore `exercise_attempts` needs language scoping to avoid collisions and enable per-language accuracy stats.

```sql
-- Add language column
ALTER TABLE exercise_attempts
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Update unique constraint
ALTER TABLE exercise_attempts
  DROP CONSTRAINT exercise_attempts_user_id_exercise_slug_key,
  ADD CONSTRAINT exercise_attempts_user_language_exercise_key
    UNIQUE(user_id, language, exercise_slug);

-- Update indexes
DROP INDEX IF EXISTS idx_exercise_attempts_user_exercise;
CREATE INDEX idx_exercise_attempts_user_language_exercise
  ON exercise_attempts(user_id, language, exercise_slug);
```

### Tables with no changes needed

- **`profiles`**: Already has `preferred_language TEXT DEFAULT 'python'`
- **`exercises`**: Already has `language TEXT NOT NULL` and `UNIQUE(language, slug)`

### RPC Functions to Update

The following RPCs query `exercise_attempts` and may need language filtering for per-language stats:

- `get_contribution_history` - **Keep global** (shows all activity)
- `calculate_attempt_points` - **Keep global** (points are global)
- `check_achievements` - **Keep global** (achievements are global)

For per-language accuracy, add new RPC or modify hooks to filter by language when joining to exercises.

---

## TypeScript Type Changes

### `ConceptSlug` - Remove Python-specific union

Current (Python-locked):
```typescript
export type ConceptSlug =
  | 'foundations'
  | 'strings'
  | 'numbers-booleans'
  // ... Python-specific
```

New (generic string, validated per-language):
```typescript
// Generic type - validation happens at runtime per language
export type ConceptSlug = string;

// Language-specific concept lists for validation
export const PYTHON_CONCEPTS = [
  'foundations', 'strings', 'numbers-booleans', 'conditionals',
  'collections', 'loops', 'functions', 'comprehensions',
  'error-handling', 'oop', 'modules-files'
] as const;

export const JAVASCRIPT_CONCEPTS = [
  'foundations', 'strings', 'numbers-booleans', 'conditionals',
  'arrays-objects', 'loops', 'functions', 'async',
  'error-handling', 'oop', 'modules-dom'
] as const;

export function isValidConcept(slug: string, language: string): boolean {
  const concepts = language === 'python' ? PYTHON_CONCEPTS : JAVASCRIPT_CONCEPTS;
  return concepts.includes(slug as any);
}
```

### `SubconceptProgress` - Add language field

```typescript
export interface SubconceptProgress {
  id: string;
  userId: string;
  language: string;  // NEW
  subconceptSlug: string;
  conceptSlug: string;  // Changed from ConceptSlug union to string
  // ... rest unchanged
}
```

### `ExerciseAttempt` - Add language field

```typescript
export interface ExerciseAttempt {
  id: string;
  userId: string;
  language: string;  // NEW
  exerciseSlug: string;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: Date;
}
```

---

## Exercise Schema Changes

### `exercises/schema.json`

Update concept enum to be per-language or remove strict enum:

**Option A (recommended):** Remove concept enum, validate in code
```json
"concept": {
  "type": "string",
  "description": "Primary milestone/concept (validated per-language)"
}
```

**Option B:** Use oneOf with language-specific enums (more complex)

---

## Path Index Language Scoping

### Current Problem

`src/lib/paths/loader.ts` hardcodes Python:
```typescript
const PATHS_DIR = join(process.cwd(), 'paths', 'python');
```

The path index is cached as singleton, so loading JavaScript paths would collide.

### Solution

1. **Parameterize loader by language:**
```typescript
export async function loadBlueprints(language: string): Promise<Blueprint[]> {
  const blueprintsDir = join(process.cwd(), 'paths', language, 'blueprints');
  // ...
}

export async function getPathIndex(language: string): Promise<PathIndex> {
  if (!cachedIndexes.has(language)) {
    const blueprints = await loadBlueprints(language);
    const skins = await loadSkins(language);
    cachedIndexes.set(language, buildPathIndex(blueprints, skins));
  }
  return cachedIndexes.get(language)!;
}
```

2. **Per-language cache:**
```typescript
const cachedIndexes = new Map<string, PathIndex>();

export function clearPathIndexCache(language?: string): void {
  if (language) {
    cachedIndexes.delete(language);
  } else {
    cachedIndexes.clear();
  }
}
```

3. **Update scripts:**
- `scripts/generate-path-index.ts` - iterate over languages
- `scripts/validate-paths.ts` - validate per language

---

## Generator Registry Language Scoping

### Current Problem

`src/lib/generators/index.ts` has a global registry. With language-specific generators, need per-language lookup.

### Solution

```typescript
// src/lib/generators/index.ts
import * as pythonGenerators from './python';
import * as javascriptGenerators from './javascript';

const generatorsByLanguage: Record<string, Record<string, Generator>> = {
  python: pythonGenerators.generators,
  javascript: javascriptGenerators.generators,
};

export function getGenerator(name: string, language: string): Generator | undefined {
  return generatorsByLanguage[language]?.[name];
}

export function hasGenerator(name: string, language: string): boolean {
  return !!getGenerator(name, language);
}
```

---

## Validation Script Updates

### `scripts/validate-exercises.ts`

```typescript
function validateExercises(language: string = 'python') {
  const exercisesDir = join(process.cwd(), 'exercises', language);
  // ...
}

// CLI: pnpm validate:exercises -- --language=javascript
```

### `scripts/validate-paths.ts`

```typescript
function validatePaths(language: string = 'python') {
  const pathsDir = join(process.cwd(), 'paths', language);
  // ...
}
```

### Update `package.json` scripts

```json
{
  "validate:exercises": "tsx scripts/validate-exercises.ts",
  "validate:exercises:js": "tsx scripts/validate-exercises.ts --language=javascript",
  "validate:paths": "tsx scripts/validate-paths.ts",
  "validate:paths:js": "tsx scripts/validate-paths.ts --language=javascript",
  "validate:all": "pnpm validate:exercises && pnpm validate:exercises:js && pnpm validate:paths && pnpm validate:paths:js"
}
```

---

## Cache Key Updates (React Query)

### `useDueCount`

Current:
```typescript
queryKey: ['dueCount', userId]
```

Updated:
```typescript
queryKey: ['dueCount', userId, language]
```

### `useSkillTree`

Current:
```typescript
queryKey: ['skillTree', userId]
```

Updated:
```typescript
queryKey: ['skillTree', userId, language]
```

### `useConceptSRS`

Current:
```typescript
queryKey: ['subconcept-progress', userId]
```

Updated:
```typescript
queryKey: ['subconcept-progress', userId, language]
```

### `useStats` (per-language portion)

```typescript
queryKey: ['languageStats', userId, language]
```

---

## File & Folder Structure

### Content directories

```
exercises/
├── schema.json           # Shared validation schema (updated)
├── python/               # Existing - unchanged
│   ├── foundations.yaml
│   ├── collections.yaml
│   └── ...
└── javascript/           # New
    ├── foundations.yaml
    ├── arrays-objects.yaml
    └── ...

paths/
├── python/               # Existing - unchanged
│   ├── blueprints/
│   └── skins/
└── javascript/           # New
    ├── blueprints/
    └── skins/
```

### Source code directories

```
src/lib/
├── curriculum/
│   ├── python.json       # Existing - unchanged
│   ├── javascript.json   # New
│   ├── loader.ts         # Updated - takes language param
│   ├── types.ts          # Updated - ConceptSlug becomes string
│   └── index.ts          # Updated exports
│
├── generators/
│   ├── shared/           # New - common utilities
│   │   └── utils.ts      # Random names, seed logic
│   ├── python/           # Move existing generators here
│   │   ├── index.ts
│   │   ├── slice-bounds.ts
│   │   └── ...
│   └── javascript/       # New
│       ├── index.ts
│       ├── array-methods.ts
│       └── ...
│
├── paths/
│   ├── loader.ts         # Updated - takes language param, per-language cache
│   ├── client-loader.ts  # Updated - takes language param
│   └── ...
```

---

## UI Components

### Header (`src/components/layout/Header.tsx`)

- Add language badge/icon next to user menu
- Display only, not clickable
- Shows active language with icon

### DueNowBand (`src/components/dashboard/DueNowBand.tsx`)

- Add language selector dropdown
- When user switches: update `profiles.preferred_language`
- Due count refreshes to show selected language's count

```
┌─────────────────────────────────────────────────────┐
│  [🐍 Python ▼]     12 cards due     [Start Practice]│
└─────────────────────────────────────────────────────┘
```

### SkillTree (`src/components/skill-tree/SkillTree.tsx`)

- Add tabs above the tree: `Python (12 due)` | `JavaScript (3 due)`
- Active language tab highlighted
- Tab selection is **view-only** (local state, does NOT change preferred_language)
- Active practice language indicated with subtle marker

### StatsGrid (`src/components/dashboard/StatsGrid.tsx`)

- Streak: global (unchanged)
- Accuracy: filtered by active language
- Total exercises: per-language or combined display

### Practice page

- No switcher - language locked at session start
- Header badge visible (display only)

---

## Hooks & Data Flow

### Hooks requiring `language` parameter

| Hook | Change |
|------|--------|
| `useConceptSRS` | Filter `subconcept_progress` by language, pass language to upserts |
| `useSkillTree` | Load curriculum for specified language |
| `useDueCount` | Count due subconcepts for language, include language in cache key |
| `useStats` | Split into global + per-language |
| `useConceptSession` | Filter exercises by language, pass language to attempt logging |

### `useConceptSRS` - Critical Updates

Must pass language explicitly to upserts to avoid defaulting to Python:

```typescript
async function recordSubconceptResult(slug: string, quality: number) {
  await supabase.from('subconcept_progress').upsert({
    user_id: userId,
    language: language,  // EXPLICIT - don't rely on default
    subconcept_slug: slug,
    // ... FSRS fields
  }, {
    onConflict: 'user_id,language,subconcept_slug'
  });
}
```

### `useConceptSession` - Exercise Filtering

Must filter exercises by language:

```typescript
const { data: exercises } = await supabase
  .from('exercises')
  .select('*')
  .eq('language', language)  // REQUIRED
  .in('subconcept', dueSubconcepts);
```

### New hook: `useActiveLanguage`

```typescript
function useActiveLanguage() {
  const { profile } = useProfile();
  return {
    language: profile?.preferredLanguage ?? 'python',
    setLanguage: async (lang: string) => {
      await updateProfile({ preferredLanguage: lang });
    }
  };
}
```

### Data flow: Dashboard load

```
1. useActiveLanguage() → 'python'
2. useDueCount('python') → 12
3. useSkillTree('python') → Python curriculum tree
4. useGlobalStats() → { streak: 5 }
5. useLanguageStats('python') → { accuracy: 85, total: 200 }
```

### Data flow: Language switch

```
1. User selects JavaScript in DueNowBand
2. setLanguage('javascript') → updates profile
3. React Query invalidates language-keyed queries
4. All hooks re-query with new language
5. UI updates: due count, skill tree, stats
```

---

## Implementation Order

### Phase 1: Foundation (Schema + Types)

1. Migration: Add `language` column to `subconcept_progress` with proper indexes
2. Migration: Add `language` column to `exercise_attempts`
3. Update TypeScript types: `ConceptSlug` → string, add language to interfaces
4. Update `exercises/schema.json` to remove Python-specific concept enum

### Phase 2: Loaders & Generators

5. Update curriculum loader to accept language parameter
6. Update paths loader with per-language caching
7. Update client-loader for paths
8. Move generators to `python/` subfolder, create registry by language
9. Create shared generator utilities

### Phase 3: Hooks & Data Layer

10. Create `useActiveLanguage` hook
11. Update `useConceptSRS` with language filter and explicit upserts
12. Update `useDueCount` with language filter and cache key
13. Update `useSkillTree` with language parameter
14. Update `useConceptSession` with language filter
15. Split stats hooks (global streak, per-language accuracy)
16. Update `logAttempt` to include language

### Phase 4: Validation Scripts

17. Parameterize `validate-exercises.ts` by language
18. Parameterize `validate-paths.ts` by language
19. Update `package.json` scripts

### Phase 5: UI Components

20. Add language badge to Header
21. Add language switcher to DueNowBand
22. Add language tabs to SkillTree (view-only)
23. Update StatsGrid for hybrid stats display

### Phase 6: JavaScript Content (separate effort)

24. Create `javascript.json` curriculum
25. Create JavaScript exercises in `exercises/javascript/`
26. Create JavaScript blueprints/skins in `paths/javascript/`
27. Create JavaScript generators in `generators/javascript/`

---

## Testing Considerations

- Unit tests for hooks with language parameter
- Unit tests for language-scoped path index
- Unit tests for generator registry by language
- Integration tests for language switching flow
- Integration tests for exercise_attempts language scoping
- E2E test: switch languages, verify due counts update
- E2E test: complete exercise in each language, verify separate progress
- E2E test: verify skill tree tabs are view-only
- Validate curriculum JSON schema for new languages
- Validate same slug works in different languages without collision

---

## Future Considerations

- TypeScript as separate language vs. JavaScript superset
- Language-specific grading strategies (AST parsing differs)
- Cross-language concept mapping (for "you know this in Python" hints)
- Language unlock/paywall tiers
