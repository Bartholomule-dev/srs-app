# Dynamic Exercise System - Phase 5: Content Migration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate existing static exercises to use the dynamic exercise system by adding generator references, target constructs, and creating new generators for common patterns.

**Architecture:** Incremental migration - start with string slicing exercises, add generators as needed, validate each batch before moving to next. Static exercises remain functional; only exercises with generator field become dynamic.

**Tech Stack:** TypeScript generators, YAML exercise files, import script updates

---

## Overview

Phase 5 migrates content to use dynamic exercises:
1. Create additional generators (list-values, variable-names, index-values, arithmetic-values)
2. Update exercise YAML schema validation
3. Migrate strings.yaml exercises
4. Migrate collections.yaml exercises
5. Update import script for new fields
6. Full validation pass

**Dependencies:** Phase 1-4 (all infrastructure)

**Files Created:**
- `src/lib/generators/definitions/list-values.ts`
- `src/lib/generators/definitions/variable-names.ts`
- `src/lib/generators/definitions/index-values.ts`
- `src/lib/generators/definitions/arithmetic-values.ts`
- `tests/unit/generators/list-values.test.ts`
- `tests/unit/generators/variable-names.test.ts`
- `tests/unit/generators/index-values.test.ts`
- `tests/unit/generators/arithmetic-values.test.ts`

**Files Modified:**
- `src/lib/generators/index.ts` (register new generators)
- `src/lib/exercise/yaml-types.ts` (validation for new fields)
- `src/lib/exercise/yaml-validation.ts` (validate generator refs)
- `exercises/python/strings.yaml`
- `exercises/python/collections.yaml`
- `scripts/import-exercises.ts` (map new fields)

---

## Task 1: Create list-values Generator

**Files:**
- Create: `src/lib/generators/definitions/list-values.ts`
- Test: `tests/unit/generators/list-values.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/list-values.test.ts`:

```typescript
// tests/unit/generators/list-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { listValuesGenerator } from '@/lib/generators/definitions/list-values';

describe('listValuesGenerator', () => {
  it('has correct name', () => {
    expect(listValuesGenerator.name).toBe('list-values');
  });

  describe('generate()', () => {
    it('returns a, b, c parameters', () => {
      const params = listValuesGenerator.generate('test-seed');
      expect(typeof params.a).toBe('number');
      expect(typeof params.b).toBe('number');
      expect(typeof params.c).toBe('number');
    });

    it('generates values in valid range [1, 99]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = listValuesGenerator.generate(seed);
        expect(params.a).toBeGreaterThanOrEqual(1);
        expect(params.a).toBeLessThanOrEqual(99);
        expect(params.b).toBeGreaterThanOrEqual(1);
        expect(params.b).toBeLessThanOrEqual(99);
        expect(params.c).toBeGreaterThanOrEqual(1);
        expect(params.c).toBeLessThanOrEqual(99);
      }
    });

    it('generates distinct values', () => {
      // Most seeds should produce distinct a, b, c
      let distinctCount = 0;
      const seeds = Array.from({ length: 100 }, (_, i) => `distinct-${i}`);
      for (const seed of seeds) {
        const params = listValuesGenerator.generate(seed);
        if (params.a !== params.b && params.b !== params.c && params.a !== params.c) {
          distinctCount++;
        }
      }
      // At least 90% should be distinct (high probability)
      expect(distinctCount).toBeGreaterThan(80);
    });

    it('is deterministic', () => {
      const params1 = listValuesGenerator.generate('fixed');
      const params2 = listValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(listValuesGenerator.validate({ a: 10, b: 20, c: 30 })).toBe(true);
      expect(listValuesGenerator.validate({ a: 1, b: 50, c: 99 })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(listValuesGenerator.validate({ a: 0, b: 20, c: 30 })).toBe(false);
      expect(listValuesGenerator.validate({ a: 10, b: 100, c: 30 })).toBe(false);
    });

    it('returns false for non-numbers', () => {
      expect(listValuesGenerator.validate({ a: '10', b: 20, c: 30 })).toBe(false);
    });

    it('returns false for missing params', () => {
      expect(listValuesGenerator.validate({ a: 10, b: 20 })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = listValuesGenerator.generate(seed);
          return listValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/list-values.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/generators/definitions/list-values.ts`:

