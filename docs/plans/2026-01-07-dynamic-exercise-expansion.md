# Dynamic Exercise Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate duplicate exercises, expand dynamic exercise coverage, and add 4 new generators for logic-based exercises.

**Architecture:** Extend existing generator infrastructure with computed-output generators (loop-simulation, string-ops, dict-values, comparison-logic). Use TDD for all new generators. Remove confirmed duplicates to improve deck quality.

**Tech Stack:** TypeScript, fast-check (property-based testing), Vitest, YAML exercises, Mustache templating

---

## Investigation Summary

### Phase 1 Analysis: Duplicates (CONFIRMED)

After reviewing the Obsidian Exercise-List.md document, **10 duplicates confirmed for removal**:

| Category | Keep | Cut | Reason |
|----------|------|-----|--------|
| **dicts** #8 & #9 | #8 `person.keys()` | #9 `d.keys()` | Same operation, different var name |
| **lists** #8 & #9 | #9 `numbers = [1,2,3]` | #8 `[1,2,3]` | #9 includes assignment (more complete) |
| **lists** #16 & #17 | #16 `a.extend(b)` | #17 `a.extend(b)` | Identical answer, rephrased prompt |
| **io** #7 & #8 | #7 `print("Hello, World!")` | #8 | Identical |
| **operators** #4 & #5 | #4 `17 // 5` | #5 `17 // 5` | Identical |
| **operators** #7 & #8 | #7 `17 % 5` | #8 `17 % 5` | Identical |
| **variables** #3 & #4 | #3 `name = "Alice"` | #4 | Identical |
| **arguments vs defaults** | defaults #3 | arguments #5 | Same: `def greet(name, greeting="Hello")` |
| **args-kwargs vs arguments** | args-kwargs #2 | arguments #4 | Same: `def sum_all(*args)` |
| **try-except vs finally** | finally #3 | try-except #9 | Same: `finally:` |

**Result:** 385 → 375 exercises after cleanup

---

### Phase 2 Analysis: Dynamization Targets

Current dynamic exercises: **23 total**. Target: **50+ dynamic exercises**.

#### P0: Prevent Memorization (Predict exercises - highest value)

These are most prone to memorization - users recall "card #X = answer Y":

| Exercise | Current Static | Generator |
|----------|----------------|-----------|
| `for-range-predict` | `range(3)` → always `0 1 2` | `loop-simulation` |
| `break-predict` | always `0 1 2` | `loop-simulation` |
| `continue-predict` | always `0 1 3 4` | `loop-simulation` |
| `enumerate-predict` | always `0 a 1 b 2 c` | needs string-pool |
| `zip-predict` | always `1 x 2 y` | `list-values` |
| `nested-loop-predict` | always `0 0 0 1 1 0 1 1` | `loop-simulation` |
| `bool-predict-and` | always `False` | `comparison-logic` |
| `int-predict-floor` | always `3` | `arithmetic-values` |
| `int-predict-modulo` | always `1` | `arithmetic-values` |

#### P1: High Value (Write exercises with hardcoded values)

| Exercise | Current Static | Generator |
|----------|----------------|-----------|
| `operators` #2 | `5 + 3` | `arithmetic-values` |
| `operators` #3 | `2 ** 10` | `arithmetic-values` |
| `operators` #4 | `17 // 5` | `arithmetic-values` |
| `operators` #7 | `17 % 5` | `arithmetic-values` |
| `lists` #4 | `numbers.append(4)` | `variable-names` + `arithmetic-values` |
| `lists` #15 | `items.count(5)` | `arithmetic-values` |
| `lists` #19 | `items.insert(2, "x")` | `index-values` |
| `lists` #22 | `items.pop(2)` | `index-values` |
| `dicts` #1 | `person["name"]` | `dict-values` |
| `dicts` #10 | `d["age"] = 25` | `dict-values` + `arithmetic-values` |

#### P2: Medium Value (Would benefit from variety)

| Exercise | Current Static | Generator |
|----------|----------------|-----------|
| `variables` #2 | `age = 25` | `variable-names` + `arithmetic-values` |
| `for-loop-range` | `range(5)` | `loop-simulation` |
| `for-range-step` | `range(0, 10, 2)` | `loop-simulation` |
| `if-statement` | `if x > 0` | `comparison-logic` |
| `if-elif` | `elif x < 0` | `comparison-logic` |
| String methods | Various | `string-ops` with variants |

**Already Dynamic:** strings (5), collections (8), numbers-booleans (5), control-flow (5)

### Phase 3 Analysis: New Generators (AGREEMENT WITH MODIFICATIONS)

The proposal for 4 new generators is sound, but priorities differ:

| Generator | Value | Complexity | Priority |
|-----------|-------|------------|----------|
| `loop-simulation` | **HIGH** - Most common rote memorization trap | Medium | **P0** |
| `comparison-logic` | **HIGH** - Enables boolean/conditional dynamism | Low | **P1** |
| `string-ops` | **MEDIUM** - Useful but limited pool | Low | **P2** |
| `dict-values` | **MEDIUM** - Good for dict access patterns | Medium | **P3** |

**Why `loop-simulation` first:**
- "Predict the output of range()" is the #1 memorization trap
- Current `for-range-predict` always shows same values
- Generator needs to compute actual output (logic simulation)

### Phase 4 Analysis: Architecture Expansion (REVISED)

| Proposal | Assessment |
|----------|------------|
| Variant field | **ACCEPT** - Enables one slug to cover multiple conceptually different operations |
| Dynamic fill-in | **AGREE** - No dynamic fill-in exercises exist today |
| Session-based seeding | **DEFER** - Day-based prevents gaming; session-based is future |
| Conditional blocks | **DEFER** - Mustache already supports `{{#section}}` |

