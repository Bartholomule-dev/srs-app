# Dynamic Exercise System - Master Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. Start with Phase 1 and proceed sequentially.

**Goal:** Transform SRS-App from static YAML exercises to a dynamic, parameterized exercise system that prevents rote memorization while maintaining grading reliability.

**Architecture:** Template-based exercises with deterministic parameter generation, two-pass grading (correctness + construct coaching), optional Pyodide execution, and comprehensive metrics tracking.

**Design Document:** `docs/plans/2026-01-06-dynamic-exercise-system-design.md`

---

## Overview

This master plan coordinates five sequential phases:

| Phase | Name | Description | Estimated Tasks |
|-------|------|-------------|-----------------|
| 1 | Foundation | Generator infrastructure, seed utilities, render pipeline | 13 tasks |
| 2 | Grading Infrastructure | Two-pass grading, construct detection, coaching UI | 9 tasks |
| 3 | Pyodide Integration | Lazy-loaded Python execution for predict exercises | 11 tasks |
| 4 | Metrics & Logging | Audit logging, success metrics queries | 8 tasks |
| 5 | Content Migration | New generators, exercise migration, validation | 11 tasks |

**Total:** ~52 bite-sized tasks following TDD methodology

---

## Phase Documents

Each phase has its own detailed plan document with step-by-step tasks:

1. **Phase 1: Foundation** → `2026-01-07-dynamic-exercises-phase1-foundation.md`
2. **Phase 2: Grading Infrastructure** → `2026-01-07-dynamic-exercises-phase2-grading.md`
3. **Phase 3: Pyodide Integration** → `2026-01-07-dynamic-exercises-phase3-pyodide.md`
4. **Phase 4: Metrics & Logging** → `2026-01-07-dynamic-exercises-phase4-metrics.md`
5. **Phase 5: Content Migration** → `2026-01-07-dynamic-exercises-phase5-content.md`

---

## Execution Strategy

### TDD Workflow (Every Task)

1. **Write the failing test** - Define expected behavior
2. **Run test to verify it fails** - Confirm test is valid
3. **Write minimal implementation** - Just enough to pass
4. **Run test to verify it passes** - Confirm implementation
5. **Commit** - Small, atomic commits

### Parallelization Opportunities

- Phase 3 (Pyodide) can run in parallel with Phase 2 (Grading)
- Within Phase 5, generators can be developed in parallel
- Metrics queries in Phase 4 can be developed in parallel

### Critical Path

```
Phase 1.1 → Phase 1.2 → Phase 1.4 → Phase 2.1 → Phase 2.3
(DB)        (Types)     (Render)    (Grading)   (UI)
```

This critical path delivers the minimum viable dynamic exercise functionality.

---

## Dependencies

### External Packages (Phase 1)

```bash
pnpm add mustache seedrandom pyodide
pnpm add -D @types/mustache @types/seedrandom fast-check
```

### Database Migrations

- Phase 4: `20260107200000_dynamic_exercise_metrics.sql`

---

## File Summary

### New Files Created

**Phase 1:**
- `src/lib/generators/types.ts`
- `src/lib/generators/seed.ts`
- `src/lib/generators/utils.ts`
- `src/lib/generators/render.ts`
- `src/lib/generators/index.ts`
- `src/lib/generators/definitions/slice-bounds.ts`
- Tests: 5 files

**Phase 2:**
- `src/lib/exercise/grading.ts`
- `src/lib/exercise/construct-check.ts`
- `src/components/exercise/CoachingFeedback.tsx`
- Tests: 2 files

**Phase 3:**
- `src/lib/context/PyodideContext.tsx`
- `src/lib/exercise/execution.ts`
- Tests: 1 file

**Phase 4:**
- `supabase/migrations/20260107200000_dynamic_exercise_metrics.sql`
- `src/lib/exercise/log-attempt.ts`
- `src/lib/stats/dynamic-metrics.ts`
- Tests: 2 files

**Phase 5:**
- `src/lib/generators/definitions/list-values.ts`
- `src/lib/generators/definitions/variable-names.ts`
- `src/lib/generators/definitions/index-values.ts`
- `src/lib/generators/definitions/arithmetic-values.ts`
- `scripts/validate-dynamic-exercises.ts`
- Tests: 4 files

### Modified Files

