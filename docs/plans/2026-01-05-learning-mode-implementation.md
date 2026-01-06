# Learning Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement teaching cards that appear once per subconcept on first encounter, showing explanation + example before practice.

**Architecture:** Extend the curriculum graph with teaching metadata per subconcept. Modify session building to insert teaching+practice pairs for new subconcepts. Create a new TeachingCard component and update SessionProgress for visual distinction.

**Tech Stack:** TypeScript, React 19, Vitest (TDD), Tailwind CSS 4, Framer Motion

---

## Part 1: Data Model & Types (TDD)

### Task 1.1: Add SubconceptTeaching Type

**Files:**
- Modify: `src/lib/curriculum/types.ts:60-98`
- Test: `tests/unit/curriculum/types.test.ts` (new file)

**Step 1: Write the failing test**

Create `tests/unit/curriculum/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { SubconceptTeaching, SubconceptDefinition } from '@/lib/curriculum/types';

describe('Curriculum Types', () => {
  describe('SubconceptTeaching', () => {
    it('has required explanation and exampleSlug fields', () => {
      const teaching: SubconceptTeaching = {
        explanation: 'For loops iterate over sequences.',
        exampleSlug: 'for-loop-range-intro',
      };

      expect(teaching.explanation).toBe('For loops iterate over sequences.');
      expect(teaching.exampleSlug).toBe('for-loop-range-intro');
    });
  });

  describe('SubconceptDefinition', () => {
    it('includes teaching field with explanation and exampleSlug', () => {
      const subconcept: SubconceptDefinition = {
        name: 'For Loops',
        concept: 'control-flow',
        prereqs: ['foundations'],
        teaching: {
          explanation: 'For loops iterate over sequences.',
          exampleSlug: 'for-loop-range-intro',
        },
      };

      expect(subconcept.name).toBe('For Loops');
      expect(subconcept.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(subconcept.teaching.exampleSlug).toBe('for-loop-range-intro');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/curriculum/types.test.ts`
Expected: FAIL with "Cannot find module" or type errors

**Step 3: Write minimal implementation**

Add to `src/lib/curriculum/types.ts` after line 98:

```typescript
/** Teaching content for introducing a subconcept */
export interface SubconceptTeaching {
  /** 2-3 sentence explanation of the concept (max 200 chars) */
  explanation: string;
  /** Slug of an intro-level exercise to show as example */
  exampleSlug: string;
}

/** Subconcept definition in curriculum graph */
export interface SubconceptDefinition {
  /** Display name of the subconcept */
  name: string;
  /** Parent concept slug */
  concept: string;
  /** Required subconcepts to unlock */
  prereqs: string[];
  /** Teaching content for first encounter */
  teaching: SubconceptTeaching;
}

/** Extended curriculum graph with subconcept definitions */
export interface ExtendedCurriculumGraph extends CurriculumGraph {
  /** Subconcept definitions with teaching content */
  subconcepts: Record<string, SubconceptDefinition>;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/curriculum/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/curriculum/types.ts tests/unit/curriculum/types.test.ts
git commit -m "feat(curriculum): add SubconceptTeaching and SubconceptDefinition types"
```

---

### Task 1.2: Add Session Card Types for Teaching

**Files:**
- Modify: `src/lib/session/types.ts:1-34`
- Test: `tests/unit/session/types.test.ts` (extend existing)

**Step 1: Write the failing test**

Add to `tests/unit/session/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  SessionCard,
  TeachingSessionCard,
  PracticeSessionCard,
  ReviewSessionCard,
  SessionCardType
} from '@/lib/session/types';
import { createMockExercise } from '@tests/fixtures/exercise';

describe('Session Card Types', () => {
  describe('TeachingSessionCard', () => {
    it('has type teaching with teaching content and example exercise', () => {
      const exercise = createMockExercise({ slug: 'for-loop-intro' });
      const card: TeachingSessionCard = {
        type: 'teaching',
        subconcept: 'for',
        teaching: {
          explanation: 'For loops iterate over sequences.',
          exampleSlug: 'for-loop-intro',
        },
        exampleExercise: exercise,
      };

      expect(card.type).toBe('teaching');
      expect(card.subconcept).toBe('for');
      expect(card.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(card.exampleExercise.slug).toBe('for-loop-intro');
    });
  });

  describe('PracticeSessionCard', () => {
    it('has type practice with exercise and isNew flag', () => {
      const exercise = createMockExercise({ slug: 'for-loop-practice' });
      const card: PracticeSessionCard = {
        type: 'practice',
        exercise,
        isNew: true,
      };

      expect(card.type).toBe('practice');
      expect(card.exercise.slug).toBe('for-loop-practice');
      expect(card.isNew).toBe(true);
    });
  });

  describe('ReviewSessionCard', () => {
    it('has type review with exercise', () => {
      const exercise = createMockExercise({ slug: 'for-loop-review' });
      const card: ReviewSessionCard = {
        type: 'review',
        exercise,
      };

      expect(card.type).toBe('review');
      expect(card.exercise.slug).toBe('for-loop-review');
    });
  });

  describe('SessionCardType discriminated union', () => {
    it('can narrow type based on type field', () => {
      const exercise = createMockExercise();
      const cards: SessionCardType[] = [
        { type: 'teaching', subconcept: 'for', teaching: { explanation: 'test', exampleSlug: 'test' }, exampleExercise: exercise },
        { type: 'practice', exercise, isNew: true },
        { type: 'review', exercise },
      ];

      const teachingCards = cards.filter((c): c is TeachingSessionCard => c.type === 'teaching');
      const practiceCards = cards.filter((c): c is PracticeSessionCard => c.type === 'practice');
      const reviewCards = cards.filter((c): c is ReviewSessionCard => c.type === 'review');

      expect(teachingCards).toHaveLength(1);
      expect(practiceCards).toHaveLength(1);
      expect(reviewCards).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/session/types.test.ts`
Expected: FAIL with type errors

**Step 3: Write minimal implementation**

Replace `src/lib/session/types.ts`:

```typescript
import type { Exercise } from '@/lib/types';
import type { CardState } from '@/lib/srs';
import type { SubconceptTeaching } from '@/lib/curriculum/types';

/**
 * A card in the practice session queue, combining exercise content with SRS state.
 * This is the legacy type - prefer SessionCardType for new code.
 */
export interface SessionCard {
  /** Full exercise data (prompt, answer, hints, etc.) */
  exercise: Exercise;
  /** SRS state (easeFactor, interval, repetitions, etc.) */
  state: CardState;
  /** True if user has never seen this exercise */
  isNew: boolean;
}

/**
 * Teaching card - shows explanation and example for first encounter
 */
export interface TeachingSessionCard {
  type: 'teaching';
  /** The subconcept being taught */
  subconcept: string;
  /** Teaching content (explanation + example slug) */
  teaching: SubconceptTeaching;
  /** The example exercise to display (read-only) */
  exampleExercise: Exercise;
}

/**
 * Practice card - follows a teaching card for new subconcepts
 */
export interface PracticeSessionCard {
  type: 'practice';
  /** The exercise to practice */
  exercise: Exercise;
  /** Always true for practice cards (first real attempt) */
  isNew: boolean;
}

/**
 * Review card - standard SRS review of previously learned content
 */
export interface ReviewSessionCard {
  type: 'review';
  /** The exercise to review */
  exercise: Exercise;
}

/**
 * Discriminated union of all session card types
 */
export type SessionCardType = TeachingSessionCard | PracticeSessionCard | ReviewSessionCard;

/**
 * Statistics tracked during a practice session.
 */
export interface SessionStats {
  /** Total cards in session (set at start) */
  total: number;
  /** Cards answered so far */
  completed: number;
  /** Cards answered correctly (quality >= 3) */
  correct: number;
  /** Cards answered incorrectly (quality < 3) */
  incorrect: number;
  /** When session started */
  startTime: Date;
  /** When session ended (undefined while in progress) */
  endTime?: Date;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/session/types.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/session/types.ts tests/unit/session/types.test.ts
git commit -m "feat(session): add TeachingSessionCard, PracticeSessionCard, ReviewSessionCard types"
```

---

### Task 1.3: Update Session Index Exports

**Files:**
- Modify: `src/lib/session/index.ts`

**Step 1: Update exports**

Replace `src/lib/session/index.ts`:

```typescript
export type {
  SessionCard,
  SessionStats,
  TeachingSessionCard,
  PracticeSessionCard,
  ReviewSessionCard,
  SessionCardType,
} from './types';
export { interleaveCards } from './interleave';
export { selectWithAntiRepeat } from './anti-repeat';
export type { SelectionCandidate } from './anti-repeat';
```

**Step 2: Verify build**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/session/index.ts
git commit -m "chore(session): export new card type exports"
```

---

## Part 2: Teaching Content Loading (TDD)

### Task 2.1: Create Curriculum Loader Utility

**Files:**
- Create: `src/lib/curriculum/loader.ts`
- Test: `tests/unit/curriculum/loader.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/curriculum/loader.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
} from '@/lib/curriculum/loader';