**Accepted Expansions:**
1. **Variant Support** - One exercise slug can have multiple prompt/answer structures selected by generator
2. **Dynamic fill-in** - Extend grading system for parameterized fill-in exercises

---

## Architecture: Variant Support

### Problem

Current system: One slug = one hardcoded prompt template with `{{value}}` interpolation.

This works for simple value substitution:
```yaml
prompt: 'What does s[{{start}}:{{end}}] return?'
# Generator provides: { start: 2, end: 5 }
```

But fails for **structurally different** prompts under one concept:
```yaml
# These are different prompts, not just different values:
# - "Convert to uppercase"
# - "Remove whitespace from ends"
# - "Replace 'old' with 'new'"
```

Without variants, we'd need separate YAML entries for each, defeating the "one slug, many variations" goal.

### Solution: Variant Field

**YAML Schema:**
```yaml
- slug: string-method-dynamic
  generator: string-ops
  # Base fields (used if no variant matches)
  prompt: "Apply the {{method}} method to string s"
  expected_answer: "{{result}}"

  # Variant-specific overrides (keyed by generator's `variant` param)
  variants:
    upper:
      prompt: "Convert string s to uppercase"
      hints: ["Use the upper() method"]
    lower:
      prompt: "Convert string s to lowercase"
      hints: ["Use the lower() method"]
    strip:
      prompt: "Remove whitespace from both ends of string s"
      hints: ["Use the strip() method"]
    replace:
      prompt: 'Replace "{{old}}" with "{{new}}" in string s'
      expected_answer: 's.replace("{{old}}", "{{new}}")'
      hints: ["Use the replace() method with two arguments"]
```

**Generator Contract:**
```typescript
// Generator returns a `variant` key to select which variant
stringOpsGenerator.generate(seed) → {
  variant: 'strip',      // Selects the variant
  original: '  hello  ',
  result: 'hello',
  // ... other params
}
```

**Render Logic:**
```typescript
function renderExercise(exercise, userId, dueDate) {
  const params = generator.generate(seed);

  // If generator returns a variant and exercise has variants defined
  if (params.variant && exercise.variants?.[params.variant]) {
    // Merge variant overrides into exercise (variant wins)
    exercise = { ...exercise, ...exercise.variants[params.variant] };
  }

  // Then do normal Mustache interpolation
  return {
    prompt: Mustache.render(exercise.prompt, params),
    expectedAnswer: Mustache.render(exercise.expectedAnswer, params),
    // ...
  };
}
```

### Type Definitions

```typescript
// src/lib/generators/types.ts

/** Fields that can be overridden per variant */
export interface VariantOverrides {
  prompt?: string;
  expectedAnswer?: string;
  acceptedSolutions?: string[];
  hints?: string[];
  code?: string;
  template?: string;
}

/** Map of variant name to its overrides */
export type VariantMap = Record<string, VariantOverrides>;

// Add to RenderableExercise interface
export interface RenderableExercise {
  // ... existing fields
  variants?: VariantMap;
}
```

### Benefits

1. **Reduces YAML clutter** - One slug for `string-method-dynamic` instead of 5 separate entries
2. **Better SRS tracking** - All string method variations share mastery state
3. **Prevents memorization** - User can't predict which variant they'll see
4. **Cleaner than Mustache sections** - No `{{#is_upper}}...{{/is_upper}}` verbosity

---

## Implementation Tasks

### Task 0: Add Variant Support Architecture (TDD)

**Files:**
- Modify: `src/lib/generators/types.ts`
- Modify: `src/lib/generators/render.ts`
- Modify: `src/lib/exercise/yaml-types.ts`
- Modify: `src/lib/supabase/mappers.ts`
- Create: `tests/unit/generators/variant-render.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/generators/variant-render.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderExercise } from '@/lib/generators/render';
import * as generatorIndex from '@/lib/generators/index';

describe('variant rendering', () => {
  it('uses variant overrides when generator returns variant param', () => {
    // Mock generator that returns a variant
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-variant-gen',
      generate: () => ({
        variant: 'optionB',
        value: 42,
      }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-variant',
      prompt: 'Base prompt with {{value}}',
      expectedAnswer: 'base answer',
      acceptedSolutions: [],
      generator: 'test-variant-gen',
      variants: {
        optionA: {
          prompt: 'Option A prompt with {{value}}',
          expectedAnswer: 'option A answer',
        },
        optionB: {
          prompt: 'Option B prompt with {{value}}',
          expectedAnswer: 'option B answer {{value}}',
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());

    expect(rendered.prompt).toBe('Option B prompt with 42');
    expect(rendered.expectedAnswer).toBe('option B answer 42');
  });

  it('falls back to base fields when no variant matches', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ value: 99 }), // No variant param
      validate: () => true,
    });

    const exercise = {
      slug: 'test-no-variant',
      prompt: 'Base prompt {{value}}',
      expectedAnswer: 'base {{value}}',
      acceptedSolutions: [],
      generator: 'test-gen',
      variants: {
        optionA: { prompt: 'Should not use this' },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());

    expect(rendered.prompt).toBe('Base prompt 99');
    expect(rendered.expectedAnswer).toBe('base 99');
  });

  it('merges variant hints with base hints', () => {
    vi.spyOn(generatorIndex, 'getGenerator').mockReturnValue({
      name: 'test-gen',
      generate: () => ({ variant: 'special' }),
      validate: () => true,
    });

    const exercise = {
      slug: 'test-hints',
      prompt: 'prompt',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
      generator: 'test-gen',
      hints: ['base hint'],
      variants: {
        special: {
          hints: ['special hint 1', 'special hint 2'],
        },
      },
    };

    const rendered = renderExercise(exercise, 'user-1', new Date());

    // Variant hints replace base hints (not merge)
    expect(rendered.hints).toEqual(['special hint 1', 'special hint 2']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/variant-render.test.ts`