```typescript
// src/lib/generators/definitions/list-values.ts
// Generator for list value exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * list-values generator
 *
 * Generates three integer values (a, b, c) for list exercises.
 * Used for predict-output exercises like "nums = [a, b, c]; print(nums[1])"
 *
 * Constraints:
 * - Values in range [1, 99]
 * - Values are typically distinct (not guaranteed)
 */
export const listValuesGenerator: Generator = {
  name: 'list-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Generate three values in [1, 99]
    const a = rng.int(1, 99);
    const b = rng.int(1, 99);
    const c = rng.int(1, 99);

    return { a, b, c };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, c } = params;

    // Type checks
    if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
      return false;
    }

    // Range checks
    if (a < 1 || a > 99 || b < 1 || b > 99 || c < 1 || c > 99) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/list-values.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/list-values.ts tests/unit/generators/list-values.test.ts
git commit -m "feat(generators): add list-values generator

- Generates a, b, c integer values
- Range [1, 99] for readable list exercises
- Property tests verify constraints"
```

---

## Task 2: Create variable-names Generator

**Files:**
- Create: `src/lib/generators/definitions/variable-names.ts`
- Test: `tests/unit/generators/variable-names.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/variable-names.test.ts`:

```typescript
// tests/unit/generators/variable-names.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { variableNamesGenerator } from '@/lib/generators/definitions/variable-names';

describe('variableNamesGenerator', () => {
  it('has correct name', () => {
    expect(variableNamesGenerator.name).toBe('variable-names');
  });

  describe('generate()', () => {
    it('returns name and name2 parameters', () => {
      const params = variableNamesGenerator.generate('test-seed');
      expect(typeof params.name).toBe('string');
      expect(typeof params.name2).toBe('string');
    });

    it('generates valid Python identifiers', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      const validIdentifier = /^[a-z][a-z0-9_]*$/;

      for (const seed of seeds) {
        const params = variableNamesGenerator.generate(seed);
        expect(params.name).toMatch(validIdentifier);
        expect(params.name2).toMatch(validIdentifier);
      }
    });

    it('generates different values for name and name2', () => {
      const params = variableNamesGenerator.generate('test');
      expect(params.name).not.toBe(params.name2);
    });

    it('is deterministic', () => {
      const params1 = variableNamesGenerator.generate('fixed');
      const params2 = variableNamesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid names', () => {
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'bar' })).toBe(true);
      expect(variableNamesGenerator.validate({ name: 'my_var', name2: 'x2' })).toBe(true);
    });

    it('returns false for invalid identifiers', () => {
      expect(variableNamesGenerator.validate({ name: '123', name2: 'bar' })).toBe(false);
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'class' })).toBe(false);
    });

    it('returns false for same name', () => {
      expect(variableNamesGenerator.validate({ name: 'foo', name2: 'foo' })).toBe(false);
    });

    it('returns false for non-strings', () => {
      expect(variableNamesGenerator.validate({ name: 123, name2: 'bar' })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = variableNamesGenerator.generate(seed);
          return variableNamesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/variable-names.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/generators/definitions/variable-names.ts`:

