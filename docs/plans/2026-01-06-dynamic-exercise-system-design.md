# Dynamic Exercise System Design

**Date:** 2026-01-06
**Status:** Approved
**Authors:** Claude (Opus 4.5), with input from OpenAI Codex, Google Gemini, ChatGPT

---

## Executive Summary

This design transforms SRS-App from static YAML exercises to a dynamic, parameterized exercise system that prevents rote memorization while maintaining grading reliability. The system introduces template-based exercise generation, two-pass grading with coaching feedback, optional Pyodide execution for behavioral validation, and comprehensive metrics tracking.

### Key Decisions

| Decision | Choice |
|----------|--------|
| **Scope** | All three exercise types (write, fill-in, predict) |
| **Template approach** | Hybrid - YAML structure + TypeScript generators |
| **Grading strategy** | Two-pass with coaching (credit for correct, feedback for construct) |
| **Pyodide scope** | Predict exercises + opt-in for write, lazy loaded |
| **Success metrics** | Retention, near-transfer, completion stability, construct adoption |
| **Rollout** | Everyone from launch (no A/B testing) |

---

## Background

### Problem Statement

The current system has 332 static Python exercises. Users can memorize answer strings rather than learning syntax patterns. With dedicated practice, users encounter repetition within weeks, leading to "pattern memorization" instead of transferable skills.

### Prior Work

A multi-AI debate (Claude, Codex, Gemini) concluded on "Phased Bounded Dynamism" - introducing controlled variation without the risks of unbounded LLM generation. ChatGPT provided critical feedback on metrics and implementation approach.

Key insights from the debate:
- **REJECTED:** Black-box LLM generation (unreliable, cost scales poorly)
- **REJECTED:** Server-side code execution (security risks)
- **ACCEPTED:** Deterministic template parameterization with graceful fallbacks
- **ACCEPTED:** Client-side Pyodide execution for predict exercises
- **ACCEPTED:** LLMs for adaptive hints only (future phase)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      YAML Exercises                          │
│  (static templates with {{parameter}} placeholders)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Generator Layer (TypeScript)                │
│  - Resolves parameters using deterministic seed              │
│  - Validates constraints (e.g., end > start)                 │
│  - Produces concrete Exercise with generated values          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Grading Layer                             │
│  Pass 1: Correctness (string match OR Pyodide execution)     │
│  Pass 2: Construct check (AST pattern, if defined)           │
│  → Returns: isCorrect, usedTargetConstruct, coachingFeedback │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Metrics Layer                             │
│  - Logs generated parameters with attempt                    │
│  - Tracks construct adoption over time                       │
│  - Feeds retention/transfer analytics                        │
└─────────────────────────────────────────────────────────────┘
```

**Key insight:** Exercises in the database remain templates. Concrete values are generated at render time using a deterministic seed derived from `(userId, exerciseSlug, dueDate)`. The same user sees the same values for a given review, but different users (or different review dates) see different values.

---

## Detailed Design

### 1. Template Format (YAML Schema)

Exercises gain three new optional fields:

```yaml
# exercises/python/strings.yaml
- slug: string-slice-dynamic
  objective: "Use slice notation to extract a substring"
  title: String Slicing
  difficulty: 2
  concept: strings
  subconcept: slicing
  level: practice
  type: write

  # NEW: Generator reference (defined in TypeScript)
  generator: slice-bounds

  # NEW: Template strings with {{param}} placeholders
  prompt: "Get characters from index {{start}} to {{end}} (exclusive) of string s"
  expected_answer: "s[{{start}}:{{end}}]"

  # NEW: Target construct for two-pass grading (optional)
  target_construct:
    type: slice
    feedback: "Try using slice notation s[start:end] instead"

  # Existing fields work as before
  hints:
    - "Use slice notation [start:end]"
    - "End index is exclusive"
  accepted_solutions:
    - "s[{{start}}:{{end}}]"
