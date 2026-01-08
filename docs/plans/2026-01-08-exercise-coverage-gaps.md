# Exercise Coverage Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fill coverage gaps identified by audit: missing intro exercises, new generators for static-only subconcepts, and type variety for write-only exercises.

**Architecture:** Four-phase approach: (1) Add missing intro exercises as static YAML, (2) Create 5 new generators for high-value subconcepts, (3) Add dynamic exercises using generators, (4) Add fill-in/predict variants. Each phase is independently valuable and can be committed separately.

**Tech Stack:** TypeScript generators, YAML exercises, Vitest + fast-check for property-based testing

---

## Multi-AI Review Feedback (Codex + Gemini)

**Incorporated changes from review:**

1. **Generator edge cases added:**
   - `tuple-access`: Added negative index scenario
   - `set-ops`: Added symmetric difference (^) and empty set gotcha
   - `any-all`: Added empty list scenarios (`any([])=False`, `all([])=True`)

2. **New generator added:** `zip-lists` generator (high ROI per both reviewers)

3. **Static gotcha exercises:** Added for reversed() iterator, sorted() vs list.sort()

4. **Explicit de-scoping:** 12 subconcepts remain static-only (documented below)

**Out of scope (future work):**
- arguments, mutability, generator-exp, context, imports (no generators planned)
- These can be addressed in a follow-up phase if needed

---

## Phase 1: Missing Intro Exercises (Critical - Unblocks Learning)

These subconcepts have no intro-level exercises, making them impossible to learn properly.

### Task 1.1: Add truthiness intro exercises

**Files:**
- Modify: `exercises/python/numbers-booleans.yaml`

**Exercises to add:**

```yaml
# --- Truthiness Intro Exercises ---
- slug: truthiness-intro
  objective: Understand that non-boolean values have truthiness in boolean contexts
  title: Truthiness Basics
  difficulty: 1
  concept: numbers-booleans
  subconcept: truthiness
  level: intro
  prereqs: [numbers-booleans.booleans]
  type: predict
  pattern: evaluation
  prompt: What does bool(0) return?
  expected_answer: "False"
  hints:
    - Zero is considered falsy in Python
    - bool() converts to boolean
  tags: [truthiness, intro, bool]

- slug: truthiness-empty-list
  objective: Recognize that empty collections are falsy
  title: Empty List Truthiness
  difficulty: 1
  concept: numbers-booleans
  subconcept: truthiness
  level: intro
  prereqs: [numbers-booleans.booleans]
  type: predict
  pattern: evaluation
  prompt: What does bool([]) return?
  expected_answer: "False"
  hints:
    - Empty collections are falsy
    - Non-empty collections are truthy
  tags: [truthiness, intro, collections]

- slug: truthiness-write-if
  objective: Use truthiness in an if statement condition
  title: Write Truthy Condition
  difficulty: 1
  concept: numbers-booleans
  subconcept: truthiness
  level: intro
  prereqs: [numbers-booleans.truthiness]
  type: write
  pattern: conditional
  prompt: Write an if statement that checks if list items is truthy (non-empty)
  expected_answer: "if items:"
  accepted_solutions:
    - "if items:"
    - "if bool(items):"
  hints:
    - You don't need == or len()
    - The list itself can be the condition
  tags: [truthiness, intro, conditional]
```

**Validation:** Run `pnpm validate:exercises`

**Commit:** `feat(exercises): add truthiness intro exercises`

---

### Task 1.2: Add unpacking intro exercises

**Files:**
- Modify: `exercises/python/collections.yaml`

**Exercises to add:**

```yaml
# --- Unpacking Intro Exercises ---
- slug: unpacking-intro
  objective: Unpack a tuple into individual variables
  title: Basic Tuple Unpacking
  difficulty: 1
  concept: collections
  subconcept: unpacking
  level: intro
  prereqs: [collections.tuples]
  type: write
  pattern: assignment
  prompt: Unpack the tuple point = (3, 5) into variables x and y
  expected_answer: "x, y = point"
  accepted_solutions:
    - "x, y = point"
    - "(x, y) = point"
  hints:
    - Variables on the left, tuple on the right
    - Number of variables must match tuple length
  tags: [unpacking, intro, tuples]

- slug: unpacking-list-intro
  objective: Unpack a list into individual variables
  title: List Unpacking
  difficulty: 1
  concept: collections
  subconcept: unpacking
  level: intro
  prereqs: [collections.lists]
  type: write
  pattern: assignment
  prompt: Unpack colors = ["red", "green", "blue"] into variables a, b, c
  expected_answer: "a, b, c = colors"
  hints:
    - Same syntax as tuple unpacking
    - Works with any iterable
  tags: [unpacking, intro, lists]

- slug: unpacking-swap-intro
  objective: Use unpacking to swap two variables
  title: Variable Swap
  difficulty: 1
  concept: collections
  subconcept: unpacking
  level: intro
  prereqs: [collections.unpacking]
  type: write
  pattern: assignment
  prompt: Swap the values of variables a and b using unpacking (one line)
  expected_answer: "a, b = b, a"
  hints:
    - Python evaluates the right side first
    - No temp variable needed
  tags: [unpacking, intro, swap]
```