```typescript
// src/lib/generators/definitions/variable-names.ts
// Generator for variable name exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Pool of safe, readable variable names.
 * Avoids Python keywords and confusing names.
 */
const VARIABLE_NAMES = [
  'count',
  'total',
  'value',
  'result',
  'num',
  'item',
  'data',
  'text',
  'name',
  'score',
  'index',
  'size',
  'length',
  'sum',
  'max_val',
  'min_val',
  'current',
  'temp',
  'flag',
  'status',
  'message',
  'output',
  'input_val',
  'answer',
  'number',
  'amount',
  'price',
  'quantity',
  'age',
  'height',
];

/**
 * Python reserved keywords to avoid.
 */
const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try',
  'while', 'with', 'yield',
]);

/**
 * variable-names generator
 *
 * Generates two distinct variable names for use in exercises.
 * Names are valid Python identifiers from a curated pool.
 */
export const variableNamesGenerator: Generator = {
  name: 'variable-names',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Pick two distinct names
    const shuffled = rng.shuffle([...VARIABLE_NAMES]);
    const name = shuffled[0];
    const name2 = shuffled[1];

    return { name, name2 };
  },

  validate(params: GeneratorParams): boolean {
    const { name, name2 } = params;

    // Type checks
    if (typeof name !== 'string' || typeof name2 !== 'string') {
      return false;
    }

    // Valid Python identifier pattern
    const validIdentifier = /^[a-z][a-z0-9_]*$/;
    if (!validIdentifier.test(name) || !validIdentifier.test(name2)) {
      return false;
    }

    // Not Python keywords
    if (PYTHON_KEYWORDS.has(name) || PYTHON_KEYWORDS.has(name2)) {
      return false;
    }

    // Must be distinct
    if (name === name2) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/variable-names.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/variable-names.ts tests/unit/generators/variable-names.test.ts
git commit -m "feat(generators): add variable-names generator

- Generates two distinct variable names
- Uses curated pool of readable names
- Avoids Python keywords"
```

---

## Task 3: Create index-values Generator

**Files:**
- Create: `src/lib/generators/definitions/index-values.ts`
- Test: `tests/unit/generators/index-values.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/index-values.test.ts`:

```typescript
// tests/unit/generators/index-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { indexValuesGenerator } from '@/lib/generators/definitions/index-values';

describe('indexValuesGenerator', () => {
  it('has correct name', () => {
    expect(indexValuesGenerator.name).toBe('index-values');
  });

  describe('generate()', () => {
    it('returns idx parameter', () => {
      const params = indexValuesGenerator.generate('test-seed');
      expect(typeof params.idx).toBe('number');
    });

    it('generates index in range [0, 4]', () => {
      const seeds = Array.from({ length: 50 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = indexValuesGenerator.generate(seed);
        expect(params.idx).toBeGreaterThanOrEqual(0);
        expect(params.idx).toBeLessThanOrEqual(4);
      }
    });

    it('is deterministic', () => {
      const params1 = indexValuesGenerator.generate('fixed');
      const params2 = indexValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid index', () => {
      expect(indexValuesGenerator.validate({ idx: 0 })).toBe(true);
      expect(indexValuesGenerator.validate({ idx: 2 })).toBe(true);
      expect(indexValuesGenerator.validate({ idx: 4 })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(indexValuesGenerator.validate({ idx: -1 })).toBe(false);
      expect(indexValuesGenerator.validate({ idx: 5 })).toBe(false);
    });

    it('returns false for non-integer', () => {
      expect(indexValuesGenerator.validate({ idx: 1.5 })).toBe(false);
      expect(indexValuesGenerator.validate({ idx: '2' })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = indexValuesGenerator.generate(seed);
          return indexValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/index-values.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/generators/definitions/index-values.ts`:

```typescript
// src/lib/generators/definitions/index-values.ts
// Generator for index-based exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * index-values generator
 *
 * Generates a single index value for array/string indexing exercises.
 *
 * Constraints:
 * - idx in range [0, 4] (safe for typical 5-element collections)
 */
export const indexValuesGenerator: Generator = {
  name: 'index-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const idx = rng.int(0, 4);
    return { idx };
  },

  validate(params: GeneratorParams): boolean {
    const { idx } = params;

    // Type check
    if (typeof idx !== 'number') {
      return false;
    }

    // Must be integer
    if (!Number.isInteger(idx)) {
      return false;
    }

    // Range check
    if (idx < 0 || idx > 4) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/index-values.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/index-values.ts tests/unit/generators/index-values.test.ts
git commit -m "feat(generators): add index-values generator

- Generates single index in [0, 4]
- Safe for typical 5-element collections"
```