```

**Field definitions:**

- **`generator`** - References a TypeScript function that produces parameter values
- **`{{param}}`** - Mustache-style placeholders, replaced at render time
- **`target_construct`** - Optional AST pattern for Pass 2 grading
- **Backward compatible** - Exercises without `generator` work exactly as before

For predict and fill-in types:

```yaml
# Predict exercise
type: predict
generator: list-values
code: "nums = [{{a}}, {{b}}, {{c}}]\nprint(nums[1])"
expected_answer: "{{b}}"

# Fill-in exercise
type: fill-in
generator: slice-bounds
template: "result = s[___:{{end}}]"
expected_answer: "{{start}}"
```

---

### 2. Generator Layer (TypeScript)

Generators live in `src/lib/generators/` and follow a strict interface:

```typescript
// src/lib/generators/types.ts
export interface GeneratorParams {
  [key: string]: string | number | boolean;
}

export interface Generator {
  /** Unique name matching YAML generator field */
  name: string;

  /** Produce parameters from a deterministic seed */
  generate(seed: string): GeneratorParams;

  /** Validate that params satisfy constraints */
  validate(params: GeneratorParams): boolean;
}
```

**Seed generation:**

```typescript
// src/lib/generators/seed.ts
export function createSeed(
  userId: string,
  exerciseSlug: string,
  dueDate: Date
): string {
  const dateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
  return sha256(`${userId}:${exerciseSlug}:${dateStr}`);
}
```

**Example generator:**

```typescript
// src/lib/generators/definitions/slice-bounds.ts
import { seededRandom } from '../utils';

export const sliceBoundsGenerator: Generator = {
  name: 'slice-bounds',

  generate(seed: string) {
    const rng = seededRandom(seed);
    const start = rng.int(0, 4);
    const end = rng.int(start + 1, 7); // ensures end > start
    return { start, end };
  },

  validate(params) {
    const { start, end } = params as { start: number; end: number };
    return end > start && start >= 0 && end <= 10;
  }
};
```

**Generator registry:**

```typescript
// src/lib/generators/index.ts
const generators: Map<string, Generator> = new Map([
  ['slice-bounds', sliceBoundsGenerator],
  ['list-values', listValuesGenerator],
  ['variable-names', variableNamesGenerator],
]);

export function getGenerator(name: string): Generator | undefined {
  return generators.get(name);
}
```

**Property-based testing:**

```typescript
// tests/unit/generators/slice-bounds.test.ts
import { fc } from 'fast-check';

test('slice-bounds always produces valid params', () => {
  fc.assert(
    fc.property(fc.string(), (seed) => {
      const params = sliceBoundsGenerator.generate(seed);
      expect(sliceBoundsGenerator.validate(params)).toBe(true);
    })
  );
});
```

---

### 3. Rendering Pipeline

```typescript
// src/lib/generators/render.ts
import Mustache from 'mustache';

export interface RenderedExercise extends Exercise {
  _generatedParams?: GeneratorParams;
  _seed?: string;
}

export function renderExercise(
  exercise: Exercise,
  userId: string,
  dueDate: Date
): RenderedExercise {
  if (!exercise.generator) {
    return exercise; // Static exercises pass through
  }

  const generator = getGenerator(exercise.generator);
  if (!generator) {
    console.warn(`Unknown generator: ${exercise.generator}`);
    return exercise;
  }

  const seed = createSeed(userId, exercise.slug, dueDate);
  const params = generator.generate(seed);

  return {
    ...exercise,
    prompt: Mustache.render(exercise.prompt, params),
    expectedAnswer: Mustache.render(exercise.expectedAnswer, params),
    acceptedSolutions: exercise.acceptedSolutions.map(
      (s) => Mustache.render(s, params)
    ),
    code: exercise.code ? Mustache.render(exercise.code, params) : undefined,
    template: exercise.template
      ? Mustache.render(exercise.template, params)
      : undefined,
    _generatedParams: params,
    _seed: seed,
  };
}
```

---

### 4. Two-Pass Grading System

```typescript
// src/lib/exercise/grading.ts
export interface GradingResult {
  isCorrect: boolean;
  usedTargetConstruct: boolean | null;
  coachingFeedback: string | null;
  gradingMethod: 'string' | 'execution' | 'execution-fallback';
}

