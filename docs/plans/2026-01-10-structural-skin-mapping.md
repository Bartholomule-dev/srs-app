# Structural Skin Mapping Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Formalize TinyStore as an internal design schema while keeping skins as the dynamic presentation layer, ensuring all skins define consistent structural variables and have quality context text.

**Architecture:** TinyStore defines the canonical entity relationships (customers, products, orders) that curriculum designers use when authoring exercises. Skins map these concepts to domain-specific names (tasks, songs, recipes) through a documented structural mapping. The system validates that skins provide all required structural variables.

**Tech Stack:** TypeScript, YAML, Vitest

---

## Current State Analysis

| Metric | Current | Target |
|--------|---------|--------|
| Skins with placeholder contexts | 488 total (~50 each in 10 skins) | 0 |
| Generators using TinyStore lexicon | 7/38 | 15+ |
| Required structural vars enforced | 3 | 8 |
| Structural mapping documented | No | Yes |

---

## Task 1: Define Structural Variable Requirements

**Files:**
- Modify: `src/lib/paths/types.ts:43-77`
- Modify: `docs/plans/2026-01-11-phase2-narrative-bible.md`

**Step 1: Update SkinVars type to document required structural fields**

Add JSDoc comments explaining the TinyStore mapping for each field:

```typescript
/**
 * Variable values provided by a skin for Mustache templating.
 *
 * These map to TinyStore's canonical entities:
 * - list_name → products/orders/customers collection
 * - item_singular → product/order/customer
 * - entity_name → Product/Order/Customer (class name)
 * - record_keys → product_id, name, price / order_id, total, status
 */
export interface SkinVars {
  // === REQUIRED: Core collection variables ===

  /** Collection variable name. TinyStore: products, orders, customers */
  list_name: string;
  /** Singular item. TinyStore: product, order, customer */
  item_singular: string;
  /** Plural items. TinyStore: products, orders, customers */
  item_plural: string;
  /** Example item values for string exercises */
  item_examples: string[];
  /** Dict/record keys. TinyStore: ["product_id", "name", "price"] */
  record_keys: string[];

  // === REQUIRED: Extended structural variables ===

  /** Primary attribute key. TinyStore: price, total, rating */
  attr_key_1: string;
  /** Secondary attribute key. TinyStore: quantity, status, tier */
  attr_key_2: string;
  /** ID field name. TinyStore: product_id, order_id, customer_id */
  id_var: string;

  // === OPTIONAL: Domain-specific variables ===

  /** Filename for file I/O exercises */
  filename?: string;
  /** File type (json, csv, txt) */
  filetype?: string;
  /** User role in the domain (player, admin, chef) */
  user_role?: string;
  /** Status variable name (equipped, completed, active) */
  status_var?: string;
  /** Action verb for the domain (equip, complete, add) */
  action_verb?: string;
  /** Entity class name for OOP (Equipment, Task, Product) */
  entity_name?: string;

  /** Allow additional custom variables */
  [key: string]: string | string[] | undefined;
}
```

**Step 2: Verify types compile**

Run: `pnpm typecheck`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/lib/paths/types.ts
git commit -m "docs(types): add TinyStore mapping documentation to SkinVars"
```

---

## Task 2: Add Structural Variable Validation

**Files:**
- Modify: `scripts/validate-paths.ts:111-142`
- Create: `tests/unit/paths/structural-vars.test.ts`

**Step 1: Write failing test for structural variable validation**

```typescript
// tests/unit/paths/structural-vars.test.ts
import { describe, it, expect } from 'vitest';
import { loadSkins } from '@/lib/paths/loader';

const REQUIRED_STRUCTURAL_VARS = [
  'list_name',
  'item_singular',
  'item_plural',
  'item_examples',
  'record_keys',
  'attr_key_1',
  'attr_key_2',
  'id_var',
] as const;