---

## Task 4: Create arithmetic-values Generator

**Files:**
- Create: `src/lib/generators/definitions/arithmetic-values.ts`
- Test: `tests/unit/generators/arithmetic-values.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/arithmetic-values.test.ts`:

```typescript
// tests/unit/generators/arithmetic-values.test.ts
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arithmeticValuesGenerator } from '@/lib/generators/definitions/arithmetic-values';

describe('arithmeticValuesGenerator', () => {
  it('has correct name', () => {
    expect(arithmeticValuesGenerator.name).toBe('arithmetic-values');
  });

  describe('generate()', () => {
    it('returns x and y parameters', () => {
      const params = arithmeticValuesGenerator.generate('test-seed');
      expect(typeof params.x).toBe('number');
      expect(typeof params.y).toBe('number');
    });

    it('generates values in range [1, 20]', () => {
      const seeds = Array.from({ length: 50 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = arithmeticValuesGenerator.generate(seed);
        expect(params.x).toBeGreaterThanOrEqual(1);
        expect(params.x).toBeLessThanOrEqual(20);
        expect(params.y).toBeGreaterThanOrEqual(1);
        expect(params.y).toBeLessThanOrEqual(20);
      }
    });

    it('also generates sum and product', () => {
      const params = arithmeticValuesGenerator.generate('test');
      expect(params.sum).toBe((params.x as number) + (params.y as number));
      expect(params.product).toBe((params.x as number) * (params.y as number));
    });

    it('is deterministic', () => {
      const params1 = arithmeticValuesGenerator.generate('fixed');
      const params2 = arithmeticValuesGenerator.generate('fixed');
      expect(params1).toEqual(params2);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(arithmeticValuesGenerator.validate({
        x: 5, y: 10, sum: 15, product: 50
      })).toBe(true);
    });

    it('returns false for out of range', () => {
      expect(arithmeticValuesGenerator.validate({
        x: 0, y: 10, sum: 10, product: 0
      })).toBe(false);
    });

    it('returns false for inconsistent sum/product', () => {
      expect(arithmeticValuesGenerator.validate({
        x: 5, y: 10, sum: 100, product: 50
      })).toBe(false);
    });
  });

  describe('property tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = arithmeticValuesGenerator.generate(seed);
          return arithmeticValuesGenerator.validate(params);
        }),
        { numRuns: 500 }
      );
    });

    it('sum and product are always consistent', () => {
      fc.assert(
        fc.property(fc.string(), (seed) => {
          const params = arithmeticValuesGenerator.generate(seed);
          const x = params.x as number;
          const y = params.y as number;
          return params.sum === x + y && params.product === x * y;
        }),
        { numRuns: 500 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/arithmetic-values.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/generators/definitions/arithmetic-values.ts`:

```typescript
// src/lib/generators/definitions/arithmetic-values.ts
// Generator for arithmetic exercises

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * arithmetic-values generator
 *
 * Generates two values and their computed results for arithmetic exercises.
 *
 * Constraints:
 * - x, y in range [1, 20] (manageable mental math)
 * - Also provides sum and product for convenience
 */
export const arithmeticValuesGenerator: Generator = {
  name: 'arithmetic-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const x = rng.int(1, 20);
    const y = rng.int(1, 20);

    return {
      x,
      y,
      sum: x + y,
      product: x * y,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { x, y, sum, product } = params;

    // Type checks
    if (
      typeof x !== 'number' ||
      typeof y !== 'number' ||
      typeof sum !== 'number' ||
      typeof product !== 'number'
    ) {
      return false;
    }

    // Range checks
    if (x < 1 || x > 20 || y < 1 || y > 20) {
      return false;
    }

    // Consistency checks
    if (sum !== x + y || product !== x * y) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/arithmetic-values.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/arithmetic-values.ts tests/unit/generators/arithmetic-values.test.ts
git commit -m "feat(generators): add arithmetic-values generator

- Generates x, y in [1, 20]
- Pre-computes sum and product
- For predict-output arithmetic exercises"
```

---