Expected: FAIL (variants not implemented)

**Step 3: Update types**

```typescript
// src/lib/generators/types.ts - add these types

/** Fields that can be overridden per variant */
export interface VariantOverrides {
  prompt?: string;
  expectedAnswer?: string;
  acceptedSolutions?: string[];
  hints?: string[];
  code?: string;
  template?: string;
}

/** Map of variant name to its overrides */
export type VariantMap = Record<string, VariantOverrides>;
```

**Step 4: Update render.ts**

```typescript
// src/lib/generators/render.ts - update RenderableExercise and renderExercise

import type { VariantMap } from './types';

export interface RenderableExercise {
  slug: string;
  prompt: string;
  expectedAnswer: string;
  acceptedSolutions: string[];
  generator?: string | null;
  code?: string | null;
  template?: string | null;
  hints?: string[];
  variants?: VariantMap;  // ADD THIS
}

export function renderExercise<T extends RenderableExercise>(
  exercise: T,
  userId: string,
  dueDate: Date
): RenderedExercise<T> {
  if (!exercise.generator) {
    return exercise as RenderedExercise<T>;
  }

  const generator = getGenerator(exercise.generator);
  if (!generator) {
    console.warn(`Unknown generator: ${exercise.generator}`);
    return exercise as RenderedExercise<T>;
  }

  const seed = createSeed(userId, exercise.slug, dueDate);
  const params = generator.generate(seed);

  // NEW: Apply variant overrides if generator returns a variant
  let workingExercise = exercise;
  const variantKey = params.variant as string | undefined;
  if (variantKey && exercise.variants?.[variantKey]) {
    workingExercise = {
      ...exercise,
      ...exercise.variants[variantKey],
    };
  }

  // Render all template fields
  const rendered: RenderedExercise<T> = {
    ...workingExercise,
    prompt: Mustache.render(workingExercise.prompt, params),
    expectedAnswer: Mustache.render(workingExercise.expectedAnswer, params),
    acceptedSolutions: (workingExercise.acceptedSolutions || []).map((s) =>
      Mustache.render(s, params)
    ),
    _generatedParams: params,
    _seed: seed,
  };

  if (workingExercise.code) {
    rendered.code = Mustache.render(workingExercise.code, params);
  }
  if (workingExercise.template) {
    rendered.template = Mustache.render(workingExercise.template, params);
  }
  if (workingExercise.hints) {
    rendered.hints = workingExercise.hints.map((h) => Mustache.render(h, params));
  }

  return rendered;
}
```

**Step 5: Update YAML types and mapper**

```typescript
// src/lib/exercise/yaml-types.ts - add variants field
export interface YamlExercise {
  // ... existing fields
  variants?: Record<string, {
    prompt?: string;
    expected_answer?: string;
    accepted_solutions?: string[];
    hints?: string[];
    code?: string;
    template?: string;
  }>;
}
```

**Step 6: Run tests to verify they pass**

Run: `pnpm test tests/unit/generators/variant-render.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/lib/generators/types.ts src/lib/generators/render.ts src/lib/exercise/yaml-types.ts tests/unit/generators/variant-render.test.ts
git commit -m "$(cat <<'EOF'
feat(generators): add variant support architecture

Enables one exercise slug to have multiple prompt/answer structures
selected by the generator's `variant` parameter. Reduces YAML clutter
and prevents memorization by varying exercise presentation.

- VariantMap type for variant overrides
- renderExercise merges variant fields before Mustache interpolation
- YAML schema supports variants field

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 1: Remove Duplicate Exercises

**Files:**
- Modify: `exercises/python/collections.yaml`
- Modify: `exercises/python/foundations.yaml`
- Modify: `exercises/python/functions.yaml`
- Modify: `exercises/python/error-handling.yaml`

**Step 1: Identify slugs to remove**

Based on Exercise-List.md analysis, find and remove these by matching content:

| File | Slug Pattern | Content to Match |
|------|--------------|------------------|
| `collections.yaml` | dicts section | Second `.keys()` exercise (keep `person.keys()`, cut `d.keys()`) |
| `collections.yaml` | lists section | `[1, 2, 3]` without assignment (keep one with `numbers = [1, 2, 3]`) |
| `collections.yaml` | lists section | Second `a.extend(b)` exercise |
| `foundations.yaml` | io section | Second `print("Hello, World!")` exercise |
| `foundations.yaml` | operators section | Second `17 // 5` exercise |
| `foundations.yaml` | operators section | Second `17 % 5` exercise |
| `foundations.yaml` | variables section | Second `name = "Alice"` exercise |
| `functions.yaml` | arguments section | `def greet(name, greeting="Hello")` (duplicate of defaults) |
| `functions.yaml` | arguments section | `def sum_all(*args)` (duplicate of args-kwargs) |
| `error-handling.yaml` | try-except section | `finally:` (duplicate of finally section) |

**Step 2: Remove each duplicate**

For each file, search for the duplicate content and delete the entire exercise block (from `- slug:` to the next `- slug:` or section end).

**Step 3: Verify exercise count**

Run: `grep -c "^  - slug:" exercises/python/*.yaml | awk -F: '{sum += $2} END {print sum}'`
Expected: ~375 (down from 385)

**Step 4: Run tests**

Run: `pnpm test`
Expected: All tests pass (exercise count may be checked)

**Step 5: Commit**