describe('Skin Structural Variables', () => {
  it('all skins have required structural variables', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      for (const varName of REQUIRED_STRUCTURAL_VARS) {
        const value = skin.vars[varName];
        if (value === undefined || value === null || value === '') {
          issues.push(`${skin.id}: missing ${varName}`);
        }
      }
    }

    expect(issues, `Missing structural vars:\n${issues.join('\n')}`).toHaveLength(0);
  });

  it('item_examples has at least 3 values', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      const examples = skin.vars.item_examples;
      if (!Array.isArray(examples) || examples.length < 3) {
        issues.push(`${skin.id}: item_examples needs 3+ values, has ${examples?.length ?? 0}`);
      }
    }

    expect(issues, `Insufficient item_examples:\n${issues.join('\n')}`).toHaveLength(0);
  });

  it('record_keys has at least 2 values', async () => {
    const skins = await loadSkins();
    const issues: string[] = [];

    for (const skin of skins) {
      const keys = skin.vars.record_keys;
      if (!Array.isArray(keys) || keys.length < 2) {
        issues.push(`${skin.id}: record_keys needs 2+ values, has ${keys?.length ?? 0}`);
      }
    }

    expect(issues, `Insufficient record_keys:\n${issues.join('\n')}`).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails (skins missing new required vars)**

Run: `pnpm test tests/unit/paths/structural-vars.test.ts`
Expected: FAIL (skins missing attr_key_1, attr_key_2, id_var)

**Step 3: Add validation to validate-paths.ts**

```typescript
// Add after line 119 in validate-paths.ts
const REQUIRED_STRUCTURAL_VARS = [
  'list_name',
  'item_singular',
  'item_plural',
  'item_examples',
  'record_keys',
  'attr_key_1',
  'attr_key_2',
  'id_var',
];

for (const skin of skins) {
  // Check for required structural vars
  for (const v of REQUIRED_STRUCTURAL_VARS) {
    const value = skin.vars[v];
    if (value === undefined || value === null || value === '') {
      console.error(`  ✗ Skin ${skin.id}: missing structural var ${v}`);
      errors++;
    }
  }

  // Check array lengths
  if (!Array.isArray(skin.vars.item_examples) || skin.vars.item_examples.length < 3) {
    console.error(`  ✗ Skin ${skin.id}: item_examples needs 3+ values`);
    errors++;
  }
  if (!Array.isArray(skin.vars.record_keys) || skin.vars.record_keys.length < 2) {
    console.error(`  ✗ Skin ${skin.id}: record_keys needs 2+ values`);
    errors++;
  }
}
```

**Step 4: Run validation to see current failures**

Run: `pnpm validate:paths`
Expected: FAIL with list of skins missing structural vars

**Step 5: Commit validation code (tests will fail until Task 3)**

```bash
git add scripts/validate-paths.ts tests/unit/paths/structural-vars.test.ts
git commit -m "test: add structural variable validation for skins"
```

---

## Task 3: Update All Skins with Required Structural Variables

**Files:**
- Modify: All 22 files in `paths/python/skins/*.yaml`

**Step 1: Create skin update script**

```typescript
// scripts/add-structural-vars.ts
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

const SKINS_DIR = join(process.cwd(), 'paths/python/skins');

// Default mappings based on skin domain
const SKIN_STRUCTURAL_DEFAULTS: Record<string, { attr_key_1: string; attr_key_2: string; id_var: string }> = {
  'task-manager': { attr_key_1: 'priority', attr_key_2: 'due_date', id_var: 'task_id' },
  'shopping-cart': { attr_key_1: 'price', attr_key_2: 'quantity', id_var: 'product_id' },
  'playlist-app': { attr_key_1: 'duration', attr_key_2: 'artist', id_var: 'track_id' },
  'recipe-book': { attr_key_1: 'prep_time', attr_key_2: 'servings', id_var: 'recipe_id' },
  'game-inventory': { attr_key_1: 'power', attr_key_2: 'rarity', id_var: 'item_id' },
  'calculator-app': { attr_key_1: 'value', attr_key_2: 'operation', id_var: 'calc_id' },
  'hello-python': { attr_key_1: 'value', attr_key_2: 'type', id_var: 'var_id' },
  'pet-simulator': { attr_key_1: 'hunger', attr_key_2: 'happiness', id_var: 'pet_id' },
  'fantasy-game': { attr_key_1: 'power', attr_key_2: 'rarity', id_var: 'item_id' },
  'music-app': { attr_key_1: 'duration', attr_key_2: 'artist', id_var: 'track_id' },
  'dungeon-crawler': { attr_key_1: 'damage', attr_key_2: 'defense', id_var: 'hero_id' },
  'api-guardian': { attr_key_1: 'status_code', attr_key_2: 'latency', id_var: 'request_id' },
  'batch-processor': { attr_key_1: 'size', attr_key_2: 'status', id_var: 'record_id' },
  'config-manager': { attr_key_1: 'value', attr_key_2: 'type', id_var: 'config_id' },
  'csv-parser': { attr_key_1: 'column', attr_key_2: 'row', id_var: 'record_id' },
  'devops-toolkit': { attr_key_1: 'cpu', attr_key_2: 'memory', id_var: 'server_id' },
  'log-analyzer': { attr_key_1: 'level', attr_key_2: 'timestamp', id_var: 'log_id' },
  'markdown-editor': { attr_key_1: 'word_count', attr_key_2: 'modified', id_var: 'doc_id' },
  'sdk-builder': { attr_key_1: 'version', attr_key_2: 'method', id_var: 'endpoint_id' },
  'signup-form': { attr_key_1: 'required', attr_key_2: 'type', id_var: 'field_id' },
  'user-database': { attr_key_1: 'role', attr_key_2: 'created', id_var: 'user_id' },
  'api-client': { attr_key_1: 'method', attr_key_2: 'timeout', id_var: 'endpoint_id' },
};

async function main() {
  const files = await readdir(SKINS_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml'));

  for (const file of yamlFiles) {
    const filePath = join(SKINS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const skin = yaml.load(content) as Record<string, unknown>;
    const skinId = skin.id as string;
    const vars = skin.vars as Record<string, unknown>;

    // Add missing structural vars
    const defaults = SKIN_STRUCTURAL_DEFAULTS[skinId];
    if (defaults) {
      if (!vars.attr_key_1) vars.attr_key_1 = defaults.attr_key_1;
      if (!vars.attr_key_2) vars.attr_key_2 = defaults.attr_key_2;
      if (!vars.id_var) vars.id_var = defaults.id_var;
    }

    // Write back
    const newContent = yaml.dump(skin, { lineWidth: 120, quotingType: '"' });
    await writeFile(filePath, newContent, 'utf-8');
    console.log(`Updated ${file}`);
  }
}

main().catch(console.error);
```

**Step 2: Run the update script**

Run: `npx tsx scripts/add-structural-vars.ts`
Expected: "Updated X.yaml" for each skin file

**Step 3: Run validation to verify all pass**

Run: `pnpm validate:paths`
Expected: PASS

**Step 4: Run structural vars test**

Run: `pnpm test tests/unit/paths/structural-vars.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add paths/python/skins/*.yaml scripts/add-structural-vars.ts
git commit -m "feat(skins): add required structural variables to all skins"
```

---

## Task 4: Add Placeholder Context Detection

**Files:**
- Modify: `scripts/validate-paths.ts`
- Create: `tests/unit/paths/context-quality.test.ts`

**Step 1: Write failing test for placeholder detection**

```typescript
// tests/unit/paths/context-quality.test.ts
import { describe, it, expect } from 'vitest';
import { loadSkins } from '@/lib/paths/loader';

const PLACEHOLDER_PATTERNS = [
  /Use this step in the .* workflow/i,
  /\[TODO\]/i,
  /PLACEHOLDER/i,
];

describe('Skin Context Quality', () => {
  it('no contexts contain placeholder text', async () => {
    const skins = await loadSkins();
    const placeholders: string[] = [];

    for (const skin of skins) {
      for (const [exercise, context] of Object.entries(skin.contexts)) {
        for (const pattern of PLACEHOLDER_PATTERNS) {
          if (pattern.test(context)) {
            placeholders.push(`${skin.id}:${exercise}`);
            break;
          }
        }
      }
    }

    expect(
      placeholders.length,
      `Found ${placeholders.length} placeholder contexts:\n${placeholders.slice(0, 20).join('\n')}${placeholders.length > 20 ? '\n...' : ''}`
    ).toBe(0);
  });

  it('all contexts are at least 20 characters', async () => {
    const skins = await loadSkins();
    const short: string[] = [];

    for (const skin of skins) {
      for (const [exercise, context] of Object.entries(skin.contexts)) {
        if (context.length < 20) {
          short.push(`${skin.id}:${exercise} (${context.length} chars)`);
        }
      }
    }

    expect(short, `Short contexts:\n${short.join('\n')}`).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails (488 placeholders)**

Run: `pnpm test tests/unit/paths/context-quality.test.ts`
Expected: FAIL with count of placeholder contexts

**Step 3: Add placeholder detection to validate-paths.ts**

```typescript
// Add after skin structural var validation
const PLACEHOLDER_PATTERNS = [
  /Use this step in the .* workflow/i,
  /\[TODO\]/i,
  /PLACEHOLDER/i,
];

let placeholderCount = 0;
for (const skin of skins) {
  for (const [exercise, context] of Object.entries(skin.contexts)) {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(context)) {
        placeholderCount++;
        // Only warn, don't error - we'll fix these incrementally
        if (placeholderCount <= 10) {
          console.warn(`  ⚠ Skin ${skin.id}: placeholder context for '${exercise}'`);
        }
        break;
      }
    }
  }
}
if (placeholderCount > 10) {
  console.warn(`  ⚠ ... and ${placeholderCount - 10} more placeholder contexts`);
}
if (placeholderCount > 0) {
  console.warn(`  ⚠ Total: ${placeholderCount} placeholder contexts need real text`);
}
```

**Step 4: Run validation to see placeholder count**

Run: `pnpm validate:paths`
Expected: Warnings showing ~488 placeholder contexts

**Step 5: Commit**

```bash
git add scripts/validate-paths.ts tests/unit/paths/context-quality.test.ts
git commit -m "test: add placeholder context detection (warns only)"
```

---

## Task 5: Create Context Generation Script

**Files:**
- Create: `scripts/generate-contexts.ts`

This script uses exercise metadata to generate domain-appropriate context text.

**Step 1: Create the context generation script**

```typescript
// scripts/generate-contexts.ts
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import yaml from 'js-yaml';