## Task 5: Register All Generators

**Files:**
- Modify: `src/lib/generators/index.ts`

**Step 1: Update generator registry**

Add imports and registrations to `src/lib/generators/index.ts`:

```typescript
// Add imports
import { listValuesGenerator } from './definitions/list-values';
import { variableNamesGenerator } from './definitions/variable-names';
import { indexValuesGenerator } from './definitions/index-values';
import { arithmeticValuesGenerator } from './definitions/arithmetic-values';

// Add registrations (after existing sliceBoundsGenerator)
registerGenerator(listValuesGenerator);
registerGenerator(variableNamesGenerator);
registerGenerator(indexValuesGenerator);
registerGenerator(arithmeticValuesGenerator);

// Export generators for direct access
export {
  sliceBoundsGenerator,
  listValuesGenerator,
  variableNamesGenerator,
  indexValuesGenerator,
  arithmeticValuesGenerator,
} from './definitions';
```

Create `src/lib/generators/definitions/index.ts`:

```typescript
// src/lib/generators/definitions/index.ts
// Export all generator definitions

export { sliceBoundsGenerator } from './slice-bounds';
export { listValuesGenerator } from './list-values';
export { variableNamesGenerator } from './variable-names';
export { indexValuesGenerator } from './index-values';
export { arithmeticValuesGenerator } from './arithmetic-values';
```

**Step 2: Run tests**

Run: `pnpm test tests/unit/generators`
Expected: All generator tests pass

**Step 3: Commit**

```bash
git add src/lib/generators/index.ts src/lib/generators/definitions/index.ts
git commit -m "feat(generators): register all generators

- slice-bounds, list-values, variable-names
- index-values, arithmetic-values
- All exported from definitions/index"
```

---

## Task 6: Update YAML Validation for Generators

**Files:**
- Modify: `src/lib/exercise/yaml-validation.ts`

**Step 1: Add generator validation**

Update `src/lib/exercise/yaml-validation.ts` to validate generator references:

```typescript
// Add import
import { hasGenerator } from '@/lib/generators';

// Add to validation function (after existing field checks):

// Validate generator reference if present
if (exercise.generator) {
  if (!hasGenerator(exercise.generator)) {
    errors.push({
      file: filePath,
      slug: exercise.slug,
      field: 'generator',
      message: `Unknown generator: ${exercise.generator}`,
    });
  }
}

// Validate target_construct structure
if (exercise.target_construct) {
  if (!exercise.target_construct.type) {
    errors.push({
      file: filePath,
      slug: exercise.slug,
      field: 'target_construct',
      message: 'target_construct must have a type field',
    });
  }
}

// Validate template placeholders match generator
if (exercise.generator && exercise.prompt) {
  const placeholders = exercise.prompt.match(/\{\{(\w+)\}\}/g);
  if (placeholders && placeholders.length === 0) {
    errors.push({
      file: filePath,
      slug: exercise.slug,
      field: 'prompt',
      message: 'Exercise has generator but no {{placeholders}} in prompt',
    });
  }
}
```

**Step 2: Run validation**

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/exercise/yaml-validation.ts
git commit -m "feat(yaml): add generator validation

- Validates generator references exist
- Validates target_construct structure
- Warns if generator but no placeholders"
```

---

## Task 7: Migrate String Slicing Exercises

**Files:**
- Modify: `exercises/python/strings.yaml`

**Step 1: Update string-slicing to be dynamic**

Edit `exercises/python/strings.yaml`, update the string-slicing exercise:

```yaml
  - slug: string-slicing-dynamic
    objective: "Use slice notation to extract a substring from a string"
    title: Dynamic String Slicing
    difficulty: 2
    prompt: Get characters from index {{start}} to {{end}} (exclusive) of string s
    expected_answer: s[{{start}}:{{end}}]
    hints:
      - Use slice notation [start:end]
      - End index is exclusive
    tags: [strings, slicing, intermediate, dynamic]
    concept: strings
    subconcept: slicing
    level: practice
    prereqs: [strings.indexing]
    type: write
    pattern: indexing
    generator: slice-bounds
    target_construct:
      type: slice
      feedback: "Try using slice notation s[start:end] for cleaner extraction"
    accepted_solutions:
      - "s[{{start}}:{{end}}]"