- `src/lib/exercise/types.ts` (extend with GradingResult)
- `src/lib/exercise/yaml-types.ts` (add generator fields)
- `src/lib/exercise/index.ts` (export new modules)
- `src/lib/types/app.types.ts` (add generator fields to Exercise)
- `src/lib/supabase/mappers.ts` (map new fields)
- `src/lib/hooks/useConceptSession.ts` (preload Pyodide, log attempts)
- `src/components/exercise/ExerciseCard.tsx` (async grading)
- `src/components/exercise/ExerciseFeedback.tsx` (coaching)
- `src/app/layout.tsx` (PyodideProvider)
- `exercises/python/strings.yaml` (dynamic exercises)
- `exercises/python/collections.yaml` (dynamic exercises)
- `scripts/import-exercises.ts` (new fields)

---

## Key Architecture Decisions

### 1. Deterministic Seeding

```typescript
seed = sha256(userId + exerciseSlug + dateStr)
```

- Same user sees same values for same exercise on same day
- Different users see different values
- Values change on different review days

### 2. Two-Pass Grading

```
Pass 1: Is the answer correct?
  → Yes: Full credit, proceed to Pass 2
  → No: No credit, skip Pass 2

Pass 2: Did user use target construct?
  → Yes: No additional feedback
  → No: Show coaching tip (non-punitive)
```

### 3. Pyodide Strategy

- **Predict exercises:** Always use execution (with fallback)
- **Write exercises:** Opt-in via `verifyByExecution` flag
- **Lazy loading:** ~6.4MB, only when needed
- **Graceful fallback:** String matching if execution fails

### 4. Static Exercise Compatibility

- Exercises without `generator` field work exactly as before
- Migration is incremental - no big-bang changes
- Static and dynamic exercises coexist

---

## Success Metrics

After implementation, monitor:

| Metric | Measurement | Target |
|--------|-------------|--------|
| **Retention** | First vs subsequent attempt accuracy | Δ > 0 (improvement) |
| **Near Transfer** | Performance on unseen exercises | > 70% correct |
| **Completion Stability** | Session abandonment rate | < 10% |
| **Construct Adoption** | Usage of target constructs | Increasing trend |

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Generator produces invalid params | Low | Property-based tests with 1000+ seeds |
| Pyodide load fails | Medium | Graceful fallback to string matching |
| AST parsing fails | Medium | Skip construct check, still grade correctness |
| User confusion from changing values | Low | Deterministic seeding per review |
| Performance regression | Low | Lazy loading, preload during session build |

---

## Rollback Strategy

If issues arise post-deployment:

1. **Feature flag:** Can disable generator rendering to fall back to static
2. **Database safe:** All new columns are nullable, old data works
3. **Gradual rollout:** Start with few dynamic exercises, expand gradually

---

## Getting Started

### Prerequisites

1. Complete Phase 1-4 of previous curriculum work (already done)
2. Ensure all tests passing: `pnpm test`
3. Fresh branch from master

### Begin Implementation

```bash
# Create feature branch
git checkout -b feat/dynamic-exercises

# Start with Phase 1
# Open: docs/plans/2026-01-07-dynamic-exercises-phase1-foundation.md
# Follow tasks sequentially
```

### Checkpoints

After each phase, verify:
- [ ] All tests pass: `pnpm test`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`
- [ ] Manual verification in dev: `pnpm dev`

---

## Maintenance Notes

### Adding New Generators

1. Create in `src/lib/generators/definitions/`
2. Add property-based tests
3. Register in `src/lib/generators/index.ts`
4. Update YAML validation if new constraints

### Adding Dynamic Exercises

1. Choose appropriate generator
2. Add `generator` field to YAML
3. Use `{{param}}` placeholders
4. Optionally add `target_construct`
5. Run `pnpm validate-dynamic`

### Monitoring

- Check metrics dashboard (future Phase 4.5)
- Monitor Pyodide load times
- Track construct adoption trends
- Watch for grading fallback frequency

---

## References

- Design Document: `docs/plans/2026-01-06-dynamic-exercise-system-design.md`
- Multi-AI Debate: `Obsidian SRS-app/Debate-Results/2026-01-06-Dynamic-QA-Generation-Debate.md`
- FSRS Algorithm: `src/lib/srs/fsrs/`
- Pyodide Docs: https://pyodide.org/

---

*Master plan created 2026-01-07*
*Ready for execution*