**Validation:** Run `pnpm validate:exercises`

**Commit:** `feat(exercises): add unpacking intro exercises`

---

### Task 1.3: Add dict-comp and set-comp intro exercises

**Files:**
- Modify: `exercises/python/comprehensions.yaml`

**Exercises to add:**

```yaml
# --- Dict Comprehension Intro ---
- slug: dict-comp-intro
  objective: Create a dictionary using comprehension syntax
  title: Basic Dict Comprehension
  difficulty: 2
  concept: comprehensions
  subconcept: dict-comp
  level: intro
  prereqs: [comprehensions.list-comp]
  type: write
  pattern: comprehension
  prompt: Create a dict mapping numbers 1-3 to their squares using comprehension
  expected_answer: "{x: x**2 for x in range(1, 4)}"
  accepted_solutions:
    - "{x: x**2 for x in range(1, 4)}"
    - "{x: x*x for x in range(1, 4)}"
    - "{i: i**2 for i in range(1, 4)}"
    - "{i: i*i for i in range(1, 4)}"
  hints:
    - Dict comprehension uses {key: value for ...}
    - range(1, 4) gives 1, 2, 3
  tags: [comprehensions, dict, intro]

- slug: dict-comp-predict-intro
  objective: Predict the output of a simple dict comprehension
  title: Dict Comprehension Output
  difficulty: 2
  concept: comprehensions
  subconcept: dict-comp
  level: intro
  prereqs: [comprehensions.list-comp]
  type: predict
  pattern: comprehension
  prompt: What does this create?
  code: "{x: x*2 for x in [1, 2, 3]}"
  expected_answer: "{1: 2, 2: 4, 3: 6}"
  hints:
    - Each x becomes a key
    - x*2 becomes its value
  tags: [comprehensions, dict, intro, predict]

# --- Set Comprehension Intro ---
- slug: set-comp-intro
  objective: Create a set using comprehension syntax
  title: Basic Set Comprehension
  difficulty: 2
  concept: comprehensions
  subconcept: set-comp
  level: intro
  prereqs: [comprehensions.list-comp]
  type: write
  pattern: comprehension
  prompt: Create a set of squares for numbers 1-4 using comprehension
  expected_answer: "{x**2 for x in range(1, 5)}"
  accepted_solutions:
    - "{x**2 for x in range(1, 5)}"
    - "{x*x for x in range(1, 5)}"
    - "{i**2 for i in range(1, 5)}"
  hints:
    - Set comprehension uses {expr for ...} (no colon)
    - Duplicates are automatically removed
  tags: [comprehensions, set, intro]

- slug: set-comp-predict-intro
  objective: Predict the output of a set comprehension with duplicates
  title: Set Comprehension Deduplication
  difficulty: 2
  concept: comprehensions
  subconcept: set-comp
  level: intro
  prereqs: [comprehensions.set-comp]
  type: predict
  pattern: comprehension
  prompt: What does this create?
  code: "{x % 3 for x in [1, 2, 3, 4, 5, 6]}"
  expected_answer: "{0, 1, 2}"
  accepted_solutions:
    - "{0, 1, 2}"
    - "{1, 2, 0}"
    - "{2, 1, 0}"
  hints:
    - Sets remove duplicates
    - 1%3=1, 2%3=2, 3%3=0, 4%3=1, 5%3=2, 6%3=0
  tags: [comprehensions, set, intro, predict]
```

**Validation:** Run `pnpm validate:exercises`

**Commit:** `feat(exercises): add dict-comp and set-comp intro exercises`

---

### Task 1.4: Add scope intro exercise

**Files:**
- Modify: `exercises/python/functions.yaml`

**Exercises to add:**