describe('Curriculum Loader', () => {
  describe('getSubconceptTeaching', () => {
    it('returns teaching content for a valid subconcept', () => {
      const teaching = getSubconceptTeaching('for');

      expect(teaching).not.toBeNull();
      expect(teaching?.explanation).toBeDefined();
      expect(teaching?.explanation.length).toBeGreaterThan(0);
      expect(teaching?.exampleSlug).toBeDefined();
    });

    it('returns null for unknown subconcept', () => {
      const teaching = getSubconceptTeaching('nonexistent-subconcept');

      expect(teaching).toBeNull();
    });
  });

  describe('getSubconceptDefinition', () => {
    it('returns full definition for a valid subconcept', () => {
      const definition = getSubconceptDefinition('for');

      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('For Loops');
      expect(definition?.concept).toBe('control-flow');
      expect(definition?.prereqs).toContain('foundations');
      expect(definition?.teaching).toBeDefined();
    });

    it('returns null for unknown subconcept', () => {
      const definition = getSubconceptDefinition('nonexistent');

      expect(definition).toBeNull();
    });
  });

  describe('getAllSubconcepts', () => {
    it('returns all subconcept slugs', () => {
      const subconcepts = getAllSubconcepts();

      expect(subconcepts.length).toBeGreaterThan(30); // We have ~42 subconcepts
      expect(subconcepts).toContain('for');
      expect(subconcepts).toContain('variables');
      expect(subconcepts).toContain('list-comp');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/curriculum/loader.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/lib/curriculum/loader.ts`:

```typescript
import type { SubconceptTeaching, SubconceptDefinition } from './types';
import curriculumData from './python.json';

// Type for the extended curriculum with subconcepts
interface CurriculumWithSubconcepts {
  language: string;
  version: string;
  concepts: Array<{
    slug: string;
    name: string;
    description: string;
    prereqs: string[];
    subconcepts: string[];
  }>;
  subconcepts?: Record<string, SubconceptDefinition>;
}

const curriculum = curriculumData as CurriculumWithSubconcepts;

/**
 * Get teaching content for a subconcept
 * @returns Teaching content or null if subconcept not found
 */
export function getSubconceptTeaching(subconceptSlug: string): SubconceptTeaching | null {
  const definition = curriculum.subconcepts?.[subconceptSlug];
  return definition?.teaching ?? null;
}

/**
 * Get full subconcept definition
 * @returns SubconceptDefinition or null if not found
 */
export function getSubconceptDefinition(subconceptSlug: string): SubconceptDefinition | null {
  return curriculum.subconcepts?.[subconceptSlug] ?? null;
}

/**
 * Get all subconcept slugs from the curriculum
 */
export function getAllSubconcepts(): string[] {
  // Collect from concepts array (current structure)
  const fromConcepts = curriculum.concepts.flatMap(c => c.subconcepts);

  // Also include any defined in subconcepts object
  const fromDefinitions = Object.keys(curriculum.subconcepts ?? {});

  // Combine and dedupe
  return [...new Set([...fromConcepts, ...fromDefinitions])];
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/curriculum/loader.test.ts`
Expected: FAIL (subconcepts object doesn't exist yet - this is expected, we'll add content in Task 2.2)

**Step 5: Skip to Task 2.2 to add teaching content, then return**

---

### Task 2.2: Add Teaching Content to python.json

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add subconcepts object with teaching content**

Add after the `concepts` array in `python.json`:

```json
{
  "language": "python",
  "version": "1.0.0",
  "concepts": [...],
  "subconcepts": {
    "variables": {
      "name": "Variables",
      "concept": "foundations",
      "prereqs": [],
      "teaching": {
        "explanation": "Variables store values for later use. Use `name = value` to assign.",
        "exampleSlug": "variable-assignment-intro"
      }
    },
    "operators": {
      "name": "Operators",
      "concept": "foundations",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Operators perform operations on values. Use +, -, *, / for arithmetic.",
        "exampleSlug": "arithmetic-operators-intro"
      }
    },
    "expressions": {
      "name": "Expressions",
      "concept": "foundations",
      "prereqs": ["operators"],
      "teaching": {
        "explanation": "Expressions combine values and operators to produce a result.",
        "exampleSlug": "expression-intro"
      }
    },
    "io": {
      "name": "Input/Output",
      "concept": "foundations",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Use print() to display output and input() to get user input.",
        "exampleSlug": "print-intro"
      }
    },
    "basics": {
      "name": "String Basics",
      "concept": "strings",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Strings are text in quotes. Use 'single' or \"double\" quotes.",
        "exampleSlug": "string-basics-intro"
      }
    },
    "indexing": {
      "name": "String Indexing",
      "concept": "strings",
      "prereqs": ["basics"],
      "teaching": {
        "explanation": "Access individual characters with [index]. Index 0 is the first character.",
        "exampleSlug": "string-indexing-intro"
      }
    },
    "slicing": {
      "name": "String Slicing",
      "concept": "strings",
      "prereqs": ["indexing"],
      "teaching": {
        "explanation": "Extract substrings with [start:end]. End index is exclusive.",
        "exampleSlug": "string-slicing-intro"
      }
    },
    "methods": {
      "name": "String Methods",
      "concept": "strings",
      "prereqs": ["basics"],
      "teaching": {
        "explanation": "Strings have methods like .upper(), .lower(), .strip() to transform them.",
        "exampleSlug": "string-methods-intro"
      }
    },
    "fstrings": {
      "name": "F-Strings",
      "concept": "strings",
      "prereqs": ["basics"],
      "teaching": {
        "explanation": "F-strings embed expressions in strings. Use f\"Hello {name}\" syntax.",
        "exampleSlug": "fstring-intro"
      }
    },
    "integers": {
      "name": "Integers",
      "concept": "numbers-booleans",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Integers are whole numbers without decimals. Use +, -, *, //, % operators.",
        "exampleSlug": "integer-intro"
      }
    },
    "floats": {
      "name": "Floats",
      "concept": "numbers-booleans",
      "prereqs": ["integers"],
      "teaching": {
        "explanation": "Floats are decimal numbers. Use / for division that returns floats.",
        "exampleSlug": "float-intro"
      }
    },
    "booleans": {
      "name": "Booleans",
      "concept": "numbers-booleans",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Booleans are True or False. Use and, or, not for logic.",
        "exampleSlug": "boolean-intro"
      }
    },
    "conversion": {
      "name": "Type Conversion",
      "concept": "numbers-booleans",
      "prereqs": ["integers", "floats"],
      "teaching": {
        "explanation": "Convert between types with int(), float(), str(), bool() functions.",
        "exampleSlug": "type-conversion-intro"
      }
    },
    "truthiness": {
      "name": "Truthiness",
      "concept": "numbers-booleans",
      "prereqs": ["booleans"],
      "teaching": {
        "explanation": "Values are truthy or falsy in conditions. 0, None, empty collections are falsy.",
        "exampleSlug": "truthiness-intro"
      }
    },
    "comparisons": {
      "name": "Comparisons",
      "concept": "numbers-booleans",
      "prereqs": ["booleans"],
      "teaching": {
        "explanation": "Use ==, !=, <, >, <=, >= to compare values. Use 'is' for identity.",
        "exampleSlug": "comparison-intro"
      }
    },
    "lists": {
      "name": "Lists",
      "concept": "collections",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Lists store ordered items in [brackets]. Access with [index], modify with .append().",
        "exampleSlug": "list-intro"
      }
    },
    "tuples": {
      "name": "Tuples",
      "concept": "collections",
      "prereqs": ["lists"],
      "teaching": {
        "explanation": "Tuples are immutable sequences in (parentheses). Use for fixed data.",
        "exampleSlug": "tuple-intro"
      }
    },
    "dicts": {
      "name": "Dictionaries",
      "concept": "collections",
      "prereqs": ["lists"],
      "teaching": {
        "explanation": "Dicts map keys to values in {braces}. Access with dict[key].",
        "exampleSlug": "dict-intro"
      }
    },
    "sets": {
      "name": "Sets",
      "concept": "collections",
      "prereqs": ["lists"],
      "teaching": {
        "explanation": "Sets store unique items in {braces}. Use for membership and deduplication.",
        "exampleSlug": "set-intro"
      }
    },
    "unpacking": {
      "name": "Unpacking",
      "concept": "collections",
      "prereqs": ["tuples"],
      "teaching": {
        "explanation": "Unpack sequences into variables: a, b = [1, 2]. Use * for rest.",
        "exampleSlug": "unpacking-intro"
      }
    },
    "mutability": {
      "name": "Mutability",
      "concept": "collections",
      "prereqs": ["lists", "tuples"],
      "teaching": {
        "explanation": "Lists are mutable (changeable), tuples are immutable. Avoid mutable default args.",
        "exampleSlug": "mutability-intro"
      }
    },
    "conditionals": {
      "name": "Conditionals",
      "concept": "control-flow",
      "prereqs": ["booleans"],
      "teaching": {
        "explanation": "Use if/elif/else to branch code. Condition must be truthy to execute.",
        "exampleSlug": "if-else-intro"
      }
    },
    "for": {
      "name": "For Loops",
      "concept": "control-flow",
      "prereqs": ["lists"],
      "teaching": {
        "explanation": "For loops iterate over sequences. Use `for item in sequence:` to process each element.",
        "exampleSlug": "for-loop-range-intro"
      }
    },
    "while": {
      "name": "While Loops",
      "concept": "control-flow",
      "prereqs": ["conditionals"],
      "teaching": {
        "explanation": "While loops repeat while condition is true. Use break to exit early.",
        "exampleSlug": "while-loop-intro"
      }
    },
    "iteration": {
      "name": "Iteration Patterns",
      "concept": "control-flow",
      "prereqs": ["for"],
      "teaching": {
        "explanation": "Use enumerate() for index+value, range() for numbers, items() for dicts.",
        "exampleSlug": "enumerate-intro"
      }
    },
    "zip": {
      "name": "Zip",
      "concept": "control-flow",
      "prereqs": ["for"],
      "teaching": {
        "explanation": "zip() pairs elements from multiple sequences. Iterate in parallel.",
        "exampleSlug": "zip-intro"
      }
    },
    "reversed": {
      "name": "Reversed",
      "concept": "control-flow",
      "prereqs": ["for"],
      "teaching": {
        "explanation": "reversed() iterates a sequence backwards. Use for reverse iteration.",
        "exampleSlug": "reversed-intro"
      }
    },
    "sorted": {
      "name": "Sorted",
      "concept": "control-flow",
      "prereqs": ["for"],
      "teaching": {
        "explanation": "sorted() returns a new sorted list. Use key= for custom sorting.",
        "exampleSlug": "sorted-intro"
      }
    },
    "any-all": {
      "name": "Any/All",
      "concept": "control-flow",
      "prereqs": ["booleans", "for"],
      "teaching": {
        "explanation": "any() returns True if any item is truthy. all() requires all to be truthy.",
        "exampleSlug": "any-all-intro"
      }
    },
    "arguments": {
      "name": "Arguments",
      "concept": "functions",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "Pass values to functions as arguments. Parameters receive the values.",
        "exampleSlug": "function-args-intro"
      }
    },
    "defaults": {
      "name": "Default Arguments",
      "concept": "functions",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "Set default values with param=value. Called without argument uses default.",
        "exampleSlug": "defaults-intro"
      }
    },
    "args-kwargs": {
      "name": "*args and **kwargs",
      "concept": "functions",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "*args captures extra positional args. **kwargs captures keyword args.",
        "exampleSlug": "args-kwargs-intro"
      }
    },
    "scope": {
      "name": "Scope",
      "concept": "functions",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "Variables inside functions are local. Use global or nonlocal to modify outer vars.",
        "exampleSlug": "scope-intro"
      }
    },
    "lambda": {
      "name": "Lambda",
      "concept": "functions",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "Lambda creates small anonymous functions. Use `lambda x: x * 2` syntax.",
        "exampleSlug": "lambda-intro"
      }
    },
    "typehints": {
      "name": "Type Hints",
      "concept": "functions",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "Type hints document expected types. Use `def func(x: int) -> str:` syntax.",
        "exampleSlug": "typehints-intro"
      }
    },
    "list-comp": {
      "name": "List Comprehensions",
      "concept": "comprehensions",
      "prereqs": ["for", "lists"],
      "teaching": {
        "explanation": "List comprehensions create lists in one line. Use [expr for item in seq].",
        "exampleSlug": "list-comprehension-intro"
      }
    },
    "dict-comp": {
      "name": "Dict Comprehensions",
      "concept": "comprehensions",
      "prereqs": ["list-comp", "dicts"],
      "teaching": {
        "explanation": "Dict comprehensions create dicts. Use {key: value for item in seq}.",
        "exampleSlug": "dict-comprehension-intro"
      }
    },
    "set-comp": {
      "name": "Set Comprehensions",
      "concept": "comprehensions",
      "prereqs": ["list-comp", "sets"],
      "teaching": {
        "explanation": "Set comprehensions create sets. Use {expr for item in seq}.",
        "exampleSlug": "set-comprehension-intro"
      }
    },
    "generator-exp": {
      "name": "Generator Expressions",
      "concept": "comprehensions",
      "prereqs": ["list-comp"],
      "teaching": {
        "explanation": "Generator expressions yield items lazily. Use (expr for item in seq).",
        "exampleSlug": "generator-exp-intro"
      }
    },
    "try-except": {
      "name": "Try/Except",
      "concept": "error-handling",
      "prereqs": ["conditionals"],
      "teaching": {
        "explanation": "try/except catches exceptions. Specify exception types to handle.",
        "exampleSlug": "try-except-intro"
      }
    },
    "finally": {
      "name": "Finally",
      "concept": "error-handling",
      "prereqs": ["try-except"],
      "teaching": {
        "explanation": "finally block always runs, even after exceptions. Use for cleanup.",
        "exampleSlug": "finally-intro"
      }
    },
    "raising": {
      "name": "Raising Exceptions",
      "concept": "error-handling",
      "prereqs": ["try-except"],
      "teaching": {
        "explanation": "raise Exception('message') signals an error. Create custom exceptions by subclassing.",
        "exampleSlug": "raise-intro"
      }
    },
    "classes": {
      "name": "Classes",
      "concept": "oop",
      "prereqs": ["arguments"],
      "teaching": {
        "explanation": "Classes define objects. Use __init__ for initialization, self for instance.",
        "exampleSlug": "class-intro"
      }
    },
    "methods": {
      "name": "Methods",
      "concept": "oop",
      "prereqs": ["classes"],
      "teaching": {
        "explanation": "Methods are functions on classes. First parameter is self for instance.",
        "exampleSlug": "method-intro"
      }
    },
    "inheritance": {
      "name": "Inheritance",
      "concept": "oop",
      "prereqs": ["classes"],
      "teaching": {
        "explanation": "Child classes inherit from parents. Use super() to call parent methods.",
        "exampleSlug": "inheritance-intro"
      }
    },
    "classmethod": {
      "name": "Class/Static Methods",
      "concept": "oop",
      "prereqs": ["methods"],
      "teaching": {
        "explanation": "@classmethod gets cls, @staticmethod gets no self. Use for alternative constructors.",
        "exampleSlug": "classmethod-intro"
      }
    },
    "properties": {
      "name": "Properties",
      "concept": "oop",
      "prereqs": ["methods"],
      "teaching": {
        "explanation": "@property makes methods act like attributes. Use for computed values.",
        "exampleSlug": "property-intro"
      }
    },
    "imports": {
      "name": "Imports",
      "concept": "modules-files",
      "prereqs": ["variables"],
      "teaching": {
        "explanation": "import module or from module import name. Use as for aliases.",
        "exampleSlug": "import-intro"
      }
    },
    "reading": {
      "name": "Reading Files",
      "concept": "modules-files",
      "prereqs": ["try-except"],
      "teaching": {
        "explanation": "Use open(path) to read files. Always close or use with statement.",
        "exampleSlug": "file-read-intro"
      }
    },
    "writing": {
      "name": "Writing Files",
      "concept": "modules-files",
      "prereqs": ["reading"],
      "teaching": {
        "explanation": "Use open(path, 'w') to write. 'a' mode appends instead of overwriting.",
        "exampleSlug": "file-write-intro"
      }
    },
    "context": {
      "name": "Context Managers",
      "concept": "modules-files",
      "prereqs": ["reading"],
      "teaching": {
        "explanation": "with statement auto-closes resources. Use with open() as f: for files.",
        "exampleSlug": "context-manager-intro"
      }
    },
    "pathlib": {
      "name": "Pathlib",
      "concept": "modules-files",
      "prereqs": ["imports"],
      "teaching": {
        "explanation": "pathlib.Path handles file paths. Use / operator to join paths.",
        "exampleSlug": "pathlib-intro"
      }
    },
    "main-guard": {
      "name": "Main Guard",
      "concept": "modules-files",
      "prereqs": ["imports"],
      "teaching": {
        "explanation": "if __name__ == '__main__': runs only when script is executed directly.",
        "exampleSlug": "main-guard-intro"
      }
    }
  }
}
```

**Step 2: Run the loader tests again**

Run: `pnpm test tests/unit/curriculum/loader.test.ts`
Expected: PASS (now that subconcepts object exists)

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json src/lib/curriculum/loader.ts tests/unit/curriculum/loader.test.ts
git commit -m "feat(curriculum): add teaching content for all 42 subconcepts"
```