```

**Note:** Keep the original static exercise and add a new dynamic one. This allows side-by-side comparison.

**Step 2: Run import validation**

```bash
pnpm run validate-exercises
```

Expected: No validation errors

**Step 3: Commit**

```bash
git add exercises/python/strings.yaml
git commit -m "content(strings): add dynamic string slicing exercise

- Uses slice-bounds generator
- Target construct: slice
- Maintains original static exercise"
```

---

## Task 8: Migrate List Indexing Exercises

**Files:**
- Modify: `exercises/python/collections.yaml`

**Step 1: Add dynamic list exercises**

Add to `exercises/python/collections.yaml`:

```yaml
  - slug: list-indexing-dynamic
    objective: "Use bracket notation to access list elements"
    title: Dynamic List Indexing
    difficulty: 1
    prompt: "Given nums = [{{a}}, {{b}}, {{c}}], what does nums[1] return?"
    expected_answer: "{{b}}"
    hints:
      - List indices start at 0
      - nums[1] returns the second element
    tags: [lists, indexing, dynamic]
    concept: collections
    subconcept: lists
    level: intro
    prereqs: []
    type: predict
    pattern: indexing
    generator: list-values
    code: |
      nums = [{{a}}, {{b}}, {{c}}]
      print(nums[1])

  - slug: list-sum-dynamic
    objective: "Predict the output of summing list elements"
    title: Dynamic List Sum
    difficulty: 2
    prompt: "Given x = {{x}} and y = {{y}}, what does x + y print?"
    expected_answer: "{{sum}}"
    hints:
      - Addition is straightforward
    tags: [arithmetic, dynamic]
    concept: numbers-booleans
    subconcept: arithmetic
    level: practice
    prereqs: []
    type: predict
    pattern: arithmetic
    generator: arithmetic-values
    code: |
      x = {{x}}
      y = {{y}}
      print(x + y)
```

**Step 2: Run import validation**

```bash
pnpm run validate-exercises
```

Expected: No validation errors

**Step 3: Commit**

```bash
git add exercises/python/collections.yaml
git commit -m "content(collections): add dynamic list exercises

- list-indexing-dynamic with list-values generator
- list-sum-dynamic with arithmetic-values generator"
```

---

## Task 9: Update Import Script for New Fields

**Files:**
- Modify: `scripts/import-exercises.ts`

**Step 1: Update import mapper**

Add mapping for new fields in `scripts/import-exercises.ts`:

```typescript
// In the exercise mapping section, add:
generator: exercise.generator ?? null,
target_construct: exercise.target_construct ?? null,
verify_by_execution: exercise.verify_by_execution ?? false,
```

**Step 2: Run import**

```bash
pnpm db:import-exercises
```

Expected: Import succeeds with dynamic exercises

**Step 3: Commit**

```bash
git add scripts/import-exercises.ts
git commit -m "feat(import): support generator fields

- Maps generator, target_construct, verify_by_execution
- Maintains backward compatibility"
```

---

## Task 10: Create Validation Script for Dynamic Exercises

**Files:**
- Create: `scripts/validate-dynamic-exercises.ts`

**Step 1: Write validation script**

Create `scripts/validate-dynamic-exercises.ts`:

```typescript
// scripts/validate-dynamic-exercises.ts
// Validates that all dynamic exercises render correctly

import { glob } from 'glob';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { hasGenerator, getGenerator, renderExercise } from '../src/lib/generators';