```yaml
# --- Scope Intro Exercises ---
- slug: scope-intro
  objective: Understand that variables defined inside functions are local
  title: Local Scope Basics
  difficulty: 2
  concept: functions
  subconcept: scope
  level: intro
  prereqs: [functions.fn-basics]
  type: predict
  pattern: scope
  prompt: What does this print?
  code: |
    x = 10
    def foo():
        x = 20
        print(x)
    foo()
  expected_answer: "20"
  hints:
    - Inside the function, x is local
    - Local x shadows global x
  tags: [functions, scope, intro]

- slug: scope-global-read
  objective: Understand that functions can read global variables
  title: Reading Global Variables
  difficulty: 2
  concept: functions
  subconcept: scope
  level: intro
  prereqs: [functions.fn-basics]
  type: predict
  pattern: scope
  prompt: What does this print?
  code: |
    x = 10
    def foo():
        print(x)
    foo()
  expected_answer: "10"
  hints:
    - No local x, so Python looks in global scope
    - Functions can read globals without declaration
  tags: [functions, scope, intro, global]
```

**Validation:** Run `pnpm validate:exercises`

**Commit:** `feat(exercises): add scope intro exercises`

---

## Phase 2: New Generators for Static-Only Subconcepts

### Task 2.1: Create tuple-access generator

**Files:**
- Create: `src/lib/generators/definitions/tuple-access.ts`
- Create: `tests/unit/generators/tuple-access.test.ts`
- Modify: `src/lib/generators/definitions/index.ts`
- Modify: `src/lib/generators/index.ts`

**Generator design:**

```typescript
// src/lib/generators/definitions/tuple-access.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface TupleScenario {
  name: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    tuple: string;        // e.g., "(10, 20, 30)"
    tupleVar: string;     // e.g., "point"
    index: number;        // e.g., 1
    result: string;       // e.g., "20"
    length: number;       // e.g., 3
    context: string;      // e.g., "coordinates"
  };
}

const SCENARIOS: TupleScenario[] = [
  {
    name: 'coordinates',
    generate: (rng) => {
      const x = rng.int(1, 100);
      const y = rng.int(1, 100);
      const z = rng.int(1, 100);
      const index = rng.int(0, 2);
      const values = [x, y, z];
      return {
        tuple: `(${x}, ${y}, ${z})`,
        tupleVar: 'point',
        index,
        result: String(values[index]),
        length: 3,
        context: '3D coordinates',
      };
    },
  },
  {
    name: 'rgb',
    generate: (rng) => {
      const r = rng.int(0, 255);
      const g = rng.int(0, 255);
      const b = rng.int(0, 255);
      const index = rng.int(0, 2);
      const values = [r, g, b];
      return {
        tuple: `(${r}, ${g}, ${b})`,
        tupleVar: 'color',
        index,
        result: String(values[index]),
        length: 3,
        context: 'RGB color',
      };
    },
  },
  {
    name: 'pair',
    generate: (rng) => {
      const a = rng.int(1, 50);
      const b = rng.int(1, 50);
      const index = rng.int(0, 1);
      const values = [a, b];
      return {
        tuple: `(${a}, ${b})`,
        tupleVar: 'pair',
        index,
        result: String(values[index]),
        length: 2,
        context: 'number pair',
      };
    },
  },
  // ADDED FROM REVIEW: Negative indexing scenario
  {
    name: 'negative_index',
    generate: (rng) => {
      const a = rng.int(10, 50);
      const b = rng.int(10, 50);
      const c = rng.int(10, 50);
      const negIndex = rng.pick([-1, -2, -3]);
      const values = [a, b, c];
      return {
        tuple: `(${a}, ${b}, ${c})`,
        tupleVar: 'data',
        index: negIndex,
        result: String(values[values.length + negIndex]),
        length: 3,
        context: 'negative indexing',
      };
    },
  },
];

export const tupleAccessGenerator: Generator = {
  name: 'tuple-access',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      tuple: data.tuple,
      tupleVar: data.tupleVar,
      index: data.index,
      result: data.result,
      length: data.length,
      context: data.context,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.tuple === 'string' &&
      typeof params.tupleVar === 'string' &&
      typeof params.index === 'number' &&
      typeof params.result === 'string' &&
      typeof params.length === 'number'
    );
  },
};
```

**Test file:**

```typescript
// tests/unit/generators/tuple-access.test.ts
import { describe, it, expect } from 'vitest';
import { tupleAccessGenerator } from '@/lib/generators/definitions/tuple-access';
import fc from 'fast-check';

describe('tuple-access generator', () => {
  it('has correct name', () => {
    expect(tupleAccessGenerator.name).toBe('tuple-access');
  });

  it('generates required params', () => {
    const params = tupleAccessGenerator.generate('test-seed');
    expect(params).toHaveProperty('tuple');
    expect(params).toHaveProperty('tupleVar');
    expect(params).toHaveProperty('index');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('length');
  });

  it('generates deterministic output', () => {
    const p1 = tupleAccessGenerator.generate('same-seed');
    const p2 = tupleAccessGenerator.generate('same-seed');
    expect(p1).toEqual(p2);
  });

  it('index is within bounds', () => {
    const params = tupleAccessGenerator.generate('test');
    expect(params.index).toBeGreaterThanOrEqual(0);
    expect(params.index).toBeLessThan(params.length as number);
  });

  it('validates correct params', () => {
    const params = tupleAccessGenerator.generate('test');
    expect(tupleAccessGenerator.validate(params)).toBe(true);
  });

  describe('property-based tests', () => {
    it('always produces valid params', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (seed) => {
          const params = tupleAccessGenerator.generate(seed);
          return tupleAccessGenerator.validate(params);
        }),
        { numRuns: 100 }
      );
    });
  });
});
```