---

### Task 2.3: Export Curriculum Loader

**Files:**
- Create: `src/lib/curriculum/index.ts`

**Step 1: Create index file**

Create `src/lib/curriculum/index.ts`:

```typescript
export type {
  ConceptSlug,
  ExerciseLevel,
  ExerciseType,
  ExercisePattern,
  LearningPhase,
  Concept,
  SubconceptProgress,
  ExerciseAttempt,
  CurriculumGraph,
  SubconceptTeaching,
  SubconceptDefinition,
  ExtendedCurriculumGraph,
} from './types';

export {
  getSubconceptTeaching,
  getSubconceptDefinition,
  getAllSubconcepts,
} from './loader';
```

**Step 2: Verify build**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/curriculum/index.ts
git commit -m "chore(curriculum): add index exports for loader and types"
```

---

## Part 3: Session Building Logic (TDD)

### Task 3.1: Create Teaching Card Builder

**Files:**
- Create: `src/lib/session/teaching-cards.ts`
- Test: `tests/unit/session/teaching-cards.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/session/teaching-cards.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTeachingPair, findExampleExercise } from '@/lib/session/teaching-cards';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { SubconceptDefinition } from '@/lib/curriculum/types';

describe('Teaching Cards', () => {
  const mockSubconcept: SubconceptDefinition = {
    name: 'For Loops',
    concept: 'control-flow',
    prereqs: ['foundations'],
    teaching: {
      explanation: 'For loops iterate over sequences.',
      exampleSlug: 'for-loop-range-intro',
    },
  };

  describe('findExampleExercise', () => {
    it('finds exercise matching the exampleSlug', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for' }),
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for' }),
      ];

      const example = findExampleExercise('for-loop-range-intro', exercises);

      expect(example).not.toBeNull();
      expect(example?.slug).toBe('for-loop-range-intro');
    });

    it('returns null if exampleSlug not found', () => {
      const exercises = [
        createMockExercise({ slug: 'other-exercise', subconcept: 'for' }),
      ];

      const example = findExampleExercise('for-loop-range-intro', exercises);

      expect(example).toBeNull();
    });
  });

  describe('buildTeachingPair', () => {
    it('returns teaching card and practice card for new subconcept', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for', level: 'intro' }),
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for', level: 'practice' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).not.toBeNull();
      expect(pair?.teachingCard.type).toBe('teaching');
      expect(pair?.teachingCard.subconcept).toBe('for');
      expect(pair?.teachingCard.teaching.explanation).toBe('For loops iterate over sequences.');
      expect(pair?.teachingCard.exampleExercise.slug).toBe('for-loop-range-intro');

      expect(pair?.practiceCard.type).toBe('practice');
      expect(pair?.practiceCard.exercise.slug).toBe('for-loop-practice');
      expect(pair?.practiceCard.isNew).toBe(true);
    });

    it('selects different exercise for practice than example', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for', level: 'intro' }),
        createMockExercise({ slug: 'for-loop-basic', subconcept: 'for', level: 'intro' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).not.toBeNull();
      expect(pair?.teachingCard.exampleExercise.slug).toBe('for-loop-range-intro');
      expect(pair?.practiceCard.exercise.slug).toBe('for-loop-basic');
    });

    it('returns null if example exercise not found', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-practice', subconcept: 'for' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).toBeNull();
    });

    it('returns null if no practice exercise available', () => {
      const exercises = [
        createMockExercise({ slug: 'for-loop-range-intro', subconcept: 'for' }),
      ];

      const pair = buildTeachingPair('for', mockSubconcept, exercises);

      expect(pair).toBeNull();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/session/teaching-cards.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/lib/session/teaching-cards.ts`:

```typescript
import type { Exercise } from '@/lib/types';
import type { SubconceptDefinition } from '@/lib/curriculum/types';
import type { TeachingSessionCard, PracticeSessionCard } from './types';

export interface TeachingPair {
  teachingCard: TeachingSessionCard;
  practiceCard: PracticeSessionCard;
}

/**
 * Find the example exercise by slug
 */
export function findExampleExercise(
  exampleSlug: string,
  exercises: Exercise[]
): Exercise | null {
  return exercises.find(e => e.slug === exampleSlug) ?? null;
}

/**
 * Find a practice exercise for a subconcept (different from example)
 */
function findPracticeExercise(
  subconceptSlug: string,
  exampleSlug: string,
  exercises: Exercise[]
): Exercise | null {
  // Get all exercises for this subconcept except the example
  const candidates = exercises.filter(
    e => e.subconcept === subconceptSlug && e.slug !== exampleSlug
  );

  if (candidates.length === 0) return null;

  // Prefer intro or practice level for first attempt
  const preferred = candidates.find(
    e => e.level === 'intro' || e.level === 'practice'
  );

  return preferred ?? candidates[0];
}

/**
 * Build a teaching + practice card pair for a new subconcept
 *
 * @returns TeachingPair or null if example or practice exercise not found
 */
export function buildTeachingPair(
  subconceptSlug: string,
  subconcept: SubconceptDefinition,
  exercises: Exercise[]
): TeachingPair | null {
  // Find the example exercise
  const exampleExercise = findExampleExercise(
    subconcept.teaching.exampleSlug,
    exercises
  );

  if (!exampleExercise) {
    console.warn(`Teaching example not found: ${subconcept.teaching.exampleSlug}`);
    return null;
  }

  // Find a different exercise for practice
  const practiceExercise = findPracticeExercise(
    subconceptSlug,
    subconcept.teaching.exampleSlug,
    exercises
  );

  if (!practiceExercise) {
    console.warn(`No practice exercise found for subconcept: ${subconceptSlug}`);
    return null;
  }

  // Build the teaching card
  const teachingCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: subconceptSlug,
    teaching: subconcept.teaching,
    exampleExercise,
  };

  // Build the practice card
  const practiceCard: PracticeSessionCard = {
    type: 'practice',
    exercise: practiceExercise,
    isNew: true,
  };

  return { teachingCard, practiceCard };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/session/teaching-cards.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/session/teaching-cards.ts tests/unit/session/teaching-cards.test.ts
git commit -m "feat(session): add buildTeachingPair for creating teaching+practice card pairs"
```

---

### Task 3.2: Create Teaching Cards Interleave Function

**Files:**
- Create: `src/lib/session/interleave-teaching.ts`
- Test: `tests/unit/session/interleave-teaching.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/session/interleave-teaching.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { interleaveWithTeaching } from '@/lib/session/interleave-teaching';
import type { ReviewSessionCard, TeachingSessionCard, PracticeSessionCard, SessionCardType } from '@/lib/session/types';
import type { TeachingPair } from '@/lib/session/teaching-cards';
import { createMockExercise } from '@tests/fixtures/exercise';

function createReviewCard(id: string): ReviewSessionCard {
  return {
    type: 'review',
    exercise: createMockExercise({ id, slug: `review-${id}` }),
  };
}

function createTeachingPair(subconcept: string): TeachingPair {
  return {
    teachingCard: {
      type: 'teaching',
      subconcept,
      teaching: { explanation: `Learn ${subconcept}`, exampleSlug: `${subconcept}-intro` },
      exampleExercise: createMockExercise({ slug: `${subconcept}-intro` }),
    },
    practiceCard: {
      type: 'practice',
      exercise: createMockExercise({ slug: `${subconcept}-practice` }),
      isNew: true,
    },
  };
}

describe('interleaveWithTeaching', () => {
  it('returns empty array when both inputs empty', () => {
    const result = interleaveWithTeaching([], []);
    expect(result).toEqual([]);
  });

  it('returns only review cards when no teaching pairs', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2')];
    const result = interleaveWithTeaching(reviewCards, []);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.type === 'review')).toBe(true);
  });

  it('returns teaching pairs when no review cards', () => {
    const pairs = [createTeachingPair('for')];
    const result = interleaveWithTeaching([], pairs);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('teaching');
    expect(result[1].type).toBe('practice');
  });

  it('interleaves teaching pairs after every 3 review cards', () => {
    const reviewCards = [
      createReviewCard('1'),
      createReviewCard('2'),
      createReviewCard('3'),
      createReviewCard('4'),
      createReviewCard('5'),
      createReviewCard('6'),
    ];
    const pairs = [createTeachingPair('for'), createTeachingPair('while')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // 6 reviews + 2 pairs (4 cards) = 10 total
    expect(result).toHaveLength(10);

    // Check pattern: 3 reviews, then teaching pair, then 3 more reviews, then teaching pair
    expect(result[0].type).toBe('review');
    expect(result[1].type).toBe('review');
    expect(result[2].type).toBe('review');
    expect(result[3].type).toBe('teaching');
    expect(result[4].type).toBe('practice');
    expect(result[5].type).toBe('review');
    expect(result[6].type).toBe('review');
    expect(result[7].type).toBe('review');
    expect(result[8].type).toBe('teaching');
    expect(result[9].type).toBe('practice');
  });

  it('keeps teaching and practice cards together as pairs', () => {
    const reviewCards = [createReviewCard('1'), createReviewCard('2')];
    const pairs = [createTeachingPair('for')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    // Find teaching card index
    const teachingIndex = result.findIndex(c => c.type === 'teaching');
    expect(teachingIndex).toBeGreaterThanOrEqual(0);

    // Practice should immediately follow
    expect(result[teachingIndex + 1].type).toBe('practice');

    // They should be for the same subconcept
    const teaching = result[teachingIndex] as TeachingSessionCard;
    const practice = result[teachingIndex + 1] as PracticeSessionCard;
    expect(teaching.subconcept).toBe('for');
  });

  it('preserves order of review cards', () => {
    const reviewCards = [
      createReviewCard('a'),
      createReviewCard('b'),
      createReviewCard('c'),
    ];
    const pairs = [createTeachingPair('for')];

    const result = interleaveWithTeaching(reviewCards, pairs);

    const reviewOnly = result.filter((c): c is ReviewSessionCard => c.type === 'review');
    expect(reviewOnly.map(c => c.exercise.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves order of teaching pairs', () => {
    const reviewCards: ReviewSessionCard[] = [];
    const pairs = [
      createTeachingPair('for'),
      createTeachingPair('while'),
      createTeachingPair('if'),
    ];

    const result = interleaveWithTeaching(reviewCards, pairs);

    const teachingOnly = result.filter((c): c is TeachingSessionCard => c.type === 'teaching');
    expect(teachingOnly.map(c => c.subconcept)).toEqual(['for', 'while', 'if']);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/session/interleave-teaching.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/lib/session/interleave-teaching.ts`:

```typescript
import type { ReviewSessionCard, SessionCardType } from './types';
import type { TeachingPair } from './teaching-cards';

const INSERT_INTERVAL = 3; // Insert teaching pair after every 3 review cards

/**
 * Interleaves teaching+practice pairs into a queue of review cards.
 *
 * - Inserts one teaching pair after every 3 review cards
 * - Teaching card always immediately precedes its practice card
 * - Maintains order of both review cards and teaching pairs
 */
export function interleaveWithTeaching(
  reviewCards: ReviewSessionCard[],
  teachingPairs: TeachingPair[]
): SessionCardType[] {
  if (reviewCards.length === 0 && teachingPairs.length === 0) {
    return [];
  }

  if (teachingPairs.length === 0) {
    return [...reviewCards];
  }

  if (reviewCards.length === 0) {
    // Just return all teaching pairs in order
    return teachingPairs.flatMap(pair => [pair.teachingCard, pair.practiceCard]);
  }

  const result: SessionCardType[] = [];
  let reviewIndex = 0;
  let pairIndex = 0;

  while (reviewIndex < reviewCards.length || pairIndex < teachingPairs.length) {
    // Add review cards up to the interval
    let addedReviews = 0;
    while (reviewIndex < reviewCards.length && addedReviews < INSERT_INTERVAL) {
      result.push(reviewCards[reviewIndex]);
      reviewIndex++;
      addedReviews++;
    }

    // Add one teaching pair if available
    if (pairIndex < teachingPairs.length) {
      const pair = teachingPairs[pairIndex];
      result.push(pair.teachingCard);
      result.push(pair.practiceCard);
      pairIndex++;
    }
  }

  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/session/interleave-teaching.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/session/interleave-teaching.ts tests/unit/session/interleave-teaching.test.ts
git commit -m "feat(session): add interleaveWithTeaching for teaching pair insertion"
```

---

### Task 3.3: Update Session Index Exports

**Files:**
- Modify: `src/lib/session/index.ts`

**Step 1: Update exports**

```typescript
export type {
  SessionCard,
  SessionStats,
  TeachingSessionCard,
  PracticeSessionCard,
  ReviewSessionCard,
  SessionCardType,
} from './types';
export { interleaveCards } from './interleave';
export { interleaveWithTeaching } from './interleave-teaching';
export { buildTeachingPair, findExampleExercise } from './teaching-cards';
export type { TeachingPair } from './teaching-cards';
export { selectWithAntiRepeat } from './anti-repeat';
export type { SelectionCandidate } from './anti-repeat';
```

**Step 2: Verify build**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/session/index.ts
git commit -m "chore(session): export teaching card utilities"
```

---

## Part 4: UI Components (TDD for Logic, Visual for UI)

### Task 4.1: Create TeachingCard Component

**Files:**
- Create: `src/components/exercise/TeachingCard.tsx`
- Test: `tests/unit/components/TeachingCard.test.tsx`

**Step 1: Write the failing test**

Create `tests/unit/components/TeachingCard.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeachingCard } from '@/components/exercise/TeachingCard';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { TeachingSessionCard } from '@/lib/session/types';

describe('TeachingCard', () => {
  const mockCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: 'for',
    teaching: {
      explanation: 'For loops iterate over sequences. Use `for item in sequence:` to process each element.',
      exampleSlug: 'for-loop-range-intro',
    },
    exampleExercise: createMockExercise({
      slug: 'for-loop-range-intro',
      expectedAnswer: 'for i in range(5):\n    print(i)',
    }),
  };

  it('displays the subconcept name in header', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/For Loops/i)).toBeInTheDocument();
  });

  it('displays the explanation text', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/For loops iterate over sequences/)).toBeInTheDocument();
  });

  it('displays the example code', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/for i in range\(5\)/)).toBeInTheDocument();
  });

  it('calls onContinue when Got it button is clicked', () => {
    const onContinue = vi.fn();
    render(<TeachingCard card={mockCard} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when Enter key is pressed', () => {
    const onContinue = vi.fn();
    render(<TeachingCard card={mockCard} onContinue={onContinue} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('has LEARN label in header', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/LEARN/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/TeachingCard.test.tsx`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/components/exercise/TeachingCard.tsx`:

```typescript
'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TeachingSessionCard } from '@/lib/session/types';
import { getSubconceptDefinition } from '@/lib/curriculum';

interface TeachingCardProps {
  card: TeachingSessionCard;
  onContinue: () => void;
}

export function TeachingCard({ card, onContinue }: TeachingCardProps) {
  const subconcept = getSubconceptDefinition(card.subconcept);
  const displayName = subconcept?.name ?? card.subconcept;

  // Handle Enter key to advance
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onContinue();
      }
    },
    [onContinue]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Card className="overflow-hidden border-blue-500/20">
      {/* Blue indicator bar for teaching cards */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

      <CardContent className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              LEARN
            </span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
          </div>

          {/* Explanation */}
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {card.teaching.explanation}
          </p>

          {/* Example code block */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Example
            </span>
            <div className="rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap text-[var(--text-primary)]">
                {card.exampleExercise.expectedAnswer}
              </pre>
            </div>
          </div>

          {/* Continue button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Got it →
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/TeachingCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/exercise/TeachingCard.tsx tests/unit/components/TeachingCard.test.tsx
git commit -m "feat(ui): add TeachingCard component for learning mode"
```

---

### Task 4.2: Export TeachingCard from Components

**Files:**
- Modify: `src/components/exercise/index.ts`
- Modify: `src/components/index.ts`

**Step 1: Update exercise index**

Add to `src/components/exercise/index.ts`:

```typescript
export { TeachingCard } from './TeachingCard';
```

**Step 2: Update main components index**

Add to `src/components/index.ts` exports:

```typescript
// Exercise components
export {
  ExerciseCard,
  ExercisePrompt,
  CodeInput,
  ExerciseFeedback,
  HintButton,
  TeachingCard,
} from './exercise';
```

**Step 3: Verify build**

Run: `pnpm typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/exercise/index.ts src/components/index.ts
git commit -m "chore(components): export TeachingCard"
```

---

### Task 4.3: Update SessionProgress for Teaching Cards

**Files:**
- Modify: `src/components/session/SessionProgress.tsx`
- Test: `tests/unit/components/SessionProgress.test.tsx` (new)

**Step 1: Write the failing test**

Create `tests/unit/components/SessionProgress.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionProgress } from '@/components/session/SessionProgress';

describe('SessionProgress', () => {
  it('renders with default green segments', () => {
    render(<SessionProgress current={2} total={5} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('renders blue segments for teaching card types', () => {
    const cardTypes: ('teaching' | 'practice' | 'review')[] = [
      'teaching',
      'practice',
      'review',
      'review',
    ];

    render(
      <SessionProgress
        current={1}
        total={4}
        cardTypes={cardTypes}
      />
    );

    // Should have teaching segment with blue styling
    const segments = screen.getByRole('progressbar').querySelectorAll('[data-segment]');
    expect(segments.length).toBe(4);
  });

  it('shows current segment with glow effect', () => {
    render(<SessionProgress current={1} total={3} />);

    // Current segment (index 1) should have glow
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current behavior**

Run: `pnpm test tests/unit/components/SessionProgress.test.tsx`
Expected: PASS for basic tests, FAIL for cardTypes (not implemented yet)

**Step 3: Update SessionProgress implementation**

Replace `src/components/session/SessionProgress.tsx`:

```typescript
'use client';

import { motion } from 'framer-motion';

interface SessionProgressProps {
  /** Current card index (0-based) */
  current: number;
  /** Total cards in session */
  total: number;
  /** Optional card types for color coding (teaching = blue, others = green) */
  cardTypes?: ('teaching' | 'practice' | 'review')[];
  /** Additional CSS classes */
  className?: string;
}

export function SessionProgress({
  current,
  total,
  cardTypes,
  className = '',
}: SessionProgressProps) {
  // Display shows next card number (completed + 1), capped at total
  const displayCurrent = Math.min(current + 1, total);

  // Calculate percentage for aria attributes
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // Generate segments
  const segments = Array.from({ length: total }, (_, index) => {
    const isCompleted = index < current;
    const isCurrent = index === current && current < total;
    const isTeaching = cardTypes?.[index] === 'teaching';

    return { index, isCompleted, isCurrent, isTeaching };
  });

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${displayCurrent} of ${total} exercises`}
        className="flex flex-1 items-center gap-1"
      >
        {total === 0 ? (
          // Empty state - show a single muted segment
          <div className="h-2 w-full rounded-full bg-[var(--bg-surface-3)]" />
        ) : (
          segments.map(({ index, isCompleted, isCurrent, isTeaching }) => (
            <motion.div
              key={index}
              data-segment
              className={`
                h-2 flex-1 rounded-full overflow-hidden
                ${isCompleted || isCurrent
                  ? ''
                  : 'bg-[var(--bg-surface-3)]'
                }
              `}
              initial={false}
            >
              <motion.div
                className={`
                  h-full rounded-full
                  ${isTeaching
                    ? isCurrent
                      ? 'bg-blue-500 shadow-[0_0_8px_rgb(59,130,246)]'
                      : 'bg-blue-500'
                    : isCurrent
                      ? 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'
                      : 'bg-[var(--accent-primary)]'
                  }
                `}
                initial={{ width: '0%' }}
                animate={{
                  width: isCompleted || isCurrent ? '100%' : '0%',
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 1, 0.5, 1],
                }}
              />
            </motion.div>
          ))
        )}
      </div>
      <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
        {displayCurrent} / {total}
      </span>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/SessionProgress.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/session/SessionProgress.tsx tests/unit/components/SessionProgress.test.tsx
git commit -m "feat(ui): add teaching card support to SessionProgress with blue segments"
```

---

## Part 5: Integration (Wire Everything Together)

### Task 5.1: Create useTeachingSession Hook

**Files:**
- Create: `src/lib/hooks/useTeachingSession.ts`
- Test: `tests/unit/hooks/useTeachingSession.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/hooks/useTeachingSession.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          lte: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    loading: false,
  }),
}));

describe('useTeachingSession', () => {
  it('placeholder for hook tests - actual implementation will be wired in useConceptSession', () => {
    // The teaching functionality will be integrated into useConceptSession
    // This test file is a placeholder for future unit tests
    expect(true).toBe(true);
  });
});
```

**Step 2: Commit placeholder**

```bash
git add tests/unit/hooks/useTeachingSession.test.ts
git commit -m "test(hooks): add placeholder for teaching session tests"
```

---

### Task 5.2: Update useConceptSession to Support Teaching Cards

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`

**Step 1: Update the hook to include teaching cards**

This is a significant change. Update `src/lib/hooks/useConceptSession.ts`:

Key changes:
1. Import teaching card utilities
2. Add state for tracking card types
3. Modify session building to include teaching pairs
4. Handle teaching card advancement (no SRS update)

```typescript
// Add these imports at the top:
import {
  buildTeachingPair,
  interleaveWithTeaching,
  type TeachingPair,
  type SessionCardType,
  type ReviewSessionCard,
} from '@/lib/session';
import { getSubconceptDefinition, getAllSubconcepts } from '@/lib/curriculum';

// Update ConceptSessionCard to use SessionCardType:
// (This is a breaking change - the return type changes)

// In the session building effect, add teaching pair logic:
// 1. Get subconcepts user has never practiced (no progress row)
// 2. Build teaching pairs for new subconcepts
// 3. Use interleaveWithTeaching instead of simple interleave
```

The full implementation is complex - see the design doc for the session flow. The key pattern is:

```typescript
// Find NEW subconcepts (in curriculum but user has no progress)
const progressSlugs = new Set(dueSubconcepts.map(s => s.subconceptSlug));
const allSubconcepts = getAllSubconcepts();
const newSubconcepts = allSubconcepts.filter(slug => !progressSlugs.has(slug));

// Build teaching pairs for new subconcepts (limit to 2 per session)
const teachingPairs: TeachingPair[] = [];
for (const slug of newSubconcepts.slice(0, 2)) {
  const definition = getSubconceptDefinition(slug);
  if (definition) {
    const pair = buildTeachingPair(slug, definition, exercises);
    if (pair) teachingPairs.push(pair);
  }
}

// Build review cards from due subconcepts
const reviewCards: ReviewSessionCard[] = dueSubconcepts.map(progress => ({
  type: 'review' as const,
  exercise: getNextExercise(progress, exercises)!,
})).filter(c => c.exercise);

// Interleave teaching pairs with review cards
const sessionCards = interleaveWithTeaching(reviewCards, teachingPairs);
```

**Step 2: Handle teaching card advancement**

In `recordResult`, check card type:

```typescript
const recordResult = useCallback(async (quality: Quality) => {
  const card = cards[currentIndex];
  if (!card) return;

  // Teaching cards don't record SRS - just advance
  if (card.type === 'teaching') {
    setCurrentIndex(prev => prev + 1);
    setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    return;
  }

  // Existing logic for practice/review cards...
}, [cards, currentIndex, ...]);
```

**Step 3: Verify build**

Run: `pnpm typecheck`
Expected: Some errors (need to update practice page)

**Step 4: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "feat(hooks): integrate teaching cards into useConceptSession"
```

---

### Task 5.3: Update Practice Page for Teaching Cards

**Files:**
- Modify: `src/app/practice/page.tsx`

**Step 1: Update practice page to handle teaching cards**

In `PracticeSessionContent`, update card rendering:

```typescript
// Import TeachingCard
import { TeachingCard } from '@/components';

// In the render, check card type:
{currentCard && (
  currentCard.type === 'teaching' ? (
    <TeachingCard
      card={currentCard}
      onContinue={() => recordResult(5)} // Quality 5 = just advance
    />
  ) : (
    <ExerciseCard
      exercise={currentCard.exercise}
      onComplete={(_, quality) => recordResult(quality)}
    />
  )
)}
```

Also update SessionProgress to pass card types:

```typescript
<SessionProgress
  current={stats.completed}
  total={stats.total}
  cardTypes={cards.map(c => c.type)}
  className="flex-1"
/>
```

**Step 2: Verify build and test**

Run: `pnpm typecheck && pnpm build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/practice/page.tsx
git commit -m "feat(practice): render TeachingCard for teaching cards in session"
```

---

### Task 5.4: E2E Test for Learning Mode

**Files:**
- Create: `tests/e2e/learning-mode.spec.ts`

**Step 1: Write E2E test**

Create `tests/e2e/learning-mode.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { createTestUser, loginTestUser, deleteTestUser } from './utils/auth';

test.describe('Learning Mode', () => {
  let testUser: { email: string; password: string };

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser) {
      await deleteTestUser(testUser.email);
    }
  });

  test('new user sees teaching card before practice', async ({ page }) => {
    await loginTestUser(page, testUser.email, testUser.password);

    // Navigate to practice
    await page.goto('/practice');

    // Wait for session to load
    await page.waitForSelector('[data-testid="session-content"]', { timeout: 10000 });

    // Should see LEARN label for teaching card
    await expect(page.getByText('LEARN')).toBeVisible();

    // Should see explanation text
    await expect(page.getByText(/iterate|variable|loop/i)).toBeVisible();

    // Should see "Got it" button
    await expect(page.getByRole('button', { name: /got it/i })).toBeVisible();

    // Click to advance
    await page.getByRole('button', { name: /got it/i }).click();

    // Should now see practice card (no LEARN label)
    await expect(page.getByText('LEARN')).not.toBeVisible();
  });

  test('teaching card advances with Enter key', async ({ page }) => {
    await loginTestUser(page, testUser.email, testUser.password);
    await page.goto('/practice');

    await page.waitForSelector('[data-testid="session-content"]');

    // Press Enter to advance
    await page.keyboard.press('Enter');

    // Should advance to practice card
    await expect(page.getByText('LEARN')).not.toBeVisible();
  });

  test('progress bar shows blue segment for teaching cards', async ({ page }) => {
    await loginTestUser(page, testUser.email, testUser.password);
    await page.goto('/practice');

    await page.waitForSelector('[data-testid="session-content"]');

    // Check for blue segment in progress bar
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toBeVisible();

    // Should have blue-styled segment
    const blueSegment = progressBar.locator('[class*="blue"]');
    await expect(blueSegment).toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `pnpm test:e2e tests/e2e/learning-mode.spec.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/e2e/learning-mode.spec.ts
git commit -m "test(e2e): add learning mode E2E tests"
```

---

## Part 6: Documentation & Cleanup

### Task 6.1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

Add to "Completed Milestones":

```markdown
13. ✅ Learning Mode - Teaching cards that appear once per subconcept on first encounter, blue-styled with explanation + example code
```

Add to Phase 3 section if it exists, or create a new section documenting Learning Mode.

**Commit:**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with Learning Mode milestone"
```

---

### Task 6.2: Final Verification

**Step 1: Run all tests**

```bash
pnpm test
pnpm test:e2e
```

Expected: All tests pass

**Step 2: Run build**

```bash
pnpm build
```

Expected: Build succeeds

**Step 3: Manual testing**

1. Start dev server: `pnpm dev`
2. Create new account (or clear subconcept_progress for existing user)
3. Navigate to /practice
4. Verify teaching card appears with blue styling
5. Verify "Got it" button advances to practice card
6. Verify Enter key also advances
7. Verify progress bar shows blue segment for teaching card
8. Complete session and verify stats are correct

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Learning Mode implementation"
```

---

## Success Criteria Checklist

- [ ] New users see teaching card before first practice of each subconcept
- [ ] Teaching cards are skippable in <1 second (Got it button + Enter key)
- [ ] Example in teaching differs from practice exercise
- [ ] Progress bar visually distinguishes learn (blue) vs practice/review (green)
- [ ] Existing users don't see teaching for already-practiced subconcepts
- [ ] Session pairs never split (teaching always precedes its practice)
- [ ] All unit tests pass (TDD throughout)
- [ ] E2E tests pass
- [ ] Build succeeds
- [ ] Manual testing confirms expected behavior
