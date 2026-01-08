# Premium Curriculum Restructure Plan

> Multi-AI Analysis: Claude, Gemini, Codex synthesis for truly premium learning structure

**Date:** 2026-01-08
**Status:** Proposed
**Impact:** High - Affects curriculum graph, exercise ordering, prerequisite chains

---

## Executive Summary

Three AI systems analyzed the curriculum for premium learning flow. Key findings:
1. **Conditionals too late** - Blocked behind collections, but if/else is foundational
2. **Imports at end** - Real Python uses imports from line 1
3. **Error-handling prerequisites too strict** - Requires comprehensions, should be earlier
4. **Missing modern Python** - match/case, explicit range, == vs is

---

## Recommended Concept Order

### Current Order (10 concepts)
```
1. Foundations → 2. Strings → 3. Numbers-Booleans → 4. Collections
    → 5. Control-Flow → 6. Functions → 7. Comprehensions
        → 8. Error-Handling → 9. OOP → 10. Modules-Files
```

### Proposed Order (11 concepts)
```
1. Foundations (+ basic imports!)
    → 2. Strings
    → 3. Numbers-Booleans (+ comparisons, truthiness emphasis)
        → 4. Conditionals (NEW - extracted from control-flow)
            → 5. Collections
                → 6. Loops (iteration patterns, zip, enumerate)
                    → 7. Functions
                        → 8. Comprehensions (relaxed prereqs)
                            → 9. Error-Handling (relaxed prereqs)
                                → 10. OOP (+ functions prereq)
                                    → 11. Modules & Files (advanced file I/O only)
```

---

## Detailed Changes

### Change 1: Extract Conditionals (CRITICAL)

**Problem:** Conditionals require collections, but `if/elif/else` only needs comparison operators.

**Current:**
```json
{
  "slug": "control-flow",
  "prereqs": ["collections"],
  "subconcepts": ["conditionals", "for", "while", "iteration", "zip", "reversed", "sorted", "any-all"]
}
```

**Proposed:** Split into two concepts:
```json
{
  "slug": "conditionals",
  "prereqs": ["numbers-booleans"],
  "subconcepts": ["if-else", "elif", "ternary", "match-case"]
}
```
```json
{
  "slug": "loops",
  "prereqs": ["collections", "conditionals"],
  "subconcepts": ["for", "while", "range", "iteration", "zip", "reversed", "sorted", "any-all"]
}
```

**Why premium:** Learners can write useful branching programs BEFORE learning data structures.

---

### Change 2: Move Basic Imports Earlier

**Problem:** Imports are Concept 10 but every real Python file starts with imports.

**Current subconcept prereqs:**
```json
"imports": { "prereqs": [] }  // No prereqs, but concept is locked behind OOP!
```

**Proposed:** Add basic imports to foundations or create new "imports-basic" subconcept in foundations:
```json
"imports-basic": {
  "name": "Basic Imports",
  "concept": "foundations",
  "prereqs": ["variables"],
  "teaching": {
    "explanation": "Use `import math` to access built-in modules. Use `from random import choice` for specific functions.",
    "exampleCode": "import math\nresult = math.sqrt(16)"
  }
}
```

Keep advanced file I/O (reading, writing, context, pathlib) in modules-files.

**Why premium:** Day-1 learners see `import random` in tutorials everywhere. Don't gatekeep it.

---

### Change 3: Relax Error-Handling Prerequisites

**Problem:** Error handling requires comprehensions, but try/except is fundamental.

**Current:**
```json
{
  "slug": "error-handling",
  "prereqs": ["comprehensions"],  // Too restrictive!
}
```

**Proposed:**
```json
{
  "slug": "error-handling",
  "prereqs": ["conditionals", "functions"],  // Core concepts only
}
```

**Why premium:** Robust code handling user input errors shouldn't require mastering list comprehensions first.

---

### Change 4: Add Functions as OOP Prerequisite

**Problem:** OOP only requires comprehensions, but classes need strong function fundamentals.

**Current:**
```json
{
  "slug": "oop",
  "prereqs": ["comprehensions"],
}
```

**Proposed:**
```json
{
  "slug": "oop",
  "prereqs": ["functions"],  // Functions are essential for methods
}
```

Comprehensions become optional pathway, not mandatory.

---

### Change 5: Add Missing Subconcepts

**New subconcepts to add:**

