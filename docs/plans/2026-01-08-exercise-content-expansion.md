# Exercise Content Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add intro-level exercises for 3 subconcepts missing them (while, iteration, arguments), expand intro coverage for 8 sparse subconcepts, and add dynamic exercises for truthiness/booleans/conversion.

**Architecture:** Content-first approach - add static exercises for foundational learning, then dynamic exercises to prevent memorization. Each subconcept should have at least 2-3 intro exercises before practice/edge exercises. New truthiness generator enables varied boolean/falsy value scenarios.

**Tech Stack:** YAML exercises, TypeScript generators (seedrandom, fast-check for testing)

---

## Phase 1: Critical Intro Exercises (3 Subconcepts Missing Intros)

### Task 1: Add `while` Subconcept Intro Exercises

**Files:**
- Modify: `exercises/python/control-flow.yaml`
- Test: Run `pnpm validate:exercises`

**Step 1: Add while-basic-intro exercise**

Add this exercise to `control-flow.yaml` (insert near line 44, before existing while-loop):

```yaml
  - slug: while-keyword
    objective: Write the while keyword that starts a conditional loop
    title: While Keyword
    difficulty: 1
    concept: control-flow
    subconcept: while
    level: intro
    prereqs: [conditionals]
    type: write
    pattern: iteration
    prompt: Write just the keyword that starts a conditional loop (not for)
    expected_answer: "while"
    hints:
      - This keyword repeats code as long as condition is True
      - Rhymes with "smile"
    tags: [loops, while, keyword]
```

**Step 2: Add while-header-intro exercise**

```yaml
  - slug: while-header-intro
    objective: Write a complete while loop header with a simple condition
    title: While Loop Header
    difficulty: 1
    concept: control-flow
    subconcept: while
    level: intro
    prereqs: [conditionals]
    type: write
    pattern: iteration
    prompt: Write a while loop that runs while x is True
    expected_answer: "while x:"
    accepted_solutions:
      - "while x:"
      - "while x == True:"
    hints:
      - While keyword followed by condition, then colon
      - x is already a boolean, no comparison needed
    tags: [loops, while, header]
```

**Step 3: Add while-counter-intro exercise**

```yaml
  - slug: while-counter-intro
    objective: Write a while loop header that checks a counter variable
    title: While Counter Loop
    difficulty: 1
    concept: control-flow
    subconcept: while
    level: intro
    prereqs: [conditionals]
    type: write
    pattern: iteration
    prompt: Write a while loop that runs while i is less than 10
    expected_answer: "while i < 10:"
    hints:
      - Use the less-than operator
      - End with a colon
    tags: [loops, while, counter]
```

**Step 4: Run validation**

Run: `pnpm validate:exercises`
Expected: PASS (all files valid)

**Step 5: Commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "feat(exercises): add intro-level while loop exercises

- while-keyword: Basic keyword recognition
- while-header-intro: Simple boolean condition
- while-counter-intro: Counter comparison pattern

Addresses content gap: while subconcept had no intro exercises.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Add `iteration` Subconcept Intro Exercises

**Files:**
- Modify: `exercises/python/control-flow.yaml`
- Test: Run `pnpm validate:exercises`

**Step 1: Add enumerate-intro exercise**

Add near existing enumerate exercises (around line 61):

```yaml
  - slug: enumerate-keyword
    objective: Identify the function that provides index with each element
    title: Enumerate Function
    difficulty: 1
    concept: control-flow
    subconcept: iteration
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: What function gives you both index and value when looping?
    expected_answer: "enumerate"
    hints:
      - This function counts elements while iterating
      - Starts with 'e', relates to counting
    tags: [loops, enumerate, intro]
```

**Step 2: Add enumerate-basic exercise**

```yaml
  - slug: enumerate-basic
    objective: Use enumerate to loop with index and value
    title: Basic Enumerate Loop
    difficulty: 1
    concept: control-flow
    subconcept: iteration
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: Write a for loop using enumerate over a list called names
    expected_answer: "for i, name in enumerate(names):"
    accepted_solutions:
      - "for i, name in enumerate(names):"
      - "for idx, name in enumerate(names):"
      - "for index, name in enumerate(names):"
    hints:
      - enumerate() wraps the iterable
      - Unpack into two variables for index and value
    tags: [loops, enumerate, basic]
```

