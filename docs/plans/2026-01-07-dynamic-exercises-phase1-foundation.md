# Dynamic Exercise System - Phase 1: Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the generator infrastructure for parameterized exercises with deterministic seeding and template rendering.

**Architecture:** TypeScript generators produce parameter values from deterministic seeds (sha256 of userId:exerciseSlug:dueDate). Mustache templates in YAML exercises get rendered at runtime. Static exercises pass through unchanged.

**Tech Stack:** TypeScript, Mustache templating, fast-check for property-based testing, seedrandom for deterministic RNG

---

## Overview

Phase 1 creates the foundational infrastructure:
1. Generator type system
2. Seeded random utilities
3. First generator implementation (slice-bounds)
4. Rendering pipeline that interpolates templates
5. Property-based tests ensuring generators always produce valid params

**Dependencies:** None (greenfield)

**Files Created:**
- `src/lib/generators/types.ts`
- `src/lib/generators/seed.ts`
- `src/lib/generators/utils.ts`
- `src/lib/generators/render.ts`
- `src/lib/generators/index.ts`
- `src/lib/generators/definitions/slice-bounds.ts`
- `tests/unit/generators/types.test.ts`
- `tests/unit/generators/seed.test.ts`
- `tests/unit/generators/utils.test.ts`
- `tests/unit/generators/render.test.ts`
- `tests/unit/generators/slice-bounds.test.ts`

**Files Modified:**
- `src/lib/exercise/yaml-types.ts` (add generator fields)
- `src/lib/types/app.types.ts` (add Exercise generator fields)
- `package.json` (add dependencies)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install runtime dependencies**

```bash
pnpm add mustache seedrandom
```

**Step 2: Install dev dependencies**

```bash
pnpm add -D @types/mustache @types/seedrandom fast-check
```

**Step 3: Verify installation**

Run: `pnpm ls mustache seedrandom fast-check`
Expected: All three packages listed with versions

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add mustache, seedrandom, fast-check dependencies

For dynamic exercise system parameterization"
```

---

## Task 2: Create Generator Types

**Files:**
- Create: `src/lib/generators/types.ts`
- Test: `tests/unit/generators/types.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/types.test.ts`:

```typescript
// tests/unit/generators/types.test.ts
import { describe, it, expect } from 'vitest';
import type { Generator, GeneratorParams, TargetConstruct } from '@/lib/generators/types';