**Register generator in index files.**

**Validation:** Run `pnpm test tests/unit/generators/tuple-access.test.ts`

**Commit:** `feat(generators): add tuple-access generator`

---

### Task 2.2: Create set-ops generator

**Files:**
- Create: `src/lib/generators/definitions/set-ops.ts`
- Create: `tests/unit/generators/set-ops.test.ts`
- Modify: `src/lib/generators/definitions/index.ts`

**Generator design:**

```typescript
// src/lib/generators/definitions/set-ops.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface SetScenario {
  name: string;
  operation: string;
  generate: (rng: ReturnType<typeof seededRandom>) => {
    set1: number[];
    set2: number[];
    result: number[];
    code: string;
    description: string;
  };
}

const SCENARIOS: SetScenario[] = [
  {
    name: 'union',
    operation: '|',
    generate: (rng) => {
      const set1 = [rng.int(1, 5), rng.int(6, 10)];
      const set2 = [rng.int(1, 5), rng.int(11, 15)];
      const result = [...new Set([...set1, ...set2])].sort((a, b) => a - b);
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} | {${set2.join(', ')}}`,
        description: 'union combines all elements',
      };
    },
  },
  {
    name: 'intersection',
    operation: '&',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const set1 = [common, rng.int(11, 20)];
      const set2 = [common, rng.int(21, 30)];
      const result = [common];
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} & {${set2.join(', ')}}`,
        description: 'intersection keeps only common elements',
      };
    },
  },
  {
    name: 'difference',
    operation: '-',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const unique = rng.int(11, 20);
      const set1 = [common, unique];
      const set2 = [common, rng.int(21, 30)];
      const result = [unique];
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} - {${set2.join(', ')}}`,
        description: 'difference removes elements in second set',
      };
    },
  },
  // ADDED FROM REVIEW: Symmetric difference
  {
    name: 'symmetric_difference',
    operation: '^',
    generate: (rng) => {
      const common = rng.int(1, 10);
      const unique1 = rng.int(11, 20);
      const unique2 = rng.int(21, 30);
      const set1 = [common, unique1];
      const set2 = [common, unique2];
      const result = [unique1, unique2].sort((a, b) => a - b);
      return {
        set1,
        set2,
        result,
        code: `{${set1.join(', ')}} ^ {${set2.join(', ')}}`,
        description: 'symmetric difference keeps elements in exactly one set',
      };
    },
  },
];

export const setOpsGenerator: Generator = {
  name: 'set-ops',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      set1: `{${data.set1.join(', ')}}`,
      set2: `{${data.set2.join(', ')}}`,
      result: `{${data.result.join(', ')}}`,
      operation: scenario.operation,
      operationName: scenario.name,
      code: data.code,
      description: data.description,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.set1 === 'string' &&
      typeof params.set2 === 'string' &&
      typeof params.result === 'string' &&
      typeof params.operation === 'string'
    );
  },
};
```

**Validation:** Run `pnpm test tests/unit/generators/set-ops.test.ts`

**Commit:** `feat(generators): add set-ops generator`

---

### Task 2.3: Create sorted-list generator

**Files:**
- Create: `src/lib/generators/definitions/sorted-list.ts`
- Create: `tests/unit/generators/sorted-list.test.ts`

**Generator design:**

```typescript
// src/lib/generators/definitions/sorted-list.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'sorted_asc',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 20), rng.int(21, 40), rng.int(41, 60)];
      rng.shuffle(nums);
      const sorted = [...nums].sort((a, b) => a - b);
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${sorted.join(', ')}]`,
        code: `sorted([${nums.join(', ')}])`,
        func: 'sorted',
        reverse: false,
      };
    },
  },
  {
    name: 'sorted_desc',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 20), rng.int(21, 40), rng.int(41, 60)];
      rng.shuffle(nums);
      const sorted = [...nums].sort((a, b) => b - a);
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${sorted.join(', ')}]`,
        code: `sorted([${nums.join(', ')}], reverse=True)`,
        func: 'sorted',
        reverse: true,
      };
    },
  },
  {
    name: 'reversed',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 30), rng.int(31, 60), rng.int(61, 90)];
      const rev = [...nums].reverse();
      return {
        input: `[${nums.join(', ')}]`,
        output: `[${rev.join(', ')}]`,
        code: `list(reversed([${nums.join(', ')}]))`,
        func: 'reversed',
        reverse: false,
      };
    },
  },
];