| Concept | Subconcept | Why |
|---------|------------|-----|
| numbers-booleans | `identity` | `== vs is`, `x is None` pattern |
| conditionals | `match-case` | Python 3.10+ structural matching (edge level) |
| loops | `range-explicit` | `range(start, stop, step)` patterns |
| collections | `dict-iteration` | `.keys()`, `.values()`, `.items()` explicitly |

---

### Change 6: Relax Comprehension Prerequisites

**Problem:** Comprehensions require both control-flow AND functions.

**Current:**
```json
{
  "slug": "comprehensions",
  "prereqs": ["control-flow", "functions"],
}
```

**Proposed:**
```json
{
  "slug": "comprehensions",
  "prereqs": ["loops"],  // Only need loop understanding
}
```

Lambda usage in comprehensions becomes "integrated" level exercise, not prerequisite.

---

## Exercise Flow Improvements

### Per-Concept Flow Pattern (Premium Standard)

Each subconcept should follow this arc:

```
Level 1 - intro (2-3 exercises)
├── fill-in: Recognize the syntax
├── write: Reproduce minimal example
└── predict: Understand basic behavior

Level 2 - practice (3-5 exercises)
├── write: Apply in simple contexts
├── fill-in: Variations and edge syntax
└── predict: Trace more complex flows

Level 3 - edge (2-3 exercises)
├── predict: Tricky edge cases
├── write: Handle edge conditions
└── integrated: Combine with other concepts
```

### Anti-Patterns to Fix

1. **Same question twice:** Review exercises for near-duplicates (Codex flagged this)
2. **Predict without setup:** Predict exercises should have write/fill-in prep first
3. **Integrated without mastery:** Don't test combining concepts before individual mastery

---

## New Exercise Ideas (Premium Feel)

### Real-World Context Variables

Instead of: `x = 5`, `y = 10`
Use: `cart_total = 149.99`, `discount_rate = 0.15`

### Idiomatic Python Checks

Add exercises that test Pythonic vs non-Pythonic:

```yaml
- slug: pythonic-list-check
  type: predict
  prompt: "What's more Pythonic?"
  code: |
    # Option A
    if len(items) > 0:
        process(items)

    # Option B
    if items:
        process(items)
  expected_answer: "Option B"
```

### Error-First Learning

For tricky concepts (mutability, scope), SHOW the error first:

```yaml
- slug: mutable-default-trap
  type: predict
  prompt: "What happens on the second call?"
  code: |
    def add_item(item, items=[]):
        items.append(item)
        return items

    print(add_item("a"))
    print(add_item("b"))
  expected_answer: |
    ['a']
    ['a', 'b']
  hint: "Default list is shared across calls!"
```

---

## Implementation Phases

### Phase 1: Graph Restructure (python.json)
- Extract conditionals from control-flow
- Add basic imports to foundations
- Adjust prerequisite chains
- Add new subconcepts

### Phase 2: Exercise Migration
- Move conditional exercises to new concept
- Create basic import exercises in foundations
- Rebalance exercises per new flow

### Phase 3: Content Enhancement
- Add real-world variable names to existing exercises
- Add "idiomatic Python" predict exercises
- Add error-first learning exercises for tricky concepts

### Phase 4: Quality Pass
- Deduplicate near-identical exercises
- Ensure intro→practice→edge flow per subconcept
- Verify every subconcept has fill-in, write, AND predict types

---

## Metrics for "Premium"

A curriculum feels premium when:

1. **No blocking surprises:** Learner never thinks "I need X but haven't learned it"
2. **Natural progression:** Each question feels like the obvious next step
3. **Real-world relevance:** Variables/contexts match actual code they'll write
4. **Aha moments:** Predict exercises create understanding, not frustration
5. **Mastery confidence:** Edge cases feel challenging but achievable

---

## Appendix: AI Feedback Summary

### Gemini Highlights
- Conditionals too late (concept 5 vs recommended 3-4)
- Imports are "end-game" content (concept 10) but should be early
- Missing: match/case, generators (yield), Counter/defaultdict
- Add idiomatic checks and real-world contexts

### Codex Highlights
- Move comparisons + truthiness earlier, bridge to conditionals
- Missing: range explicit, == vs is, None coverage, shallow/deep copy
- Comprehensions requiring functions is too strict
- OOP should ensure functions is prereq
- Add adaptive diagnostics, micro-projects, error-first learning

### Claude Analysis
- Core structure is solid but dependency graph is too conservative
- Error-handling gated behind comprehensions is anti-pattern
- Importing basic modules shouldn't require OOP mastery
- Need explicit "identity" subconcept for `is` vs `==`
