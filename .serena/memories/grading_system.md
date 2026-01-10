# Grading System Architecture

## Overview

Strategy-based grading with 4 strategies implemented 2026-01-10.

## Strategies

| Strategy | Use Case | Pyodide |
|----------|----------|---------|
| `exact` | Fill-in, simple matching | No |
| `token` | Whitespace/comment tolerance | Yes |
| `ast` | Semantic equivalence | Yes |
| `execution` | Output verification | Yes |

## Key Files

```
src/lib/exercise/
├── strategy-router.ts    # Orchestration + fallback
├── strategy-defaults.ts  # Default config per exercise type
├── matching.ts           # String matching (with literal masking)
├── token-compare.ts      # Pyodide tokenization
├── ast-compare.ts        # AST normalization (slices, variables)
├── verification.ts       # Assertion-based scripts
├── construct-check.ts    # Regex detection (strips strings/comments)
└── telemetry.ts          # Analytics logging
```

## Failure Modes Solved

1. **String corruption**: `"a,b"` stays `"a,b"` (mask before normalize)
2. **Slice equivalence**: `[:3]` ≡ `[0:3]` ≡ `[0:3:1]`
3. **Variable names**: `for i in x` ≡ `for j in x` (local alpha-rename)
4. **False positives**: Constructs in strings/comments ignored
5. **Behavior mismatch**: Execution strategy with verification

## AST Normalization

Uses Python's `ast` module via Pyodide:
- Slice canonicalization: `0` lower → `None`, `1` step → `None`
- Local alpha-rename: Function params, loop vars, comprehension vars → `_v0`, `_v1`
- Docstring stripping (optional)

## Usage

Exercises can specify:
- `gradingStrategy`: `exact` | `token` | `ast` | `execution`
- `verificationScript`: Python assertion code

Default strategies:
- fill-in → exact
- predict → execution (fallback: exact)
- write → exact