export const sortedListGenerator: Generator = {
  name: 'sorted-list',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      input: data.input,
      output: data.output,
      code: data.code,
      func: data.func,
      reverse: data.reverse,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.input === 'string' &&
      typeof params.output === 'string' &&
      typeof params.code === 'string' &&
      typeof params.func === 'string'
    );
  },
};
```

**Validation:** Run `pnpm test tests/unit/generators/sorted-list.test.ts`

**Commit:** `feat(generators): add sorted-list generator`

---

### Task 2.4: Create any-all generator

**Files:**
- Create: `src/lib/generators/definitions/any-all.ts`
- Create: `tests/unit/generators/any-all.test.ts`

**Generator design:**

```typescript
// src/lib/generators/definitions/any-all.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'any_true',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      // At least one True
      const bools = [false, false, true];
      rng.shuffle(bools);
      return {
        list: `[${bools.map(b => b ? 'True' : 'False').join(', ')}]`,
        func: 'any',
        result: 'True',
      };
    },
  },
  {
    name: 'any_false',
    generate: () => ({
      list: '[False, False, False]',
      func: 'any',
      result: 'False',
    }),
  },
  {
    name: 'all_true',
    generate: () => ({
      list: '[True, True, True]',
      func: 'all',
      result: 'True',
    }),
  },
  {
    name: 'all_false',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      // At least one False
      const bools = [true, true, false];
      rng.shuffle(bools);
      return {
        list: `[${bools.map(b => b ? 'True' : 'False').join(', ')}]`,
        func: 'all',
        result: 'False',
      };
    },
  },
  {
    name: 'any_numbers',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [0, 0, rng.int(1, 10)];
      rng.shuffle(nums);
      return {
        list: `[${nums.join(', ')}]`,
        func: 'any',
        result: 'True',
        description: 'non-zero is truthy',
      };
    },
  },
  {
    name: 'all_numbers',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const nums = [rng.int(1, 10), rng.int(1, 10), 0];
      rng.shuffle(nums);
      return {
        list: `[${nums.join(', ')}]`,
        func: 'all',
        result: 'False',
        description: 'zero is falsy',
      };
    },
  },
  // ADDED FROM REVIEW: Empty list gotcha cases
  {
    name: 'any_empty',
    generate: () => ({
      list: '[]',
      func: 'any',
      result: 'False',
      description: 'any() on empty list is False (no truthy elements)',
    }),
  },
  {
    name: 'all_empty',
    generate: () => ({
      list: '[]',
      func: 'all',
      result: 'True',
      description: 'all() on empty list is True (vacuous truth)',
    }),
  },
];

export const anyAllGenerator: Generator = {
  name: 'any-all',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      list: data.list,
      func: data.func,
      result: data.result,
      code: `${data.func}(${data.list})`,
      scenario: scenario.name,
      description: data.description || '',
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.list === 'string' &&
      typeof params.func === 'string' &&
      typeof params.result === 'string' &&
      ['True', 'False'].includes(params.result as string)
    );
  },
};
```

**Validation:** Run `pnpm test tests/unit/generators/any-all.test.ts`

**Commit:** `feat(generators): add any-all generator`

---

### Task 2.5: Create zip-lists generator (ADDED FROM REVIEW)

**Files:**
- Create: `src/lib/generators/definitions/zip-lists.ts`
- Create: `tests/unit/generators/zip-lists.test.ts`
- Modify: `src/lib/generators/definitions/index.ts`

**Generator design:**

```typescript
// src/lib/generators/definitions/zip-lists.ts
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

const SCENARIOS = [
  {
    name: 'equal_length',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 10), rng.int(11, 20), rng.int(21, 30)];
      const list2 = ['a', 'b', 'c'];
      const zipped = list1.map((v, i) => `(${v}, '${list2[i]}')`);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: "['a', 'b', 'c']",
        output: `[${zipped.join(', ')}]`,
        description: 'zip pairs elements by position',
      };
    },
  },
  {
    name: 'unequal_length',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 10), rng.int(11, 20)];
      const list2 = ['x', 'y', 'z'];
      const zipped = list1.map((v, i) => `(${v}, '${list2[i]}')`);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: "['x', 'y', 'z']",
        output: `[${zipped.join(', ')}]`,
        description: 'zip stops at shortest list',
      };
    },
  },
  {
    name: 'numbers_only',
    generate: (rng: ReturnType<typeof seededRandom>) => {
      const list1 = [rng.int(1, 5), rng.int(6, 10)];
      const list2 = [rng.int(11, 15), rng.int(16, 20)];
      const sums = list1.map((v, i) => v + list2[i]);
      return {
        list1: `[${list1.join(', ')}]`,
        list2: `[${list2.join(', ')}]`,
        output: `[${sums.join(', ')}]`,
        code: `[a + b for a, b in zip(${`[${list1.join(', ')}]`}, ${`[${list2.join(', ')}]`})]`,
        description: 'zip with comprehension for pairwise sum',
      };
    },
  },
];

