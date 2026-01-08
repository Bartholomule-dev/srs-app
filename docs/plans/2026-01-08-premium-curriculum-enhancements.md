# Premium Curriculum Enhancements Plan

> Making the SRS learning experience feel truly premium

## Multi-AI Review Summary

### Codex Assessment
- **Progression**: Solid and mostly beginner-safe with enough breadth for rusty seniors
- **Strengths**: Good concept order, healthy exercise-type mix, explicit truthiness/identity subconcepts
- **Key Gaps**: imports placement feels stranded, missing "why functions exist" bridge, mutability introduced late

### Gemini Assessment
- **Progression**: Solid foundation, but starts too slow for seniors
- **Strengths**: Collections before loops is excellent, modern typehints inclusion
- **Key Gaps**: Missing decorators, dataclasses, testing, async; exercises lack engineering context

### Consensus Points
1. **Both agree**: Progression is pedagogically sound for beginners
2. **Both agree**: Needs "fast track" or adaptive difficulty for seniors
3. **Both agree**: Need more "why" explanations and common pitfalls
4. **Both agree**: Premium = engineering context, not just syntax drilling

---

## Phase 1: Teaching Content Enhancement (Quick Wins)

### 1.1 Add "Common Pitfall" to Each Subconcept

Extend teaching content structure:
```json
"teaching": {
  "explanation": "...",
  "exampleCode": "...",
  "exampleSlug": "...",
  "pitfall": {
    "mistake": "Using == to compare None instead of 'is'",
    "why": "== checks value equality, 'is' checks identity. None is a singleton.",
    "fix": "Always use 'x is None' or 'x is not None'"
  }
}
```

Priority subconcepts (high-value pitfalls):
- `identity`: is vs == for None
- `mutability`: default mutable arguments
- `scope`: closure variable capture in loops
- `slicing`: off-by-one with negative indices
- `iteration`: modifying list while iterating
- `truthiness`: empty collections are falsy
- `fstrings`: f-string before variable defined

### 1.2 Add "Why This Matters" Context

Each concept description should explain real-world relevance:
```json
{
  "slug": "comprehensions",
  "name": "Comprehensions",
  "description": "List, dict, and set comprehensions",
  "whyItMatters": "Comprehensions are the Pythonic way to transform data. They're 30% faster than equivalent loops and signal to other developers that you write idiomatic Python."
}
```

---

## Phase 2: Missing Subconcepts (Structural Gaps)

### 2.1 Add to Functions (Tier 5)
```
decorators (new)
  - prereqs: [lambda, scope]
  - Why: Used throughout Python ecosystem (@property, @classmethod, Flask routes)
  - Exercises: write simple decorators, predict decorator behavior, debug decorator issues
```

### 2.2 Add to OOP (Tier 6)
```
dataclasses (new)
  - prereqs: [classes, typehints]
  - Why: Modern Python standard for data containers, replaces boilerplate
  - Exercises: convert class to dataclass, use field(), frozen dataclasses

dunder-methods (new)
  - prereqs: [methods]
  - Why: __str__, __repr__, __eq__ are essential for debugging and testing
  - Exercises: implement repr, make class hashable, comparison operators
```

### 2.3 Add to Error Handling (Tier 6)
```
custom-exceptions (new)
  - prereqs: [raising, inheritance]
  - Why: Real applications need domain-specific errors
  - Exercises: create exception hierarchy, add context to exceptions
```

---

## Phase 3: New Exercise Type - "Refactor"

### 3.1 Schema Addition
```json
"type": {
  "enum": ["write", "fill-in", "predict", "debug", "refactor"]
}
```

### 3.2 Refactor Exercise Structure
```yaml
- slug: refactor-range-len-to-enumerate
  type: refactor
  pattern: idiomatic
  level: practice
  prompt: "Refactor this code to be more Pythonic"
  code: |
    for i in range(len(items)):
        print(i, items[i])
  expected_answer: |
    for i, item in enumerate(items):
        print(i, item)
  why_better: "enumerate() is clearer, faster, and avoids index errors"
```

