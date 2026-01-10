# Blueprint-First Exercise System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the exercise system to be blueprint-first where "almost every question belongs to a blueprint" with skin-dependent answers, while maintaining a clean, unified system.

**Architecture:** Evolve from current 3-layer model (Exercise → Blueprint → Skin) to a more integrated system where:
- Skins become **global theme packs** usable across multiple blueprints
- Exercises gain **role tags** for flexible blueprint assignment
- A **standardized slot vocabulary** enables widespread skin-driven templating
- 4 "mega-blueprints" absorb the majority of exercises

**Tech Stack:** TypeScript, YAML (js-yaml), Vitest (TDD), Mustache templating, existing generators

---

## Executive Summary: Design Decisions

### What We're Keeping
1. **FSRS algorithm unchanged** - SRS scheduling remains per-subconcept
2. **Exercise YAML structure** - Existing schema works, just adding optional fields
3. **Generator system** - Existing 42 generators + skin var merging
4. **Three-layer conceptual model** - Exercise/Blueprint/Skin, but with enhanced relationships

### What We're Changing
1. **Skins become global** - No longer blueprint-specific; any skin can apply to any blueprint
2. **Exercises get role tags** - New `roles` field enables flexible blueprint assignment
3. **Standardized slot vocabulary** - 12 core slots for consistent templating
4. **4 mega-blueprints** - Each 15-25 beats covering specific concept clusters
5. **Side-quest buckets** - Optional exercise clusters per beat

### What We're Removing
1. **Blueprint-specific skin binding** - `blueprints: [...]` in skins becomes optional compatibility hint
2. **Hardcoded variable names in exercises** - Convert to `{{slot}}` syntax

### What We're Adding
1. **Role taxonomy** - 8 roles: Create, Update, Query, Transform, Display, Persist, Guard, Recover
2. **Data packs per skin** - Canonical datasets for predict exercises
3. **Side-quest system** - Beat-attached optional drills
4. **Expanded slot vocabulary** - Beyond current 5 vars to 12 standardized slots

---

## Critical Architecture Fixes (Pre-requisites)

Before implementing the main plan, these architectural issues MUST be addressed:

### Fix 1: Template Rendering Order (HIGH PRIORITY)

**Problem:** Exercises are rendered at fetch time (`useConceptSession.ts:179-183`) BEFORE skins are selected (`useConceptSession.ts:416-472`). If we convert exercises to use `{{collection_var}}`, they'll display raw placeholders.

**Root Cause:**
```
1. fetchExercises() → renderExercises(exercises, userId, date) // NO skinVars
2. buildSession() → selectSkinForExercises() // Skins chosen HERE
3. UI displays already-rendered exercise // Placeholder visible!
```

**Solution:** Keep existing variable names as primary, add new slots as aliases.
- **Keep `list_name`** as the primary slot (skins already provide this)
- Add `collection_var` as an **alias** in skin vars expansion
- Exercises continue to use `{{list_name}}`, `{{item_singular}}`, etc.
- New slot vocabulary documents the canonical names (which match existing skins)

**Alternative (deferred):** Re-render exercises with skin vars after selection. This requires:
- Storing raw exercises separately from rendered exercises
- A second render pass in `buildSession()` after skin selection
- More complex, save for Phase 5 if needed

### Fix 2: Global Skins Path Not in Client Loader (HIGH PRIORITY)

**Problem:** Plan creates `paths/global-skins/` but `generate-path-index.ts` only loads from `paths/python/skins/`.

**Solution:** Update Task 6 to modify BOTH:
1. `scripts/generate-path-index.ts` - Add `loadGlobalSkins()` function
2. `src/lib/paths/client-loader.ts` - No change needed (loads from generated JSON)
3. `src/lib/paths/loader.ts` - Add global skins to server loader

**Updated paths:**
```
paths/
├── python/
│   ├── blueprints/     # Language-specific blueprints
│   └── skins/          # Language-specific skins (KEEP for backwards compat)
└── global-skins/       # Cross-language theme packs (NEW)
```

### Fix 3: Role Inference Pattern Mismatch (HIGH PRIORITY)

**Problem:** Plan uses pattern names like `'creation'`, `'membership'`, `'append'` but actual `ExercisePattern` enum has different values.

**Actual ExercisePattern values:**
- `'construction'` (not 'creation')
- `'query'` (not 'membership')
- `'mutation'` (not 'append')
- `'iteration'` (correct)
- `'filtering'` (correct)
- `'conditional'` (correct)
- `'handling'` (not 'exception')
- `'context'` (not 'context-manager')
- `'file'` (correct)

**Solution:** Update `ROLE_DEFINITIONS` in Task 3 to use actual pattern values:
```typescript
create: { patterns: ['construction', 'declaration', 'definition', 'assignment'] }
update: { patterns: ['mutation'] }
query: { patterns: ['query', 'lookup', 'indexing', 'search'] }
transform: { patterns: ['transformation', 'mapping', 'filtering'] }
display: { patterns: ['iteration', 'output', 'io'] }
persist: { patterns: ['file', 'context', 'import'] }
guard: { patterns: ['conditional', 'branching', 'comparison'] }
recover: { patterns: ['handling', 'error-first'] }
```

### Fix 4: Side-Quest Data Flow (MEDIUM PRIORITY)

**Problem:** `SkinnedCard` and session types have no side-quest marker for UI display.

**Solution:** Add to types in Phase 2, Task 13:
```typescript
// In src/lib/paths/types.ts
export interface SkinnedCard {
  // ... existing fields ...
  isSideQuest: boolean;  // NEW: true if this is a side-quest, not main beat
}

// In Beat interface
export interface Beat {
  // ... existing fields ...
  sideQuests?: string[];  // NEW: optional exercise slugs for side-quests
}
```

### Fix 5: Blueprint Rename Migration (MEDIUM PRIORITY)

**Problem:** Renaming `collection-cli-app` to `cli-organizer` will break existing skin `blueprints: [collection-cli-app]` references.

**Solution:** TWO-PHASE MIGRATION
1. **Phase 1:** Add `cli-organizer` blueprint WITHOUT removing old one
2. **Phase 2:** Update all 5 skins to reference BOTH: `blueprints: [cli-organizer, collection-cli-app]`
3. **Phase 3:** After confirming no issues, remove old blueprint in a later release

OR: Keep original ID (`collection-cli-app`) and just expand the beats (simpler, recommended).

