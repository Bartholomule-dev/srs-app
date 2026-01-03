# Exercise Library Design

> Design for storing and importing 50 Python syntax exercises via YAML files.

## Overview

Replace the current SQL-based seed data with human-readable YAML files that are imported to the database via a script. This makes exercises easy to edit, version-control, and expand.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage format | YAML files imported to DB | Readable, nice git diffs, feeds existing schema |
| File format | YAML over JSON | Multi-line Python code needs no escaping |
| Organization | One file per category | Manageable size, easy to find/edit topics |
| Explanation field | Omitted for MVP | Pure syntax drilling, not concept teaching |
| Import mechanism | pnpm script with upsert | Idempotent, works local + production |
| Exercise identity | Slug-based | Stable identifier, survives title renames |
| Slug uniqueness | Composite (language, slug) | Future-proofs for multi-language support |
| Answer evaluation | Exact match with normalization | Simple, predictable, uses existing `checkAnswer` |
| Hints requirement | Required (min 1) | Core SRS mechanic - hint usage affects quality score |

## File Structure

```
exercises/
└── python/
    ├── basics.yaml
    ├── strings.yaml
    ├── lists.yaml
    ├── dictionaries.yaml
    ├── loops.yaml
    ├── functions.yaml
    ├── classes.yaml
    ├── comprehensions.yaml
    ├── operators.yaml
    └── exceptions.yaml
```

## YAML Schema

**File-level fields:**
```yaml
language: python
category: loops
```

**Exercise fields:**
```yaml
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
```

**Field reference:**

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| slug | yes | string | Unique within language, kebab-case, manually authored |
| title | yes | string | Human-readable name |
| difficulty | yes | 1-3 | 1=easy, 2=medium, 3=hard (DB constraint enforced) |
| prompt | yes | string | What to type |
| expected_answer | yes | string | Correct answer (whitespace-normalized, see below) |
| hints | yes | string[] | Minimum 1 hint required (affects SRS quality scoring) |
| tags | no | string[] | For filtering/search (freeform, no validation) |

## Slug Rules

**Authoring:**
- Slugs are **manually authored** in YAML files
- Never auto-generated during import
- Must be kebab-case: `for-loop-range`, not `ForLoopRange` or `for_loop_range`
- Must be unique within a language (enforced by DB constraint)

**Immutability:**
- Once an exercise has user progress linked, the slug is **frozen**
- Never rename slugs after deployment to production
- Title can be renamed freely without breaking user progress

**Backfill (one-time for existing seed data):**
- Existing exercises get slugs generated as `{category}-{normalized-title}`
- Example: "For Loop Range" in loops → `loops-for-loop-range`
- Category prefix guarantees uniqueness even if titles collide

## Answer Matching

Answers are evaluated using **exact match with whitespace normalization**.

**Normalization rules** (implemented in `src/lib/exercise/matching.ts`):
1. Trim leading/trailing whitespace from entire answer
2. Normalize line endings to `\n` (handles Windows CRLF)
3. Preserve internal indentation (Python is indent-sensitive)
4. Collapse multiple consecutive blank lines to single blank line
5. Remove trailing whitespace from each line

**Example:**
```
User input:           "  for i in range(5):\n    print(i)  \n\n"
After normalization:  "for i in range(5):\n    print(i)"
Expected answer:      "for i in range(5):\n    print(i)"
Result:               MATCH
```

**Not supported (intentionally):**
- AST comparison (too complex for MVP)
- Multiple correct answers (use hints to guide to canonical form)
- Semantic equivalence (`range(0, 5)` vs `range(5)`)

## Database Changes

**New `slug` column on `exercises` table:**

```sql
-- Add slug column with composite unique constraint
ALTER TABLE exercises
ADD COLUMN slug TEXT;

-- Backfill existing exercises with category-prefixed slugs
-- This guarantees uniqueness even if titles collide after normalization
UPDATE exercises
SET slug = LOWER(
  category || '-' ||
  REGEXP_REPLACE(
    REGEXP_REPLACE(title, '[^a-zA-Z0-9 -]', '', 'g'),
    ' +', '-', 'g'
  )
);

-- Make slug required
ALTER TABLE exercises
ALTER COLUMN slug SET NOT NULL;

-- Composite unique constraint (language, slug) for multi-language support
ALTER TABLE exercises
ADD CONSTRAINT exercises_language_slug_unique UNIQUE (language, slug);

-- Add difficulty check constraint
ALTER TABLE exercises
ADD CONSTRAINT exercises_difficulty_check CHECK (difficulty BETWEEN 1 AND 3);
```