async function validateDynamicExercises() {
  const files = await glob('exercises/**/*.yaml');
  let errors = 0;
  let dynamicCount = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const data = parse(content);

    for (const exercise of data.exercises ?? []) {
      if (!exercise.generator) continue;

      dynamicCount++;

      // Check generator exists
      if (!hasGenerator(exercise.generator)) {
        console.error(`[${file}] ${exercise.slug}: Unknown generator '${exercise.generator}'`);
        errors++;
        continue;
      }

      // Try rendering
      try {
        const rendered = renderExercise(
          {
            slug: exercise.slug,
            prompt: exercise.prompt,
            expectedAnswer: exercise.expected_answer,
            acceptedSolutions: exercise.accepted_solutions ?? [],
            generator: exercise.generator,
            code: exercise.code,
            template: exercise.template,
          },
          'test-user',
          new Date()
        );

        // Verify no unrendered placeholders
        if (rendered.prompt.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in prompt`);
          errors++;
        }
        if (rendered.expectedAnswer.includes('{{')) {
          console.error(`[${file}] ${exercise.slug}: Unrendered placeholders in expected_answer`);
          errors++;
        }
      } catch (err) {
        console.error(`[${file}] ${exercise.slug}: Render error - ${err}`);
        errors++;
      }
    }
  }

  console.log(`\nValidated ${dynamicCount} dynamic exercises`);
  if (errors > 0) {
    console.error(`Found ${errors} errors`);
    process.exit(1);
  } else {
    console.log('All dynamic exercises valid!');
  }
}

validateDynamicExercises();
```

**Step 2: Add npm script**

Add to `package.json`:

```json
"validate-dynamic": "tsx scripts/validate-dynamic-exercises.ts"
```

**Step 3: Run validation**

```bash
pnpm validate-dynamic
```

Expected: All dynamic exercises valid

**Step 4: Commit**

```bash
git add scripts/validate-dynamic-exercises.ts package.json
git commit -m "feat(scripts): add dynamic exercise validation

- Validates generator references
- Tests rendering produces valid output
- Catches unrendered placeholders"
```

---

## Task 11: Final Phase 5 Verification

**Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests pass

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: No type errors

**Step 3: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

**Step 4: Run all validation scripts**

```bash
pnpm validate-exercises
pnpm validate-dynamic
```

Expected: All validations pass

**Step 5: Test dynamic exercise in app**

Run: `pnpm dev`
- Navigate to practice session
- Verify dynamic exercises render with concrete values
- Complete a dynamic exercise
- Verify grading works

**Step 6: Create Phase 5 completion commit**

```bash
git add -A
git commit -m "feat(content): complete Phase 5 - Content Migration

Phase 5 migrates content to dynamic system:
- Five generators: slice-bounds, list-values, variable-names, index-values, arithmetic-values
- Dynamic exercises in strings.yaml and collections.yaml
- Updated import script for new fields
- Validation script for dynamic exercises
- All exercises validated and working

Dynamic Exercise System implementation complete!"
```

---

## Phase 5 Checklist

- [ ] list-values generator created
- [ ] variable-names generator created
- [ ] index-values generator created
- [ ] arithmetic-values generator created
- [ ] All generators registered
- [ ] YAML validation updated
- [ ] String exercises migrated
- [ ] Collection exercises migrated
- [ ] Import script updated
- [ ] Validation script created
- [ ] All validations passing
- [ ] Dynamic exercises work in app
- [ ] All tests passing
- [ ] No type errors
- [ ] No lint errors

---

## Post-Implementation

### Adding More Dynamic Exercises

To add more dynamic exercises:

1. **Use existing generators** - Many exercises can use slice-bounds, list-values, etc.
2. **Create new generators** - For new patterns, create in `definitions/` with tests
3. **Register new generators** - Add to `index.ts`
4. **Update YAML** - Add `generator` and optionally `target_construct`
5. **Validate** - Run `pnpm validate-dynamic`

### Monitoring Success Metrics

After launch, monitor:
- Retention rate (should improve with dynamic exercises)
- Transfer rate (novel exercise performance)
- Construct adoption (coaching effectiveness)
- Completion stability (no increase in abandonment)

### Future Generators

Consider adding:
- `string-content` - Random strings like "hello", "world"
- `boolean-values` - True/False combinations
- `dict-keys` - Key-value pair generators
- `function-names` - Safe function name pool