---

## Design Questions & Answers

### Q1: Should global skins be language-specific or truly cross-language?

**Answer:** **Language-specific under `paths/python/`** (renamed from `global-skins/`).

**Reasoning:**
- Skins contain domain-specific variable names that may differ by language conventions
- Python uses `snake_case`, JavaScript uses `camelCase`
- Example: `list_name` (Python) vs `listName` (JS)
- Future JavaScript skins can live under `paths/javascript/skins/`
- The "global" concept means "usable across all Python blueprints" not "cross-language"

**Updated structure:**
```
paths/
├── python/
│   ├── blueprints/
│   └── skins/          # ALL Python skins here (no separate global-skins/)
└── javascript/         # Future
    ├── blueprints/
    └── skins/
```

### Q2: Should "blueprint-first" override SRS or remain a grouping layer?

**Answer:** **Remain a grouping/reordering layer** (current behavior).

**Reasoning:**
- Overriding SRS would break the spaced repetition learning model
- Blueprints should enhance presentation, not replace the learning algorithm
- Users who want to "play through" a blueprint can use a future "Blueprint Mode" (opt-in)
- Current behavior: SRS selects due exercises → Blueprint groups/reorders them
- This preserves learning effectiveness while adding narrative context

**Future enhancement (not in this plan):**
- Add "Blueprint Progression Mode" as opt-in feature
- User explicitly chooses to follow a blueprint sequence
- SRS still tracks progress, but blueprint drives sequencing
- Save for Phase 6 or separate feature request

### Q3: Should roles be stored on exercises (YAML/DB) or inferred at runtime?

**Answer:** **Hybrid approach** - inferred at runtime with optional YAML override.

**Reasoning:**
- Inference from `pattern` field works for ~80% of exercises
- Some exercises may need explicit role assignment
- Avoid schema migration for 510 exercises
- Runtime inference is fast (string matching)

**Implementation:**
```yaml
# Optional explicit role in YAML (only when inference is wrong)
- slug: some-edge-case
  roles: [create, update]  # Optional override
  pattern: mutation        # Still used if roles not specified
```

```typescript
// In role inference
function getRoles(exercise: Exercise): ExerciseRole[] {
  // Check explicit override first
  if (exercise.roles && exercise.roles.length > 0) {
    return exercise.roles;
  }
  // Fall back to inference
  return [inferRoleFromExercise(exercise)];
}
```

---

## Phase 0: Preparation & Cleanup (Tasks 1-3)

### Task 1: Audit Current State

**Files:**
- Read: All `exercises/python/*.yaml` (510 exercises)
- Read: `paths/python/blueprints/*.yaml` (1 blueprint)
- Read: `paths/python/skins/*.yaml` (5 skins)

**Purpose:** Generate baseline metrics before changes

**Step 1: Run audit script**

Create a one-time audit script:

```bash
# scripts/audit-blueprint-coverage.sh
echo "=== Blueprint Coverage Audit ==="
echo ""
echo "Total exercises:"
grep -c "slug:" exercises/python/*.yaml | awk -F: '{sum+=$2} END {print sum}'
echo ""
echo "Exercises with generator:"
grep -c "generator:" exercises/python/*.yaml | awk -F: '{sum+=$2} END {print sum}'
echo ""
echo "Exercises with Mustache templates:"
grep -l "{{" exercises/python/*.yaml | wc -l
echo ""
echo "Exercises per concept:"
for f in exercises/python/*.yaml; do
  name=$(basename $f .yaml)
  count=$(grep -c "slug:" $f)
  echo "  $name: $count"
done
echo ""
echo "Current blueprints:"
ls paths/python/blueprints/
echo ""
echo "Current skins:"
ls paths/python/skins/
echo ""
echo "Exercises in blueprints:"
grep "exercise:" paths/python/blueprints/*.yaml | wc -l
```

**Step 2: Run audit**

Run: `bash scripts/audit-blueprint-coverage.sh > docs/audit-baseline.txt`

**Step 3: Commit baseline**

```bash
git add scripts/audit-blueprint-coverage.sh docs/audit-baseline.txt
git commit -m "chore: add blueprint coverage audit baseline

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Define Standardized Slot Vocabulary

**Files:**
- Create: `src/lib/paths/slot-vocabulary.ts`
- Test: `tests/unit/paths/slot-vocabulary.test.ts`

**IMPORTANT:** Due to Fix 1 (rendering order), we keep the EXISTING variable names that skins already provide. The slot vocabulary documents the canonical names and adds validation.

**Step 1: Write the failing test**

```typescript
// tests/unit/paths/slot-vocabulary.test.ts
import { describe, it, expect } from 'vitest';
import {
  STANDARD_SLOTS,
  SlotVocabulary,
  validateSkinVarsHasRequiredSlots,
} from '@/lib/paths/slot-vocabulary';

