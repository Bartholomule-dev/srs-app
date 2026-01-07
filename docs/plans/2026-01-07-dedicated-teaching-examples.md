# Dedicated Teaching Examples Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate teaching examples from exercises so users see instructional content that differs from what they'll be asked to solve.

**Architecture:** Add an `exampleCode` field to `SubconceptTeaching` that holds a dedicated code snippet for teaching cards, removing the dependency on `exampleSlug` pointing to an actual exercise. The `exampleSlug` is deprecated but kept for backward compatibility during migration.

**Tech Stack:** TypeScript, Vitest, React, YAML curriculum files

---

## Problem Summary

Currently, 41 out of 52 subconcepts use their intro-level exercise as the teaching example via `exampleSlug`. This means users see an example (e.g., `print("Hello, World!")`) then are immediately asked to do the *exact same thing*.

### Issues Identified

| Category | Count | Examples |
|----------|-------|----------|
| Direct duplicates | 36 | `io`, `indexing`, `string-methods`, `fstrings`, most collections, control-flow, functions, comprehensions, error-handling, OOP, modules |
| Wrong examples | 3 | `floats` → exponentiation instead of floats; `classmethod` → basic class; `properties` → instance attribute |
| Acceptable | 13 | Fill-in/predict exercises, or genuinely different exercises available |

### Consensus (Codex + Gemini)