const SKINS_DIR = join(process.cwd(), 'paths/python/skins');
const EXERCISES_DIR = join(process.cwd(), 'exercises/python');

interface Exercise {
  slug: string;
  title: string;
  objective: string;
  concept: string;
  subconcept: string;
}

// Load all exercises
async function loadExercises(): Promise<Map<string, Exercise>> {
  const exercises = new Map<string, Exercise>();
  const files = await readdir(EXERCISES_DIR);

  for (const file of files.filter(f => f.endsWith('.yaml'))) {
    const content = await readFile(join(EXERCISES_DIR, file), 'utf-8');
    const data = yaml.load(content) as { exercises: Exercise[] };
    for (const ex of data.exercises || []) {
      exercises.set(ex.slug, ex);
    }
  }
  return exercises;
}

// Generate context based on skin domain and exercise
function generateContext(skinId: string, skinVars: Record<string, unknown>, exercise: Exercise): string {
  const { list_name, item_singular, entity_name, action_verb, user_role } = skinVars as {
    list_name: string;
    item_singular: string;
    entity_name?: string;
    action_verb?: string;
    user_role?: string;
  };

  // Context templates based on subconcept patterns
  const templates: Record<string, string> = {
    'lists': `Manage the ${list_name} collection for your ${entity_name || item_singular} data.`,
    'dicts': `Store ${item_singular} data with key-value pairs for quick lookup.`,
    'for': `Process each ${item_singular} in the ${list_name} one at a time.`,
    'iteration': `Iterate through ${list_name} with position tracking.`,
    'if-else': `Make decisions based on ${item_singular} properties.`,
    'elif-chains': `Categorize ${list_name} into multiple groups.`,
    'ternary': `Choose between ${item_singular} options in a single line.`,
    'try-except': `Handle errors gracefully when working with ${item_singular} data.`,
    'raising': `Signal problems with invalid ${item_singular} data.`,
    'finally': `Ensure ${item_singular} resources are always cleaned up.`,
    'fn-basics': `Create reusable ${item_singular} operations.`,
    'lambda': `Define quick transformations for ${list_name}.`,
    'arguments': `Customize ${item_singular} processing with parameters.`,
    'list-comp': `Transform ${list_name} efficiently in one line.`,
    'dict-comp': `Build ${item_singular} lookups from data.`,
    'classes': `Define ${entity_name || item_singular} structure as a class.`,
    'methods': `Add behavior to your ${entity_name || item_singular} class.`,
    'reading': `Load ${list_name} from a saved file.`,
    'writing': `Save ${list_name} to a file for later.`,
    'pathlib': `Manage file paths for ${item_singular} storage.`,
    'fstrings': `Format ${item_singular} data for display.`,
    'string-methods': `Process ${item_singular} text values.`,
    'slicing': `Extract portions of ${item_singular} data.`,
  };

  // Use subconcept template or fall back to objective-based
  const template = templates[exercise.subconcept];
  if (template) {
    return template;
  }

  // Fall back to rephrasing the objective
  return `${exercise.objective.replace(/^[A-Z]/, c => c.toLowerCase())} for ${list_name}.`;
}