export async function gradeAnswer(
  userAnswer: string,
  exercise: RenderedExercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {

  // === PASS 1: Correctness ===
  let isCorrect = false;
  let gradingMethod: GradingResult['gradingMethod'] = 'string';

  const useExecution =
    exercise.exerciseType === 'predict' ||
    exercise.verifyByExecution === true;

  if (useExecution && pyodide) {
    try {
      isCorrect = await verifyByExecution(userAnswer, exercise, pyodide);
      gradingMethod = 'execution';
    } catch {
      isCorrect = checkStringMatch(userAnswer, exercise);
      gradingMethod = 'execution-fallback';
    }
  } else {
    isCorrect = checkStringMatch(userAnswer, exercise);
  }

  // === PASS 2: Construct Check ===
  let usedTargetConstruct: boolean | null = null;
  let coachingFeedback: string | null = null;

  if (isCorrect && exercise.targetConstruct) {
    usedTargetConstruct = checkTargetConstruct(
      userAnswer,
      exercise.targetConstruct
    );

    if (!usedTargetConstruct) {
      coachingFeedback = exercise.targetConstruct.feedback
        ?? "Great job! Try the suggested syntax next time.";
    }
  }

  return { isCorrect, usedTargetConstruct, coachingFeedback, gradingMethod };
}
```

**Key behavior:** Full credit for correctness. Coaching feedback shown but doesn't affect SRS rating.

---

### 5. Pyodide Integration

Lazy-loaded React context:

```typescript
// src/lib/context/PyodideContext.tsx
export function PyodideProvider({ children }: { children: React.ReactNode }) {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState(false);
  const loadPromiseRef = useRef<Promise<PyodideInterface | null> | null>(null);

  const loadPyodide = useCallback(async () => {
    if (pyodide) return pyodide;
    if (loadPromiseRef.current) return loadPromiseRef.current;

    setLoading(true);

    loadPromiseRef.current = (async () => {
      try {
        const { loadPyodide: load } = await import('pyodide');
        const instance = await load({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        setPyodide(instance);
        return instance;
      } catch (err) {
        console.error('Failed to load Pyodide:', err);
        return null;
      } finally {
        setLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    return loadPromiseRef.current;
  }, [pyodide]);

  return (
    <PyodideContext.Provider value={{ pyodide, loading, loadPyodide }}>
      {children}
    </PyodideContext.Provider>
  );
}
```

**Loading trigger in session:**

```typescript
// In useConceptSession.ts
useEffect(() => {
  const needsPyodide = cards.some(
    (c) => c.type !== 'teaching' && (
      c.exercise.exerciseType === 'predict' ||
      c.exercise.verifyByExecution
    )
  );

  if (needsPyodide) {
    loadPyodide(); // Preload for when user reaches that card
  }
}, [cards, loadPyodide]);
```

**UX considerations:**
- ~6.4MB initial download, 4-5s cold start
- Only loads when session contains predict/execution exercises
- Shows loading spinner if Pyodide not ready when user reaches that card
- Falls back to string matching if load fails

---

### 6. Metrics & Audit Logging

**Database schema additions:**

```sql
-- Extend exercise_attempts
ALTER TABLE exercise_attempts
ADD COLUMN generated_params JSONB,
ADD COLUMN seed VARCHAR(64),
ADD COLUMN grading_method VARCHAR(20),
ADD COLUMN used_target_construct BOOLEAN,
ADD COLUMN coaching_shown BOOLEAN DEFAULT FALSE;

-- New table for transfer tracking
CREATE TABLE transfer_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subconcept_slug TEXT NOT NULL,
  exercise_slug TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  practice_count INTEGER NOT NULL,
  last_practice_at TIMESTAMPTZ
);
```

**Four success metrics:**

| Metric | What it measures | Query approach |
|--------|------------------|----------------|
| **Retention** | Performance on subsequent reviews | Compare first vs later attempts per subconcept |
| **Near Transfer** | Performance on unseen exercises | Track fresh exercise results in transfer_assessments |
| **Completion Stability** | Rage-quit signals | Abandon rate, hint frequency, retry streaks |
| **Construct Adoption** | Users learning target syntax | Trend of used_target_construct over time |

---

## File Structure

```
src/lib/
├── generators/                      # NEW
│   ├── index.ts
│   ├── types.ts
│   ├── seed.ts
│   ├── render.ts
│   ├── utils.ts
│   └── definitions/
│       ├── slice-bounds.ts
│       ├── list-values.ts
│       ├── variable-names.ts
│       ├── index-values.ts
│       └── arithmetic-values.ts
│
├── exercise/
│   ├── matching.ts                  # MODIFY
│   ├── grading.ts                   # NEW
│   ├── ast-check.ts                 # NEW
│   ├── execution.ts                 # NEW
│   └── log-attempt.ts               # NEW
│
├── context/
│   └── PyodideContext.tsx           # NEW
│
├── stats/
│   └── dynamic-metrics.ts           # NEW
│
└── types/
    └── app.types.ts                 # MODIFY

src/components/exercise/
├── ExerciseCard.tsx                 # MODIFY
└── CoachingFeedback.tsx             # NEW

tests/
├── unit/generators/                 # NEW
└── integration/
    └── dynamic-session.test.ts      # NEW

supabase/migrations/
└── YYYYMMDD_dynamic_exercises.sql   # NEW
```

**Estimated scope:**
- ~15 new files
- ~1,500 lines new TypeScript
- ~200 lines new SQL
- Updates to ~10 existing files

---

## Implementation Order

```
PHASE 1: Foundation
├── 1.1 Database migration
├── 1.2 Generator types + seed utilities
├── 1.3 First generator: slice-bounds
├── 1.4 Render pipeline
└── 1.5 Property-based tests

PHASE 2: Grading Infrastructure
├── 2.1 Two-pass grading orchestrator
├── 2.2 AST construct checking
├── 2.3 Update ExerciseCard
├── 2.4 CoachingFeedback component
└── 2.5 Grading tests

PHASE 3: Pyodide Integration
├── 3.1 PyodideContext provider
├── 3.2 Execution helpers
├── 3.3 Lazy loading in useConceptSession
├── 3.4 Fallback handling
└── 3.5 Integration tests

PHASE 4: Metrics & Logging
├── 4.1 Extend exercise_attempts
├── 4.2 Audit logging
├── 4.3 Transfer assessment tracking
├── 4.4 Metrics queries
└── 4.5 (Future) Metrics dashboard

PHASE 5: Content Migration
├── 5.1 Update strings.yaml
├── 5.2 Update collections.yaml
├── 5.3 Add more generators
├── 5.4 Update import script
└── 5.5 Validation
```

**Critical path:** 1.1 → 1.2 → 1.4 → 2.1 → 2.3 (minimum for parameterized exercises)

**Parallelizable:** Phase 3 (Pyodide) can run in parallel with Phase 2

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Generator produces invalid params | Low | High | Property-based tests, validate() method |
| Pyodide load fails | Medium | Low | Graceful fallback to string matching |
| AST parsing fails | Medium | Low | Skip construct check, still grade correctness |
| User confusion from changing values | Low | Medium | Deterministic seeding per review |
| Performance regression | Low | Medium | Lazy loading, preload during session build |

---

## Future Considerations

- **LLM Adaptive Hints (Phase D):** Trigger on 2+ failures, session budget cap
- **More generators:** As content expands, add generators for new patterns
- **Metrics dashboard:** Visualize retention/transfer data for content authors
- **A/B testing infrastructure:** If needed post-launch for specific experiments

---

## References

- [Multi-AI Debate Results](../Debate-Results/2026-01-06-Dynamic-QA-Generation-Debate.md)
- [Phase 2.7 Exercise Variety Design](./2026-01-06-phase27-exercise-variety-design.md)
- [Pyodide Documentation](https://pyodide.org/)
- [Desirable Difficulties in Learning](https://bjorklab.psych.ucla.edu/research/)

---

*Design approved 2026-01-06*