export const zipListsGenerator: Generator = {
  name: 'zip-lists',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);
    const data = scenario.generate(rng);

    return {
      list1: data.list1,
      list2: data.list2,
      output: data.output,
      description: data.description,
      code: data.code || `list(zip(${data.list1}, ${data.list2}))`,
      scenario: scenario.name,
    };
  },

  validate(params: GeneratorParams): boolean {
    return (
      typeof params.list1 === 'string' &&
      typeof params.list2 === 'string' &&
      typeof params.output === 'string'
    );
  },
};
```

**Validation:** Run `pnpm test tests/unit/generators/zip-lists.test.ts`

**Commit:** `feat(generators): add zip-lists generator`

---

## Phase 3: Dynamic Exercises Using New Generators

### Task 3.1: Add dynamic tuple exercises

**Files:**
- Modify: `exercises/python/collections.yaml`

**Exercises to add:**

```yaml
# --- Dynamic Tuple Exercises ---
- slug: tuple-index-dynamic
  objective: Access a tuple element by index
  title: Dynamic Tuple Index
  difficulty: 1
  concept: collections
  subconcept: tuples
  level: practice
  prereqs: [collections.tuples]
  type: predict
  pattern: indexing
  generator: tuple-access
  prompt: "What does {{tupleVar}}[{{index}}] return?"
  code: |
    {{tupleVar}} = {{tuple}}
    print({{tupleVar}}[{{index}}])
  expected_answer: "{{result}}"
  hints:
    - Tuple indexing works like list indexing
    - Index {{index}} gets the element at position {{index}}
  tags: [tuples, indexing, dynamic]

- slug: tuple-unpack-dynamic
  objective: Write unpacking for a dynamically generated tuple
  title: Dynamic Tuple Unpack
  difficulty: 2
  concept: collections
  subconcept: tuples
  level: practice
  prereqs: [collections.unpacking]
  type: write
  pattern: assignment
  generator: tuple-access
  prompt: "Unpack {{tupleVar}} = {{tuple}} into {{length}} variables"
  expected_answer: "x, y, z = {{tupleVar}}"
  hints:
    - Number of variables must match tuple length
    - Use comma-separated variable names
  tags: [tuples, unpacking, dynamic]
```

**Commit:** `feat(exercises): add dynamic tuple exercises`

---

### Task 3.2: Add dynamic set exercises

**Files:**
- Modify: `exercises/python/collections.yaml`

**Exercises to add:**

```yaml
# --- Dynamic Set Exercises ---
- slug: set-operation-dynamic
  objective: Predict the result of a set operation
  title: Dynamic Set Operation
  difficulty: 2
  concept: collections
  subconcept: sets
  level: practice
  prereqs: [collections.sets]
  type: predict
  pattern: operation
  generator: set-ops
  prompt: "What does {{code}} return?"
  expected_answer: "{{result}}"
  hints:
    - "{{description}}"
    - The {{operationName}} operation uses {{operation}}
  tags: [sets, operations, dynamic]

- slug: set-operation-write-dynamic
  objective: Write the set operation to get a specific result
  title: Write Set Operation
  difficulty: 2
  concept: collections
  subconcept: sets
  level: practice
  prereqs: [collections.sets]
  type: write
  pattern: operation
  generator: set-ops
  prompt: "Write the {{operationName}} of {{set1}} and {{set2}}"
  expected_answer: "{{set1}} {{operation}} {{set2}}"
  hints:
    - "{{operationName}} uses the {{operation}} operator"
  tags: [sets, operations, dynamic, write]
```

**Commit:** `feat(exercises): add dynamic set exercises`

---

### Task 3.3: Add dynamic sorted/reversed exercises

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Exercises to add:**

```yaml
# --- Dynamic Sorted/Reversed Exercises ---
- slug: sorted-predict-dynamic
  objective: Predict the output of sorted() or reversed()
  title: Dynamic Sorted/Reversed
  difficulty: 2
  concept: control-flow
  subconcept: sorted
  level: practice
  prereqs: [control-flow.for]
  type: predict
  pattern: transformation
  generator: sorted-list
  prompt: "What does {{code}} return?"
  expected_answer: "{{output}}"
  hints:
    - "{{func}}() returns a new sequence"
    - Original list is unchanged
  tags: [sorted, reversed, dynamic]