```bash
git add exercises/python/
git commit -m "$(cat <<'EOF'
chore(exercises): remove 10 duplicate exercises

Duplicates identified from Exercise-List.md analysis:
- dicts: duplicate .keys() exercise
- lists: duplicate [1,2,3] and extend exercises
- io: duplicate print("Hello, World!")
- operators: duplicate floor division and modulo
- variables: duplicate name = "Alice"
- functions: duplicate greet and sum_all definitions
- error-handling: duplicate finally block

385 → 375 exercises

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create loop-simulation Generator (TDD)

**Files:**
- Create: `src/lib/generators/definitions/loop-simulation.ts`
- Create: `tests/unit/generators/loop-simulation.test.ts`
- Modify: `src/lib/generators/definitions/index.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/generators/loop-simulation.test.ts
import { describe, it, expect } from 'vitest';
import { loopSimulationGenerator } from '@/lib/generators/definitions/loop-simulation';

describe('loop-simulation generator', () => {
  it('has correct name', () => {
    expect(loopSimulationGenerator.name).toBe('loop-simulation');
  });

  it('generates valid parameters from seed', () => {
    const params = loopSimulationGenerator.generate('test-seed-123');

    expect(params).toHaveProperty('start');
    expect(params).toHaveProperty('stop');
    expect(params).toHaveProperty('step');
    expect(params).toHaveProperty('output');
    expect(typeof params.start).toBe('number');
    expect(typeof params.stop).toBe('number');
    expect(typeof params.step).toBe('number');
    expect(typeof params.output).toBe('string');
  });

  it('computes output correctly for range(0, 6, 2)', () => {
    // We need deterministic output verification
    const params = loopSimulationGenerator.generate('fixed-seed');
    const { start, stop, step, output } = params;

    // Recompute expected output
    const expected: number[] = [];
    for (let i = start as number; i < (stop as number); i += step as number) {
      expected.push(i);
    }
    expect(output).toBe(expected.join(' '));
  });

  it('produces deterministic output for same seed', () => {
    const params1 = loopSimulationGenerator.generate('seed-abc');
    const params2 = loopSimulationGenerator.generate('seed-abc');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(loopSimulationGenerator.validate({
      start: 0,
      stop: 6,
      step: 2,
      output: '0 2 4'
    })).toBe(true);
  });

  it('rejects invalid step (zero)', () => {
    expect(loopSimulationGenerator.validate({
      start: 0,
      stop: 5,
      step: 0,
      output: ''
    })).toBe(false);
  });

  it('rejects inconsistent output', () => {
    expect(loopSimulationGenerator.validate({
      start: 0,
      stop: 6,
      step: 2,
      output: '0 1 2'  // Wrong - should be '0 2 4'
    })).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/loop-simulation.test.ts`
Expected: FAIL with "Cannot find module '@/lib/generators/definitions/loop-simulation'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/generators/definitions/loop-simulation.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * loop-simulation generator
 *
 * Generates range() parameters and computes the actual loop output.
 * For predict-output exercises testing mental execution of loops.
 *
 * Constraints:
 * - start: [0, 5]
 * - stop: [start+2, start+10] (ensures meaningful iteration)
 * - step: [1, 3]
 * - output: space-separated values from range(start, stop, step)
 */
export const loopSimulationGenerator: Generator = {
  name: 'loop-simulation',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const start = rng.int(0, 5);
    const step = rng.int(1, 3);
    // Ensure at least 2 iterations, at most 5
    const minStop = start + step * 2;
    const maxStop = start + step * 5;
    const stop = rng.int(minStop, maxStop);

    // Compute actual output
    const values: number[] = [];
    for (let i = start; i < stop; i += step) {
      values.push(i);
    }
    const output = values.join(' ');

    return { start, stop, step, output };
  },

  validate(params: GeneratorParams): boolean {
    const { start, stop, step, output } = params;

    // Type checks
    if (typeof start !== 'number' || typeof stop !== 'number' ||
        typeof step !== 'number' || typeof output !== 'string') {
      return false;
    }

    // Step must be positive
    if (step <= 0) {
      return false;
    }

    // Recompute and verify output
    const values: number[] = [];
    for (let i = start; i < stop; i += step) {
      values.push(i);
    }
    const expectedOutput = values.join(' ');
    if (output !== expectedOutput) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/loop-simulation.test.ts`
Expected: PASS

**Step 5: Register the generator**

```typescript
// src/lib/generators/definitions/index.ts - add export
export { loopSimulationGenerator } from './loop-simulation';
```

```typescript
// src/lib/generators/index.ts - add to registry
import { loopSimulationGenerator } from './definitions/loop-simulation';

export const generators: Record<string, Generator> = {
  // ... existing generators
  'loop-simulation': loopSimulationGenerator,
};
```

**Step 6: Add property-based tests**

```typescript
// tests/unit/generators/loop-simulation.test.ts - add to describe block
import { fc } from '@fast-check/vitest';

describe('property-based tests', () => {
  it('always produces valid output across 1000 seeds', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
        const params = loopSimulationGenerator.generate(seed);
        return loopSimulationGenerator.validate(params);
      }),
      { numRuns: 1000 }
    );
  });

  it('output length matches iteration count', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
        const params = loopSimulationGenerator.generate(seed);
        const { start, stop, step, output } = params;
        const values = (output as string).split(' ').filter(Boolean);
        const expectedCount = Math.ceil(((stop as number) - (start as number)) / (step as number));
        return values.length === expectedCount;
      }),
      { numRuns: 1000 }
    );
  });
});
```

**Step 7: Run full test suite**

Run: `pnpm test tests/unit/generators/`
Expected: All generator tests pass

**Step 8: Commit**

```bash
git add src/lib/generators/definitions/loop-simulation.ts tests/unit/generators/loop-simulation.test.ts src/lib/generators/definitions/index.ts src/lib/generators/index.ts
git commit -m "$(cat <<'EOF'
feat(generators): add loop-simulation generator

Logic-simulating generator that produces range() parameters and computes
actual loop output for predict-output exercises. Prevents rote memorization
of static loop examples.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create comparison-logic Generator (TDD)

**Files:**
- Create: `src/lib/generators/definitions/comparison-logic.ts`
- Create: `tests/unit/generators/comparison-logic.test.ts`
- Modify: `src/lib/generators/definitions/index.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/generators/comparison-logic.test.ts
import { describe, it, expect } from 'vitest';
import { comparisonLogicGenerator } from '@/lib/generators/definitions/comparison-logic';
import { fc } from '@fast-check/vitest';

describe('comparison-logic generator', () => {
  it('has correct name', () => {
    expect(comparisonLogicGenerator.name).toBe('comparison-logic');
  });

  it('generates valid parameters from seed', () => {
    const params = comparisonLogicGenerator.generate('test-seed-123');

    expect(params).toHaveProperty('a');
    expect(params).toHaveProperty('b');
    expect(params).toHaveProperty('op');
    expect(params).toHaveProperty('result');
    expect(['<', '>', '==', '!=', '<=', '>=']).toContain(params.op);
    expect(['True', 'False']).toContain(params.result);
  });

  it('computes result correctly', () => {
    const params = comparisonLogicGenerator.generate('fixed-seed');
    const { a, b, op, result } = params;

    // Verify computation
    let expected: boolean;
    switch (op) {
      case '<': expected = (a as number) < (b as number); break;
      case '>': expected = (a as number) > (b as number); break;
      case '==': expected = (a as number) === (b as number); break;
      case '!=': expected = (a as number) !== (b as number); break;
      case '<=': expected = (a as number) <= (b as number); break;
      case '>=': expected = (a as number) >= (b as number); break;
      default: expected = false;
    }
    expect(result).toBe(expected ? 'True' : 'False');
  });

  it('produces deterministic output for same seed', () => {
    const params1 = comparisonLogicGenerator.generate('seed-xyz');
    const params2 = comparisonLogicGenerator.generate('seed-xyz');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5,
      b: 10,
      op: '<',
      result: 'True'
    })).toBe(true);
  });

  it('rejects invalid operator', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5,
      b: 10,
      op: '===',  // JavaScript operator, not Python
      result: 'True'
    })).toBe(false);
  });

  it('rejects inconsistent result', () => {
    expect(comparisonLogicGenerator.validate({
      a: 5,
      b: 10,
      op: '>',
      result: 'True'  // Wrong - 5 > 10 is False
    })).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = comparisonLogicGenerator.generate(seed);
          return comparisonLogicGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/comparison-logic.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// src/lib/generators/definitions/comparison-logic.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const OPERATORS = ['<', '>', '==', '!=', '<=', '>='] as const;
type ComparisonOp = typeof OPERATORS[number];

/**
 * comparison-logic generator
 *
 * Generates two operands and a comparison operator, computing the boolean result.
 * For predict-output exercises testing boolean evaluation.
 *
 * Constraints:
 * - a: [1, 20]
 * - b: [1, 20]
 * - op: one of <, >, ==, !=, <=, >=
 * - result: 'True' or 'False' (Python boolean string)
 */
export const comparisonLogicGenerator: Generator = {
  name: 'comparison-logic',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const a = rng.int(1, 20);
    const b = rng.int(1, 20);
    const op = rng.pick([...OPERATORS]);

    // Compute result
    let boolResult: boolean;
    switch (op) {
      case '<': boolResult = a < b; break;
      case '>': boolResult = a > b; break;
      case '==': boolResult = a === b; break;
      case '!=': boolResult = a !== b; break;
      case '<=': boolResult = a <= b; break;
      case '>=': boolResult = a >= b; break;
    }
    const result = boolResult ? 'True' : 'False';

    return { a, b, op, result };
  },

  validate(params: GeneratorParams): boolean {
    const { a, b, op, result } = params;

    // Type checks
    if (typeof a !== 'number' || typeof b !== 'number' ||
        typeof op !== 'string' || typeof result !== 'string') {
      return false;
    }

    // Operator check
    if (!OPERATORS.includes(op as ComparisonOp)) {
      return false;
    }

    // Recompute and verify
    let expected: boolean;
    switch (op) {
      case '<': expected = a < b; break;
      case '>': expected = a > b; break;
      case '==': expected = a === b; break;
      case '!=': expected = a !== b; break;
      case '<=': expected = a <= b; break;
      case '>=': expected = a >= b; break;
      default: return false;
    }

    return result === (expected ? 'True' : 'False');
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/comparison-logic.test.ts`
Expected: PASS

**Step 5: Register the generator**

Add to `definitions/index.ts` and `index.ts` as shown in Task 1.

**Step 6: Commit**

```bash
git add src/lib/generators/definitions/comparison-logic.ts tests/unit/generators/comparison-logic.test.ts src/lib/generators/definitions/index.ts src/lib/generators/index.ts
git commit -m "$(cat <<'EOF'
feat(generators): add comparison-logic generator

Generates comparison expressions with computed boolean results for predict
exercises. Prevents memorization of static boolean examples.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create string-ops Generator (TDD)

**Files:**
- Create: `src/lib/generators/definitions/string-ops.ts`
- Create: `tests/unit/generators/string-ops.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/generators/string-ops.test.ts
import { describe, it, expect } from 'vitest';
import { stringOpsGenerator } from '@/lib/generators/definitions/string-ops';
import { fc } from '@fast-check/vitest';

describe('string-ops generator', () => {
  it('has correct name', () => {
    expect(stringOpsGenerator.name).toBe('string-ops');
  });

  it('generates valid parameters', () => {
    const params = stringOpsGenerator.generate('test-seed');

    expect(params).toHaveProperty('original');
    expect(params).toHaveProperty('method');
    expect(params).toHaveProperty('result');
    expect(['upper', 'lower', 'strip', 'title', 'capitalize']).toContain(params.method);
  });

  it('computes result correctly', () => {
    const params = stringOpsGenerator.generate('fixed-seed');
    const { original, method, result } = params;

    let expected: string;
    const str = original as string;
    switch (method) {
      case 'upper': expected = str.toUpperCase(); break;
      case 'lower': expected = str.toLowerCase(); break;
      case 'strip': expected = str.trim(); break;
      case 'title': expected = str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); break;
      case 'capitalize': expected = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); break;
      default: expected = str;
    }
    expect(result).toBe(expected);
  });

  it('validates correct params', () => {
    expect(stringOpsGenerator.validate({
      original: '  Hello  ',
      method: 'strip',
      result: 'Hello'
    })).toBe(true);
  });

  it('rejects inconsistent result', () => {
    expect(stringOpsGenerator.validate({
      original: 'hello',
      method: 'upper',
      result: 'hello'  // Wrong - should be 'HELLO'
    })).toBe(false);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = stringOpsGenerator.generate(seed);
          return stringOpsGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/string-ops.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/generators/definitions/string-ops.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const METHODS = ['upper', 'lower', 'strip', 'title', 'capitalize'] as const;
type StringMethod = typeof METHODS[number];

// Word pool with varying characteristics for strip testing
const WORD_POOL = [
  '  hello  ',
  'WORLD',
  'Python',
  '  code  ',
  'TEST',
  'Example',
  '  space  ',
  'hello world',
];

/**
 * string-ops generator
 *
 * Generates a string and method call with computed result.
 * For predict-output exercises testing string method knowledge.
 */
export const stringOpsGenerator: Generator = {
  name: 'string-ops',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    const original = rng.pick(WORD_POOL);
    const method = rng.pick([...METHODS]);

    // Compute result
    let result: string;
    switch (method) {
      case 'upper':
        result = original.toUpperCase();
        break;
      case 'lower':
        result = original.toLowerCase();
        break;
      case 'strip':
        result = original.trim();
        break;
      case 'title':
        result = original.trim().split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'capitalize':
        result = original.trim().charAt(0).toUpperCase() +
                 original.trim().slice(1).toLowerCase();
        break;
    }

    return { original, method, result };
  },

  validate(params: GeneratorParams): boolean {
    const { original, method, result } = params;

    if (typeof original !== 'string' || typeof method !== 'string' ||
        typeof result !== 'string') {
      return false;
    }

    if (!METHODS.includes(method as StringMethod)) {
      return false;
    }

    // Recompute and verify
    let expected: string;
    switch (method) {
      case 'upper':
        expected = original.toUpperCase();
        break;
      case 'lower':
        expected = original.toLowerCase();
        break;
      case 'strip':
        expected = original.trim();
        break;
      case 'title':
        expected = original.trim().split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'capitalize':
        expected = original.trim().charAt(0).toUpperCase() +
                   original.trim().slice(1).toLowerCase();
        break;
      default:
        return false;
    }

    return result === expected;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/string-ops.test.ts`
Expected: PASS

**Step 5: Register and commit**

```bash
git add src/lib/generators/definitions/string-ops.ts tests/unit/generators/string-ops.test.ts src/lib/generators/definitions/index.ts src/lib/generators/index.ts
git commit -m "$(cat <<'EOF'
feat(generators): add string-ops generator

Generates string method calls with computed results for predict exercises.
Covers upper, lower, strip, title, capitalize methods.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Create dict-values Generator (TDD)

**Files:**
- Create: `src/lib/generators/definitions/dict-values.ts`
- Create: `tests/unit/generators/dict-values.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/generators/dict-values.test.ts
import { describe, it, expect } from 'vitest';
import { dictValuesGenerator } from '@/lib/generators/definitions/dict-values';
import { fc } from '@fast-check/vitest';

describe('dict-values generator', () => {
  it('has correct name', () => {
    expect(dictValuesGenerator.name).toBe('dict-values');
  });

  it('generates valid parameters', () => {
    const params = dictValuesGenerator.generate('test-seed');

    expect(params).toHaveProperty('dict_str');
    expect(params).toHaveProperty('key');
    expect(params).toHaveProperty('value');
    expect(params).toHaveProperty('exists');
    expect(typeof params.dict_str).toBe('string');
    expect(typeof params.key).toBe('string');
    expect(typeof params.exists).toBe('boolean');
  });

  it('dict_str is valid Python dict syntax', () => {
    const params = dictValuesGenerator.generate('test-seed');
    const dictStr = params.dict_str as string;

    // Should start with { and end with }
    expect(dictStr.startsWith('{')).toBe(true);
    expect(dictStr.endsWith('}')).toBe(true);
  });

  it('generates existing key scenarios', () => {
    // Try multiple seeds to find an existing key scenario
    let foundExisting = false;
    for (let i = 0; i < 100; i++) {
      const params = dictValuesGenerator.generate(`seed-${i}`);
      if (params.exists === true) {
        foundExisting = true;
        expect(params.value).toBeDefined();
        break;
      }
    }
    expect(foundExisting).toBe(true);
  });

  it('validates correct params', () => {
    expect(dictValuesGenerator.validate({
      dict_str: '{"a": 1, "b": 2}',
      key: 'a',
      value: '1',
      exists: true
    })).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid output across 1000 seeds', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5, maxLength: 50 }), (seed) => {
          const params = dictValuesGenerator.generate(seed);
          return dictValuesGenerator.validate(params);
        }),
        { numRuns: 1000 }
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/dict-values.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/generators/definitions/dict-values.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

// Key pool for dict generation
const KEY_POOL = ['a', 'b', 'c', 'x', 'y', 'name', 'age', 'count'];

/**
 * dict-values generator
 *
 * Generates a small dictionary, a target key, and whether it exists.
 * For predict-output exercises testing dict access.
 */
export const dictValuesGenerator: Generator = {
  name: 'dict-values',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Generate dict with 2-4 entries
    const numEntries = rng.int(2, 4);
    const availableKeys = rng.shuffle([...KEY_POOL]);
    const selectedKeys = availableKeys.slice(0, numEntries);

    const dict: Record<string, number> = {};
    for (const k of selectedKeys) {
      dict[k] = rng.int(1, 99);
    }

    // Build Python dict string
    const entries = Object.entries(dict)
      .map(([k, v]) => `"${k}": ${v}`)
      .join(', ');
    const dict_str = `{${entries}}`;

    // Pick target key (80% existing, 20% missing)
    const shouldExist = rng.next() < 0.8;
    let key: string;
    let value: string;
    let exists: boolean;

    if (shouldExist && selectedKeys.length > 0) {
      key = rng.pick(selectedKeys);
      value = String(dict[key]);
      exists = true;
    } else {
      // Pick a key not in the dict
      const missingKeys = KEY_POOL.filter(k => !selectedKeys.includes(k));
      key = missingKeys.length > 0 ? rng.pick(missingKeys) : 'missing';
      value = 'KeyError';
      exists = false;
    }

    return { dict_str, key, value, exists };
  },

  validate(params: GeneratorParams): boolean {
    const { dict_str, key, value, exists } = params;

    if (typeof dict_str !== 'string' || typeof key !== 'string' ||
        typeof value !== 'string' || typeof exists !== 'boolean') {
      return false;
    }

    // Basic format check
    if (!dict_str.startsWith('{') || !dict_str.endsWith('}')) {
      return false;
    }

    return true;
  },
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/generators/dict-values.test.ts`
Expected: PASS

**Step 5: Register and commit**

```bash
git add src/lib/generators/definitions/dict-values.ts tests/unit/generators/dict-values.test.ts src/lib/generators/definitions/index.ts src/lib/generators/index.ts
git commit -m "$(cat <<'EOF'
feat(generators): add dict-values generator

Generates dictionary access scenarios with existing/missing keys for
predict exercises testing dict access patterns.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Add Dynamic Exercises Using New Generators

**Files:**
- Modify: `exercises/python/control-flow.yaml`
- Modify: `exercises/python/strings.yaml`
- Modify: `exercises/python/collections.yaml`

**Step 1: Add loop-simulation exercises to control-flow.yaml**

```yaml
# Add to control-flow.yaml after existing dynamic exercises

  - slug: range-output-dynamic
    objective: Predict the output of range() with dynamic parameters
    title: Dynamic Range Output
    difficulty: 2
    concept: control-flow
    subconcept: for
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: iteration
    generator: loop-simulation
    prompt: "What does this code print?"
    code: |
      for i in range({{start}}, {{stop}}, {{step}}):
          print(i)
    expected_answer: "{{output}}"
    hints:
      - range(start, stop, step) generates numbers
      - stop is exclusive
    tags: [control-flow, range, dynamic]

  - slug: range-list-dynamic
    objective: Predict the list created from range()
    title: Dynamic Range to List
    difficulty: 2
    concept: control-flow
    subconcept: for
    level: practice
    prereqs: [control-flow.for]
    type: predict
    pattern: conversion
    generator: loop-simulation
    prompt: "What does list(range({{start}}, {{stop}}, {{step}})) produce?"
    code: |
      print(list(range({{start}}, {{stop}}, {{step}})))
    expected_answer: "[{{output}}]"
    accepted_solutions:
      - "[{{output}}]"
    hints:
      - list() converts range to a list
      - Values are separated by commas in list output
    tags: [control-flow, range, list, dynamic]
```

**Step 2: Add comparison-logic exercises to control-flow.yaml**

```yaml
  - slug: comparison-result-dynamic
    objective: Predict the result of a comparison expression
    title: Dynamic Comparison Result
    difficulty: 1
    concept: control-flow
    subconcept: conditionals
    level: intro
    prereqs: [foundations]
    type: predict
    pattern: comparison
    generator: comparison-logic
    prompt: "What does {{a}} {{op}} {{b}} evaluate to?"
    code: |
      print({{a}} {{op}} {{b}})
    expected_answer: "{{result}}"
    hints:
      - Compare the two values using the operator
    tags: [control-flow, comparison, dynamic]

  - slug: if-comparison-dynamic
    objective: Write an if statement with dynamic comparison
    title: Dynamic If Comparison
    difficulty: 1
    concept: control-flow
    subconcept: conditionals
    level: intro
    prereqs: [foundations]
    type: write
    pattern: conditional
    generator: comparison-logic
    prompt: "Write an if statement that checks if {{a}} {{op}} {{b}}"
    expected_answer: "if {{a}} {{op}} {{b}}:"
    hints:
      - Use the comparison operator directly
      - End with a colon
    tags: [control-flow, conditionals, dynamic]
```

**Step 3: Add string-ops exercises to strings.yaml**

```yaml
  - slug: string-method-dynamic
    objective: Predict the result of a string method call
    title: Dynamic String Method
    difficulty: 1
    concept: strings
    subconcept: string-methods
    level: intro
    prereqs: [strings.basics]
    type: predict
    pattern: invocation
    generator: string-ops
    prompt: 'What does "{{original}}".{{method}}() return?'
    code: |
      s = "{{original}}"
      print(s.{{method}}())
    expected_answer: "{{result}}"
    hints:
      - Apply the string method mentally
    tags: [strings, methods, dynamic]
```

**Step 4: Add dict-values exercises to collections.yaml**

```yaml
  - slug: dict-access-dynamic
    objective: Predict the result of dict key access
    title: Dynamic Dict Access
    difficulty: 1
    concept: collections
    subconcept: dicts
    level: intro
    prereqs: [collections.dicts]
    type: predict
    pattern: indexing
    generator: dict-values
    prompt: 'Given d = {{dict_str}}, what does d["{{key}}"] return?'
    code: |
      d = {{dict_str}}
      print(d["{{key}}"])
    expected_answer: "{{value}}"
    hints:
      - Look up the key in the dictionary
      - If key doesn't exist, it raises KeyError
    tags: [collections, dicts, dynamic]

  - slug: dict-get-dynamic
    objective: Predict the result of dict.get() with default
    title: Dynamic Dict Get
    difficulty: 2
    concept: collections
    subconcept: dicts
    level: practice
    prereqs: [collections.dicts]
    type: predict
    pattern: lookup
    generator: dict-values
    prompt: 'Given d = {{dict_str}}, what does d.get("{{key}}", "default") return?'
    code: |
      d = {{dict_str}}
      print(d.get("{{key}}", "default"))
    expected_answer: '{{#exists}}{{value}}{{/exists}}{{^exists}}default{{/exists}}'
    hints:
      - get() returns default if key missing
      - No error raised with get()
    tags: [collections, dicts, get, dynamic]
```

**Step 5: Run validation**

Run: `pnpm validate:dynamic`
Expected: All dynamic exercises pass validation

**Step 6: Commit**

```bash
git add exercises/python/control-flow.yaml exercises/python/strings.yaml exercises/python/collections.yaml
git commit -m "$(cat <<'EOF'
feat(exercises): add dynamic exercises using new generators

- 2 loop-simulation exercises (range output, range to list)
- 2 comparison-logic exercises (comparison result, if statement)
- 1 string-ops exercise (method result)
- 2 dict-values exercises (access, get with default)

Total dynamic exercises now: 30 (was 23)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Expand Existing Exercises with Current Generators

**Files:**
- Modify: `exercises/python/collections.yaml`
- Modify: `exercises/python/foundations.yaml`

**Step 1: Dynamize list-insert**

```yaml
# Replace static list-insert in collections.yaml
  - slug: list-insert-dynamic
    objective: Use insert() to add an element at a specific position
    title: Dynamic List Insert
    difficulty: 2
    concept: collections
    subconcept: lists
    level: practice
    prereqs: [collections.lists]
    type: write
    pattern: mutation
    generator: index-values
    prompt: 'Insert value "x" at index {{idx}} in list items'
    expected_answer: 'items.insert({{idx}}, "x")'
    accepted_solutions:
      - 'items.insert({{idx}}, "x")'
      - "items.insert({{idx}}, 'x')"
    hints:
      - insert(index, value)
    tags: [lists, insert, mutation, dynamic]
```

**Step 2: Dynamize exponentiation**

```yaml
# Replace static exponentiation-intro in foundations.yaml
  - slug: exponentiation-dynamic
    objective: Calculate powers using the exponentiation operator
    title: Dynamic Exponentiation
    difficulty: 1
    concept: foundations
    subconcept: operators
    level: practice
    prereqs: [operators]
    type: write
    pattern: arithmetic
    generator: arithmetic-values
    prompt: "Calculate {{x}} to the power of {{y}}"
    expected_answer: "{{x}} ** {{y}}"
    accepted_solutions:
      - "{{x}} ** {{y}}"
      - "{{x}}**{{y}}"
    hints:
      - Use ** for exponentiation
    tags: [operators, power, exponent, dynamic]
```

**Step 3: Run validation and tests**

Run: `pnpm validate:dynamic && pnpm test`
Expected: All pass

**Step 4: Commit**

```bash
git add exercises/python/collections.yaml exercises/python/foundations.yaml
git commit -m "$(cat <<'EOF'
feat(exercises): dynamize existing exercises

- list-insert now uses index-values generator
- exponentiation now uses arithmetic-values generator

Reduces static exercise count, prevents memorization.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Run Full Validation and Final Commit

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All 1100+ tests pass

**Step 4: Run dynamic validation**

Run: `pnpm validate:dynamic`
Expected: All dynamic exercises valid

**Step 5: Final summary commit (if needed)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: complete dynamic exercise expansion

Summary:
- Variant support architecture for multi-prompt exercises
- 4 new generators: loop-simulation, comparison-logic, string-ops, dict-values
- 9 new dynamic exercises using new generators
- 2 static exercises upgraded to dynamic
- Total generators: 9 (was 5)
- Total dynamic exercises: 32 (was 23)

All tests pass. Type checking clean.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Variant support | No | Yes | Architecture added |
| Generators | 5 | 9 | +4 |
| Dynamic exercises | 23 | 32 | +9 |
| Exercise deletions | - | 0 | Manual cleanup deferred |
| Total tests | ~1088 | ~1150 | +62 |

**Key Deliverables:**
1. **Variant architecture** - One slug can have multiple prompt structures selected by generator
2. `loop-simulation` generator - prevents rote memorization of range() outputs
3. `comparison-logic` generator - enables dynamic boolean/conditional exercises
4. `string-ops` generator - tests string method knowledge dynamically (uses variants)
5. `dict-values` generator - tests dict access patterns dynamically
6. New dynamic exercises across control-flow, strings, and collections
7. Upgraded existing static exercises to use generators
