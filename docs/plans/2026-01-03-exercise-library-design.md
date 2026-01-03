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
| slug | yes | string | Unique identifier, kebab-case |
| title | yes | string | Human-readable name |
| difficulty | yes | 1-3 | 1=easy, 2=medium, 3=hard |
| prompt | yes | string | What to type |
| expected_answer | yes | string | Correct answer (whitespace-normalized) |
| hints | yes | string[] | Progressive hints (1-3 recommended) |
| tags | no | string[] | For filtering/search |

## Database Changes

**New `slug` column on `exercises` table:**

```sql
ALTER TABLE exercises
ADD COLUMN slug TEXT UNIQUE;

-- Backfill existing exercises with auto-generated slugs
UPDATE exercises
SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '''', ''));

-- Make slug required for future inserts
ALTER TABLE exercises
ALTER COLUMN slug SET NOT NULL;
```

**Migration file:** `supabase/migrations/XXXXXX_add_exercise_slug.sql`

**Updated TypeScript types:**

```typescript
// src/lib/types/app.types.ts - add slug field
export interface Exercise {
  id: string;
  slug: string;  // NEW
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
- Upserts on `slug` (insert or update existing)
- Reports count of inserted/updated/skipped
- Exits with error code if validation fails

**Dependencies:**
- `yaml` package for parsing
- Existing Supabase client

**Validation checks:**
- Required fields present
- `slug` is kebab-case
- `difficulty` is 1-3
- `hints` is non-empty array
- No duplicate slugs across files

**Example output:**
```
Scanning exercises/python/...
  ✓ basics.yaml: 5 exercises
  ✓ loops.yaml: 5 exercises
  ...

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

**Example difficulty scaling (loops):**
- Difficulty 1: `Write a for loop using range(5)`
- Difficulty 2: `Loop over items with enumerate`
- Difficulty 3: `Write a list comprehension with a conditional`

## Implementation Tasks

1. Create migration adding `slug` column to exercises
2. Update TypeScript types and mappers
3. Install `yaml` package
4. Create `scripts/import-exercises.ts`
5. Add `pnpm db:import-exercises` script to package.json
6. Create `exercises/python/` directory structure
7. Write 50 exercises across 10 YAML files
8. Run import and verify in database
9. Update seed.sql to remove old exercises (optional cleanup)

## Related

- [[Features]] - Exercise Library section
- [[Database-Schema]] - exercises table