async function main() {
  const exercises = await loadExercises();
  const skinFiles = await readdir(SKINS_DIR);

  let updated = 0;
  let skipped = 0;

  for (const file of skinFiles.filter(f => f.endsWith('.yaml'))) {
    const filePath = join(SKINS_DIR, file);
    const content = await readFile(filePath, 'utf-8');
    const skin = yaml.load(content) as { id: string; vars: Record<string, unknown>; contexts: Record<string, string> };

    let changed = false;

    for (const [slug, context] of Object.entries(skin.contexts)) {
      // Check if placeholder
      if (/Use this step in the .* workflow/i.test(context)) {
        const exercise = exercises.get(slug);
        if (exercise) {
          skin.contexts[slug] = generateContext(skin.id, skin.vars, exercise);
          changed = true;
          updated++;
        } else {
          skipped++;
        }
      }
    }

    if (changed) {
      const newContent = yaml.dump(skin, { lineWidth: 120, quotingType: '"' });
      await writeFile(filePath, newContent, 'utf-8');
      console.log(`Updated contexts in ${file}`);
    }
  }

  console.log(`\nUpdated ${updated} contexts, skipped ${skipped} (exercise not found)`);
}

main().catch(console.error);
```

**Step 2: Run the script**

Run: `npx tsx scripts/generate-contexts.ts`
Expected: "Updated contexts in X.yaml" messages, ~488 updated

**Step 3: Run context quality test**

Run: `pnpm test tests/unit/paths/context-quality.test.ts`
Expected: PASS (or significantly fewer failures)

**Step 4: Manual review and refinement**

Review a sample of generated contexts in a few skins to ensure quality.

**Step 5: Commit**

```bash
git add paths/python/skins/*.yaml scripts/generate-contexts.ts
git commit -m "feat(skins): replace placeholder contexts with generated domain text"
```

---

## Task 6: Update Narrative Bible Documentation

**Files:**
- Modify: `docs/plans/2026-01-11-phase2-narrative-bible.md`

**Step 1: Add Skin Authoring Guide section**

Add the following section at the end of the file:

```markdown
## Skin Authoring Guide

### Purpose

Skins translate TinyStore's canonical entities into domain-specific names while maintaining the same structural relationships. This allows exercises to feel contextually relevant while the underlying learning progression stays consistent.

### Required Structural Variables

Every skin MUST define these variables that map to TinyStore concepts:

| Variable | TinyStore Concept | Example (task-manager) |
|----------|-------------------|------------------------|
| `list_name` | products/orders/customers | tasks |
| `item_singular` | product/order/customer | task |
| `item_plural` | products/orders/customers | tasks |
| `item_examples` | ["mug", "notebook", "lamp"] | ["buy groceries", "call mom"] |
| `record_keys` | ["product_id", "name", "price"] | ["title", "done", "priority"] |
| `attr_key_1` | price, total, rating | priority |
| `attr_key_2` | quantity, status, tier | due_date |
| `id_var` | product_id, order_id | task_id |

### Structural Consistency

The skin's domain should support these patterns:

1. **Collection of records**: `list_name` contains multiple `item_singular` items
2. **Record with ID**: Each item has an `id_var` for unique identification
3. **Numeric/Status attributes**: `attr_key_1` and `attr_key_2` for comparison/filtering
4. **File persistence**: `filename` for saving/loading the collection

### Context Text Guidelines

Each context should:
- Be 20-80 characters
- Reference the skin's domain terms
- Explain WHY this step matters in the workflow
- Avoid generic phrases like "Use this step" or "TODO"

Good: "Save tasks to a file so they persist between sessions."
Bad: "Use this step in the Task Manager workflow: File Write."

### Validation

Run `pnpm validate:paths` to check:
- All required structural variables are present
- No placeholder contexts remain
- Context text meets minimum length
```

**Step 2: Commit**

```bash
git add docs/plans/2026-01-11-phase2-narrative-bible.md
git commit -m "docs: add skin authoring guide to narrative bible"
```

---

## Task 7: Expand Generator TinyStore Usage

**Files:**
- Modify: `src/lib/generators/definitions/list-values.ts`
- Modify: `src/lib/generators/definitions/dict-values.ts`
- Modify: `src/lib/generators/definitions/comp-mapping.ts`
- Modify: `src/lib/generators/definitions/comp-filter.ts`

**Step 1: Update list-values generator to use TinyStore product names**

```typescript
// At top of file
import { tinyStoreLexicon } from '../tinystore-data';

// Replace hardcoded word lists with:
const WORD_POOL = tinyStoreLexicon.productNames;
```

**Step 2: Update dict-values generator**

Use `tinyStoreDatasets.small.products` for sample dict data.

**Step 3: Update comp-mapping and comp-filter generators**

Use TinyStore lexicon for variable names and sample values.

**Step 4: Run generator tests**

Run: `pnpm test tests/unit/generators/`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/*.ts
git commit -m "feat(generators): expand TinyStore lexicon usage"
```

---

## Task 8: Final Validation and Cleanup

**Files:**
- Run all validation scripts
- Update CLAUDE.md if needed

**Step 1: Run all validation**

```bash
pnpm validate:exercises
pnpm validate:paths
pnpm validate:curriculum
pnpm test
```

Expected: All pass

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Update CLAUDE.md milestones**

Add entry for this work in the Completed Milestones section.

**Step 4: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: add structural skin mapping to milestones"
```

---

## Summary

| Task | Files Changed | Outcome |
|------|---------------|---------|
| 1 | types.ts | SkinVars documented with TinyStore mapping |
| 2 | validate-paths.ts, tests | Structural var validation added |
| 3 | 22 skin YAML files | All skins have required vars |
| 4 | validate-paths.ts, tests | Placeholder detection added |
| 5 | 22 skin YAML files | 488 placeholders replaced |
| 6 | narrative-bible.md | Skin authoring guide added |
| 7 | 4+ generator files | More generators use TinyStore |
| 8 | CLAUDE.md | Milestone documented |

**Total estimated changes:** ~1500 lines across 30+ files