**Step 3: Add range-intro exercise**

```yaml
  - slug: range-intro
    objective: Use range() to generate a sequence of numbers
    title: Range Function Intro
    difficulty: 1
    concept: control-flow
    subconcept: iteration
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: Generate numbers 0 through 4 using range
    expected_answer: "range(5)"
    hints:
      - range(n) gives 0 to n-1
      - For 0-4, you need 5 numbers total
    tags: [loops, range, intro]
```

**Step 4: Run validation**

Run: `pnpm validate:exercises`
Expected: PASS

**Step 5: Commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "feat(exercises): add intro-level iteration pattern exercises

- enumerate-keyword: Function recognition
- enumerate-basic: Basic enumerate usage
- range-intro: Simple range generation

Addresses content gap: iteration subconcept had no intro exercises.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Add `arguments` Subconcept Intro Exercises

**Files:**
- Modify: `exercises/python/functions.yaml`
- Test: Run `pnpm validate:exercises`

**Step 1: Add positional-arg-intro exercise**

Add near existing argument exercises (after fn-basics exercises):

```yaml
  - slug: positional-arg-intro
    objective: Call a function with positional arguments
    title: Positional Arguments
    difficulty: 1
    concept: functions
    subconcept: arguments
    level: intro
    prereqs: [fn-basics]
    type: write
    pattern: invocation
    prompt: Call function add with arguments 5 and 3 (positional)
    expected_answer: "add(5, 3)"
    hints:
      - Arguments are separated by commas
      - Order matters for positional args
    tags: [functions, arguments, positional]
```

**Step 2: Add keyword-arg-intro exercise**

```yaml
  - slug: keyword-arg-intro
    objective: Call a function using keyword argument syntax
    title: Keyword Arguments Intro
    difficulty: 1
    concept: functions
    subconcept: arguments
    level: intro
    prereqs: [fn-basics]
    type: write
    pattern: invocation
    prompt: Call greet with name="Alice" as a keyword argument
    expected_answer: 'greet(name="Alice")'
    accepted_solutions:
      - 'greet(name="Alice")'
      - "greet(name='Alice')"
    hints:
      - Use name=value syntax
      - The parameter name goes before the equals sign
    tags: [functions, arguments, keyword]
```

**Step 3: Add mixed-args-intro exercise**

```yaml
  - slug: mixed-args-intro
    objective: Combine positional and keyword arguments in a function call
    title: Mixed Arguments
    difficulty: 2
    concept: functions
    subconcept: arguments
    level: intro
    prereqs: [fn-basics]
    type: write
    pattern: invocation
    prompt: Call connect with "localhost" positional, port=8080 keyword
    expected_answer: 'connect("localhost", port=8080)'
    accepted_solutions:
      - 'connect("localhost", port=8080)'
      - "connect('localhost', port=8080)"
    hints:
      - Positional arguments come first
      - Keyword arguments follow positional ones
    tags: [functions, arguments, mixed]
```

**Step 4: Run validation**

Run: `pnpm validate:exercises`
Expected: PASS

**Step 5: Commit**

```bash
git add exercises/python/functions.yaml
git commit -m "feat(exercises): add intro-level function argument exercises

- positional-arg-intro: Basic positional arguments
- keyword-arg-intro: Keyword argument syntax
- mixed-args-intro: Combining both styles

Addresses content gap: arguments subconcept had no intro exercises.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Expand Sparse Intro Coverage (8 Subconcepts with Only 1 Intro)

### Task 4: Add Second Intro for `zip` Subconcept

**Files:**
- Modify: `exercises/python/control-flow.yaml`
- Test: Run `pnpm validate:exercises`

**Step 1: Add zip-intro exercise**

```yaml
  - slug: zip-intro
    objective: Use zip to combine two lists for parallel iteration
    title: Zip Function Intro
    difficulty: 1
    concept: control-flow
    subconcept: zip
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: Combine lists names and scores for parallel iteration
    expected_answer: "zip(names, scores)"
    hints:
      - zip pairs elements at same positions
      - Pass both lists as arguments
    tags: [loops, zip, intro]