- slug: sorted-write-dynamic
  objective: Write the correct sorted/reversed call
  title: Write Sorted Call
  difficulty: 2
  concept: control-flow
  subconcept: sorted
  level: practice
  prereqs: [control-flow.sorted]
  type: write
  pattern: transformation
  generator: sorted-list
  prompt: "Sort {{input}} to get {{output}}"
  expected_answer: "{{code}}"
  hints:
    - Use sorted() with reverse parameter if needed
  tags: [sorted, dynamic, write]
```

**Commit:** `feat(exercises): add dynamic sorted/reversed exercises`

---

### Task 3.4: Add dynamic any/all exercises

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Exercises to add:**

```yaml
# --- Dynamic Any/All Exercises ---
- slug: any-all-predict-dynamic
  objective: Predict the result of any() or all()
  title: Dynamic Any/All
  difficulty: 2
  concept: control-flow
  subconcept: any-all
  level: practice
  prereqs: [numbers-booleans.truthiness]
  type: predict
  pattern: evaluation
  generator: any-all
  prompt: "What does {{code}} return?"
  expected_answer: "{{result}}"
  hints:
    - "{{func}}() checks if {{func}} elements are truthy"
    - Remember truthiness rules
  tags: [any, all, dynamic]

- slug: any-all-write-dynamic
  objective: Write the any/all expression for a list
  title: Write Any/All
  difficulty: 2
  concept: control-flow
  subconcept: any-all
  level: practice
  prereqs: [control-flow.any-all]
  type: write
  pattern: evaluation
  generator: any-all
  prompt: "Check if {{func}} elements in {{list}} are truthy"
  expected_answer: "{{func}}({{list}})"
  hints:
    - "{{func}}() takes an iterable"
  tags: [any, all, dynamic, write]
```

**Commit:** `feat(exercises): add dynamic any/all exercises`

---

### Task 3.5: Add dynamic zip exercises (ADDED FROM REVIEW)

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Exercises to add:**

```yaml
# --- Dynamic Zip Exercises ---
- slug: zip-predict-dynamic
  objective: Predict the output of zip() on two lists
  title: Dynamic Zip Output
  difficulty: 2
  concept: control-flow
  subconcept: zip
  level: practice
  prereqs: [control-flow.for]
  type: predict
  pattern: transformation
  generator: zip-lists
  prompt: "What does list(zip({{list1}}, {{list2}})) return?"
  expected_answer: "{{output}}"
  hints:
    - "{{description}}"
    - zip() pairs elements by index
  tags: [zip, dynamic, predict]

- slug: zip-sum-dynamic
  objective: Write a zip comprehension for pairwise operations
  title: Dynamic Zip Sum
  difficulty: 2
  concept: control-flow
  subconcept: zip
  level: practice
  prereqs: [control-flow.zip, comprehensions.list-comp]
  type: predict
  pattern: transformation
  generator: zip-lists
  prompt: "What does {{code}} return?"
  expected_answer: "{{output}}"
  hints:
    - zip pairs elements for the comprehension
    - a + b adds each pair
  tags: [zip, comprehension, dynamic]
```

**Commit:** `feat(exercises): add dynamic zip exercises`

---

## Phase 4: Fill-in/Predict Variants for Write-Only Subconcepts

### Task 4.1: Add fill-in exercises for write-only subconcepts

**Files:**
- Modify: `exercises/python/collections.yaml` (tuples, unpacking, mutability)
- Modify: `exercises/python/control-flow.yaml` (reversed, sorted, any-all, zip)
- Modify: `exercises/python/functions.yaml` (arguments)
- Modify: `exercises/python/comprehensions.yaml` (generator-exp)

**Example exercises (add similar for each):**

```yaml
# collections.yaml - tuples fill-in
- slug: tuple-create-fill
  objective: Complete tuple creation syntax
  title: Tuple Creation Fill-in
  difficulty: 1
  concept: collections
  subconcept: tuples
  level: intro
  prereqs: []
  type: fill-in
  pattern: creation
  prompt: Complete to create a tuple with values 1, 2, 3
  template: "nums = ___(1, 2, 3)"
  expected_answer: "("
  hints:
    - Tuples use parentheses
  tags: [tuples, fill-in]

