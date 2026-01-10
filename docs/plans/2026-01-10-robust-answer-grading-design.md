# Robust Answer Grading System Design

**Date:** 2026-01-10
**Status:** Approved
**Authors:** Claude (Opus 4.5), with input from OpenAI Codex, Google Gemini

---

## Executive Summary

This design evolves the SRS-App grading system from brittle string matching to a flexible, strategy-based architecture that handles semantic equivalence while maintaining sub-second response times. The system introduces per-exercise grading strategies, token-aware normalization, and verification scripts—all running client-side with Pyodide.

### Problem Statement

The current grading system has five documented failure modes:

1. **String literal corruption**: `normalizePython()` applies comma/colon normalization inside string literals (e.g., `"a,b"` → `"a, b"`)

2. **Semantic equivalence misses**: `items[0:3]` vs `items[:3]` vs `items[0:3:1]` are semantically identical but fail string matching

3. **Variable name variations**: `for i in range(5)` vs `for x in range(5)` both valid, only one matches

4. **Construct false positives**: Regex patterns match inside comments/strings (`"[x for x in xs]"` triggers comprehension detection)

5. **Behavior vs syntax mismatch**: Two implementations with identical output don't match if syntax differs

**Impact**: Users report "correct answers marked wrong" frustration. Exercises require extensive `accepted_solutions` lists that still miss edge cases.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Strategy architecture** | Per-exercise grading strategies | Different exercises need different approaches |
| **Default strategy** | `token` for write, `exact` for fill-in, `execution` for predict | Matches exercise semantics |
| **Token comparison** | Pyodide's `tokenize` module | Handles whitespace/comments, runs client-side |
| **String literal fix** | Mask-before-normalize pattern | Quick win, backward compatible |
| **Verification scripts** | Assertion-based (like LeetCode) | Tests behavior, not syntax |
| **Telemetry** | Log grading method, fallbacks, false negatives | Data-driven prioritization |
| **Phasing** | 3 parallel tracks | Ship fast, iterate with data |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Exercise (with grading_strategy)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Grading Strategy Router                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐           │
│  │  exact  │  │  token  │  │   ast   │  │ execution │           │
│  │ (fast)  │  │(default)│  │(future) │  │ (verify)  │           │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Grading Result + Telemetry                    │
│  { isCorrect, strategy, fallbackUsed, constructCheck, ... }     │
└─────────────────────────────────────────────────────────────────┘
```

**Strategy selection flow:**
1. Exercise defines `grading_strategy` (or uses type-based default)
2. Router dispatches to appropriate matcher
3. On failure, may cascade to fallback strategy
4. All results logged with telemetry for analysis

---

## Parallel Tracks Structure

### Track Overview

Three parallel workstreams that can progress simultaneously:

```
TRACK A: Quick Wins (Foundation)          TRACK B: Grading Infrastructure       TRACK C: Content & Migration
─────────────────────────────────         ────────────────────────────────      ─────────────────────────────
A1: String literal preservation           B1: Token comparison (Pyodide)        C1: grading_strategy YAML field
A2: Grading telemetry                     B2: Verification scripts              C2: Strategy defaults per type
A3: Construct detection fix               B3: Grading strategy router           C3: Content audit & migration
                                          B4: Execution improvements            C4: Validation tooling
```

### Track Dependencies

```
     A1 ──────────────────────────────────────────────────────►
     A2 ──────────────────────────► (informs C3 priorities)
     A3 ───────────────────────────────────────────────────────►

     B1 ─────────────────► B3 ────────────────────────────────►
     B2 ─────────────────► B3
                           B4 ────────────────────────────────►

                           C1 ───► C2 ───► C3 ───► C4 ────────►
