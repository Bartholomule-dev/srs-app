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
| **Default strategy** | `exact` for write/fill-in, `execution` for predict | Avoids Pyodide load for most sessions; token is opt-in |
| **Token comparison** | Pyodide's `tokenize` module (opt-in) | Handles whitespace/comments; requires Pyodide so explicit opt-in only |
| **String literal fix** | Mask-before-normalize pattern | Quick win, backward compatible |
| **Verification scripts** | Assertion-based (like LeetCode), runs in worker | Tests behavior not syntax; worker avoids UI blocking |
| **Fallback policy** | Only on infra unavailability, NOT on incorrect answers | Prevents wrong execution answers from passing via string match |
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

**Note:** Token comparison requires Pyodide, so it's opt-in for write exercises (not the default) to avoid loading Pyodide for sessions that don't need it. Use `grading_strategy: token` explicitly when semantic equivalence matters.

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

let tokenizeInitialized = false;

/** Initialize tokenize helper in Pyodide (call once) */
export async function initTokenizer(pyodide: PyodideInterface): Promise<void> {
  if (tokenizeInitialized) return;
  pyodide.runPython(TOKENIZE_CODE);
  tokenizeInitialized = true;
}

export async function tokenizeCode(
  pyodide: PyodideInterface,
  code: string
): Promise<[number, string][] | null> {
  await initTokenizer(pyodide);
  const result = pyodide.runPython(`tokenize_code(${JSON.stringify(code)})`);
  return result ? JSON.parse(result) : null;
}

/** Compare user answer against expected + accepted alternatives by token stream */
export async function compareByTokens(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[] = []
): Promise<{ match: boolean; matchedAlternative: string | null }> {
  const userTokens = await tokenizeCode(pyodide, userAnswer);
  if (!userTokens) return { match: false, matchedAlternative: null };

  // Check primary expected answer
  const expectedTokens = await tokenizeCode(pyodide, expectedAnswer);
  if (expectedTokens && JSON.stringify(userTokens) === JSON.stringify(expectedTokens)) {
    return { match: true, matchedAlternative: null };
  }

  // Check accepted alternatives
  for (const alt of acceptedSolutions) {
    const altTokens = await tokenizeCode(pyodide, alt);
    if (altTokens && JSON.stringify(userTokens) === JSON.stringify(altTokens)) {
      return { match: true, matchedAlternative: alt };
    }
  }

  return { match: false, matchedAlternative: null };
}
```

**Handles:** Whitespace variations, comment differences, trailing newlines, accepted_solutions

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
import { executePythonCodeIsolated } from './execution';

/**
 * Run verification script against user code in isolated worker.
 * Uses worker execution to avoid blocking UI during assertion checks.
 *
 * IMPORTANT: executePythonCode returns { success: false } on errors,
 * it does NOT throw. We must check result.success explicitly.
 */
export async function verifyWithScript(
  userCode: string,
  verificationScript: string
): Promise<{ passed: boolean; error?: string }> {
  const fullCode = `${userCode}\n\n${verificationScript}`;

  // Use isolated worker execution (non-blocking, terminable)
  const result = await executePythonCodeIsolated(fullCode);

  if (!result.success) {
    // Execution failed - could be syntax error, assertion failure, or timeout
    return {
      passed: false,
      error: result.error ?? 'Verification failed'
    };
  }

  // All assertions passed (no exception thrown)
  return { passed: true };
}
```

---

### B3: Grading Strategy Router

**Purpose:** Dispatch to appropriate grading method based on exercise configuration.

**Critical design decision:** Fallbacks should ONLY trigger when infrastructure is unavailable (Pyodide not loaded, worker crashed), NOT when the user's answer is legitimately incorrect. If execution runs successfully but the answer is wrong, that's a real incorrect answer—don't second-guess it with string matching.