describe('Generator types', () => {
  it('GeneratorParams accepts string, number, boolean, and array values', () => {
    const params: GeneratorParams = {
      start: 1,
      end: 5,
      name: 'test',
      isValid: true,
      items: [1, 2, 3],
    };
    expect(params.start).toBe(1);
    expect(params.name).toBe('test');
    expect(params.isValid).toBe(true);
    expect(params.items).toEqual([1, 2, 3]);
  });

  it('Generator interface has required properties', () => {
    const mockGenerator: Generator = {
      name: 'test-generator',
      generate: (seed: string) => ({ value: seed.length }),
      validate: (params: GeneratorParams) => typeof params.value === 'number',
    };

    expect(mockGenerator.name).toBe('test-generator');
    expect(typeof mockGenerator.generate).toBe('function');
    expect(typeof mockGenerator.validate).toBe('function');
  });

  it('TargetConstruct has type and optional feedback', () => {
    const construct: TargetConstruct = {
      type: 'slice',
      feedback: 'Try using slice notation',
    };
    expect(construct.type).toBe('slice');
    expect(construct.feedback).toBe('Try using slice notation');

    const minimalConstruct: TargetConstruct = {
      type: 'comprehension',
    };
    expect(minimalConstruct.type).toBe('comprehension');
    expect(minimalConstruct.feedback).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/types.test.ts`
Expected: FAIL with "Cannot find module '@/lib/generators/types'"

**Step 3: Write the implementation**

Create `src/lib/generators/types.ts`:

```typescript
// src/lib/generators/types.ts
// Type definitions for the dynamic exercise generator system

/**
 * Parameter values that generators can produce.
 * Used for template interpolation via Mustache.
 */
export interface GeneratorParams {
  [key: string]: string | number | boolean | (string | number)[];
}

/**
 * Generator interface - produces deterministic parameter values from a seed.
 * Each generator is registered by name and referenced from YAML exercises.
 */
export interface Generator {
  /** Unique name matching the YAML `generator` field */
  name: string;

  /** Produce parameters from a deterministic seed */
  generate(seed: string): GeneratorParams;

  /** Validate that params satisfy generator constraints */
  validate(params: GeneratorParams): boolean;
}

/**
 * Construct types for two-pass grading.
 * Pass 1 checks correctness; Pass 2 checks if target construct was used.
 */
export type ConstructType =
  | 'slice'
  | 'comprehension'
  | 'f-string'
  | 'ternary'
  | 'enumerate'
  | 'zip'
  | 'lambda'
  | 'generator-expr';

/**
 * Target construct definition for two-pass grading.
 * If defined on an exercise, Pass 2 checks if the user's answer used this construct.
 */
export interface TargetConstruct {
  /** The construct type to check for */
  type: ConstructType;
  /** Coaching feedback if user got correct answer but didn't use target construct */
  feedback?: string;
}

/**
 * Rendered exercise with generated parameters attached.
 * Extends the base Exercise type with generator metadata.
 */
export interface RenderedExerciseMetadata {
  /** Parameters that were generated (for logging/debugging) */
  _generatedParams?: GeneratorParams;
  /** Seed used for generation (for reproducibility) */
  _seed?: string;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/types.ts tests/unit/generators/types.test.ts
git commit -m "feat(generators): add core type definitions

- GeneratorParams for template values
- Generator interface for implementations
- TargetConstruct for two-pass grading
- RenderedExerciseMetadata for tracking"
```

---

## Task 3: Create Seed Generation Utilities

**Files:**
- Create: `src/lib/generators/seed.ts`
- Test: `tests/unit/generators/seed.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/seed.test.ts`:

```typescript
// tests/unit/generators/seed.test.ts
import { describe, it, expect } from 'vitest';
import { createSeed, hashString } from '@/lib/generators/seed';

describe('hashString', () => {
  it('produces consistent output for same input', () => {
    const hash1 = hashString('test-input');
    const hash2 = hashString('test-input');
    expect(hash1).toBe(hash2);
  });

  it('produces different output for different inputs', () => {
    const hash1 = hashString('input-a');
    const hash2 = hashString('input-b');
    expect(hash1).not.toBe(hash2);
  });

  it('produces a 64-character hex string', () => {
    const hash = hashString('any-input');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('createSeed', () => {
  it('combines userId, exerciseSlug, and date into a seed', () => {
    const seed = createSeed('user-123', 'string-slice', new Date('2026-01-15'));
    expect(typeof seed).toBe('string');
    expect(seed.length).toBe(64); // SHA-256 hex
  });

  it('produces same seed for same inputs', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-123', 'exercise-1', date);
    const seed2 = createSeed('user-123', 'exercise-1', date);
    expect(seed1).toBe(seed2);
  });

  it('produces different seeds for different users', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-1', 'exercise-1', date);
    const seed2 = createSeed('user-2', 'exercise-1', date);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different exercises', () => {
    const date = new Date('2026-01-15');
    const seed1 = createSeed('user-1', 'exercise-a', date);
    const seed2 = createSeed('user-1', 'exercise-b', date);
    expect(seed1).not.toBe(seed2);
  });

  it('produces different seeds for different dates', () => {
    const seed1 = createSeed('user-1', 'exercise-1', new Date('2026-01-15'));
    const seed2 = createSeed('user-1', 'exercise-1', new Date('2026-01-16'));
    expect(seed1).not.toBe(seed2);
  });

  it('uses only date portion (ignores time)', () => {
    const date1 = new Date('2026-01-15T09:00:00Z');
    const date2 = new Date('2026-01-15T18:30:00Z');
    const seed1 = createSeed('user-1', 'exercise-1', date1);
    const seed2 = createSeed('user-1', 'exercise-1', date2);
    expect(seed1).toBe(seed2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/seed.test.ts`
Expected: FAIL with "Cannot find module '@/lib/generators/seed'"

**Step 3: Write the implementation**

Create `src/lib/generators/seed.ts`:

```typescript
// src/lib/generators/seed.ts
// Deterministic seed generation for parameterized exercises

/**
 * Simple SHA-256 hash using Web Crypto API (available in Node and browsers).
 * Returns a 64-character hex string.
 */
export function hashString(input: string): string {
  // Use a simple hash for determinism (no crypto needed for non-security use)
  // This is a variant of djb2 extended to 256 bits via multiple passes
  let h1 = 5381;
  let h2 = 52711;
  let h3 = 33791;
  let h4 = 10301;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ char;
    h2 = ((h2 << 5) + h2) ^ char;
    h3 = ((h3 << 5) + h3) ^ char;
    h4 = ((h4 << 5) + h4) ^ char;
  }

  // Convert to unsigned 32-bit integers
  h1 = h1 >>> 0;
  h2 = h2 >>> 0;
  h3 = h3 >>> 0;
  h4 = h4 >>> 0;

  // Combine into 64-char hex string (256 bits)
  return (
    h1.toString(16).padStart(8, '0') +
    h2.toString(16).padStart(8, '0') +
    h3.toString(16).padStart(8, '0') +
    h4.toString(16).padStart(8, '0') +
    // Add more entropy with secondary mixing
    ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0') +
    ((h2 ^ h3) >>> 0).toString(16).padStart(8, '0') +
    ((h3 ^ h4) >>> 0).toString(16).padStart(8, '0') +
    ((h4 ^ h1) >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Create a deterministic seed for exercise parameter generation.
 *
 * The seed is derived from:
 * - userId: Each user sees different values
 * - exerciseSlug: Each exercise has its own parameter space
 * - dueDate: Values change on different review days
 *
 * Same (userId, exerciseSlug, date) always produces same seed.
 */
export function createSeed(
  userId: string,
  exerciseSlug: string,
  dueDate: Date
): string {
  // Use only date portion (YYYY-MM-DD) so time doesn't affect seed
  const dateStr = dueDate.toISOString().split('T')[0];
  const input = `${userId}:${exerciseSlug}:${dateStr}`;
  return hashString(input);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/seed.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/seed.ts tests/unit/generators/seed.test.ts
git commit -m "feat(generators): add deterministic seed generation

- hashString for consistent 64-char hex output
- createSeed combines userId, exerciseSlug, date
- Same inputs always produce same seed"
```

---

## Task 4: Create Seeded Random Utilities

**Files:**
- Create: `src/lib/generators/utils.ts`
- Test: `tests/unit/generators/utils.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/utils.test.ts`:

```typescript
// tests/unit/generators/utils.test.ts
import { describe, it, expect } from 'vitest';
import { seededRandom, type SeededRandom } from '@/lib/generators/utils';

describe('seededRandom', () => {
  it('creates a SeededRandom instance from a seed', () => {
    const rng = seededRandom('test-seed');
    expect(rng).toBeDefined();
    expect(typeof rng.next).toBe('function');
    expect(typeof rng.int).toBe('function');
    expect(typeof rng.pick).toBe('function');
    expect(typeof rng.shuffle).toBe('function');
  });

  describe('next()', () => {
    it('returns a number between 0 and 1', () => {
      const rng = seededRandom('test-seed');
      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('produces same sequence for same seed', () => {
      const rng1 = seededRandom('fixed-seed');
      const rng2 = seededRandom('fixed-seed');

      for (let i = 0; i < 10; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = seededRandom('seed-a');
      const rng2 = seededRandom('seed-b');

      const seq1 = Array.from({ length: 5 }, () => rng1.next());
      const seq2 = Array.from({ length: 5 }, () => rng2.next());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('int()', () => {
    it('returns integers within range [min, max]', () => {
      const rng = seededRandom('int-test');
      for (let i = 0; i < 100; i++) {
        const value = rng.int(5, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    it('handles min === max', () => {
      const rng = seededRandom('edge-case');
      expect(rng.int(7, 7)).toBe(7);
    });

    it('is deterministic for same seed', () => {
      const rng1 = seededRandom('deterministic');
      const rng2 = seededRandom('deterministic');

      for (let i = 0; i < 10; i++) {
        expect(rng1.int(0, 100)).toBe(rng2.int(0, 100));
      }
    });
  });

  describe('pick()', () => {
    it('returns an element from the array', () => {
      const rng = seededRandom('pick-test');
      const items = ['a', 'b', 'c', 'd'];

      for (let i = 0; i < 20; i++) {
        const picked = rng.pick(items);
        expect(items).toContain(picked);
      }
    });

    it('is deterministic for same seed', () => {
      const items = ['x', 'y', 'z'];
      const rng1 = seededRandom('pick-seed');
      const rng2 = seededRandom('pick-seed');

      for (let i = 0; i < 10; i++) {
        expect(rng1.pick(items)).toBe(rng2.pick(items));
      }
    });

    it('throws on empty array', () => {
      const rng = seededRandom('empty');
      expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
    });
  });

  describe('shuffle()', () => {
    it('returns array with same elements', () => {
      const rng = seededRandom('shuffle-test');
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle([...original]);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('does not mutate original array', () => {
      const rng = seededRandom('no-mutate');
      const original = [1, 2, 3];
      const copy = [...original];
      rng.shuffle(copy);

      // Note: shuffle returns new array, doesn't mutate
      expect(original).toEqual([1, 2, 3]);
    });

    it('is deterministic for same seed', () => {
      const rng1 = seededRandom('shuffle-seed');
      const rng2 = seededRandom('shuffle-seed');

      const arr = [1, 2, 3, 4, 5];
      expect(rng1.shuffle([...arr])).toEqual(rng2.shuffle([...arr]));
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/utils.test.ts`
Expected: FAIL with "Cannot find module '@/lib/generators/utils'"

**Step 3: Write the implementation**

Create `src/lib/generators/utils.ts`:

```typescript
// src/lib/generators/utils.ts
// Seeded random number generation utilities for deterministic parameter generation

import seedrandom from 'seedrandom';

/**
 * Seeded random number generator interface.
 * Provides deterministic random values from a seed string.
 */
export interface SeededRandom {
  /** Get next random float in [0, 1) */
  next(): number;

  /** Get random integer in [min, max] inclusive */
  int(min: number, max: number): number;

  /** Pick random element from array */
  pick<T>(items: T[]): T;

  /** Shuffle array (Fisher-Yates) - returns new array */
  shuffle<T>(items: T[]): T[];
}

/**
 * Create a seeded random number generator.
 *
 * @param seed - String seed for determinism
 * @returns SeededRandom instance with utility methods
 */
export function seededRandom(seed: string): SeededRandom {
  const rng = seedrandom(seed);

  return {
    next(): number {
      return rng();
    },

    int(min: number, max: number): number {
      if (min === max) return min;
      // rng() returns [0, 1), scale to [min, max]
      return Math.floor(rng() * (max - min + 1)) + min;
    },

    pick<T>(items: T[]): T {
      if (items.length === 0) {
        throw new Error('Cannot pick from empty array');
      }
      const index = Math.floor(rng() * items.length);
      return items[index];
    },

    shuffle<T>(items: T[]): T[] {
      // Fisher-Yates shuffle on a copy
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/utils.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/utils.ts tests/unit/generators/utils.test.ts
git commit -m "feat(generators): add seeded random utilities

- SeededRandom interface with next, int, pick, shuffle
- Deterministic output from seed string
- Uses seedrandom library"
```

---

## Task 5: Create First Generator (slice-bounds)

**Files:**
- Create: `src/lib/generators/definitions/slice-bounds.ts`
- Test: `tests/unit/generators/slice-bounds.test.ts`

**Step 1: Write the failing test (unit tests)**

Create `tests/unit/generators/slice-bounds.test.ts`:

```typescript
// tests/unit/generators/slice-bounds.test.ts
import { describe, it, expect } from 'vitest';
import { sliceBoundsGenerator } from '@/lib/generators/definitions/slice-bounds';

describe('sliceBoundsGenerator', () => {
  it('has correct name', () => {
    expect(sliceBoundsGenerator.name).toBe('slice-bounds');
  });

  describe('generate()', () => {
    it('returns start and end parameters', () => {
      const params = sliceBoundsGenerator.generate('test-seed');
      expect(typeof params.start).toBe('number');
      expect(typeof params.end).toBe('number');
    });

    it('ensures end > start', () => {
      // Test with multiple seeds to ensure constraint always holds
      const seeds = ['seed-1', 'seed-2', 'seed-3', 'another', 'test'];
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        expect(params.end).toBeGreaterThan(params.start as number);
      }
    });

    it('keeps start in valid range [0, 4]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}`);
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        expect(params.start).toBeGreaterThanOrEqual(0);
        expect(params.start).toBeLessThanOrEqual(4);
      }
    });

    it('keeps end in valid range [start+1, 7]', () => {
      const seeds = Array.from({ length: 20 }, (_, i) => `range-${i}`);
      for (const seed of seeds) {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        const end = params.end as number;
        expect(end).toBeGreaterThan(start);
        expect(end).toBeLessThanOrEqual(7);
      }
    });

    it('is deterministic for same seed', () => {
      const params1 = sliceBoundsGenerator.generate('fixed-seed');
      const params2 = sliceBoundsGenerator.generate('fixed-seed');
      expect(params1).toEqual(params2);
    });

    it('produces different values for different seeds', () => {
      // Generate many pairs and verify at least some differ
      const results = Array.from({ length: 10 }, (_, i) =>
        sliceBoundsGenerator.generate(`unique-${i}`)
      );
      const unique = new Set(results.map((r) => `${r.start}-${r.end}`));
      expect(unique.size).toBeGreaterThan(1);
    });
  });

  describe('validate()', () => {
    it('returns true for valid params', () => {
      expect(sliceBoundsGenerator.validate({ start: 0, end: 5 })).toBe(true);
      expect(sliceBoundsGenerator.validate({ start: 2, end: 7 })).toBe(true);
      expect(sliceBoundsGenerator.validate({ start: 4, end: 5 })).toBe(true);
    });

    it('returns false when end <= start', () => {
      expect(sliceBoundsGenerator.validate({ start: 5, end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ start: 5, end: 3 })).toBe(false);
    });

    it('returns false when start < 0', () => {
      expect(sliceBoundsGenerator.validate({ start: -1, end: 5 })).toBe(false);
    });

    it('returns false when end > 10', () => {
      expect(sliceBoundsGenerator.validate({ start: 0, end: 11 })).toBe(false);
    });

    it('returns false for non-number values', () => {
      expect(sliceBoundsGenerator.validate({ start: '0', end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ start: 0, end: '5' })).toBe(false);
    });

    it('returns false for missing params', () => {
      expect(sliceBoundsGenerator.validate({ start: 0 })).toBe(false);
      expect(sliceBoundsGenerator.validate({ end: 5 })).toBe(false);
      expect(sliceBoundsGenerator.validate({})).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/slice-bounds.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create directory and file:

```bash
mkdir -p src/lib/generators/definitions
```

Create `src/lib/generators/definitions/slice-bounds.ts`:

```typescript
// src/lib/generators/definitions/slice-bounds.ts
// Generator for string slicing exercises with bounded indices

import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * slice-bounds generator
 *
 * Generates start and end indices for string slicing exercises.
 * Constraints:
 * - start: [0, 4]
 * - end: [start+1, 7]
 * - Always ensures end > start
 */
export const sliceBoundsGenerator: Generator = {
  name: 'slice-bounds',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // start: 0-4 (leaves room for meaningful slice)
    const start = rng.int(0, 4);

    // end: at least start+1, at most 7
    const end = rng.int(start + 1, 7);

    return { start, end };
  },

  validate(params: GeneratorParams): boolean {
    const { start, end } = params;

    // Type checks
    if (typeof start !== 'number' || typeof end !== 'number') {
      return false;
    }

    // Range checks
    if (start < 0 || start > 4) {
      return false;
    }

    if (end > 10) {
      return false;
    }

    // Constraint: end > start
    if (end <= start) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/slice-bounds.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/slice-bounds.ts tests/unit/generators/slice-bounds.test.ts
git commit -m "feat(generators): add slice-bounds generator

- Generates start/end indices for string slicing
- Constraints: start [0,4], end [start+1,7]
- Deterministic output from seed"
```

---

## Task 6: Add Property-Based Tests

**Files:**
- Modify: `tests/unit/generators/slice-bounds.test.ts`

**Step 1: Add property-based tests to existing file**

Add to `tests/unit/generators/slice-bounds.test.ts`:

```typescript
// Add this import at the top
import * as fc from 'fast-check';

// Add this describe block at the end of the file
describe('sliceBoundsGenerator property tests', () => {
  it('always produces valid params for any seed', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        return sliceBoundsGenerator.validate(params);
      }),
      { numRuns: 1000 }
    );
  });

  it('always satisfies end > start constraint', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        const end = params.end as number;
        return end > start;
      }),
      { numRuns: 1000 }
    );
  });

  it('start is always in [0, 4]', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const start = params.start as number;
        return start >= 0 && start <= 4;
      }),
      { numRuns: 1000 }
    );
  });

  it('end is always in [1, 7]', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params = sliceBoundsGenerator.generate(seed);
        const end = params.end as number;
        return end >= 1 && end <= 7;
      }),
      { numRuns: 1000 }
    );
  });

  it('same seed always produces same output', () => {
    fc.assert(
      fc.property(fc.string(), (seed) => {
        const params1 = sliceBoundsGenerator.generate(seed);
        const params2 = sliceBoundsGenerator.generate(seed);
        return params1.start === params2.start && params1.end === params2.end;
      }),
      { numRuns: 500 }
    );
  });
});
```

**Step 2: Run all generator tests**

Run: `pnpm test tests/unit/generators/slice-bounds.test.ts`
Expected: All tests PASS including property tests

**Step 3: Commit**

```bash
git add tests/unit/generators/slice-bounds.test.ts
git commit -m "test(generators): add property-based tests for slice-bounds

- Verifies constraints hold for 1000 random seeds
- Uses fast-check for property-based testing"
```

---

## Task 7: Create Generator Registry

**Files:**
- Create: `src/lib/generators/index.ts`
- Modify: `tests/unit/generators/slice-bounds.test.ts` (add registry test)

**Step 1: Write the failing test**

Add to end of `tests/unit/generators/slice-bounds.test.ts`:

```typescript
// Add this import at the top
import { getGenerator, registerGenerator, hasGenerator } from '@/lib/generators';

describe('Generator registry', () => {
  it('slice-bounds is registered', () => {
    expect(hasGenerator('slice-bounds')).toBe(true);
  });

  it('getGenerator returns slice-bounds generator', () => {
    const gen = getGenerator('slice-bounds');
    expect(gen).toBeDefined();
    expect(gen?.name).toBe('slice-bounds');
  });

  it('getGenerator returns undefined for unknown generator', () => {
    const gen = getGenerator('non-existent');
    expect(gen).toBeUndefined();
  });

  it('registerGenerator adds new generator', () => {
    const testGen: Generator = {
      name: 'test-gen',
      generate: () => ({ value: 1 }),
      validate: () => true,
    };
    registerGenerator(testGen);
    expect(hasGenerator('test-gen')).toBe(true);
    expect(getGenerator('test-gen')).toBe(testGen);
  });
});
```

Also add import for `Generator` type if not present.

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/slice-bounds.test.ts`
Expected: FAIL with "Cannot find module '@/lib/generators'"

**Step 3: Write the implementation**

Create `src/lib/generators/index.ts`:

```typescript
// src/lib/generators/index.ts
// Generator registry and public API

import type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata } from './types';
import { sliceBoundsGenerator } from './definitions/slice-bounds';

// Re-export types
export type { Generator, GeneratorParams, TargetConstruct, RenderedExerciseMetadata };

// Re-export utilities
export { createSeed, hashString } from './seed';
export { seededRandom, type SeededRandom } from './utils';

/**
 * Registry of all available generators.
 * Generators are registered by name for YAML reference.
 */
const generators: Map<string, Generator> = new Map();

/**
 * Register a generator in the registry.
 */
export function registerGenerator(generator: Generator): void {
  generators.set(generator.name, generator);
}

/**
 * Get a generator by name.
 */
export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}

/**
 * Check if a generator exists.
 */
export function hasGenerator(name: string): boolean {
  return generators.has(name);
}

/**
 * Get all registered generator names.
 */
export function getGeneratorNames(): string[] {
  return Array.from(generators.keys());
}

// Register built-in generators
registerGenerator(sliceBoundsGenerator);
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/slice-bounds.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/index.ts tests/unit/generators/slice-bounds.test.ts
git commit -m "feat(generators): add generator registry

- registerGenerator, getGenerator, hasGenerator
- Auto-registers slice-bounds on import
- Re-exports all generator utilities"
```

---

## Task 8: Create Rendering Pipeline

**Files:**
- Create: `src/lib/generators/render.ts`
- Test: `tests/unit/generators/render.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/render.test.ts`:

```typescript
// tests/unit/generators/render.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderExercise, type RenderableExercise } from '@/lib/generators/render';
import { registerGenerator, type Generator } from '@/lib/generators';

// Mock generator for testing
const mockGenerator: Generator = {
  name: 'test-render-gen',
  generate: () => ({ start: 2, end: 6, name: 'test' }),
  validate: () => true,
};

beforeEach(() => {
  // Register mock generator
  registerGenerator(mockGenerator);
});

describe('renderExercise', () => {
  const baseExercise: RenderableExercise = {
    slug: 'test-exercise',
    prompt: 'Static prompt',
    expectedAnswer: 'static answer',
    acceptedSolutions: [],
  };

  it('passes through static exercises unchanged', () => {
    const result = renderExercise(baseExercise, 'user-1', new Date());
    expect(result.prompt).toBe('Static prompt');
    expect(result.expectedAnswer).toBe('static answer');
    expect(result._generatedParams).toBeUndefined();
    expect(result._seed).toBeUndefined();
  });

  it('renders templates with generated params', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Get chars from {{start}} to {{end}}',
      expectedAnswer: 's[{{start}}:{{end}}]',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.prompt).toBe('Get chars from 2 to 6');
    expect(result.expectedAnswer).toBe('s[2:6]');
    expect(result._generatedParams).toEqual({ start: 2, end: 6, name: 'test' });
    expect(result._seed).toBeDefined();
  });

  it('renders acceptedSolutions templates', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Test',
      expectedAnswer: 's[{{start}}:{{end}}]',
      acceptedSolutions: ['s[{{start}}:{{end}}]', '{{name}}[{{start}}:{{end}}]'],
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.acceptedSolutions).toEqual(['s[2:6]', 'test[2:6]']);
  });

  it('renders code template for predict exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      code: 'print(s[{{start}}:{{end}}])',
      expectedAnswer: '{{name}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.code).toBe('print(s[2:6])');
    expect(result.expectedAnswer).toBe('test');
  });

  it('renders template for fill-in exercises', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      template: 'result = s[___:{{end}}]',
      expectedAnswer: '{{start}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date('2026-01-15'));

    expect(result.template).toBe('result = s[___:6]');
    expect(result.expectedAnswer).toBe('2');
  });

  it('warns and passes through for unknown generator', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'non-existent',
      prompt: 'Template {{value}}',
      expectedAnswer: '{{value}}',
    };

    const result = renderExercise(exercise, 'user-1', new Date());

    expect(result.prompt).toBe('Template {{value}}');
    expect(result._generatedParams).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent'));

    warnSpy.mockRestore();
  });

  it('produces same output for same (user, exercise, date)', () => {
    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'test-render-gen',
      prompt: 'Index {{start}}',
      expectedAnswer: '{{start}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-123', date);
    const result2 = renderExercise(exercise, 'user-123', date);

    expect(result1.prompt).toBe(result2.prompt);
    expect(result1._seed).toBe(result2._seed);
  });

  it('produces different output for different users', () => {
    // Need a generator that actually varies
    const varyingGenerator: Generator = {
      name: 'varying-gen',
      generate: (seed) => {
        // Use seed to produce different values
        const num = seed.charCodeAt(0) % 10;
        return { value: num };
      },
      validate: () => true,
    };
    registerGenerator(varyingGenerator);

    const exercise: RenderableExercise = {
      ...baseExercise,
      generator: 'varying-gen',
      prompt: 'Value: {{value}}',
      expectedAnswer: '{{value}}',
    };

    const date = new Date('2026-01-15');
    const result1 = renderExercise(exercise, 'user-aaa', date);
    const result2 = renderExercise(exercise, 'user-zzz', date);

    // Seeds should differ
    expect(result1._seed).not.toBe(result2._seed);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/render.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

Create `src/lib/generators/render.ts`:

```typescript
// src/lib/generators/render.ts
// Template rendering pipeline for parameterized exercises

import Mustache from 'mustache';
import { createSeed } from './seed';
import { getGenerator } from './index';
import type { GeneratorParams, RenderedExerciseMetadata } from './types';

// Disable Mustache's HTML escaping (we're not rendering to HTML)
Mustache.escape = (text: string) => text;

/**
 * Minimum exercise interface required for rendering.
 * This allows renderExercise to work with both full Exercise objects
 * and partial test fixtures.
 */
export interface RenderableExercise {
  slug: string;
  prompt: string;
  expectedAnswer: string;
  acceptedSolutions: string[];
  generator?: string;
  code?: string;
  template?: string;
}

/**
 * Rendered exercise with original fields plus generator metadata.
 */
export type RenderedExercise<T extends RenderableExercise> = T & RenderedExerciseMetadata;

/**
 * Render a parameterized exercise by interpolating templates.
 *
 * Static exercises (no generator field) pass through unchanged.
 * Dynamic exercises have their templates rendered with generated params.
 *
 * @param exercise - Exercise to render (may have generator field)
 * @param userId - User ID for seed generation
 * @param dueDate - Due date for seed generation
 * @returns Exercise with rendered templates and metadata
 */
export function renderExercise<T extends RenderableExercise>(
  exercise: T,
  userId: string,
  dueDate: Date
): RenderedExercise<T> {
  // Static exercises pass through unchanged
  if (!exercise.generator) {
    return exercise as RenderedExercise<T>;
  }

  // Look up generator
  const generator = getGenerator(exercise.generator);
  if (!generator) {
    console.warn(`Unknown generator: ${exercise.generator} for exercise ${exercise.slug}`);
    return exercise as RenderedExercise<T>;
  }

  // Generate parameters from seed
  const seed = createSeed(userId, exercise.slug, dueDate);
  const params = generator.generate(seed);

  // Render all template fields
  const rendered: RenderedExercise<T> = {
    ...exercise,
    prompt: Mustache.render(exercise.prompt, params),
    expectedAnswer: Mustache.render(exercise.expectedAnswer, params),
    acceptedSolutions: exercise.acceptedSolutions.map((s) =>
      Mustache.render(s, params)
    ),
    _generatedParams: params,
    _seed: seed,
  };

  // Render optional fields if present
  if (exercise.code) {
    rendered.code = Mustache.render(exercise.code, params);
  }
  if (exercise.template) {
    rendered.template = Mustache.render(exercise.template, params);
  }

  return rendered;
}

/**
 * Batch render multiple exercises for a session.
 */
export function renderExercises<T extends RenderableExercise>(
  exercises: T[],
  userId: string,
  dueDate: Date
): RenderedExercise<T>[] {
  return exercises.map((e) => renderExercise(e, userId, dueDate));
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/render.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/render.ts tests/unit/generators/render.test.ts
git commit -m "feat(generators): add template rendering pipeline

- renderExercise interpolates {{param}} templates
- Static exercises pass through unchanged
- Attaches _generatedParams and _seed metadata
- renderExercises for batch processing"
```

---

## Task 9: Update YAML Types for Generator Fields

**Files:**
- Modify: `src/lib/exercise/yaml-types.ts`
- Modify: `tests/unit/exercise/yaml-validation.test.ts`

**Step 1: Update the YAML types**

Edit `src/lib/exercise/yaml-types.ts` to add generator fields:

```typescript
// Add to YamlExercise interface (after existing fields):

  // Dynamic exercise generation (optional)
  generator?: string;

  // Target construct for two-pass grading (optional)
  target_construct?: {
    type: string;
    feedback?: string;
  };

  // Execution verification flag (optional, for write exercises)
  verify_by_execution?: boolean;
```

**Step 2: Add validation test**

Add to `tests/unit/exercise/yaml-validation.test.ts`:

```typescript
describe('generator field validation', () => {
  it('accepts exercises with generator field', () => {
    const exercise: YamlExercise = {
      slug: 'dynamic-test',
      title: 'Dynamic Test',
      prompt: 'Get chars from {{start}} to {{end}}',
      expected_answer: 's[{{start}}:{{end}}]',
      hints: ['Use slice'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'indexing',
      objective: 'Practice dynamic slicing',
      generator: 'slice-bounds',
    };
    // Should not throw
    expect(exercise.generator).toBe('slice-bounds');
  });

  it('accepts exercises with target_construct', () => {
    const exercise: YamlExercise = {
      slug: 'construct-test',
      title: 'Construct Test',
      prompt: 'Sum the list',
      expected_answer: 'sum(nums)',
      hints: ['Use sum()'],
      concept: 'collections',
      subconcept: 'lists',
      level: 'practice',
      prereqs: [],
      type: 'write',
      pattern: 'aggregation',
      objective: 'Use built-in sum',
      target_construct: {
        type: 'builtin',
        feedback: 'Try using the sum() function',
      },
    };
    expect(exercise.target_construct?.type).toBe('builtin');
  });
});
```

**Step 3: Run tests**

Run: `pnpm test tests/unit/exercise/yaml-validation.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/exercise/yaml-types.ts tests/unit/exercise/yaml-validation.test.ts
git commit -m "feat(yaml): add generator and target_construct fields

- generator: reference to TypeScript generator
- target_construct: for two-pass grading
- verify_by_execution: opt-in Pyodide verification"
```

---

## Task 10: Update App Exercise Type

**Files:**
- Modify: `src/lib/types/app.types.ts`

**Step 1: Update the Exercise interface**

Edit `src/lib/types/app.types.ts` to add generator-related fields to the `Exercise` interface:

```typescript
// Add these properties to the Exercise interface:

  /** Generator name for dynamic exercises (optional) */
  generator?: string;

  /** Target construct for two-pass grading (optional) */
  targetConstruct?: {
    type: string;
    feedback?: string;
  };

  /** Verify answer by execution (optional, for write exercises) */
  verifyByExecution?: boolean;
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/lib/types/app.types.ts
git commit -m "feat(types): add generator fields to Exercise interface

- generator: optional generator name
- targetConstruct: for two-pass grading
- verifyByExecution: opt-in Pyodide flag"
```

---

## Task 11: Update Exercise Mapper

**Files:**
- Modify: `src/lib/supabase/mappers.ts`
- Test: Verify existing mapper tests still pass

**Step 1: Update mapExercise to include new fields**

Edit `src/lib/supabase/mappers.ts` to map the new fields from database:

```typescript
// In mapExercise function, add:
generator: row.generator ?? undefined,
targetConstruct: row.target_construct ? {
  type: row.target_construct.type,
  feedback: row.target_construct.feedback,
} : undefined,
verifyByExecution: row.verify_by_execution ?? false,
```

**Step 2: Run existing tests**

Run: `pnpm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/lib/supabase/mappers.ts
git commit -m "feat(mappers): map generator fields from database

- Maps generator, target_construct, verify_by_execution
- Maintains backward compatibility"
```

---

## Task 12: Integration Test - Full Render Flow

**Files:**
- Create: `tests/integration/generators/render-flow.test.ts`

**Step 1: Write integration test**

Create `tests/integration/generators/render-flow.test.ts`:

```typescript
// tests/integration/generators/render-flow.test.ts
import { describe, it, expect } from 'vitest';
import { renderExercise } from '@/lib/generators/render';
import { getGenerator, hasGenerator } from '@/lib/generators';
import type { Exercise } from '@/lib/types';

describe('Generator render flow integration', () => {
  it('slice-bounds generator is registered and functional', () => {
    expect(hasGenerator('slice-bounds')).toBe(true);
    const gen = getGenerator('slice-bounds');
    expect(gen).toBeDefined();

    const params = gen!.generate('integration-test-seed');
    expect(gen!.validate(params)).toBe(true);
  });

  it('renders a dynamic exercise with slice-bounds', () => {
    // Simulate a full Exercise object as would come from database
    const exercise = {
      id: 'test-id',
      slug: 'string-slice-dynamic',
      title: 'Dynamic Slicing',
      prompt: 'Get characters from index {{start}} to {{end}} (exclusive)',
      expectedAnswer: 's[{{start}}:{{end}}]',
      acceptedSolutions: ['s[{{start}}:{{end}}]'],
      hints: ['Use slice notation'],
      concept: 'strings',
      subconcept: 'slicing',
      level: 'practice',
      prereqs: ['strings.indexing'],
      exerciseType: 'write',
      pattern: 'indexing',
      objective: 'Practice dynamic slicing',
      generator: 'slice-bounds',
      difficulty: 2,
      language: 'python',
      category: 'strings',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Exercise;

    const rendered = renderExercise(exercise, 'user-123', new Date('2026-01-15'));

    // Should have concrete values, not templates
    expect(rendered.prompt).not.toContain('{{');
    expect(rendered.expectedAnswer).not.toContain('{{');
    expect(rendered.acceptedSolutions[0]).not.toContain('{{');

    // Should have metadata
    expect(rendered._generatedParams).toBeDefined();
    expect(rendered._seed).toBeDefined();

    // Params should satisfy constraints
    const params = rendered._generatedParams!;
    expect(typeof params.start).toBe('number');
    expect(typeof params.end).toBe('number');
    expect(params.end).toBeGreaterThan(params.start as number);
  });

  it('static exercises pass through unchanged', () => {
    const exercise = {
      slug: 'static-exercise',
      prompt: 'Print hello world',
      expectedAnswer: 'print("hello world")',
      acceptedSolutions: [],
    };

    const rendered = renderExercise(exercise, 'user-123', new Date());

    expect(rendered.prompt).toBe('Print hello world');
    expect(rendered._generatedParams).toBeUndefined();
    expect(rendered._seed).toBeUndefined();
  });

  it('same user/exercise/date always produces same render', () => {
    const exercise = {
      slug: 'determinism-test',
      prompt: 'Index {{start}}',
      expectedAnswer: '{{start}}',
      acceptedSolutions: [],
      generator: 'slice-bounds',
    };

    const date = new Date('2026-01-15');
    const r1 = renderExercise(exercise, 'user-abc', date);
    const r2 = renderExercise(exercise, 'user-abc', date);

    expect(r1.prompt).toBe(r2.prompt);
    expect(r1.expectedAnswer).toBe(r2.expectedAnswer);
    expect(r1._seed).toBe(r2._seed);
  });
});
```

**Step 2: Run integration test**

Run: `pnpm test tests/integration/generators/render-flow.test.ts`
Expected: PASS

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/generators/render-flow.test.ts
git commit -m "test(generators): add integration test for render flow

- Verifies slice-bounds registration
- Tests full exercise rendering
- Confirms determinism and static passthrough"
```

---

## Task 13: Final Phase 1 Verification

**Step 1: Run full test suite**

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

Expected: No lint errors (or only pre-existing ones)

**Step 4: Create Phase 1 completion commit**

```bash
git add -A
git commit -m "feat(generators): complete Phase 1 - Foundation

Phase 1 establishes generator infrastructure:
- Generator type system with params, validation
- Deterministic seed generation (user/exercise/date)
- Seeded random utilities (int, pick, shuffle)
- slice-bounds generator with property-based tests
- Template rendering pipeline with Mustache
- YAML and app type updates for generator fields

Ready for Phase 2: Grading Infrastructure"
```

---

## Phase 1 Checklist

- [ ] Dependencies installed (mustache, seedrandom, fast-check)
- [ ] Generator types defined
- [ ] Seed generation working
- [ ] Seeded random utilities working
- [ ] slice-bounds generator implemented
- [ ] Property-based tests passing
- [ ] Generator registry working
- [ ] Render pipeline working
- [ ] YAML types updated
- [ ] App types updated
- [ ] Mappers updated
- [ ] Integration tests passing
- [ ] All tests passing
- [ ] No type errors
- [ ] No lint errors

---

## Next Phase

Proceed to **Phase 2: Grading Infrastructure** which builds:
- Two-pass grading system
- AST construct checking
- Updated ExerciseCard component
- CoachingFeedback component