```

**Critical path:** A1 (string fix) has no dependencies and delivers immediate value.

**Unlock point:** B3 (strategy router) unlocks C2/C3 (content can start using strategies).

### Effort Estimates

| Track | Item | Effort | Impact |
|-------|------|--------|--------|
| A | A1: String literal fix | Quick (<1h) | High |
| A | A2: Telemetry | Quick (<1h) | Medium |
| A | A3: Construct fix | Short (1-4h) | Medium |
| B | B1: Token comparison | Short (2-4h) | High |
| B | B2: Verification scripts | Medium (4-8h) | High |
| B | B3: Strategy router | Short (2-4h) | High |
| B | B4: Execution improvements | Short (2-4h) | Medium |
| C | C1-C4: Content migration | Medium (1-2d) | High |

**Total estimated effort:** ~3-4 days of focused work across all tracks.

---

## Track A: Quick Wins (Foundation)

### A1: String Literal Preservation

**Problem:** `normalizePython()` corrupts string contents by normalizing commas/colons inside quotes.

**Solution:** Mask string literals before normalization, restore after.

```typescript
// src/lib/exercise/matching.ts
export function normalizePython(code: string): string {
  if (!code) return '';

  // Step 1: Mask string literals to protect them
  const strings: string[] = [];
  let masked = code.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    (match) => {
      strings.push(match);
      return `__STR_${strings.length - 1}__`;
    }
  );

  // Step 2: Apply normalizations to non-string code
  masked = masked
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/ +$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/, */g, ', ')
    .replace(/ +:/g, ':')
    .replace(/:(?![\n$]) */g, ': ')
    .trim();

  // Step 3: Restore string literals
  return masked.replace(/__STR_(\d+)__/g, (_, i) => strings[parseInt(i)]);
}
```

**Files:** `src/lib/exercise/matching.ts`
**Tests:** Add cases for `"a,b"` preservation, nested quotes, escaped quotes

---

### A2: Grading Telemetry

**Purpose:** Capture grading outcomes to identify false negatives and prioritize improvements.

```typescript
// src/lib/exercise/telemetry.ts
export interface GradingTelemetry {
  exerciseSlug: string;
  strategy: GradingStrategy;
  wasCorrect: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  matchedAlternative: string | null;
  userAnswerHash: string; // SHA-256, not raw answer
  timestamp: Date;
}

export function logGradingTelemetry(telemetry: GradingTelemetry): void {
  // Phase 1: Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Grading]', telemetry);
  }
  // Phase 2: Send to analytics (future)
}
```

**Files:** `src/lib/exercise/telemetry.ts`, modify `grading.ts`

---

### A3: Construct Detection Fix

**Problem:** Regex patterns match constructs inside strings/comments.

**Solution:** Strip strings and comments before construct check.

```typescript
// src/lib/exercise/construct-check.ts
function stripStringsAndComments(code: string): string {
  return code
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '""') // Replace strings
    .replace(/#.*/g, ''); // Remove comments
}

export function checkConstruct(
  code: string,
  constructType: ConstructType
): ConstructCheckResult {
  const cleanCode = stripStringsAndComments(code);
  const pattern = CONSTRUCT_PATTERNS[constructType];
  // ... rest of implementation
}
```

**Files:** `src/lib/exercise/construct-check.ts`

---

## Track B: Grading Infrastructure

### B1: Token Comparison (Pyodide)

**Purpose:** Compare code by token stream instead of string, handling whitespace and comments naturally.

```typescript
// src/lib/exercise/token-compare.ts
import type { PyodideInterface } from '@/lib/context/PyodideContext';

const TOKENIZE_CODE = `
import tokenize
import io
import json

def tokenize_code(code):
    try:
        tokens = tokenize.generate_tokens(io.StringIO(code).readline)
        # Keep meaningful tokens, skip whitespace/comments
        result = [
            (t.type, t.string) for t in tokens
            if t.type not in (
                tokenize.COMMENT, tokenize.NL,
                tokenize.NEWLINE, tokenize.ENCODING,
                tokenize.ENDMARKER
            )
        ]
        return json.dumps(result)
    except tokenize.TokenizeError:
        return None
`;