**Migration file:** `supabase/migrations/XXXXXX_add_exercise_slug.sql`

**Updated TypeScript types:**

```typescript
// src/lib/types/app.types.ts - add slug field
export interface Exercise {
  id: string;
  slug: string;  // NEW - unique within language
  // ... existing fields
}
```

## Import Script

**File:** `scripts/import-exercises.ts`

**Usage:**
```bash
pnpm db:import-exercises           # Import to local Supabase
pnpm db:import-exercises --prod    # Import to production (future)
```

**Behavior:**
- Recursively scans `exercises/{language}/*.yaml`
- Validates each exercise has required fields
- Upserts on `(language, slug)` composite key
- Reports count of inserted/updated/skipped
- Exits with error code if validation fails

**Dependencies:**
- `yaml` package for parsing
- Existing Supabase client

**Validation checks:**
- Required fields present (slug, title, difficulty, prompt, expected_answer, hints)
- `slug` is kebab-case (regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/`)
- `difficulty` is 1, 2, or 3
- `hints` is array with at least 1 element
- No duplicate slugs within same language across all files
- `language` and `category` present at file level

**Example output:**
```
Scanning exercises/python/...
  ✓ basics.yaml: 5 exercises
  ✓ loops.yaml: 5 exercises
  ...

Validating...
  ✓ All slugs unique within language
  ✓ All required fields present
  ✓ All difficulties in range 1-3

Importing to database...
  Inserted: 34
  Updated: 16
  Errors: 0

Done! 50 exercises in database.
```

## Exercise Content

**Distribution (50 exercises across 10 categories):**

| Category | Count | Focus |
|----------|-------|-------|
| basics | 5 | print, variables, comments, input, type() |
| operators | 5 | arithmetic, comparison, logical, assignment, membership |
| strings | 5 | indexing, slicing, methods, f-strings, concatenation |
| lists | 5 | creation, indexing, append, slicing, methods |
| dictionaries | 5 | creation, access, keys/values, get(), update |
| loops | 5 | for, while, range, enumerate, break/continue |
| functions | 5 | def, return, parameters, defaults, *args/**kwargs |
| classes | 5 | class, __init__, self, methods, inheritance |
| comprehensions | 5 | list, dict, set, conditionals, nested |
| exceptions | 5 | try/except, raise, finally, custom exceptions |

**Content principles:**
- Short prompts (one sentence, ~10-15 words)
- Short answers (1-3 lines of code max)
- Syntax-focused ("Write X" not "Explain X")
- No context needed (standalone exercises)
- Progressive difficulty (mix of 1s, 2s, and 3s per category)
- Every exercise has at least 1 hint (required for SRS quality scoring)

**Example difficulty scaling (loops):**
- Difficulty 1: `Write a for loop using range(5)`
- Difficulty 2: `Loop over items with enumerate`
- Difficulty 3: `Write a list comprehension with a conditional`

## Validation Scope (MVP)

**Validated:**
- Required fields present
- Slug format (kebab-case)
- Slug uniqueness within language
- Difficulty range (1-3)
- Hints non-empty

**Not validated (intentional for MVP):**
- Tags against canonical list (freeform is fine)
- Category against canonical list (file-level, consistent by design)
- Answer syntax validity (trust the author)

Can add stricter validation later if drift becomes a problem.

## Implementation Tasks

1. Create migration adding `slug` column with composite unique constraint
2. Update TypeScript types and mappers for `slug` field
3. Install `yaml` package
4. Create `scripts/import-exercises.ts` with validation
5. Add `pnpm db:import-exercises` script to package.json
6. Create `exercises/python/` directory structure
7. Write 50 exercises across 10 YAML files
8. Run import and verify in database
9. Update seed.sql to remove old exercises (optional cleanup)

## Related

- [[Features]] - Exercise Library section
- [[Database-Schema]] - exercises table
- `src/lib/exercise/matching.ts` - Answer normalization implementation