### 3.3 Priority Refactor Exercises
| Anti-Pattern | Pythonic | Subconcept |
|-------------|----------|------------|
| `range(len(x))` | `enumerate(x)` | iteration |
| `if x == True` | `if x` | truthiness |
| `d.keys()` in loop | `d` directly | dict-iteration |
| `try/except Exception` | specific exceptions | try-except |
| Manual `__init__` boilerplate | `@dataclass` | dataclasses |
| Nested loops for transform | comprehension | list-comp |
| `+` string concatenation | f-string or join | fstrings |

---

## Phase 4: Engineering Context Exercises

### 4.1 Real-World Variable Names
Replace generic names with domain context:
- `x, y, z` → `price, quantity, tax_rate`
- `my_list` → `user_emails`, `transaction_log`
- `Person` class → `UserSession`, `PaymentRecord`

### 4.2 Integrated "Mini-Project" Exercises
Add 5-10 integrated exercises that combine 3+ subconcepts:

```yaml
- slug: log-parser-integrated
  level: integrated
  targets: [string-methods, dict-iteration, for, try-except]
  prompt: |
    Parse this log line and extract timestamp, level, and message into a dict.
    Handle malformed lines by returning None.

    Line format: "2024-01-15 10:30:45 [ERROR] Connection timeout"
```

### 4.3 Exercise Objective Verbs
Upgrade objectives from tutorial-style to engineering-style:
- "Write a for loop" → "Extract unique values from a dataset using iteration"
- "Create a class" → "Model a bank transaction with validation"
- "Use try/except" → "Handle API response errors gracefully"

---

## Phase 5: Adaptive Experience (UI/UX)

### 5.1 Session Insights (Post-Session)
After each session, show:
- Skills improved: "list slicing (+12%)"
- Weak spots identified: "dict-iteration needs practice"
- Suggested next focus: "8 min session on comprehensions"

### 5.2 Fast-Track Assessment
For returning/senior users:
- Offer "Skip ahead" test at signup
- 10-15 questions covering basics
- Auto-unlock subconcepts they've demonstrated

### 5.3 Difficulty Adaptation
- Track time-to-correct-answer
- If consistently fast: skip intro, push to edge cases
- Surface in UI: "Skipping basics you've mastered"

---

## Phase 6: Explain Exercise Type (Depth-Building)

### 6.1 Multi-AI Consensus on Validation

Both Codex and Gemini recommend **Augmented Self-Assessment**:

| Aspect | Recommendation |
|--------|----------------|
| **Core approach** | Interactive rubric with self-assessment |
| **Detection** | Soft keyword matching as hints, not penalties |
| **User agency** | User confirms which points covered (can override) |
| **SRS signal** | rubric_coverage * 0.6 + confidence * 0.2 + time * 0.2 |
| **Premium feel** | App appears to "understand" their answer |

### 6.2 Explain Exercise Flow

```
1. User writes free-form explanation
2. System reveals interactive rubric (checkboxes)
3. Auto-highlight keywords that match rubric points (soft detection)
4. User confirms which points they actually covered
5. Suggest FSRS rating based on coverage
6. Show model answer for comparison
```

### 6.3 ExplainExercise Component (TODO)

```tsx
// src/components/exercise/ExplainExercise.tsx
interface ExplainExerciseProps {
  code: string;                    // Code snippet being explained
  prompt: string;                  // Question
  explanationRubric: string[];     // 3-4 key points
  expectedAnswer: string;          // Model answer
}

// State flow:
// 1. WRITING - user types explanation
// 2. REVIEWING - rubric revealed, user checks points
// 3. COMPARED - model answer shown
```

### 6.4 Quality Signal Formula

```typescript
const calculateExplainQuality = (
  rubricCoverage: number,      // 0-1 (checked points / total points)
  confidence: number,          // 1-4 user self-rating
  timeSeconds: number          // response time
): FSRSRating => {
  const timeFactor = timeSeconds < 30 ? 0.8 : timeSeconds < 90 ? 1.0 : 0.9;
  const score = rubricCoverage * 0.6 + (confidence / 4) * 0.2 + timeFactor * 0.2;

  if (score >= 0.9) return Rating.Easy;
  if (score >= 0.7) return Rating.Good;
  if (score >= 0.4) return Rating.Hard;
  return Rating.Again;
};
```

### 6.5 Explain Exercises Added