export async function tokenizeCode(
  pyodide: PyodideInterface,
  code: string
): Promise<[number, string][] | null> {
  const result = pyodide.runPython(`tokenize_code(${JSON.stringify(code)})`);
  return result ? JSON.parse(result) : null;
}

export async function compareByTokens(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string
): Promise<boolean> {
  const userTokens = await tokenizeCode(pyodide, userAnswer);
  const expectedTokens = await tokenizeCode(pyodide, expectedAnswer);

  if (!userTokens || !expectedTokens) return false;
  return JSON.stringify(userTokens) === JSON.stringify(expectedTokens);
}
```

**Handles:** Whitespace variations, comment differences, trailing newlines

---

### B2: Verification Scripts

**Purpose:** Test code behavior via assertions (LeetCode-style), not string matching.

```yaml
# exercises/python/functions.yaml
- slug: add-function
  type: write
  grading_strategy: execution
  prompt: "Write a function `add(a, b)` that returns the sum"
  expected_answer: "def add(a, b):\n    return a + b"
  verification_script: |
    assert add(1, 2) == 3, "add(1, 2) should equal 3"
    assert add(-1, 1) == 0, "add(-1, 1) should equal 0"
    assert add(0, 0) == 0, "add(0, 0) should equal 0"
```

```typescript
// src/lib/exercise/verification.ts
export async function verifyWithScript(
  pyodide: PyodideInterface,
  userCode: string,
  verificationScript: string
): Promise<{ passed: boolean; error?: string }> {
  const fullCode = `${userCode}\n\n${verificationScript}`;

  try {
    await executePythonCode(pyodide, fullCode);
    return { passed: true };
  } catch (err) {
    return {
      passed: false,
      error: err instanceof Error ? err.message : 'Verification failed'
    };
  }
}
```

---

### B3: Grading Strategy Router

**Purpose:** Dispatch to appropriate grading method based on exercise configuration.

```typescript
// src/lib/exercise/strategy-router.ts
export type GradingStrategy = 'exact' | 'token' | 'ast' | 'execution';

export interface StrategyConfig {
  primary: GradingStrategy;
  fallback?: GradingStrategy;
}

const DEFAULT_STRATEGIES: Record<ExerciseType, StrategyConfig> = {
  'fill-in': { primary: 'exact' },
  'predict': { primary: 'execution', fallback: 'exact' },
  'write': { primary: 'token', fallback: 'exact' },
};