```typescript
// src/lib/exercise/strategy-router.ts
export type GradingStrategy = 'exact' | 'token' | 'ast' | 'execution';

export interface StrategyConfig {
  primary: GradingStrategy;
  fallback?: GradingStrategy;
}

export interface StrategyResult {
  isCorrect: boolean;
  infraAvailable: boolean;  // false = Pyodide unavailable, strategy couldn't run
  matchedAlternative: string | null;
  error?: string;
}

// NOTE: write defaults to 'exact' (not 'token') to avoid loading Pyodide unnecessarily.
// Use grading_strategy: token explicitly for exercises needing semantic equivalence.
const DEFAULT_STRATEGIES: Record<ExerciseType, StrategyConfig> = {
  'fill-in': { primary: 'exact' },
  'predict': { primary: 'execution', fallback: 'exact' },
  'write': { primary: 'exact' },  // token is opt-in via grading_strategy field
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
  const result = await executeStrategy(config.primary, userAnswer, exercise, pyodide);

  // IMPORTANT: Only fall back if infrastructure was unavailable.
  // If the strategy ran successfully and returned incorrect, that's the real answer.
  // Do NOT fall back on !isCorrect—that would let wrong execution answers
  // pass via string matching.
  if (!result.infraAvailable && config.fallback) {
    console.warn(`Strategy '${config.primary}' unavailable, falling back to '${config.fallback}'`);
    const fallbackResult = await executeStrategy(
      config.fallback, userAnswer, exercise, pyodide
    );
    return { ...fallbackResult, fallbackUsed: true, fallbackReason: 'infra_unavailable' };
  }

  return { ...result, fallbackUsed: false };
}

/** Execute a specific strategy, returning infraAvailable: false if it can't run */
async function executeStrategy(
  strategy: GradingStrategy,
  userAnswer: string,
  exercise: Exercise,
  pyodide: PyodideInterface | null
): Promise<StrategyResult> {
  switch (strategy) {
    case 'exact':
      // Always available - no Pyodide needed
      return { ...checkStringMatch(userAnswer, exercise), infraAvailable: true };

    case 'token':
      if (!pyodide) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      return { ...await compareByTokens(pyodide, userAnswer, exercise), infraAvailable: true };

    case 'execution':
      if (!pyodide && !exercise.verificationScript) {
        return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
      }
      // Verification scripts use worker (no pyodide instance needed)
      if (exercise.verificationScript) {
        const result = await verifyWithScript(userAnswer, exercise.verificationScript);
        return { isCorrect: result.passed, infraAvailable: true, matchedAlternative: null };
      }
      // Output-based execution
      return { ...await verifyByExecution(pyodide!, userAnswer, exercise), infraAvailable: true };

    default:
      return { isCorrect: false, infraAvailable: false, matchedAlternative: null };
  }
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
| `predict` | `execution` → `exact` | Run code, compare output; fallback only if Pyodide unavailable |
| `write` (simple) | `exact` | String matching with normalization; avoids Pyodide load |
| `write` (with `grading_strategy: token`) | `token` | Opt-in for exercises needing semantic equivalence |
| `write` (with `verification_script`) | `execution` | Behavior testing trumps syntax; runs in worker |
| `write` (with `verifyByExecution: true`) | `execution` → `exact` | Legacy flag support |

**Important:** Token strategy is opt-in (not default) because it requires Pyodide. Most write exercises work fine with exact matching + `accepted_solutions`. Use `grading_strategy: token` only when you need semantic equivalence (whitespace, comments, quote styles).

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
│ ████████ exact (65%)     │ Top 5 exercises:                 │
│ ████ execution (25%)     │ 1. predict-list-output           │
│ ██ token (10%)           │ 2. function-return-value         │
│                          │ 3. string-format-dynamic         │
├─────────────────────────────────────────────────────────────┤
│ False Negative Candidates (review queue)                     │
│ User answered: items[:3]  Expected: items[0:3]              │
│ User answered: f'{x}'     Expected: f"{x}"                  │
│ → Consider adding grading_strategy: token to these exercises│
└─────────────────────────────────────────────────────────────┘
```

---

## Future Considerations

1. **AST Strategy (Phase 2+):** Full tree-sitter-python WASM for structural comparison if token matching proves insufficient

2. **Variable name canonicalization:** Alpha-rename variables to detect `for i in` vs `for x in` equivalence (opt-in, high risk of false positives)

3. **Partial credit:** Strategy router could return confidence scores for "almost correct" feedback

4. **LLM fallback (ruled out for now):** If all else fails, LLM could evaluate semantic equivalence—but cost/latency concerns remain

5. **Community-contributed alternatives:** Users submit answers that were marked wrong but should be correct; review queue for content authors

6. **JS-based token matching:** If Pyodide proves too heavy for token comparison, could implement a simplified JS tokenizer that handles the most common cases (whitespace, quotes, comments) without full Python tokenize semantics.

---

## Open Questions Resolved

These questions were raised during multi-AI review. Answers are incorporated into the design above.

### Q: Should execution fallbacks only happen when Pyodide is unavailable, or also on assertion/runtime failures?

**A: Only when infrastructure is unavailable.** If the user's code runs and produces wrong output (or fails assertions), that's a legitimate incorrect answer. Falling back to string matching would let wrong answers pass incorrectly. The `infraAvailable` flag in `StrategyResult` distinguishes "couldn't run" from "ran but failed". See B3 implementation.

### Q: Is loading Pyodide for most write exercises acceptable, or should token matching be limited/JS-based to avoid that cost?

**A: Token matching is opt-in, not default.** Write exercises default to `exact` strategy (string matching with normalization). Authors must explicitly set `grading_strategy: token` for exercises that need semantic equivalence. This avoids loading Pyodide for sessions that don't need it. The existing preload logic in `useConceptSession.ts` only triggers for `predict` or `verifyByExecution` exercises—this remains unchanged.

### Q: Do you want verification scripts to run in the worker (executePythonCodeIsolated) to avoid UI blocking?

**A: Yes, verification scripts run in the worker.** The `verifyWithScript` function uses `executePythonCodeIsolated` which runs in a Web Worker, keeping the UI responsive during assertion checks. This also provides timeout handling and crash isolation.

---

## References

- Multi-AI Analysis Session (2026-01-10)
- [Dynamic Exercise System Design](./2026-01-06-dynamic-exercise-system-design.md)
- [Phase 2 Grading Infrastructure](./2026-01-07-dynamic-exercises-phase2-grading.md)
- [Pyodide Documentation](https://pyodide.org/)
- [Python tokenize module](https://docs.python.org/3/library/tokenize.html)

---

*Design approved 2026-01-10*