```

**Step 2: Run validation and commit**

Run: `pnpm validate:exercises`

```bash
git add exercises/python/control-flow.yaml
git commit -m "feat(exercises): add second intro for zip subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Add Second Intro for `reversed` Subconcept

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Step 1: Add reversed-intro exercise**

```yaml
  - slug: reversed-intro
    objective: Use reversed() to iterate backwards through a sequence
    title: Reversed Function Intro
    difficulty: 1
    concept: control-flow
    subconcept: reversed
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: Iterate through items list in reverse order
    expected_answer: "for item in reversed(items):"
    accepted_solutions:
      - "for item in reversed(items):"
      - "for x in reversed(items):"
    hints:
      - reversed() wraps the iterable
      - Original list is not modified
    tags: [loops, reversed, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "feat(exercises): add second intro for reversed subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Add Second Intro for `sorted` Subconcept

**Files:**
- Modify: `exercises/python/control-flow.yaml`

**Step 1: Add sorted-intro exercise**

```yaml
  - slug: sorted-intro
    objective: Use sorted() to iterate through items in sorted order
    title: Sorted Function Intro
    difficulty: 1
    concept: control-flow
    subconcept: sorted
    level: intro
    prereqs: [for]
    type: write
    pattern: iteration
    prompt: Iterate through numbers list in sorted order
    expected_answer: "for n in sorted(numbers):"
    accepted_solutions:
      - "for n in sorted(numbers):"
      - "for num in sorted(numbers):"
      - "for x in sorted(numbers):"
    hints:
      - sorted() returns a new sorted list
      - Original list is not modified
    tags: [loops, sorted, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/control-flow.yaml
git commit -m "feat(exercises): add second intro for sorted subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Add Second Intro for `defaults` Subconcept

**Files:**
- Modify: `exercises/python/functions.yaml`

**Step 1: Add default-param-intro exercise**

```yaml
  - slug: default-param-intro
    objective: Define a function parameter with a default value
    title: Default Parameter Intro
    difficulty: 1
    concept: functions
    subconcept: defaults
    level: intro
    prereqs: [fn-basics]
    type: write
    pattern: definition
    prompt: Define function greet with name parameter defaulting to "World"
    expected_answer: 'def greet(name="World"):'
    accepted_solutions:
      - 'def greet(name="World"):'
      - "def greet(name='World'):"
    hints:
      - Use = to set the default value
      - Default goes after the parameter name
    tags: [functions, defaults, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/functions.yaml
git commit -m "feat(exercises): add second intro for defaults subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Add Second Intro for `generator-exp` Subconcept

**Files:**
- Modify: `exercises/python/comprehensions.yaml`

**Step 1: Add generator-exp-intro exercise**

```yaml
  - slug: generator-exp-intro
    objective: Write a generator expression for lazy evaluation
    title: Generator Expression Intro
    difficulty: 2
    concept: comprehensions
    subconcept: generator-exp
    level: intro
    prereqs: [list-comp]
    type: write
    pattern: transformation
    prompt: Create a generator that yields squares of numbers 1-5
    expected_answer: "(x**2 for x in range(1, 6))"
    accepted_solutions:
      - "(x**2 for x in range(1, 6))"
      - "(x ** 2 for x in range(1, 6))"
      - "(n**2 for n in range(1, 6))"
    hints:
      - Use parentheses instead of square brackets
      - Same syntax as list comprehension otherwise
    tags: [comprehensions, generator, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/comprehensions.yaml
git commit -m "feat(exercises): add second intro for generator-exp subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Add Second Intro for `raising` Subconcept

**Files:**
- Modify: `exercises/python/error-handling.yaml`

**Step 1: Add raise-intro exercise**

```yaml
  - slug: raise-intro
    objective: Raise a basic exception to signal an error
    title: Raise Exception Intro
    difficulty: 1
    concept: error-handling
    subconcept: raising
    level: intro
    prereqs: [try-except]
    type: write
    pattern: handling
    prompt: Raise a generic Exception
    expected_answer: "raise Exception()"
    accepted_solutions:
      - "raise Exception()"
      - "raise Exception"
    hints:
      - Use the raise keyword
      - Exception is the base exception class
    tags: [exceptions, raise, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/error-handling.yaml
git commit -m "feat(exercises): add second intro for raising subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Add Second Intro for `context` Subconcept

**Files:**
- Modify: `exercises/python/modules-files.yaml`

**Step 1: Add context-intro exercise**

```yaml
  - slug: context-intro
    objective: Use the with statement for automatic resource management
    title: Context Manager Intro
    difficulty: 1
    concept: modules-files
    subconcept: context
    level: intro
    prereqs: [reading]
    type: write
    pattern: context
    prompt: Open file "data.txt" for reading using a context manager
    expected_answer: 'with open("data.txt") as f:'
    accepted_solutions:
      - 'with open("data.txt") as f:'
      - "with open('data.txt') as f:"
      - 'with open("data.txt", "r") as f:'
      - "with open('data.txt', 'r') as f:"
    hints:
      - Use with statement for automatic cleanup
      - File closes automatically when block exits
    tags: [files, context, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/modules-files.yaml
git commit -m "feat(exercises): add second intro for context subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 11: Add Second Intro for `pathlib` Subconcept

**Files:**
- Modify: `exercises/python/modules-files.yaml`

**Step 1: Add pathlib-intro exercise**

```yaml
  - slug: pathlib-intro
    objective: Create a Path object from a string
    title: Pathlib Intro
    difficulty: 1
    concept: modules-files
    subconcept: pathlib
    level: intro
    prereqs: [imports]
    type: write
    pattern: construction
    prompt: Create a Path object from string "data/file.txt"
    expected_answer: 'Path("data/file.txt")'
    accepted_solutions:
      - 'Path("data/file.txt")'
      - "Path('data/file.txt')"
    hints:
      - Path is imported from pathlib
      - Pass the string path to the constructor
    tags: [pathlib, path, intro]
```

**Step 2: Run validation and commit**

```bash
git add exercises/python/modules-files.yaml
git commit -m "feat(exercises): add second intro for pathlib subconcept

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Dynamic Exercises for Truthiness/Booleans/Conversion

### Task 12: Create Truthiness Generator

**Files:**
- Create: `src/lib/generators/definitions/truthiness.ts`
- Modify: `src/lib/generators/definitions/index.ts`
- Test: `tests/unit/generators/truthiness.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/truthiness.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { truthinessGenerator } from '@/lib/generators/definitions/truthiness';

describe('truthinessGenerator', () => {
  it('generates valid truthiness scenarios', () => {
    const params = truthinessGenerator.generate('test-seed-123');

    expect(params).toHaveProperty('value');
    expect(params).toHaveProperty('valueStr');
    expect(params).toHaveProperty('isTruthy');
    expect(params).toHaveProperty('category');
    expect(['True', 'False']).toContain(params.isTruthy);
  });

  it('generates consistent results for same seed', () => {
    const params1 = truthinessGenerator.generate('consistent-seed');
    const params2 = truthinessGenerator.generate('consistent-seed');

    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const params = truthinessGenerator.generate('valid-test');
    expect(truthinessGenerator.validate(params)).toBe(true);
  });

  it('rejects invalid params', () => {
    expect(truthinessGenerator.validate({ value: 'x', isTruthy: 'Maybe' })).toBe(false);
    expect(truthinessGenerator.validate({})).toBe(false);
  });

  it('covers falsy values', () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const params = truthinessGenerator.generate(`falsy-${i}`);
      if (params.isTruthy === 'False') {
        results.add(params.category as string);
      }
    }
    // Should cover multiple falsy categories
    expect(results.size).toBeGreaterThan(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/truthiness.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement truthiness generator**

Create `src/lib/generators/definitions/truthiness.ts`:

```typescript
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

/**
 * Truthiness scenarios covering falsy and truthy values
 */
interface TruthinessScenario {
  valueStr: string;
  isTruthy: boolean;
  category: string;
}

const FALSY_SCENARIOS: TruthinessScenario[] = [
  { valueStr: 'False', isTruthy: false, category: 'boolean-false' },
  { valueStr: 'None', isTruthy: false, category: 'none' },
  { valueStr: '0', isTruthy: false, category: 'zero-int' },
  { valueStr: '0.0', isTruthy: false, category: 'zero-float' },
  { valueStr: '""', isTruthy: false, category: 'empty-string' },
  { valueStr: "''", isTruthy: false, category: 'empty-string-single' },
  { valueStr: '[]', isTruthy: false, category: 'empty-list' },
  { valueStr: '{}', isTruthy: false, category: 'empty-dict' },
  { valueStr: 'set()', isTruthy: false, category: 'empty-set' },
  { valueStr: '()', isTruthy: false, category: 'empty-tuple' },
];

const TRUTHY_SCENARIOS: TruthinessScenario[] = [
  { valueStr: 'True', isTruthy: true, category: 'boolean-true' },
  { valueStr: '1', isTruthy: true, category: 'nonzero-int' },
  { valueStr: '-1', isTruthy: true, category: 'negative-int' },
  { valueStr: '0.1', isTruthy: true, category: 'nonzero-float' },
  { valueStr: '"hello"', isTruthy: true, category: 'nonempty-string' },
  { valueStr: '"0"', isTruthy: true, category: 'string-zero' },
  { valueStr: '"False"', isTruthy: true, category: 'string-false' },
  { valueStr: '[0]', isTruthy: true, category: 'list-with-zero' },
  { valueStr: '[False]', isTruthy: true, category: 'list-with-false' },
  { valueStr: '{"a": 1}', isTruthy: true, category: 'nonempty-dict' },
  { valueStr: '{1}', isTruthy: true, category: 'nonempty-set' },
  { valueStr: '(0,)', isTruthy: true, category: 'tuple-with-zero' },
];

/**
 * truthiness generator
 *
 * Generates truthiness evaluation exercises for Python values.
 *
 * Output params:
 * - valueStr: string representation of the value
 * - isTruthy: 'True' or 'False'
 * - category: scenario category for validation
 * - explanation: why this value is truthy/falsy
 */
export const truthinessGenerator: Generator = {
  name: 'truthiness',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);

    // Mix of truthy and falsy, slightly favoring tricky falsy cases
    const useFalsy = rng.float() < 0.55;
    const scenarios = useFalsy ? FALSY_SCENARIOS : TRUTHY_SCENARIOS;
    const scenario = rng.pick(scenarios);

    const explanation = scenario.isTruthy
      ? `Non-empty/non-zero values are truthy`
      : `Empty collections, zero, None, and False are falsy`;

    return {
      valueStr: scenario.valueStr,
      isTruthy: scenario.isTruthy ? 'True' : 'False',
      category: scenario.category,
      explanation,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { valueStr, isTruthy, category } = params;

    if (
      typeof valueStr !== 'string' ||
      typeof isTruthy !== 'string' ||
      typeof category !== 'string'
    ) {
      return false;
    }

    if (isTruthy !== 'True' && isTruthy !== 'False') {
      return false;
    }

    // Find matching scenario
    const allScenarios = [...FALSY_SCENARIOS, ...TRUTHY_SCENARIOS];
    const scenario = allScenarios.find((s) => s.category === category);
    if (!scenario) return false;

    const expectedTruthy = scenario.isTruthy ? 'True' : 'False';
    return isTruthy === expectedTruthy && valueStr === scenario.valueStr;
  },
};
```

**Step 4: Register generator in index**

Modify `src/lib/generators/definitions/index.ts`, add import and export:

```typescript
import { truthinessGenerator } from './truthiness';

// Add to exports and registry
export { truthinessGenerator };

// In the registry object:
truthiness: truthinessGenerator,
```

**Step 5: Run tests**

Run: `pnpm test tests/unit/generators/truthiness.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/generators/definitions/truthiness.ts src/lib/generators/definitions/index.ts tests/unit/generators/truthiness.test.ts
git commit -m "feat(generators): add truthiness generator

Generates exercises evaluating Python truthiness/falsiness.
Covers: False, None, 0, empty collections (falsy)
        Non-zero, non-empty, True (truthy)
Includes tricky cases like '0' string and [False] list.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 13: Add Dynamic Truthiness Exercises

**Files:**
- Modify: `exercises/python/numbers-booleans.yaml`
- Test: Run `pnpm validate:dynamic`

**Step 1: Add truthiness-predict-dynamic exercise**

```yaml
  - slug: truthiness-predict-dynamic
    objective: Predict whether a Python value is truthy or falsy
    title: Dynamic Truthiness Predict
    difficulty: 2
    concept: numbers-booleans
    subconcept: truthiness
    level: practice
    prereqs: [booleans]
    type: predict
    pattern: logical
    generator: truthiness
    prompt: "What does bool({{valueStr}}) return?"
    code: |
      value = {{valueStr}}
      print(bool(value))
    expected_answer: "{{isTruthy}}"
    hints:
      - "{{explanation}}"
      - "Empty and zero values are falsy; most others are truthy"
    tags: [truthiness, bool, dynamic, predict]
```

**Step 2: Add truthiness-if-dynamic exercise**

```yaml
  - slug: truthiness-if-dynamic
    objective: Predict conditional behavior based on truthiness
    title: Dynamic Truthiness Conditional
    difficulty: 2
    concept: numbers-booleans
    subconcept: truthiness
    level: practice
    prereqs: [truthiness, conditionals]
    type: predict
    pattern: conditional
    generator: truthiness
    prompt: "What does this code print?"
    code: |
      x = {{valueStr}}
      if x:
          print("truthy")
      else:
          print("falsy")
    expected_answer: '{{#isTruthy}}truthy{{/isTruthy}}{{^isTruthy}}falsy{{/isTruthy}}'
    hints:
      - "{{explanation}}"
      - "The if statement evaluates truthiness"
    tags: [truthiness, conditional, dynamic, predict]
```

Note: The Mustache template above uses conditional sections. If that doesn't work with your renderer, use this simpler version:

```yaml
    expected_answer: "{{isTruthy === 'True' ? 'truthy' : 'falsy'}}"
```

Actually, let me check how the dynamic exercise system handles this. We should use a simpler approach:

**Step 2 (revised): Add truthiness-write-dynamic exercise**

```yaml
  - slug: truthiness-write-dynamic
    objective: Write code to check if a value is truthy
    title: Dynamic Truthiness Check
    difficulty: 2
    concept: numbers-booleans
    subconcept: truthiness
    level: practice
    prereqs: [booleans]
    type: write
    pattern: logical
    generator: truthiness
    prompt: "Convert {{valueStr}} to a boolean using bool()"
    expected_answer: "bool({{valueStr}})"
    hints:
      - "Use the bool() function"
      - "This will return {{isTruthy}}"
    tags: [truthiness, bool, dynamic, write]
```

**Step 3: Run validation**

Run: `pnpm validate:dynamic`
Expected: PASS

**Step 4: Commit**

```bash
git add exercises/python/numbers-booleans.yaml
git commit -m "feat(exercises): add dynamic truthiness exercises

Uses new truthiness generator for varied practice.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 14: Add Dynamic Boolean Logic Exercises

**Files:**
- Modify: `exercises/python/numbers-booleans.yaml`
- Test: Run `pnpm validate:dynamic`

**Step 1: Add bool-expr-dynamic exercise**

The `bool-logic` generator already exists. Add exercises using it:

```yaml
  - slug: bool-expr-dynamic
    objective: Evaluate a compound boolean expression
    title: Dynamic Boolean Expression
    difficulty: 2
    concept: numbers-booleans
    subconcept: booleans
    level: practice
    prereqs: [booleans]
    type: predict
    pattern: logical
    generator: bool-logic
    prompt: "What is the result of this expression?"
    code: |
      a = {{a}}
      b = {{b}}
      result = {{expression}}
      print(result)
    expected_answer: "{{result}}"
    hints:
      - "Expression checks: {{description}}"
      - "Evaluate step by step"
    tags: [booleans, logic, dynamic, predict]
```

**Step 2: Run validation and commit**

Run: `pnpm validate:dynamic`

```bash
git add exercises/python/numbers-booleans.yaml
git commit -m "feat(exercises): add dynamic boolean expression exercise

Uses existing bool-logic generator.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 15: Add Dynamic Conversion Exercises

**Files:**
- Create: `src/lib/generators/definitions/type-conversion.ts`
- Modify: `src/lib/generators/definitions/index.ts`
- Test: `tests/unit/generators/type-conversion.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/generators/type-conversion.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { typeConversionGenerator } from '@/lib/generators/definitions/type-conversion';

describe('typeConversionGenerator', () => {
  it('generates valid conversion scenarios', () => {
    const params = typeConversionGenerator.generate('test-seed');

    expect(params).toHaveProperty('inputValue');
    expect(params).toHaveProperty('targetType');
    expect(params).toHaveProperty('result');
    expect(params).toHaveProperty('conversionCall');
    expect(['int', 'float', 'str', 'bool']).toContain(params.targetType);
  });

  it('generates consistent results for same seed', () => {
    const params1 = typeConversionGenerator.generate('seed-abc');
    const params2 = typeConversionGenerator.generate('seed-abc');
    expect(params1).toEqual(params2);
  });

  it('validates correct params', () => {
    const params = typeConversionGenerator.generate('valid');
    expect(typeConversionGenerator.validate(params)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/generators/type-conversion.test.ts`
Expected: FAIL

**Step 3: Implement type-conversion generator**

Create `src/lib/generators/definitions/type-conversion.ts`:

```typescript
import type { Generator, GeneratorParams } from '../types';
import { seededRandom } from '../utils';

interface ConversionScenario {
  inputValue: string;
  targetType: 'int' | 'float' | 'str' | 'bool';
  result: string;
}

const SCENARIOS: ConversionScenario[] = [
  // String to int
  { inputValue: '"42"', targetType: 'int', result: '42' },
  { inputValue: '"123"', targetType: 'int', result: '123' },
  { inputValue: '"-5"', targetType: 'int', result: '-5' },

  // Float to int (truncates)
  { inputValue: '3.7', targetType: 'int', result: '3' },
  { inputValue: '9.99', targetType: 'int', result: '9' },
  { inputValue: '-2.8', targetType: 'int', result: '-2' },

  // String to float
  { inputValue: '"3.14"', targetType: 'float', result: '3.14' },
  { inputValue: '"2.5"', targetType: 'float', result: '2.5' },

  // Int to float
  { inputValue: '5', targetType: 'float', result: '5.0' },
  { inputValue: '10', targetType: 'float', result: '10.0' },

  // To string
  { inputValue: '42', targetType: 'str', result: '"42"' },
  { inputValue: '3.14', targetType: 'str', result: '"3.14"' },
  { inputValue: 'True', targetType: 'str', result: '"True"' },
  { inputValue: '[1, 2]', targetType: 'str', result: '"[1, 2]"' },

  // To bool
  { inputValue: '0', targetType: 'bool', result: 'False' },
  { inputValue: '1', targetType: 'bool', result: 'True' },
  { inputValue: '""', targetType: 'bool', result: 'False' },
  { inputValue: '"hello"', targetType: 'bool', result: 'True' },
  { inputValue: '[]', targetType: 'bool', result: 'False' },
  { inputValue: '[0]', targetType: 'bool', result: 'True' },
];

export const typeConversionGenerator: Generator = {
  name: 'type-conversion',

  generate(seed: string): GeneratorParams {
    const rng = seededRandom(seed);
    const scenario = rng.pick(SCENARIOS);

    return {
      inputValue: scenario.inputValue,
      targetType: scenario.targetType,
      result: scenario.result,
      conversionCall: `${scenario.targetType}(${scenario.inputValue})`,
    };
  },

  validate(params: GeneratorParams): boolean {
    const { inputValue, targetType, result } = params;

    if (
      typeof inputValue !== 'string' ||
      typeof targetType !== 'string' ||
      typeof result !== 'string'
    ) {
      return false;
    }

    const scenario = SCENARIOS.find(
      (s) => s.inputValue === inputValue && s.targetType === targetType
    );

    return scenario !== undefined && scenario.result === result;
  },
};
```

**Step 4: Register generator and run tests**

Add to `src/lib/generators/definitions/index.ts`:

```typescript
import { typeConversionGenerator } from './type-conversion';
export { typeConversionGenerator };
// In registry: 'type-conversion': typeConversionGenerator,
```

Run: `pnpm test tests/unit/generators/type-conversion.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/generators/definitions/type-conversion.ts src/lib/generators/definitions/index.ts tests/unit/generators/type-conversion.test.ts
git commit -m "feat(generators): add type-conversion generator

Covers: str->int, float->int, str->float, int->float, any->str, any->bool
Includes tricky cases like float truncation and empty collection booleans.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

### Task 16: Add Dynamic Conversion Exercises to YAML

**Files:**
- Modify: `exercises/python/numbers-booleans.yaml`
- Test: Run `pnpm validate:dynamic`

**Step 1: Add conversion-predict-dynamic exercise**

```yaml
  - slug: conversion-predict-dynamic
    objective: Predict the result of a type conversion
    title: Dynamic Type Conversion
    difficulty: 2
    concept: numbers-booleans
    subconcept: conversion
    level: practice
    prereqs: [integers, floats]
    type: predict
    pattern: conversion
    generator: type-conversion
    prompt: "What does {{conversionCall}} return?"
    code: |
      result = {{conversionCall}}
      print(result)
    expected_answer: "{{result}}"
    hints:
      - "Converting {{inputValue}} to {{targetType}}"
      - "Think about how Python handles this conversion"
    tags: [conversion, type, dynamic, predict]
```

**Step 2: Add conversion-write-dynamic exercise**

```yaml
  - slug: conversion-write-dynamic
    objective: Write the correct type conversion call
    title: Dynamic Conversion Write
    difficulty: 2
    concept: numbers-booleans
    subconcept: conversion
    level: practice
    prereqs: [integers, floats]
    type: write
    pattern: conversion
    generator: type-conversion
    prompt: "Convert {{inputValue}} to {{targetType}}"
    expected_answer: "{{conversionCall}}"
    hints:
      - "Use the {{targetType}}() function"
      - "Pass the value as an argument"
    tags: [conversion, type, dynamic, write]
```

**Step 3: Run validation**

Run: `pnpm validate:dynamic`
Expected: PASS

**Step 4: Commit**

```bash
git add exercises/python/numbers-booleans.yaml
git commit -m "feat(exercises): add dynamic type conversion exercises

Uses new type-conversion generator.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Validation & Documentation

### Task 17: Run Full Validation Suite

**Files:**
- Test all validation scripts

**Step 1: Run exercise schema validation**

Run: `pnpm validate:exercises`
Expected: PASS (all 10 files valid)

**Step 2: Run curriculum validation**

Run: `pnpm validate:curriculum`
Expected: PASS (0 issues)

**Step 3: Run dynamic exercise validation**

Run: `pnpm validate:dynamic`
Expected: PASS (all dynamic exercises valid)

**Step 4: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 5: Regenerate exercise documentation**

Run: `pnpm generate:exercise-list:obsidian`
Expected: Exercise-List.md updated with new exercises

---

### Task 18: Final Commit and Summary

**Step 1: Commit any remaining changes**

```bash
git add docs/EXERCISES.md
git commit -m "docs: regenerate exercise list after content expansion

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**Step 2: Create summary of changes**

Expected additions:
- **9 new intro exercises** for while, iteration, arguments
- **8 new intro exercises** for sparse subconcepts
- **2 new generators** (truthiness, type-conversion)
- **5+ new dynamic exercises** for booleans/truthiness/conversion

Total new exercises: ~22
Total exercises after: ~441

---

## Verification Checklist

After all tasks complete, verify:

- [ ] `pnpm validate:exercises` passes
- [ ] `pnpm validate:curriculum` passes
- [ ] `pnpm validate:dynamic` passes
- [ ] `pnpm test` passes (including new generator tests)
- [ ] No subconcepts have 0 intro exercises
- [ ] All sparse subconcepts have 2+ intro exercises
- [ ] Truthiness generator has property-based tests
- [ ] Type-conversion generator has property-based tests
- [ ] Exercise-List.md is regenerated