describe('Slot Vocabulary', () => {
  it('defines 12 standard slots', () => {
    expect(Object.keys(STANDARD_SLOTS)).toHaveLength(12);
  });

  it('includes collection slots (using existing names)', () => {
    // IMPORTANT: These match existing SkinVars in types.ts
    expect(STANDARD_SLOTS.list_name).toBeDefined();
    expect(STANDARD_SLOTS.item_singular).toBeDefined();
    expect(STANDARD_SLOTS.item_plural).toBeDefined();
  });

  it('includes attribute slots', () => {
    expect(STANDARD_SLOTS.attr_key_1).toBeDefined();
    expect(STANDARD_SLOTS.attr_key_2).toBeDefined();
    expect(STANDARD_SLOTS.id_var).toBeDefined();
  });

  it('includes file slots', () => {
    expect(STANDARD_SLOTS.filename).toBeDefined();
    expect(STANDARD_SLOTS.filetype).toBeDefined();
  });

  it('includes misc slots', () => {
    expect(STANDARD_SLOTS.user_role).toBeDefined();
    expect(STANDARD_SLOTS.status_var).toBeDefined();
    expect(STANDARD_SLOTS.action_verb).toBeDefined();
    expect(STANDARD_SLOTS.entity_name).toBeDefined();
  });

  describe('validateSkinVarsHasRequiredSlots', () => {
    it('passes when all required slots present', () => {
      const vars = {
        list_name: 'tasks',           // EXISTING name (not collection_var)
        item_singular: 'task',
        item_plural: 'tasks',
        item_examples: ['task1'],     // EXISTING required field
        record_keys: ['title'],       // EXISTING required field
      };
      expect(validateSkinVarsHasRequiredSlots(vars)).toEqual({ valid: true, missing: [] });
    });

    it('reports missing slots', () => {
      const vars = { list_name: 'tasks' };
      const result = validateSkinVarsHasRequiredSlots(vars);
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('item_singular');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/paths/slot-vocabulary.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/lib/paths/slot-vocabulary.ts
/**
 * Standardized slot vocabulary for skin-driven exercise templating.
 *
 * IMPORTANT: Variable names match the EXISTING SkinVars interface.
 * We keep `list_name` (not `collection_var`) because exercises are
 * rendered before skins are selected, so we must use names that
 * existing skins already provide.
 *
 * These 12 slots cover ~80% of all exercise variable needs.
 */

export interface SlotVocabulary {
  /** Main collection variable name - KEEP EXISTING NAME */
  list_name: string;
  /** Singular item name (item, task, song, product) */
  item_singular: string;
  /** Plural item name (items, tasks, songs, products) */
  item_plural: string;
  /** Primary attribute key (name, title, track) */
  attr_key_1: string;
  /** Secondary attribute key (price, duration, priority) */
  attr_key_2: string;
  /** ID variable name (id, sku, track_id, task_id) */
  id_var: string;
  /** Filename for file exercises (data.txt, inventory.json) */
  filename: string;
  /** File type/extension (txt, json, csv) */
  filetype: string;
  /** User role for examples (admin, guest, user) */
  user_role: string;
  /** Status variable (active, done, playing) */
  status_var: string;
  /** Action verb (add, remove, update, play) */
  action_verb: string;
  /** Entity name for OOP/classes (Task, Item, Song) */
  entity_name: string;
}

/** Standard slot definitions with descriptions */
export const STANDARD_SLOTS: Record<keyof SlotVocabulary, { description: string; examples: string[] }> = {
  list_name: {
    description: 'Main collection variable name (matches existing SkinVars)',
    examples: ['items', 'tasks', 'playlist', 'cart', 'inventory'],
  },
  item_singular: {
    description: 'Singular form of item',
    examples: ['item', 'task', 'song', 'product', 'weapon'],
  },
  item_plural: {
    description: 'Plural form of item',
    examples: ['items', 'tasks', 'songs', 'products', 'weapons'],
  },
  attr_key_1: {
    description: 'Primary attribute/dict key',
    examples: ['name', 'title', 'track', 'product_name'],
  },
  attr_key_2: {
    description: 'Secondary attribute/dict key',
    examples: ['price', 'duration', 'priority', 'quantity'],
  },
  id_var: {
    description: 'ID variable name',
    examples: ['id', 'task_id', 'track_id', 'sku'],
  },
  filename: {
    description: 'Filename for file I/O exercises',
    examples: ['data.txt', 'tasks.json', 'inventory.json'],
  },
  filetype: {
    description: 'File extension/type',
    examples: ['txt', 'json', 'csv'],
  },
  user_role: {
    description: 'User role for examples',
    examples: ['admin', 'guest', 'user', 'player'],
  },
  status_var: {
    description: 'Status variable name',
    examples: ['active', 'done', 'playing', 'pending'],
  },
  action_verb: {
    description: 'Primary action verb',
    examples: ['add', 'remove', 'update', 'play', 'buy'],
  },
  entity_name: {
    description: 'Entity/class name (PascalCase)',
    examples: ['Task', 'Item', 'Song', 'Product'],
  },
};

/** Required slots that every skin must provide (matches existing SkinVars) */
export const REQUIRED_SLOTS: (keyof SlotVocabulary | 'item_examples' | 'record_keys')[] = [
  'list_name',          // Existing required field
  'item_singular',      // Existing required field
  'item_plural',        // Existing required field
  'item_examples',      // Existing required field (array)
  'record_keys',        // Existing required field (array)
];

/** Validate skin vars have minimum required slots */
export function validateSkinVarsHasRequiredSlots(
  vars: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing = REQUIRED_SLOTS.filter(slot => !(slot in vars));
  return { valid: missing.length === 0, missing };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/paths/slot-vocabulary.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/paths/slot-vocabulary.ts tests/unit/paths/slot-vocabulary.test.ts
git commit -m "feat(paths): add standardized slot vocabulary for skin templating

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Define Exercise Role Taxonomy

**Files:**
- Create: `src/lib/paths/roles.ts`
- Test: `tests/unit/paths/roles.test.ts`

**IMPORTANT:** Patterns must match ACTUAL ExercisePattern enum values from `src/lib/curriculum/types.ts`:
- `'construction'` (not 'creation')
- `'mutation'` (not 'append')
- `'query'` (correct)
- `'iteration'` (correct)
- `'filtering'` (correct)
- `'conditional'` (correct)
- `'handling'` (not 'exception')
- `'context'` (not 'context-manager')
- `'file'` (correct)

**Step 1: Write the failing test**

```typescript
// tests/unit/paths/roles.test.ts
import { describe, it, expect } from 'vitest';
import {
  ExerciseRole,
  ROLE_DEFINITIONS,
  roleMatchesBeat,
  inferRoleFromExercise,
} from '@/lib/paths/roles';

describe('Exercise Roles', () => {
  it('defines 8 roles', () => {
    expect(Object.keys(ROLE_DEFINITIONS)).toHaveLength(8);
  });

  it('includes all standard roles', () => {
    const roles: ExerciseRole[] = [
      'create', 'update', 'query', 'transform',
      'display', 'persist', 'guard', 'recover'
    ];
    roles.forEach(role => {
      expect(ROLE_DEFINITIONS[role]).toBeDefined();
    });
  });

  describe('roleMatchesBeat', () => {
    it('matches create role to initialization beats', () => {
      expect(roleMatchesBeat('create', { beat: 1, title: 'Create storage' })).toBe(true);
    });

    it('matches display role to output beats', () => {
      expect(roleMatchesBeat('display', { beat: 5, title: 'Display items' })).toBe(true);
    });
  });

  describe('inferRoleFromExercise', () => {
    // Tests use ACTUAL ExercisePattern enum values

    it('infers create from construction patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-create-empty', pattern: 'construction' })).toBe('create');
    });

    it('infers update from mutation patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-append-item', pattern: 'mutation' })).toBe('update');
    });

    it('infers query from query patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-in-check', pattern: 'query' })).toBe('query');
    });

    it('infers display from iteration patterns', () => {
      expect(inferRoleFromExercise({ slug: 'for-loop-list', pattern: 'iteration' })).toBe('display');
    });

    it('infers transform from filtering patterns', () => {
      expect(inferRoleFromExercise({ slug: 'list-comp-filter', pattern: 'filtering' })).toBe('transform');
    });

    it('infers persist from context patterns', () => {
      expect(inferRoleFromExercise({ slug: 'context-intro', pattern: 'context' })).toBe('persist');
    });

    it('infers guard from conditional patterns', () => {
      expect(inferRoleFromExercise({ slug: 'if-else-basic', pattern: 'conditional' })).toBe('guard');
    });

    it('infers recover from handling patterns', () => {
      expect(inferRoleFromExercise({ slug: 'try-except-basic', pattern: 'handling' })).toBe('recover');
    });

    it('falls back to slug hints when pattern unknown', () => {
      expect(inferRoleFromExercise({ slug: 'list-append-item' })).toBe('update');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/paths/roles.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/paths/roles.ts
/**
 * Exercise role taxonomy for flexible blueprint assignment.
 *
 * Roles describe WHAT an exercise does in a blueprint context,
 * allowing the same exercise to fit multiple blueprints.
 *
 * IMPORTANT: Pattern values must match ExercisePattern enum from
 * src/lib/curriculum/types.ts for correct inference.
 */

export type ExerciseRole =
  | 'create'    // Initialize structures (empty list, dict, class instance)
  | 'update'    // Modify structures (append, set, remove, extend)
  | 'query'     // Read/check structures (membership, get, access)
  | 'transform' // Transform data (comprehensions, map/filter, sort)
  | 'display'   // Output data (loops + print, formatting)
  | 'persist'   // File I/O (read, write, context managers)
  | 'guard'     // Control flow (if/elif/match, validation)
  | 'recover';  // Error handling (try/except/finally, raise)

export interface RoleDefinition {
  name: ExerciseRole;
  description: string;
  /** Patterns from ExercisePattern enum that indicate this role */
  patterns: string[];
  /** Slug substrings that indicate this role (fallback) */
  slugHints: string[];
}

// CRITICAL: Use actual ExercisePattern enum values, not made-up ones!
export const ROLE_DEFINITIONS: Record<ExerciseRole, RoleDefinition> = {
  create: {
    name: 'create',
    description: 'Initialize data structures',
    // Actual enum: 'construction', 'declaration', 'definition', 'assignment'
    patterns: ['construction', 'declaration', 'definition', 'assignment'],
    slugHints: ['create', 'empty', 'init', 'new', 'define'],
  },
  update: {
    name: 'update',
    description: 'Modify data structures',
    // Actual enum: 'mutation'
    patterns: ['mutation'],
    slugHints: ['append', 'add', 'remove', 'update', 'extend', 'insert', 'pop', 'set'],
  },
  query: {
    name: 'query',
    description: 'Read and check data',
    // Actual enum: 'query', 'lookup', 'indexing', 'search'
    patterns: ['query', 'lookup', 'indexing', 'search'],
    slugHints: ['check', 'in', 'get', 'access', 'index', 'contains', 'has', 'find'],
  },
  transform: {
    name: 'transform',
    description: 'Transform data structures',
    // Actual enum: 'transformation', 'mapping', 'filtering'
    patterns: ['transformation', 'mapping', 'filtering'],
    slugHints: ['comp', 'filter', 'map', 'sort', 'transform', 'convert'],
  },
  display: {
    name: 'display',
    description: 'Output and format data',
    // Actual enum: 'iteration', 'output', 'io'
    patterns: ['iteration', 'output', 'io'],
    slugHints: ['loop', 'print', 'display', 'show', 'format', 'enumerate'],
  },
  persist: {
    name: 'persist',
    description: 'File I/O operations',
    // Actual enum: 'file', 'context', 'import'
    patterns: ['file', 'context', 'import'],
    slugHints: ['file', 'read', 'write', 'save', 'load', 'context', 'path'],
  },
  guard: {
    name: 'guard',
    description: 'Control flow and validation',
    // Actual enum: 'conditional', 'branching', 'comparison'
    patterns: ['conditional', 'branching', 'comparison'],
    slugHints: ['if', 'elif', 'else', 'match', 'case', 'validate', 'check'],
  },
  recover: {
    name: 'recover',
    description: 'Error handling',
    // Actual enum: 'handling', 'error-first'
    patterns: ['handling', 'error-first'],
    slugHints: ['try', 'except', 'finally', 'raise', 'error', 'handle'],
  },
};

interface BeatInfo {
  beat: number;
  title: string;
}

/** Check if a role matches a beat's semantic intent */
export function roleMatchesBeat(role: ExerciseRole, beat: BeatInfo): boolean {
  const titleLower = beat.title.toLowerCase();
  const def = ROLE_DEFINITIONS[role];

  // Check if beat title contains role hints
  return def.slugHints.some(hint => titleLower.includes(hint));
}

interface ExerciseInfo {
  slug: string;
  pattern?: string;
}

/** Infer primary role from exercise metadata */
export function inferRoleFromExercise(exercise: ExerciseInfo): ExerciseRole {
  const { slug, pattern } = exercise;
  const slugLower = slug.toLowerCase();
  const patternLower = pattern?.toLowerCase() ?? '';

  // Check each role definition
  for (const [role, def] of Object.entries(ROLE_DEFINITIONS)) {
    // Check pattern match first (more specific)
    if (pattern && def.patterns.some(p => patternLower.includes(p))) {
      return role as ExerciseRole;
    }
    // Fall back to slug hints
    if (def.slugHints.some(hint => slugLower.includes(hint))) {
      return role as ExerciseRole;
    }
  }

  // Default to display (most common fallback)
  return 'display';
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/paths/roles.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/paths/roles.ts tests/unit/paths/roles.test.ts
git commit -m "feat(paths): add exercise role taxonomy for blueprint assignment

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 1: Global Skins System (Tasks 4-8)

### Task 4: Update Skin Type for Global Usage

**Files:**
- Modify: `src/lib/paths/types.ts`
- Test: `tests/unit/paths/types.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to tests/unit/paths/types.test.ts

describe('Global Skin', () => {
  it('allows skins without blueprint restriction', () => {
    const globalSkin: Skin = {
      id: 'fantasy-game',
      title: 'Fantasy Game',
      icon: '⚔️',
      // blueprints is now optional
      vars: {
        collection_var: 'inventory',
        item_singular: 'item',
        item_plural: 'items',
        attr_key_1: 'name',
        attr_key_2: 'rarity',
        id_var: 'item_id',
        filename: 'inventory.json',
        filetype: 'json',
        user_role: 'player',
        status_var: 'equipped',
        action_verb: 'equip',
        entity_name: 'Item',
        item_examples: ['sword', 'potion', 'shield'],
        record_keys: ['name', 'rarity', 'damage'],
      },
      contexts: {},
      dataPack: {
        list_sample: ['sword', 'shield', 'potion'],
        dict_sample: { name: 'Excalibur', rarity: 'legendary', damage: 100 },
        records_sample: [
          { name: 'sword', rarity: 'common', damage: 10 },
          { name: 'shield', rarity: 'rare', damage: 0 },
        ],
        string_samples: ['Quest accepted!', 'Enemy defeated!'],
      },
    };

    expect(globalSkin.blueprints).toBeUndefined();
    expect(globalSkin.dataPack).toBeDefined();
  });

  it('validates data pack structure', () => {
    const pack: SkinDataPack = {
      list_sample: [1, 2, 3],
      dict_sample: { a: 1, b: 2 },
      records_sample: [{ a: 1 }, { a: 2 }],
      string_samples: ['hello', 'world'],
    };

    expect(Array.isArray(pack.list_sample)).toBe(true);
    expect(typeof pack.dict_sample).toBe('object');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/paths/types.test.ts`
Expected: FAIL (SkinDataPack not defined, blueprints required)

**Step 3: Update types**

```typescript
// src/lib/paths/types.ts - Add/modify these types

/**
 * Data pack for predict exercises - provides themed sample data
 */
export interface SkinDataPack {
  /** Sample list for list exercises */
  list_sample: (string | number | boolean)[];
  /** Sample dict for dict exercises */
  dict_sample: Record<string, string | number | boolean>;
  /** Sample records (list of dicts) for iteration exercises */
  records_sample: Record<string, string | number | boolean>[];
  /** Sample strings for string exercises */
  string_samples: string[];
}

/**
 * Extended SkinVars including standardized slots
 */
export interface SkinVars {
  // Core collection slots
  collection_var: string;  // Renamed from list_name
  item_singular: string;
  item_plural: string;

  // Attribute slots
  attr_key_1: string;
  attr_key_2: string;
  id_var: string;

  // File slots
  filename: string;
  filetype: string;

  // Misc slots
  user_role: string;
  status_var: string;
  action_verb: string;
  entity_name: string;

  // Arrays for seeded selection
  item_examples: string[];
  record_keys: string[];

  // Legacy aliases (for backwards compatibility during migration)
  list_name?: string;  // Alias for collection_var

  /** Allow additional custom variables */
  [key: string]: string | string[] | undefined;
}

/**
 * Skin: Global domain theming for exercises
 *
 * Skins are now GLOBAL - they can be applied to ANY blueprint
 * that needs themed variable names and context.
 */
export interface Skin {
  id: string;
  title: string;
  icon: string;
  /** Optional: blueprints this skin is optimized for (hint only, not restriction) */
  blueprints?: string[];
  vars: SkinVars;
  /** Exercise-specific context text (keyed by exercise slug) */
  contexts: Record<string, string>;
  /** Optional: data pack for predict exercises */
  dataPack?: SkinDataPack;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/paths/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/paths/types.ts tests/unit/paths/types.test.ts
git commit -m "feat(paths): make skins global with data packs for predict exercises

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Add New Skins with Extended Vocabulary

**Files:**
- Create: `paths/python/skins/fantasy-game.yaml` (NEW skin in existing directory)
- Create: `paths/python/skins/music-streaming.yaml` (NEW)
- Modify: Existing 5 skins to add new optional slots (attr_key_1, filename, etc.)

**NOTE:** Per Q1 decision, skins stay in `paths/python/skins/` (language-specific).
No separate `global-skins/` directory. "Global" means "usable across all Python blueprints."

**Step 1: Create fantasy-game.yaml in EXISTING skins directory**

```yaml
# paths/python/skins/fantasy-game.yaml
# NOTE: Uses list_name (existing) NOT collection_var (see Fix 1)

id: fantasy-game
title: "Fantasy Game"
icon: "⚔️"
# blueprints is OPTIONAL for global skins - omit to make available to all
# blueprints: [collection-cli-app]  # Uncomment to restrict

vars:
  # REQUIRED existing fields (match current SkinVars interface)
  list_name: inventory          # NOT collection_var - see Fix 1
  item_singular: item
  item_plural: items
  item_examples:
    - "sword"
    - "shield"
    - "potion"
    - "helmet"
    - "bow"
    - "staff"
  record_keys: ["name", "rarity", "damage", "weight"]

  # NEW optional extended slots
  attr_key_1: name
  attr_key_2: rarity
  id_var: item_id
  filename: inventory.json
  filetype: json
  user_role: player
  status_var: equipped
  action_verb: equip
  entity_name: Item

# NEW: Data pack for predict exercises
dataPack:
  list_sample: ["sword", "shield", "potion", "bow"]
  dict_sample:
    name: "Excalibur"
    rarity: "legendary"
    damage: 100
    weight: 5
  records_sample:
    - { name: "sword", rarity: "common", damage: 10 }
    - { name: "shield", rarity: "rare", damage: 0 }
    - { name: "potion", rarity: "common", damage: 0 }
  string_samples:
    - "Quest accepted!"
    - "Enemy defeated!"
    - "Level up!"
    - "Item acquired!"

contexts:
  # Collection exercises
  list-create-empty: "Every adventurer needs an inventory to carry their loot."
  list-append-dynamic: "Add a newly found item to your inventory."
  list-in-check: "Check if you already have this item before picking it up."
  dict-create-values: "Items have stats like damage and rarity."

  # Loop exercises
  for-loop-list: "Display all items in your inventory."
  enumerate-basic: "Number your items so you can select them by index."
  while-loop-basic: "Keep fighting until the enemy is defeated."

  # Comprehension exercises
  list-comp-filter-dynamic: "Filter your inventory to show only rare items."
  list-comp-basic: "Create a list of item names from your inventory."
  dict-comp-basic: "Create a lookup table of item names to damage values."

  # File exercises
  context-intro: "Save your inventory to a file so progress persists."
  file-read-basic: "Load your saved game from a file."
  file-write-basic: "Write your current stats to the save file."

  # Error handling
  try-except-basic: "Handle the case where the save file doesn't exist."
  try-except-specific: "Catch the error when an item slot is empty."

  # Functions
  function-basic: "Create a function to calculate total inventory weight."
  function-args: "Create a function that adds an item with a given quantity."

  # Conditionals
  if-else-basic: "Check if the player has enough gold to buy an item."
  elif-chain: "Determine item quality: legendary, rare, or common."

  # OOP
  class-basic: "Create an Item class to represent inventory items."
  class-method: "Add a method to calculate item value based on rarity."
```

**Step 3: Create music-app.yaml**

```yaml
# paths/global-skins/music-app.yaml

id: music-app
title: "Music Streaming"
icon: "🎵"

vars:
  collection_var: playlist
  item_singular: track
  item_plural: tracks
  attr_key_1: title
  attr_key_2: duration
  id_var: track_id
  filename: playlist.json
  filetype: json
  user_role: listener
  status_var: playing
  action_verb: play
  entity_name: Track

  item_examples:
    - "Bohemian Rhapsody"
    - "Stairway to Heaven"
    - "Hotel California"
    - "Imagine"
    - "Smells Like Teen Spirit"
  record_keys: ["title", "artist", "duration", "album"]

dataPack:
  list_sample: ["rock", "pop", "jazz", "classical"]
  dict_sample:
    title: "Bohemian Rhapsody"
    artist: "Queen"
    duration: 354
    album: "A Night at the Opera"
  records_sample:
    - { title: "Imagine", artist: "John Lennon", duration: 187 }
    - { title: "Yesterday", artist: "The Beatles", duration: 125 }
    - { title: "Purple Rain", artist: "Prince", duration: 520 }
  string_samples:
    - "Now playing..."
    - "Added to queue"
    - "Shuffling playlist"
    - "Repeat mode on"

contexts:
  list-create-empty: "Every music app needs a playlist to store tracks."
  list-append-dynamic: "Add a track to the current playlist."
  list-in-check: "Check if a track is already in the playlist."
  dict-create-values: "Tracks have metadata like artist and duration."
  for-loop-list: "Display all tracks in the playlist."
  enumerate-basic: "Number tracks so users can select by position."
  list-comp-filter-dynamic: "Filter to show only tracks by a specific artist."
  context-intro: "Save the playlist so it persists between sessions."
  try-except-basic: "Handle the case where the playlist file is missing."
  function-basic: "Create a function to calculate total playlist duration."
  if-else-basic: "Check if a track is longer than 5 minutes."
  class-basic: "Create a Track class to represent songs."
```

**Step 4: Create remaining skins (cooking-app, ecommerce, productivity)**

Similar structure - create files with appropriate domain-specific values.

**Step 5: Update validation script**

Modify `scripts/validate-paths.ts` to handle global skins directory:

```typescript
// Add to validate-paths.ts
const GLOBAL_SKINS_DIR = path.join(process.cwd(), 'paths', 'global-skins');

async function loadGlobalSkins(): Promise<Skin[]> {
  const files = await fs.readdir(GLOBAL_SKINS_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml'));
  // ... load and validate
}
```

**Step 6: Commit**

```bash
git add paths/global-skins/*.yaml scripts/validate-paths.ts
git commit -m "feat(paths): add 5 global skins with data packs

- fantasy-game: RPG/gaming domain
- music-app: Music streaming domain
- cooking-app: Recipe/cooking domain
- ecommerce: Shopping/retail domain
- productivity: Task management domain

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Update Loader for Global Skins (Optional blueprints field)

**Files:**
- Modify: `src/lib/paths/loader.ts`
- Modify: `scripts/generate-path-index.ts`
- Test: `tests/unit/paths/loader.test.ts`

**NOTE:** Per Q1, no separate `global-skins/` directory. All skins stay in `paths/python/skins/`.
The change is making `blueprints` field OPTIONAL - skins without it are "global" (usable everywhere).

**Step 1: Write the failing test**

```typescript
// Add to tests/unit/paths/loader.test.ts

describe('Global Skins (no blueprints restriction)', () => {
  it('loads skins with optional blueprints field', async () => {
    const index = await getPathIndex();

    // fantasy-game has NO blueprints field = global
    expect(index.skins.has('fantasy-game')).toBe(true);
  });

  it('skins use list_name (not collection_var) per Fix 1', async () => {
    const index = await getPathIndex();
    const skin = index.skins.get('fantasy-game')!;

    // Uses existing field name for backwards compatibility
    expect(skin.vars.list_name).toBeDefined();
    expect(skin.vars.item_singular).toBeDefined();
  });

  it('global skins are available to ALL exercises', async () => {
    const index = await getPathIndex();

    // Global skins (no blueprints restriction) should map to exercises
    // via a catch-all mechanism
    const skins = index.exerciseToSkins.get('list-create-empty');
    expect(skins?.length).toBeGreaterThan(0);
  });

  it('skins can have data packs', async () => {
    const index = await getPathIndex();
    const skin = index.skins.get('fantasy-game')!;

    expect(skin.dataPack).toBeDefined();
    expect(skin.dataPack!.list_sample).toBeInstanceOf(Array);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/paths/loader.test.ts`
Expected: FAIL (blueprints validation fails)

**Step 3: Update generate-path-index.ts**

```typescript
// scripts/generate-path-index.ts - Allow optional blueprints field

async function loadSkins(): Promise<Skin[]> {
  // ... existing code ...
  for (const file of yamlFiles) {
    const data = yaml.load(content) as Skin;

    // CHANGED: blueprints is now OPTIONAL
    // Skins without blueprints are "global" (available to all)
    if (!data.id || !data.title || !data.vars) {
      console.warn(`  Warning: Invalid skin in ${file}: missing required fields`);
      continue;
    }

    skins.push(data);
    }
  } catch {
    // Global skins directory may not exist yet
  }

  return skins;
}

export async function buildPathIndex(
  blueprints: Blueprint[],
  skins: Skin[],
  globalSkins: Skin[]
): Promise<PathIndex> {
  // Merge blueprint-specific and global skins
  const allSkins = [...skins, ...globalSkins];

  // ... rest of index building
  // For global skins (no blueprints restriction), make them compatible with all exercises
}
```

**Step 4: Run test to verify it passes**

**Step 5: Commit**

---

### Task 7: Update Skin Selector for Global Skins

**Files:**
- Modify: `src/lib/paths/selector.ts`
- Test: `tests/unit/paths/selector.test.ts`

**Purpose:** Update selector to prefer global skins that match exercise domain, with fallback to any global skin.

---

### Task 8: Migrate Existing Skins to New Structure

**Files:**
- Modify: `paths/python/skins/*.yaml` (5 files)

**Purpose:** Add missing slots to existing skins for backwards compatibility.

---

## Phase 2: Mega-Blueprints (Tasks 9-16)

### Task 9: Expand CLI Collection App Blueprint

**Files:**
- Modify: `paths/python/blueprints/collection-cli-app.yaml`

**NOTE:** Per Fix 5, we KEEP the original ID `collection-cli-app` to avoid breaking existing skin references.
The expansion adds more beats but preserves the ID. DO NOT rename file or change ID.

**Purpose:** Expand from 8 beats to ~20 beats covering:
- foundations (input, variables)
- collections (lists, dicts)
- loops (for, enumerate, filtering)
- conditionals (validation, branching)
- functions (helpers, organization)
- error-handling (try/except)
- modules-files (save/load)

```yaml
# paths/python/blueprints/collection-cli-app.yaml
# KEEP ORIGINAL ID to preserve skin references (see Fix 5)

id: collection-cli-app
title: "Build a CLI Collection App"
description: "Build a complete command-line application from scratch"
difficulty: beginner
concepts: [foundations, collections, loops, conditionals, functions, error-handling, modules-files]

beats:
  # Act 1: Setup & Storage (Beats 1-5)
  - beat: 1
    title: "Initialize storage"
    exercise: list-create-empty
    roles: [create]
    sideQuests: [variable-assign-string, variable-assign-int]

  - beat: 2
    title: "Get user input"
    exercise: input-basic
    roles: [create]
    sideQuests: [input-with-prompt, input-convert-int]

  - beat: 3
    title: "Add to collection"
    exercise: list-append-dynamic
    roles: [update]
    sideQuests: [list-extend, list-insert]

  - beat: 4
    title: "Prevent duplicates"
    exercise: list-in-check
    roles: [query, guard]
    sideQuests: [list-not-in, list-count]

  - beat: 5
    title: "Store richer data"
    exercise: dict-create-values
    roles: [create]
    sideQuests: [dict-from-keys, dict-update]

  # Act 2: Display & Iteration (Beats 6-10)
  - beat: 6
    title: "Display all items"
    exercise: for-loop-list
    roles: [display]
    sideQuests: [for-loop-dict, for-loop-string]

  - beat: 7
    title: "Number the items"
    exercise: enumerate-basic
    roles: [display]
    sideQuests: [enumerate-start, enumerate-unpack]

  - beat: 8
    title: "Format output nicely"
    exercise: fstring-basic
    roles: [display]
    sideQuests: [fstring-expressions, fstring-format-spec]

  - beat: 9
    title: "Sort the display"
    exercise: sorted-basic
    roles: [transform, display]
    sideQuests: [sorted-reverse, sorted-key]

  - beat: 10
    title: "Filter results"
    exercise: list-comp-filter-dynamic
    roles: [transform]
    sideQuests: [list-comp-basic, list-comp-conditional]

  # Act 3: Logic & Validation (Beats 11-14)
  - beat: 11
    title: "Validate input"
    exercise: if-else-basic
    roles: [guard]
    sideQuests: [if-only, if-elif-else]

  - beat: 12
    title: "Handle commands"
    exercise: elif-chain
    roles: [guard]
    sideQuests: [match-basic, nested-if]

  - beat: 13
    title: "Handle errors gracefully"
    exercise: try-except-basic
    roles: [recover]
    sideQuests: [try-except-specific, try-except-else]

  - beat: 14
    title: "Clean up resources"
    exercise: try-finally
    roles: [recover]
    sideQuests: [try-except-finally]

  # Act 4: Organization & Persistence (Beats 15-20)
  - beat: 15
    title: "Extract helper function"
    exercise: function-basic
    roles: [create]
    sideQuests: [function-args, function-return]

  - beat: 16
    title: "Add default parameters"
    exercise: function-default-args
    roles: [create]
    sideQuests: [function-kwargs, function-args-kwargs]

  - beat: 17
    title: "Save to file"
    exercise: context-intro
    roles: [persist]
    sideQuests: [file-write-lines, file-write-json]

  - beat: 18
    title: "Load from file"
    exercise: file-read-basic
    roles: [persist]
    sideQuests: [file-read-lines, file-read-json]

  - beat: 19
    title: "Use pathlib"
    exercise: pathlib-basic
    roles: [persist]
    sideQuests: [pathlib-exists, pathlib-mkdir]

  - beat: 20
    title: "Add main guard"
    exercise: main-guard
    roles: [persist]
    sideQuests: [import-module, import-from]
```

---

### Task 10: Design Data Processor Blueprint

**Files:**
- Create: `paths/python/blueprints/data-processor.yaml`

**Purpose:** Log/data cleaning pipeline covering:
- strings (parsing, slicing, methods)
- loops (iteration, filtering)
- comprehensions (transformation)
- numbers (aggregation)
- modules-files (read/write)
- error-handling (bad data)

---

### Task 11: Design Text Adventure Blueprint

**Files:**
- Create: `paths/python/blueprints/text-adventure.yaml`

**Purpose:** Game state + commands covering:
- strings (commands, parsing)
- conditionals (branching)
- loops (game loop)
- collections (state, inventory)
- functions (actions)
- oop (entities, optional)

---

### Task 12: Design Module Library Blueprint

**Files:**
- Create: `paths/python/blueprints/module-library.yaml`

**Purpose:** Reusable module design covering:
- modules-files (imports, main guard)
- functions (API design)
- oop (dataclasses, classes)
- error-handling (robust API)

---

### Task 13: Update Blueprint Loader for Side-Quests

**Files:**
- Modify: `src/lib/paths/types.ts`
- Modify: `src/lib/paths/loader.ts`
- Test: `tests/unit/paths/loader.test.ts`

**Purpose:** Add side-quest parsing and storage in PathIndex.

---

### Task 14: Create Blueprint Coverage Script

**Files:**
- Create: `scripts/blueprint-coverage.ts`

**Purpose:** Report which exercises are covered by blueprints and which remain orphaned.

---

### Task 15: Add Blueprint Validation

**Files:**
- Modify: `scripts/validate-paths.ts`

**Purpose:** Validate:
- All beat exercises exist
- No duplicate exercises within blueprint
- Beat numbering is sequential
- Side-quest exercises exist

---

### Task 16: Commit Mega-Blueprints

```bash
git add paths/python/blueprints/*.yaml
git commit -m "feat(paths): add 4 mega-blueprints covering all 11 concepts

- cli-organizer: 20 beats (foundations → files)
- data-processor: 18 beats (strings → error-handling)
- text-adventure: 15 beats (state → branching)
- module-library: 12 beats (modules → oop)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Exercise Template Migration (Tasks 17-24)

### Task 17: Identify High-Impact Conversion Targets

**Files:**
- Create: `scripts/identify-template-candidates.ts`

**Purpose:** Scan exercises for hardcoded names that could become slots:
- `items`, `d`, `data`, `lst` → `{{collection_var}}`
- `"apple"`, `"name"`, `"Alice"` → `{{item_example}}`
- `"data.txt"` → `{{filename}}`

---

### Task 18: Create Migration Script

**Files:**
- Create: `scripts/migrate-exercise-to-template.ts`

**Purpose:** Semi-automated conversion of static exercises to templates.

---

### Task 19: Migrate Collections Exercises

**Files:**
- Modify: `exercises/python/collections.yaml`

**Purpose:** Convert 77 collection exercises to use slots where applicable.

---

### Task 20: Migrate Loops Exercises

**Files:**
- Modify: `exercises/python/loops.yaml`

**Purpose:** Convert 76 loop exercises.

---

### Task 21: Migrate Strings Exercises

**Files:**
- Modify: `exercises/python/strings.yaml`

**Purpose:** Convert 51 string exercises.

---

### Task 22: Migrate Remaining Exercises

**Files:**
- Modify: `exercises/python/conditionals.yaml`
- Modify: `exercises/python/functions.yaml`
- Modify: `exercises/python/comprehensions.yaml`

---

### Task 23: Validate Migrated Exercises

Run: `pnpm validate:exercises && pnpm validate:dynamic`

---

### Task 24: Update Exercise Count Metrics

Update CLAUDE.md and docs with new dynamic exercise counts.

---

## Phase 4: Integration & Testing (Tasks 25-32)

### Task 25: Update Session Hook for Multi-Blueprint

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`
- Test: `tests/integration/session/multi-blueprint.test.ts`

**Purpose:** Handle sessions with exercises from multiple blueprints.

---

### Task 26: Add Role-Based Exercise Selection

**Files:**
- Modify: `src/lib/session/select-exercise.ts`
- Test: `tests/unit/session/role-selection.test.ts`

**Purpose:** Select exercises by role for blueprint beats.

---

### Task 27: Integrate Skin Vars into Rendering

**Files:**
- Modify: `src/lib/generators/render.ts`
- Test: `tests/unit/generators/render-with-skins.test.ts`

**Purpose:** Ensure skin vars are properly merged with generator params during exercise rendering.

---

### Task 28: Update BeatHeader for Side-Quests

**Files:**
- Modify: `src/components/exercise/BeatHeader.tsx`
- Test: `tests/unit/components/BeatHeader.test.tsx`

**Purpose:** Show "Side Quest" indicator for non-main-beat exercises.

---

### Task 29: Add Data Pack Rendering for Predict

**Files:**
- Modify: `src/lib/generators/render.ts`
- Test: `tests/unit/generators/render-predict.test.ts`

**Purpose:** Use skin data packs for predict exercise sample data.

---

### Task 30: Add Blueprint Progress Component

**Files:**
- Create: `src/components/session/BlueprintProgress.tsx`
- Test: `tests/unit/components/BlueprintProgress.test.tsx`

**Purpose:** Visual progress indicator showing current position in blueprint.

---

### Task 31: E2E Tests for Multi-Blueprint Sessions

**Files:**
- Create: `tests/e2e/multi-blueprint-session.spec.ts`

---

### Task 32: E2E Tests for Skin-Driven Answers

**Files:**
- Create: `tests/e2e/skin-driven-answers.spec.ts`

**Purpose:** Verify that answers actually change based on skin selection.

---

## Phase 5: Cleanup & Documentation (Tasks 33-36)

### Task 33: Remove Legacy Code

**Files:**
- Review: `src/lib/paths/*.ts` for dead code
- Review: Test files for obsolete tests

**Purpose:** Clean up any code paths that are no longer used.

---

### Task 34: Update Validation Scripts

**Files:**
- Modify: `scripts/validate-paths.ts`

**Purpose:** Full validation of new structure.

---

### Task 35: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/EXERCISES.md`
- Update Obsidian docs

---

### Task 36: Final Audit

Run: `bash scripts/audit-blueprint-coverage.sh > docs/audit-final.txt`

Compare with baseline to verify coverage improvement.

---

## Summary

**Before:**
- 510 exercises, 1 blueprint (8 beats), 5 blueprint-specific skins
- 97 dynamic exercises (~19%)
- Only 8 exercises in blueprints (~1.6%)

**After:**
- 510 exercises, 4 mega-blueprints (~65 beats + side-quests)
- ~300+ template-enabled exercises (~60%)
- ~400 exercises in blueprints as main beats or side-quests (~80%)
- 5+ global skins with data packs

**Key Deliverables:**
1. Standardized 12-slot vocabulary
2. 8-role exercise taxonomy
3. 4 mega-blueprints with side-quest system
4. 5 global skins with data packs
5. ~200 exercises converted to templates
6. Full E2E test coverage

---

## Execution Notes

**Recommended execution order:**
1. Phase 0 (preparation) - establishes baseline
2. Phase 1 (global skins) - infrastructure for theming
3. Phase 2 (mega-blueprints) - content organization
4. Phase 3 (template migration) - content transformation
5. Phase 4 (integration) - wire it all together
6. Phase 5 (cleanup) - polish and document

**Risk mitigation:**
- Each phase can be deployed independently
- Existing system continues to work during migration
- Backwards compatibility maintained for legacy skins