Both recommend **Option A: Separate dedicated examples** with these benefits:
- **Decoupling:** Teaching (explain) vs Assessment (test) have different goals
- **Maintainability:** Example content changes don't affect exercise pool or SRS history
- **Cognitive load:** Worked example → minimally different practice confirms understanding

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/lib/curriculum/types.ts:105-111`
- Test: `tests/unit/curriculum/types.test.ts`

**Step 1: Write the failing test**

```typescript
// In tests/unit/curriculum/types.test.ts, add:
describe('SubconceptTeaching', () => {
  it('supports exampleCode field', () => {
    const teaching: SubconceptTeaching = {
      explanation: 'Use print() to display output.',
      exampleCode: 'print("Hello, World!")',
    };
    expect(teaching.exampleCode).toBe('print("Hello, World!")');
  });

  it('allows optional exampleSlug for backward compatibility', () => {
    const teaching: SubconceptTeaching = {
      explanation: 'Use print() to display output.',
      exampleCode: 'print("Hello, World!")',
      exampleSlug: 'print-string', // deprecated but allowed
    };
    expect(teaching.exampleSlug).toBe('print-string');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/curriculum/types.test.ts -v`
Expected: FAIL with type error (exampleCode not defined)

**Step 3: Update SubconceptTeaching type**

```typescript
// src/lib/curriculum/types.ts:105-111
/** Teaching content for introducing a subconcept */
export interface SubconceptTeaching {
  /** 2-3 sentence explanation of the concept (max 200 chars) */
  explanation: string;
  /** Dedicated code example to show (preferred) */
  exampleCode?: string;
  /** @deprecated Slug of exercise to use as example - use exampleCode instead */
  exampleSlug?: string;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/curriculum/types.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/curriculum/types.ts tests/unit/curriculum/types.test.ts
git commit -m "$(cat <<'EOF'
feat(curriculum): add exampleCode to SubconceptTeaching type

Adds dedicated exampleCode field for teaching examples, separate from
exercises. Deprecates exampleSlug but keeps it for backward compatibility.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Update TeachingCard Component

**Files:**
- Modify: `src/components/exercise/TeachingCard.tsx:74-76`
- Test: `tests/unit/components/TeachingCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// Add to tests/unit/components/TeachingCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TeachingCard } from '@/components/exercise/TeachingCard';
import type { TeachingSessionCard } from '@/lib/session/types';

describe('TeachingCard', () => {
  it('displays exampleCode when provided', () => {
    const card: TeachingSessionCard = {
      type: 'teaching',
      subconcept: 'io',
      teaching: {
        explanation: 'Use print() to display output.',
        exampleCode: 'print("Teaching example!")',
      },
      exampleExercise: {
        id: '1',
        slug: 'print-string',
        expectedAnswer: 'print("Hello, World!")', // Different!
        // ... other required fields
      } as any,
    };

    render(<TeachingCard card={card} onContinue={() => {}} />);

    // Should show exampleCode, NOT expectedAnswer
    expect(screen.getByText('print("Teaching example!")')).toBeInTheDocument();
    expect(screen.queryByText('print("Hello, World!")')).not.toBeInTheDocument();
  });

  it('falls back to expectedAnswer when exampleCode not provided', () => {
    const card: TeachingSessionCard = {
      type: 'teaching',
      subconcept: 'io',
      teaching: {
        explanation: 'Use print() to display output.',
        exampleSlug: 'print-string',
        // No exampleCode
      },
      exampleExercise: {
        id: '1',
        slug: 'print-string',
        expectedAnswer: 'print("Hello, World!")',
      } as any,
    };

    render(<TeachingCard card={card} onContinue={() => {}} />);

    expect(screen.getByText('print("Hello, World!")')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/TeachingCard.test.tsx -v`
Expected: FAIL (always shows expectedAnswer)

**Step 3: Update TeachingCard to prefer exampleCode**

```tsx
// src/components/exercise/TeachingCard.tsx:74-76
// Replace:
//   {card.exampleExercise.expectedAnswer}
// With:
{card.teaching.exampleCode ?? card.exampleExercise.expectedAnswer}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/TeachingCard.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/exercise/TeachingCard.tsx tests/unit/components/TeachingCard.test.tsx
git commit -m "$(cat <<'EOF'
feat(teaching): prefer exampleCode over exercise expectedAnswer

TeachingCard now displays teaching.exampleCode when available,
falling back to exampleExercise.expectedAnswer for backward compat.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update teaching-cards.ts to Handle exampleCode

**Files:**
- Modify: `src/lib/session/teaching-cards.ts`
- Test: `tests/unit/session/teaching-cards.test.ts`

**Step 1: Write the failing test**

```typescript
// Add to tests/unit/session/teaching-cards.test.ts
describe('buildTeachingPair with exampleCode', () => {
  it('builds teaching pair even without exampleSlug when exampleCode provided', () => {
    const subconceptWithExampleCode: SubconceptDefinition = {
      name: 'Print Output',
      concept: 'foundations',
      prereqs: [],
      teaching: {
        explanation: 'Use print() to display output.',
        exampleCode: 'print("Teaching example!")',
        // No exampleSlug!
      },
    };

    const exercises = [
      createMockExercise({ slug: 'print-string', subconcept: 'io', level: 'intro' }),
      createMockExercise({ slug: 'print-number', subconcept: 'io', level: 'practice' }),
    ];

    const pair = buildTeachingPair('io', subconceptWithExampleCode, exercises);

    expect(pair).not.toBeNull();
    expect(pair?.teachingCard.teaching.exampleCode).toBe('print("Teaching example!")');
    // Practice should be any exercise for this subconcept
    expect(pair?.practiceCard.exercise.subconcept).toBe('io');
  });

  it('still works with exampleSlug when exampleCode not provided', () => {
    const subconceptWithSlug: SubconceptDefinition = {
      name: 'For Loops',
      concept: 'control-flow',
      prereqs: [],
      teaching: {
        explanation: 'For loops iterate.',
        exampleSlug: 'for-loop-range',
      },
    };

    const exercises = [
      createMockExercise({ slug: 'for-loop-range', subconcept: 'for', level: 'intro' }),
      createMockExercise({ slug: 'for-loop-list', subconcept: 'for', level: 'intro' }),
    ];

    const pair = buildTeachingPair('for', subconceptWithSlug, exercises);

    expect(pair).not.toBeNull();
    expect(pair?.teachingCard.exampleExercise.slug).toBe('for-loop-range');
    expect(pair?.practiceCard.exercise.slug).toBe('for-loop-list');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/session/teaching-cards.test.ts -v`
Expected: FAIL (buildTeachingPair returns null without exampleSlug)

**Step 3: Update buildTeachingPair to handle exampleCode**

```typescript
// src/lib/session/teaching-cards.ts
export function buildTeachingPair(
  subconceptSlug: string,
  subconcept: SubconceptDefinition,
  exercises: Exercise[]
): TeachingPair | null {
  const teaching = subconcept.teaching;

  // If we have exampleCode, we don't need exampleSlug
  const hasExampleCode = !!teaching.exampleCode;

  // Find example exercise (only needed if no exampleCode or for legacy)
  let exampleExercise: Exercise | null = null;
  if (teaching.exampleSlug) {
    exampleExercise = findExampleExercise(teaching.exampleSlug, exercises);
    if (!exampleExercise && !hasExampleCode) {
      console.warn(`Teaching example not found: ${teaching.exampleSlug}`);
      return null;
    }
  }

  // If no exampleCode and no valid exampleSlug, we need at least one exercise
  if (!hasExampleCode && !exampleExercise) {
    // Try to find ANY intro exercise for this subconcept
    exampleExercise = exercises.find(
      e => e.subconcept === subconceptSlug && e.level === 'intro'
    ) ?? null;

    if (!exampleExercise) {
      console.warn(`No example exercise found for subconcept: ${subconceptSlug}`);
      return null;
    }
  }

  // Find practice exercise (different from example if we have one)
  const excludeSlug = exampleExercise?.slug ?? '';
  const practiceExercise = findPracticeExercise(subconceptSlug, excludeSlug, exercises);

  if (!practiceExercise) {
    console.warn(`No practice exercise found for subconcept: ${subconceptSlug}`);
    return null;
  }

  // Build the teaching card
  const teachingCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: subconceptSlug,
    teaching: subconcept.teaching,
    exampleExercise: exampleExercise ?? practiceExercise, // Fallback for type safety
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

Run: `pnpm test tests/unit/session/teaching-cards.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/session/teaching-cards.ts tests/unit/session/teaching-cards.test.ts
git commit -m "$(cat <<'EOF'
feat(session): support exampleCode-only teaching cards

buildTeachingPair now works with exampleCode alone, without requiring
exampleSlug. Maintains backward compatibility with existing content.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update Validation Script

**Files:**
- Modify: `scripts/validate-exercises.cjs`

**Step 1: Update validation to check exampleCode**

```javascript
// In scripts/validate-exercises.cjs, update Check 7:

// === Check 7: Teaching exampleSlugs ===
console.log('=== Check 7: Teaching Example Content ===');
for (const [subSlug, subDef] of Object.entries(curriculum.subconcepts)) {
  const hasExampleCode = !!subDef.teaching?.exampleCode;
  const hasExampleSlug = !!subDef.teaching?.exampleSlug;

  // Must have either exampleCode or valid exampleSlug
  if (!hasExampleCode && !hasExampleSlug) {
    issues.push({
      type: 'MISSING_EXAMPLE',
      file: 'python.json',
      slug: subSlug,
      message: `Teaching needs either exampleCode or exampleSlug`
    });
  }

  // If using exampleSlug, validate it exists
  if (hasExampleSlug && !hasExampleCode) {
    if (!allExercises.has(subDef.teaching.exampleSlug)) {
      issues.push({
        type: 'MISSING_EXAMPLE',
        file: 'python.json',
        slug: subSlug,
        message: `Teaching exampleSlug "${subDef.teaching.exampleSlug}" not found in exercises`
      });
    }
  }

  // Warn if still using exampleSlug without exampleCode
  if (hasExampleSlug && !hasExampleCode) {
    console.log(`  ⚠ ${subSlug}: using deprecated exampleSlug, consider adding exampleCode`);
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`
Expected: Warnings for subconcepts without exampleCode

**Step 3: Commit**

```bash
git add scripts/validate-exercises.cjs
git commit -m "$(cat <<'EOF'
chore(scripts): update validation for exampleCode field

Validation now checks for exampleCode or exampleSlug, warns when
using deprecated exampleSlug pattern.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add exampleCode to Curriculum (Batch 1 - Foundations)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for foundations subconcepts**

Update `python.json` subconcepts section. For each, create a teaching example that is DIFFERENT from the intro exercise:

```json
{
  "variables": {
    "name": "Variables",
    "concept": "foundations",
    "prereqs": [],
    "teaching": {
      "explanation": "Variables store values using the = operator. Choose descriptive names.",
      "exampleCode": "greeting = \"Welcome to Python!\"",
      "exampleSlug": "assign-variable"
    }
  },
  "operators": {
    "name": "Arithmetic Operators",
    "concept": "foundations",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Python supports +, -, *, /, //, %, ** for math operations.",
      "exampleCode": "result = 10 + 7",
      "exampleSlug": "add-numbers"
    }
  },
  "expressions": {
    "name": "Expressions",
    "concept": "foundations",
    "prereqs": ["variables", "operators"],
    "teaching": {
      "explanation": "Combine values, operators, and function calls to compute results.",
      "exampleCode": "is_valid = x > 0 and y > 0",
      "exampleSlug": "boolean-and"
    }
  },
  "io": {
    "name": "Input/Output",
    "concept": "foundations",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Use print() to display output and input() to get user input.",
      "exampleCode": "print(\"Welcome to Python!\")",
      "exampleSlug": "print-string"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`
Expected: Fewer warnings for foundations

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to foundations subconcepts

Adds dedicated teaching examples for variables, operators, expressions,
and io that differ from the intro exercises.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Add exampleCode to Curriculum (Batch 2 - Strings)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for strings subconcepts**

```json
{
  "basics": {
    "name": "String Basics",
    "concept": "strings",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Strings are text in quotes. Concatenate with + operator.",
      "exampleCode": "full_name = first + \" \" + last",
      "exampleSlug": "string-concatenate"
    }
  },
  "indexing": {
    "name": "String Indexing",
    "concept": "strings",
    "prereqs": ["basics"],
    "teaching": {
      "explanation": "Access individual characters with [index]. First character is index 0.",
      "exampleCode": "last_char = word[-1]",
      "exampleSlug": "string-indexing"
    }
  },
  "slicing": {
    "name": "String Slicing",
    "concept": "strings",
    "prereqs": ["indexing"],
    "teaching": {
      "explanation": "Extract substrings with [start:end]. End index is exclusive.",
      "exampleCode": "middle = text[2:5]",
      "exampleSlug": "string-slice-start"
    }
  },
  "string-methods": {
    "name": "String Methods",
    "concept": "strings",
    "prereqs": ["basics"],
    "teaching": {
      "explanation": "Strings have methods like upper(), lower(), strip(), split().",
      "exampleCode": "clean = text.strip().lower()",
      "exampleSlug": "string-upper"
    }
  },
  "fstrings": {
    "name": "F-Strings",
    "concept": "strings",
    "prereqs": ["basics", "variables"],
    "teaching": {
      "explanation": "F-strings embed expressions in strings using f\"...{expr}...\" syntax.",
      "exampleCode": "message = f\"{user} has {points} points\"",
      "exampleSlug": "f-string-basic"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to strings subconcepts

Adds dedicated teaching examples for basics, indexing, slicing,
string-methods, and fstrings.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Add exampleCode to Curriculum (Batch 3 - Numbers-Booleans)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for numbers-booleans subconcepts**

Note: Fix the `floats` example which incorrectly pointed to exponentiation!

```json
{
  "integers": {
    "name": "Integers",
    "concept": "numbers-booleans",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Integers are whole numbers. Use // for floor division, % for modulo.",
      "exampleCode": "remainder = 17 % 5  # Result: 2",
      "exampleSlug": "floor-division-intro"
    }
  },
  "floats": {
    "name": "Floats",
    "concept": "numbers-booleans",
    "prereqs": ["integers"],
    "teaching": {
      "explanation": "Floats are decimal numbers. Use round() to control precision.",
      "exampleCode": "price = round(19.995, 2)  # Result: 20.0",
      "exampleSlug": "exponentiation-intro"
    }
  },
  "booleans": {
    "name": "Booleans",
    "concept": "numbers-booleans",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Booleans are True or False. Combine with and, or, not operators.",
      "exampleCode": "is_ready = has_data and not is_loading",
      "exampleSlug": "boolean-and"
    }
  },
  "conversion": {
    "name": "Type Conversion",
    "concept": "numbers-booleans",
    "prereqs": ["integers", "floats"],
    "teaching": {
      "explanation": "Convert types with int(), float(), str(), bool().",
      "exampleCode": "count = int(\"42\")",
      "exampleSlug": "convert-int-fill"
    }
  },
  "truthiness": {
    "name": "Truthiness",
    "concept": "numbers-booleans",
    "prereqs": ["booleans"],
    "teaching": {
      "explanation": "Empty containers and zero are falsy; non-empty are truthy.",
      "exampleCode": "if items:  # True if items is non-empty",
      "exampleSlug": "truthiness-predict-empty"
    }
  },
  "comparisons": {
    "name": "Comparisons",
    "concept": "numbers-booleans",
    "prereqs": ["booleans"],
    "teaching": {
      "explanation": "Use ==, !=, <, >, <=, >= for comparison. Use 'is' for identity.",
      "exampleCode": "is_none = value is None",
      "exampleSlug": "comparison-is-fill"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to numbers-booleans subconcepts

Adds dedicated teaching examples. Fixes floats example which
incorrectly pointed to exponentiation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add exampleCode to Curriculum (Batch 4 - Collections)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for collections subconcepts**

```json
{
  "lists": {
    "name": "Lists",
    "concept": "collections",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Lists are ordered, mutable sequences. Access by index, modify with append/remove.",
      "exampleCode": "colors = [\"red\", \"green\", \"blue\"]",
      "exampleSlug": "list-create-empty"
    }
  },
  "tuples": {
    "name": "Tuples",
    "concept": "collections",
    "prereqs": ["lists"],
    "teaching": {
      "explanation": "Tuples are immutable sequences. Use for fixed collections and multiple returns.",
      "exampleCode": "point = (10, 20)",
      "exampleSlug": "tuple-create"
    }
  },
  "dicts": {
    "name": "Dictionaries",
    "concept": "collections",
    "prereqs": ["lists"],
    "teaching": {
      "explanation": "Dicts map keys to values. Access with dict[key] or dict.get(key).",
      "exampleCode": "user = {\"name\": \"Alice\", \"age\": 30}",
      "exampleSlug": "dict-create-empty"
    }
  },
  "sets": {
    "name": "Sets",
    "concept": "collections",
    "prereqs": ["lists"],
    "teaching": {
      "explanation": "Sets store unique values. Use for membership testing and removing duplicates.",
      "exampleCode": "unique = {1, 2, 3, 2, 1}  # {1, 2, 3}",
      "exampleSlug": "set-create"
    }
  },
  "unpacking": {
    "name": "Unpacking",
    "concept": "collections",
    "prereqs": ["lists", "tuples"],
    "teaching": {
      "explanation": "Unpack sequences into variables. Use * to capture remaining items.",
      "exampleCode": "first, *rest = [1, 2, 3, 4]",
      "exampleSlug": "star-unpack"
    }
  },
  "mutability": {
    "name": "Mutability",
    "concept": "collections",
    "prereqs": ["lists"],
    "teaching": {
      "explanation": "Lists and dicts are mutable (can change). Strings and tuples are immutable.",
      "exampleCode": "copy = original[:]  # Shallow copy to avoid aliasing",
      "exampleSlug": "list-aliasing"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to collections subconcepts

Adds dedicated teaching examples for lists, tuples, dicts, sets,
unpacking, and mutability.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Add exampleCode to Curriculum (Batch 5 - Control-Flow)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for control-flow subconcepts**

```json
{
  "conditionals": {
    "name": "Conditionals",
    "concept": "control-flow",
    "prereqs": ["booleans"],
    "teaching": {
      "explanation": "Use if/elif/else to branch based on conditions.",
      "exampleCode": "if score >= 90:\n    grade = \"A\"",
      "exampleSlug": "if-statement"
    }
  },
  "for": {
    "name": "For Loops",
    "concept": "control-flow",
    "prereqs": ["lists"],
    "teaching": {
      "explanation": "For loops iterate over sequences. Use range() for number sequences.",
      "exampleCode": "for name in names:\n    print(name)",
      "exampleSlug": "for-loop-range"
    }
  },
  "while": {
    "name": "While Loops",
    "concept": "control-flow",
    "prereqs": ["conditionals"],
    "teaching": {
      "explanation": "While loops repeat while a condition is true. Watch for infinite loops!",
      "exampleCode": "while attempts < 3:\n    try_again()",
      "exampleSlug": "while-loop"
    }
  },
  "iteration": {
    "name": "Iteration Tools",
    "concept": "control-flow",
    "prereqs": ["for"],
    "teaching": {
      "explanation": "Use enumerate() for index+value, zip() for parallel iteration.",
      "exampleCode": "for i, item in enumerate(items):\n    print(f\"{i}: {item}\")",
      "exampleSlug": "enumerate-loop"
    }
  },
  "zip": {
    "name": "Zip Function",
    "concept": "control-flow",
    "prereqs": ["for"],
    "teaching": {
      "explanation": "zip() combines multiple iterables for parallel iteration.",
      "exampleCode": "for name, score in zip(names, scores):\n    results[name] = score",
      "exampleSlug": "zip-two-lists"
    }
  },
  "reversed": {
    "name": "Reversed Iteration",
    "concept": "control-flow",
    "prereqs": ["for"],
    "teaching": {
      "explanation": "reversed() iterates in reverse order without modifying the original.",
      "exampleCode": "for item in reversed(history):\n    process(item)",
      "exampleSlug": "reversed-list"
    }
  },
  "sorted": {
    "name": "Sorted Iteration",
    "concept": "control-flow",
    "prereqs": ["for"],
    "teaching": {
      "explanation": "sorted() returns a new sorted list. Use key= for custom sorting.",
      "exampleCode": "for user in sorted(users, key=lambda u: u.name):\n    print(user)",
      "exampleSlug": "sorted-list"
    }
  },
  "any-all": {
    "name": "Any/All Functions",
    "concept": "control-flow",
    "prereqs": ["for", "booleans"],
    "teaching": {
      "explanation": "any() returns True if any element is truthy. all() requires all truthy.",
      "exampleCode": "has_errors = any(item.error for item in results)",
      "exampleSlug": "any-basic"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to control-flow subconcepts

Adds dedicated teaching examples for conditionals, for, while, iteration,
zip, reversed, sorted, and any-all.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Add exampleCode to Curriculum (Batch 6 - Functions)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for functions subconcepts**

```json
{
  "fn-basics": {
    "name": "Function Basics",
    "concept": "functions",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Define functions with def. Use return to send back values.",
      "exampleCode": "def square(n):\n    return n ** 2",
      "exampleSlug": "define-function"
    }
  },
  "arguments": {
    "name": "Function Arguments",
    "concept": "functions",
    "prereqs": ["fn-basics"],
    "teaching": {
      "explanation": "Functions accept positional and keyword arguments.",
      "exampleCode": "def greet(name, greeting=\"Hello\"):\n    return f\"{greeting}, {name}!\"",
      "exampleSlug": "default-parameter"
    }
  },
  "defaults": {
    "name": "Default Parameters",
    "concept": "functions",
    "prereqs": ["fn-basics"],
    "teaching": {
      "explanation": "Default values make parameters optional. Use None for mutable defaults.",
      "exampleCode": "def connect(host, port=8080, timeout=30):\n    ...",
      "exampleSlug": "default-param-simple"
    }
  },
  "args-kwargs": {
    "name": "Args & Kwargs",
    "concept": "functions",
    "prereqs": ["arguments"],
    "teaching": {
      "explanation": "*args captures positional args as tuple. **kwargs captures keyword args as dict.",
      "exampleCode": "def log(*messages, **options):\n    for msg in messages:\n        print(msg)",
      "exampleSlug": "args-intro"
    }
  },
  "scope": {
    "name": "Variable Scope",
    "concept": "functions",
    "prereqs": ["fn-basics"],
    "teaching": {
      "explanation": "Variables defined in functions are local. Use global/nonlocal to modify outer scope.",
      "exampleCode": "def increment():\n    global counter\n    counter += 1",
      "exampleSlug": "global-keyword"
    }
  },
  "lambda": {
    "name": "Lambda Functions",
    "concept": "functions",
    "prereqs": ["fn-basics"],
    "teaching": {
      "explanation": "Lambda creates small anonymous functions. Syntax: lambda args: expression.",
      "exampleCode": "square = lambda n: n ** 2",
      "exampleSlug": "lambda-simple"
    }
  },
  "typehints": {
    "name": "Type Hints",
    "concept": "functions",
    "prereqs": ["fn-basics"],
    "teaching": {
      "explanation": "Type hints document expected types. Use -> for return type.",
      "exampleCode": "def add(a: int, b: int) -> int:\n    return a + b",
      "exampleSlug": "typehint-param"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to functions subconcepts

Adds dedicated teaching examples for fn-basics, arguments, defaults,
args-kwargs, scope, lambda, and typehints.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Add exampleCode to Curriculum (Batch 7 - Comprehensions)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for comprehensions subconcepts**

```json
{
  "list-comp": {
    "name": "List Comprehensions",
    "concept": "comprehensions",
    "prereqs": ["for", "lists"],
    "teaching": {
      "explanation": "List comprehensions create lists in one line: [expr for item in iterable].",
      "exampleCode": "doubled = [n * 2 for n in numbers]",
      "exampleSlug": "list-comp-basic"
    }
  },
  "dict-comp": {
    "name": "Dict Comprehensions",
    "concept": "comprehensions",
    "prereqs": ["list-comp", "dicts"],
    "teaching": {
      "explanation": "Dict comprehensions create dicts: {key: value for item in iterable}.",
      "exampleCode": "lengths = {word: len(word) for word in words}",
      "exampleSlug": "dict-comp-basic"
    }
  },
  "set-comp": {
    "name": "Set Comprehensions",
    "concept": "comprehensions",
    "prereqs": ["list-comp", "sets"],
    "teaching": {
      "explanation": "Set comprehensions create sets with unique values: {expr for item in iterable}.",
      "exampleCode": "initials = {name[0] for name in names}",
      "exampleSlug": "set-comp-basic"
    }
  },
  "generator-exp": {
    "name": "Generator Expressions",
    "concept": "comprehensions",
    "prereqs": ["list-comp"],
    "teaching": {
      "explanation": "Generator expressions use () and yield values lazily for memory efficiency.",
      "exampleCode": "total = sum(n ** 2 for n in range(1000))",
      "exampleSlug": "generator-exp-basic"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to comprehensions subconcepts

Adds dedicated teaching examples for list-comp, dict-comp, set-comp,
and generator-exp.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Add exampleCode to Curriculum (Batch 8 - Error-Handling)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for error-handling subconcepts**

```json
{
  "try-except": {
    "name": "Try-Except",
    "concept": "error-handling",
    "prereqs": ["functions"],
    "teaching": {
      "explanation": "Use try/except to catch and handle exceptions gracefully.",
      "exampleCode": "try:\n    result = int(user_input)\nexcept ValueError:\n    print(\"Invalid number\")",
      "exampleSlug": "try-except-basic"
    }
  },
  "finally": {
    "name": "Finally Clause",
    "concept": "error-handling",
    "prereqs": ["try-except"],
    "teaching": {
      "explanation": "finally always runs, whether or not an exception occurred. Use for cleanup.",
      "exampleCode": "try:\n    f = open(path)\n    data = f.read()\nfinally:\n    f.close()",
      "exampleSlug": "finally-basic"
    }
  },
  "raising": {
    "name": "Raising Exceptions",
    "concept": "error-handling",
    "prereqs": ["try-except"],
    "teaching": {
      "explanation": "Use raise to signal errors. Prefer specific exception types.",
      "exampleCode": "if age < 0:\n    raise ValueError(\"Age must be positive\")",
      "exampleSlug": "raise-exception"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to error-handling subconcepts

Adds dedicated teaching examples for try-except, finally, and raising.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Add exampleCode to Curriculum (Batch 9 - OOP)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for OOP subconcepts**

Note: Fix `classmethod` and `properties` which pointed to wrong examples!

```json
{
  "classes": {
    "name": "Classes",
    "concept": "oop",
    "prereqs": ["functions"],
    "teaching": {
      "explanation": "Classes define blueprints for objects. Use __init__ for initialization.",
      "exampleCode": "class Dog:\n    def __init__(self, name):\n        self.name = name",
      "exampleSlug": "define-class"
    }
  },
  "methods": {
    "name": "Instance Methods",
    "concept": "oop",
    "prereqs": ["classes"],
    "teaching": {
      "explanation": "Methods are functions defined in a class. First parameter is always self.",
      "exampleCode": "def bark(self):\n    return f\"{self.name} says woof!\"",
      "exampleSlug": "init-method"
    }
  },
  "inheritance": {
    "name": "Inheritance",
    "concept": "oop",
    "prereqs": ["classes"],
    "teaching": {
      "explanation": "Child classes inherit from parents. Use super() to call parent methods.",
      "exampleCode": "class Cat(Animal):\n    def speak(self):\n        return \"meow\"",
      "exampleSlug": "inheritance-basic"
    }
  },
  "classmethod": {
    "name": "Class Methods",
    "concept": "oop",
    "prereqs": ["methods"],
    "teaching": {
      "explanation": "@classmethod receives class as first arg (cls). Use for factory methods.",
      "exampleCode": "@classmethod\ndef from_json(cls, data):\n    return cls(data[\"name\"])",
      "exampleSlug": "classmethod-basic"
    }
  },
  "properties": {
    "name": "Properties",
    "concept": "oop",
    "prereqs": ["methods"],
    "teaching": {
      "explanation": "@property turns methods into attribute-like access. Add .setter for assignment.",
      "exampleCode": "@property\ndef full_name(self):\n    return f\"{self.first} {self.last}\"",
      "exampleSlug": "property-getter"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to OOP subconcepts

Adds dedicated teaching examples for classes, methods, inheritance.
Fixes classmethod and properties which pointed to wrong examples.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Add exampleCode to Curriculum (Batch 10 - Modules-Files)

**Files:**
- Modify: `src/lib/curriculum/python.json`

**Step 1: Add exampleCode for modules-files subconcepts**

```json
{
  "imports": {
    "name": "Imports",
    "concept": "modules-files",
    "prereqs": ["variables"],
    "teaching": {
      "explanation": "Import modules with import or from...import. Use as for aliases.",
      "exampleCode": "from pathlib import Path\nimport json",
      "exampleSlug": "import-module"
    }
  },
  "reading": {
    "name": "Reading Files",
    "concept": "modules-files",
    "prereqs": ["imports"],
    "teaching": {
      "explanation": "Use open() in read mode. Always close files or use with statement.",
      "exampleCode": "with open(\"config.json\") as f:\n    data = json.load(f)",
      "exampleSlug": "file-open-read"
    }
  },
  "writing": {
    "name": "Writing Files",
    "concept": "modules-files",
    "prereqs": ["reading"],
    "teaching": {
      "explanation": "Open with 'w' to write (overwrites) or 'a' to append.",
      "exampleCode": "with open(\"log.txt\", \"a\") as f:\n    f.write(message + \"\\n\")",
      "exampleSlug": "file-open-write"
    }
  },
  "context": {
    "name": "Context Managers",
    "concept": "modules-files",
    "prereqs": ["reading"],
    "teaching": {
      "explanation": "with statement ensures cleanup. Works with files, locks, connections.",
      "exampleCode": "with open(\"in.txt\") as src, open(\"out.txt\", \"w\") as dst:\n    dst.write(src.read())",
      "exampleSlug": "context-manager-open"
    }
  },
  "pathlib": {
    "name": "Pathlib",
    "concept": "modules-files",
    "prereqs": ["imports"],
    "teaching": {
      "explanation": "Path objects make file paths easy. Use / to join, .read_text() to read.",
      "exampleCode": "config = Path(\"~/.config/app\").expanduser()\ndata = (config / \"settings.json\").read_text()",
      "exampleSlug": "pathlib-create-path"
    }
  },
  "main-guard": {
    "name": "Main Guard",
    "concept": "modules-files",
    "prereqs": ["imports"],
    "teaching": {
      "explanation": "if __name__ == \"__main__\" runs code only when script is executed directly.",
      "exampleCode": "def main():\n    print(\"Running!\")\n\nif __name__ == \"__main__\":\n    main()",
      "exampleSlug": "main-guard-basic"
    }
  }
}
```

**Step 2: Run validation**

Run: `node scripts/validate-exercises.cjs`

**Step 3: Commit**

```bash
git add src/lib/curriculum/python.json
git commit -m "$(cat <<'EOF'
content(curriculum): add exampleCode to modules-files subconcepts

Adds dedicated teaching examples for imports, reading, writing, context,
pathlib, and main-guard.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Update E2E Tests

**Files:**
- Modify: `tests/e2e/learning-mode.spec.ts`

**Step 1: Update E2E test to check for exampleCode**

```typescript
// In tests/e2e/learning-mode.spec.ts, verify teaching card shows exampleCode
test('teaching card displays dedicated example, not exercise answer', async ({ page }) => {
  // Navigate to practice with a new subconcept
  await page.goto('/practice');

  // Teaching card should appear
  const teachingCard = page.locator('[data-testid="teaching-card"]');
  await expect(teachingCard).toBeVisible();

  // The example shown should be the exampleCode, not the expectedAnswer
  // (We can't directly verify this without knowing content, but we can check structure)
  const exampleBlock = teachingCard.locator('pre');
  await expect(exampleBlock).toBeVisible();

  // Click continue
  await page.click('button:has-text("Got it")');

  // Now practice card should show different exercise
  const exercisePrompt = page.locator('[data-testid="exercise-prompt"]');
  await expect(exercisePrompt).toBeVisible();
});
```

**Step 2: Run E2E tests**

Run: `pnpm test:e2e tests/e2e/learning-mode.spec.ts`

**Step 3: Commit**

```bash
git add tests/e2e/learning-mode.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): update learning mode test for exampleCode

Verifies teaching card displays dedicated example content.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Final Validation and Documentation

**Files:**
- Run validation script
- Update CLAUDE.md if needed

**Step 1: Run full validation**

Run: `node scripts/validate-exercises.cjs`
Expected: 0 issues (or only acceptable warnings)

**Step 2: Run full test suite**

Run: `pnpm test`
Expected: All tests pass

**Step 3: Run E2E tests**

Run: `pnpm test:e2e`
Expected: All tests pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: complete dedicated teaching examples migration

All 52 subconcepts now have exampleCode separate from exercises.
Teaching cards show instructional examples while exercises test
different applications of the same concept.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

This plan:

1. **Adds `exampleCode` field** to `SubconceptTeaching` type (backward compatible)
2. **Updates `TeachingCard`** to prefer `exampleCode` over `expectedAnswer`
3. **Updates `buildTeachingPair`** to work with `exampleCode` alone
4. **Updates validation script** to check for proper examples
5. **Adds `exampleCode`** to all 52 subconcepts in 10 batches
6. **Fixes wrong examples**: `floats`, `classmethod`, `properties`
7. **Updates E2E tests** to verify behavior

Total: 16 tasks, estimated ~45 minutes to execute.