| Concept | Slug | Question |
|---------|------|----------|
| strings | explain-slice-half-open | Why half-open intervals? |
| numbers-booleans | explain-truthiness-design | Why is empty list falsy? |
| collections | explain-mutable-default-danger | Why are mutable defaults dangerous? |
| functions | explain-closure-capture | Why do loop closures all return same value? |
| functions | explain-decorator-wraps | Why use @functools.wraps? |
| comprehensions | explain-genexp-vs-listcomp | When genexp vs listcomp? |
| oop | explain-dataclass-benefits | Why dataclass over regular class? |

---

## Implementation Priority

### Immediate (This Session) ✅
1. ✅ Add `pitfall` field to teaching content schema
2. ✅ Add pitfalls to 10 highest-value subconcepts
3. ✅ Add `decorators` and `dataclasses` subconcepts
4. ✅ Create 8 refactor-type exercises
5. ✅ Create 11 debug exercises (one per pitfall)
6. ✅ Create 7 explain exercises
7. ✅ Add 6 integrated exercises combining 3+ subconcepts
8. ✅ Upgrade variable names to engineering context

### Next Session
9. Implement ExplainExercise component with augmented self-assessment
10. Add confidence calibration tracking
11. Session insights UI component

### Next Session
12. Tag remaining exercises with domains (5 tagged as examples)
13. Implement ExplainExercise component with augmented self-assessment

### Future
14. Fast-track assessment flow
15. Adaptive difficulty algorithm
16. Exemplar rotation for explain answers
17. Gold solution schema with alternatives and tradeoffs (see Phase 7)

---

## Phase 8: Domain-Specific Tracks (Implemented)

### 8.1 Domain Tags Schema

Added `domains` field to exercise schema:

```yaml
domains:
  type: array
  items:
    enum: [general, web, data, devops, testing, ml]
```

### 8.2 Domain Definitions (Codex Recommendation)

| Domain | Description | Example Patterns |
|--------|-------------|------------------|
| `general` | Universal Python (default) | All fundamentals |
| `web` | Flask/Django/FastAPI patterns | Request handling, decorators, validation |
| `data` | pandas/NumPy-style transforms | Comprehensions, vectorized ops, IO |
| `devops` | Automation, CLI, config | Pathlib, subprocess, env vars |
| `testing` | pytest patterns | Fixtures, mocks, assertions |
| `ml` | sklearn/torch idioms | Dataset prep, model APIs |

### 8.3 Tagging Heuristics

1. **Library mentions** → direct domain mapping
2. **Pattern implies workflow**:
   - "parse request", "validate input" → `web`
   - "transform dataframe", "aggregate" → `data`
   - "config", "path", "script" → `devops`

### 8.4 Tagged Exercises (Examples)

| Exercise | Domains |
|----------|---------|
| `retry-decorator-integrated` | web, devops |
| `config-loader-integrated` | devops, web |
| `active-users-integrated` | data, web |
| `api-response-model-integrated` | web |

---

## Phase 7: Gold Standard Solutions (Future)

### 7.1 Schema Enhancement (Codex Recommendation)

Replace flat `accepted_solutions` with rich alternative structure:

```yaml
gold_solution:
  code: "return n % 2 == 0"
  rationale: "Minimal, readable, idiomatic Python"

alternatives:
  - code: "return (n & 1) == 0"
    label: bitwise
    tradeoffs: "Faster in tight loops, less obvious to beginners"
  - code: "return not n % 2"
    label: logical
    tradeoffs: "Equivalent but slightly less direct"

style_notes:
  - tag: idiomatic
    note: "Prefer modulo over bitwise unless performance is critical"
```

### 7.2 Premium Value

- **Gold solution**: Curated + justified, not just "the first answer"
- **Alternatives**: Labeled by style with tradeoffs (senior-level thinking)
- **Style notes**: Engineering norms + intent, not just syntax

### 7.3 Implementation Notes

- Requires schema migration for 500+ exercises
- UI component to toggle between alternatives
- Could be incremental (add to high-value exercises first)

---

## Success Metrics

| Metric | Free Tutorial | Premium Target |
|--------|--------------|----------------|
| Teaching depth | Syntax only | Pitfalls + why |
| Exercise context | Generic (x, y) | Engineering (user_count) |
| Exercise types | write, fill-in | + refactor, debug |
| Integrated exercises | 0-5 | 20+ |
| Adaptive features | None | Fast-track, insights |
