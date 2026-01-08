# Exercise Backlog

> Ideas for future exercises and notes on content gaps

## Background

On 2026-01-07, an audit revealed discrepancies between the Exercise-List.md documentation and actual YAML source files:

| Source | Count |
|--------|-------|
| Old Obsidian doc | 383 |
| Obsidian math (sum of sections) | 386 |
| **Actual YAML files** | **352** |

The ~30 "ghost" exercises existed only in documentation, not in code. The Exercise-List.md is now auto-generated from YAML to prevent future drift.

## Resolution

The generation script (`scripts/generate-exercise-list.ts`) now produces Exercise-List.md from YAML source of truth:
- `pnpm generate:exercise-list` - outputs to `docs/EXERCISES.md`
- `pnpm generate:exercise-list:obsidian` - also outputs to Obsidian vault

## Exercise Ideas (Backlog)

These are potential exercises identified during the audit that may be valuable to add:

### Control Flow
- [ ] Match statement with multiple patterns
- [ ] Walrus operator (`:=`) in while loops
- [ ] Loop-else patterns

### Collections
- [ ] ChainMap usage
- [ ] Counter from collections
- [ ] defaultdict patterns
- [ ] Named tuples

### Functions
- [ ] Positional-only parameters (`/`)
- [ ] Keyword-only parameters (`*`)
- [ ] Closure examples
- [ ] Decorator with arguments

### OOP
- [ ] Abstract base classes
- [ ] Multiple inheritance / MRO
- [ ] Dataclasses
- [ ] __slots__

### Modules
- [ ] Package __init__.py
- [ ] Relative imports
- [ ] __all__ exports

### Error Handling
- [ ] Exception groups (Python 3.11+)
- [ ] Context managers with exceptions

## Dynamic Exercise Opportunities

Converting existing predict exercises to dynamic improves retention and prevents rote memorization.

### Comprehensions (4 predict exercises)

| Exercise | Generator | Status |
|----------|-----------|--------|
| `list-comp-predict` | `comp-mapping` | ✅ **Implemented** |
| `list-comp-filter-predict` | `comp-filter` | ✅ **Implemented** |
| `dict-comp-predict` | `list-values` | Pending |
| `nested-comp-predict` | `list-values` | Pending |

### Error Handling (5 predict exercises)

| Exercise | Generator | Status |
|----------|-----------|--------|
| `try-except-predict` | `try-except-flow` | ✅ **Implemented** |
| `except-type-predict` | `variable-names` | Pending |
| `exception-as-predict` | `variable-names` | Pending |

### OOP (3 predict exercises)

| Exercise | Generator | Status |
|----------|-----------|--------|
| `instance-attribute-predict` | `oop-instance` | ✅ **Implemented** |
| `method-call-predict` | `arithmetic-values` | Pending |
| `inheritance-predict` | `variable-names` | Pending |

### Modules/Files (3 predict exercises)

| Exercise | Generator | Status |
|----------|-----------|--------|
| `path-join-predict` | `string-ops` | Pending |

**Progress:** 4/15 exercises implemented (27%)

**Remaining priority:**
1. `dict-comp-predict` - Dict comprehension coverage
2. `method-call-predict` - OOP methods
3. `except-type-predict` - Exception variety

## Contributing

To add new exercises:
1. Add to appropriate `exercises/python/*.yaml` file
2. Run `pnpm validate:exercises` to check schema
3. Run `pnpm generate:exercise-list:obsidian` to update docs
4. Commit both YAML and generated docs