# control-flow.yaml - zip fill-in
- slug: zip-fill
  objective: Complete zip usage
  title: Zip Fill-in
  difficulty: 2
  concept: control-flow
  subconcept: zip
  level: intro
  prereqs: [control-flow.for]
  type: fill-in
  pattern: iteration
  prompt: Complete to iterate over two lists in parallel
  template: "for a, b in ___(list1, list2):"
  expected_answer: "zip"
  hints:
    - zip() pairs elements from multiple iterables
  tags: [zip, fill-in]

# functions.yaml - arguments fill-in
- slug: positional-arg-fill
  objective: Complete function call with positional arguments
  title: Positional Arguments Fill-in
  difficulty: 1
  concept: functions
  subconcept: arguments
  level: intro
  prereqs: [functions.fn-basics]
  type: fill-in
  pattern: invocation
  prompt: Complete the function call with x=5, y=10
  template: "result = add___(5, 10)"
  expected_answer: "("
  hints:
    - Function calls use parentheses
  tags: [functions, arguments, fill-in]
```

**Commit:** `feat(exercises): add fill-in variants for write-only subconcepts`

---

### Task 4.2: Add predict exercises for write-only subconcepts

**Files:**
- Same files as Task 4.1

**Example exercises:**

```yaml
# collections.yaml - tuples predict
- slug: tuple-immutable-predict
  objective: Understand tuple immutability
  title: Tuple Immutability Predict
  difficulty: 2
  concept: collections
  subconcept: tuples
  level: practice
  prereqs: [collections.tuples]
  type: predict
  pattern: error
  prompt: What happens when this code runs?
  code: |
    t = (1, 2, 3)
    t[0] = 10
  expected_answer: "TypeError"
  accepted_solutions:
    - "TypeError"
    - "Error"
    - "error"
  hints:
    - Tuples are immutable
    - You cannot modify tuple elements
  tags: [tuples, immutable, predict]

# control-flow.yaml - reversed predict
- slug: reversed-predict
  objective: Predict reversed() output
  title: Reversed Predict
  difficulty: 1
  concept: control-flow
  subconcept: reversed
  level: intro
  prereqs: [control-flow.for]
  type: predict
  pattern: transformation
  prompt: What does list(reversed([1, 2, 3])) return?
  expected_answer: "[3, 2, 1]"
  hints:
    - reversed() returns an iterator
    - list() converts it to a list
  tags: [reversed, predict]

# comprehensions.yaml - generator-exp predict
- slug: generator-exp-predict
  objective: Understand generator expression evaluation
  title: Generator Expression Predict
  difficulty: 2
  concept: comprehensions
  subconcept: generator-exp
  level: practice
  prereqs: [comprehensions.list-comp]
  type: predict
  pattern: comprehension
  prompt: What does sum(x**2 for x in [1, 2, 3]) return?
  expected_answer: "14"
  hints:
    - Generator expression creates values on-demand
    - 1 + 4 + 9 = 14
  tags: [generator-exp, predict]
```

**Commit:** `feat(exercises): add predict variants for write-only subconcepts`

---

## Final Validation

### Task 5.1: Run all validations

```bash
pnpm validate:exercises
pnpm validate:dynamic
pnpm test
pnpm typecheck
```

**Commit:** `chore: verify all exercises and generators`

---

### Task 5.2: Update exercise list documentation

```bash
pnpm generate:exercise-list:obsidian
```

**Commit:** `docs: regenerate exercise list`

---

## Summary (Updated with Review Feedback)

**Phase 1:** 11 new intro exercises
- truthiness: 3 (intro predict, intro predict, intro write)
- unpacking: 3 (intro write x3)
- dict-comp: 2 (intro write, intro predict)
- set-comp: 2 (intro write, intro predict)
- scope: 2 (intro predict x2)

**Phase 2:** 5 new generators (updated from 4)
- tuple-access: 4 scenarios (coordinates, rgb, pair, **negative_index**)
- set-ops: 4 scenarios (union, intersection, difference, **symmetric_difference**)
- sorted-list: 3 scenarios (sorted asc, sorted desc, reversed)
- any-all: 8 scenarios (6 original + **any_empty, all_empty**)
- **zip-lists**: 3 scenarios (equal_length, unequal_length, numbers_only) - NEW

**Phase 3:** 10 new dynamic exercises (updated from 8)
- 2 tuple exercises
- 2 set exercises
- 2 sorted/reversed exercises
- 2 any/all exercises
- **2 zip exercises** - NEW

**Phase 4:** ~15 fill-in/predict variants for write-only subconcepts

**Total new exercises:** ~36

**Expected final count:** ~389 exercises (was 353)

---

## Out of Scope (Future Work)

The following subconcepts will remain static-only after this plan:
- functions.arguments, functions.args-kwargs
- collections.mutability
- comprehensions.generator-exp
- modules-files.imports, modules-files.context

These can be addressed in a follow-up phase if dynamic coverage is needed.