export async function gradeWithStrategy(
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<GradingResult> {
  const config = exercise.gradingStrategy
    ? { primary: exercise.gradingStrategy }
    : DEFAULT_STRATEGIES[exercise.exerciseType];

  // Try primary strategy
  let result = await executeStrategy(config.primary, userAnswer, exercise, pyodide);

  // Fallback if primary fails/unavailable
  if (!result.isCorrect && config.fallback) {
    const fallbackResult = await executeStrategy(
      config.fallback, userAnswer, exercise, pyodide
    );
    if (fallbackResult.isCorrect) {
      return { ...fallbackResult, fallbackUsed: true };
    }
  }

  return result;
}
```

---

### B4: Execution Improvements

**Enhancements to existing Pyodide execution:**

1. **Output normalization options:** `trim`, `strict`, `ignore_whitespace`
2. **Better error messages:** Parse assertion errors for user feedback
3. **Timeout handling:** Per-exercise timeout configuration

---

## Track C: Content & Migration

### C1: grading_strategy YAML Field

**Add new optional field to exercise schema:**

```yaml
# exercises/python/strings.yaml
- slug: string-slice-dynamic
  type: write
  grading_strategy: token  # NEW: optional, overrides type default
  # ... rest of exercise
```

```typescript
// src/lib/exercise/yaml-types.ts (add to YamlExercise)
export interface YamlExercise {
  // ... existing fields ...

  /** Grading strategy override (optional) */
  grading_strategy?: 'exact' | 'token' | 'ast' | 'execution';

  /** Verification script for execution strategy (optional) */
  verification_script?: string;
}
```

```typescript
// src/lib/types/app.types.ts (add to Exercise)
export interface Exercise {
  // ... existing fields ...

  gradingStrategy?: GradingStrategy;
  verificationScript?: string;
}
```

---

### C2: Strategy Defaults Per Type

**Smart defaults based on exercise characteristics:**

| Exercise Type | Default Strategy | Rationale |
|--------------|------------------|-----------|
| `fill-in` | `exact` | Single token answers, exact match sufficient |
| `predict` | `execution` → `exact` | Run code, compare output; fallback if Pyodide unavailable |
| `write` (simple) | `token` → `exact` | Token stream handles formatting; string fallback |
| `write` (with `verification_script`) | `execution` | Behavior testing trumps syntax |
| `write` (with `verifyByExecution: true`) | `execution` → `token` | Legacy flag support |

```typescript
// src/lib/exercise/strategy-defaults.ts
export function getDefaultStrategy(exercise: Exercise): StrategyConfig {
  // Explicit override takes precedence
  if (exercise.gradingStrategy) {
    return { primary: exercise.gradingStrategy };
  }

  // Verification script implies execution
  if (exercise.verificationScript) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Legacy flag support
  if (exercise.verifyByExecution) {
    return { primary: 'execution', fallback: 'token' };
  }

  // Type-based defaults
  return DEFAULT_STRATEGIES[exercise.exerciseType];
}
```

---

### C3: Content Audit & Migration

**Phase 1: Identify problem exercises via telemetry**
- Run app with telemetry enabled
- Collect exercises with high `fallbackUsed` or user complaints
- Prioritize these for strategy assignment

**Phase 2: Bulk migration script**
```bash
# scripts/audit-grading.ts
pnpm audit:grading  # Outputs report of exercises by strategy needs
```

**Phase 3: Add verification scripts to key exercises**
- Functions that return values → assertion-based verification
- Output-producing code → execution with output comparison
- Syntax-focused → token comparison

---

### C4: Validation Tooling

```typescript
// scripts/validate-strategies.ts
// Validates that:
// 1. verification_script only used with grading_strategy: execution
// 2. All verification scripts are syntactically valid Python
// 3. No conflicting strategy + verifyByExecution combinations
```

```bash
pnpm validate:strategies  # Add to CI pipeline
```

---

## File Structure & Changes

### New Files

```
src/lib/exercise/
├── telemetry.ts           # A2: Grading telemetry logging
├── token-compare.ts       # B1: Pyodide token stream comparison
├── verification.ts        # B2: Verification script execution
├── strategy-router.ts     # B3: Strategy dispatch logic
└── strategy-defaults.ts   # C2: Default strategy selection

scripts/
├── audit-grading.ts       # C3: Exercise grading audit tool
└── validate-strategies.ts # C4: Strategy validation for CI
```

### Modified Files

```
src/lib/exercise/
├── matching.ts            # A1: Add string literal masking
├── construct-check.ts     # A3: Strip strings/comments before check
├── grading.ts             # Integrate strategy router
├── types.ts               # Add GradingStrategy, telemetry types
├── yaml-types.ts          # Add grading_strategy, verification_script
└── index.ts               # Export new modules

src/lib/types/
└── app.types.ts           # Add gradingStrategy, verificationScript to Exercise

src/lib/supabase/
└── mappers.ts             # Map new DB fields to Exercise type

src/components/exercise/
└── ExerciseCard.tsx       # Use gradeWithStrategy instead of gradeAnswer
```

### Database Changes

```sql
-- supabase/migrations/YYYYMMDD_grading_strategies.sql
ALTER TABLE exercises
ADD COLUMN grading_strategy TEXT,
ADD COLUMN verification_script TEXT;

-- Add telemetry table (optional, for Phase 2 analytics)
CREATE TABLE grading_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_slug TEXT NOT NULL,
  strategy TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL,
  fallback_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Estimated Scope

| Category | Count |
|----------|-------|
| New files | 7 |
| Modified files | 9 |
| New TypeScript lines | ~400 |
| New SQL lines | ~20 |
| New tests | ~80 |

---

## Risks & Mitigations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Token parsing fails on code fragments** | Medium | Low | Wrap in try/catch, fallback to string matching; fragments like `x[1:3]` may not tokenize as standalone |
| **Pyodide unavailable** | Medium | Low | All strategies have `exact` fallback; graceful degradation |
| **Verification script timeout** | Low | Medium | 5s timeout inherited from worker; scripts should be simple assertions |
| **String masking misses edge cases** | Low | Medium | Handle escaped quotes, triple-quoted strings; comprehensive tests |
| **Token comparison too lenient** | Low | Medium | May accept answers with different variable names; telemetry will surface this |

### Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Token comparison slower than string** | Medium | Low | Only ~10-50ms overhead; Pyodide already loaded for predict exercises |
| **Verification script execution overhead** | Low | Low | Reuse existing Pyodide instance; assertions run fast |
| **Telemetry logging overhead** | Low | Negligible | Async logging, minimal payload |

### Migration Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Breaking existing exercises** | Low | High | All changes are additive; existing `accepted_solutions` continue working |
| **Strategy mismatch causes false negatives** | Medium | Medium | Conservative defaults; telemetry identifies problems |
| **Content authors confused by options** | Low | Low | Clear defaults; explicit override only when needed |

### Rollback Plan

1. **Feature flag:** `ENABLE_STRATEGY_ROUTING=false` bypasses router, uses legacy grading
2. **Per-exercise override:** Set `grading_strategy: exact` to force legacy behavior
3. **Database rollback:** New columns are nullable, no data loss on rollback

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **False negative rate** | <1% | Telemetry: answers marked wrong that match via looser strategy |
| **Fallback usage** | <10% | Telemetry: grading attempts using fallback strategy |
| **User complaints** | 50% reduction | Support tickets about "correct answer marked wrong" |
| **Grading latency** | <200ms p95 | Performance monitoring; maintain sub-second feel |
| **accepted_solutions bloat** | Decrease | Audit: exercises needing fewer manual alternatives |

### Telemetry Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────┐
│ Grading Health Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│ Strategy Distribution    │ Fallback Triggers                │
│ ████████ token (65%)     │ Top 5 exercises:                 │
│ ████ exact (20%)         │ 1. string-format-dynamic         │
│ ███ execution (15%)      │ 2. list-comp-filter              │
│                          │ 3. dict-access-dynamic           │
├─────────────────────────────────────────────────────────────┤
│ False Negative Candidates (review queue)                     │
│ User answered: items[:3]  Expected: items[0:3]              │
│ User answered: f'{x}'     Expected: f"{x}"                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Future Considerations

1. **AST Strategy (Phase 2+):** Full tree-sitter-python WASM for structural comparison if token matching proves insufficient

2. **Variable name canonicalization:** Alpha-rename variables to detect `for i in` vs `for x in` equivalence (opt-in, high risk of false positives)

3. **Partial credit:** Strategy router could return confidence scores for "almost correct" feedback

4. **LLM fallback (ruled out for now):** If all else fails, LLM could evaluate semantic equivalence—but cost/latency concerns remain

5. **Community-contributed alternatives:** Users submit answers that were marked wrong but should be correct; review queue for content authors

---

## References

- Multi-AI Analysis Session (2026-01-10)
- [Dynamic Exercise System Design](./2026-01-06-dynamic-exercise-system-design.md)
- [Phase 2 Grading Infrastructure](./2026-01-07-dynamic-exercises-phase2-grading.md)
- [Pyodide Documentation](https://pyodide.org/)
- [Python tokenize module](https://docs.python.org/3/library/tokenize.html)

---

*Design approved 2026-01-10*
