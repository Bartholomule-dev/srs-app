# Phase 2.7: Exercise Variety & Experience Levels

> Design Document - 2026-01-06

---

## Summary

Add exercise type variety (fill-in, predict-output) with user-selectable experience levels that control the mix of exercise types. This enables the app to serve both "Rusty Seniors" (experienced developers maintaining skills) and "AI-Native Juniors" (newer developers building fundamentals).

---

## Background

### Problem

The app currently has 218 exercises, all "write from scratch" type. This creates two issues:

1. **For beginners:** Write-from-scratch on day 1 is too hard - causes dropout
2. **For experienced users:** No variety in exercise format - mental execution skills not exercised

### Debate Results

Two multi-AI debates informed this design:

1. **2026-01-06 Phase 3 Readiness:** Recommended adding fill-in and predict-output
2. **2026-01-06 Exercise Type Dilution:** Clarified that:
   - Fill-in is a LEARNING tool (cued recall)
   - Predict-output is a MAINTENANCE tool (mental execution)
   - User experience level should dictate the mix
   - Core thesis (production recall) must remain central

### Key Insight

Different users need different exercise mixes. Rather than picking one audience, let users self-select their experience level.

---

## Design

### 1. Experience Levels

Users select their experience level during onboarding. This controls exercise type ratios.

| Level | Label | Target Persona | Exercise Mix |
|-------|-------|----------------|--------------|
| `refresher` | "Shaking off rust" | Rusty Senior | 80% write, 10% fill-in, 10% predict |
| `learning` | "Building skills" | Intermediate | 50% write, 25% fill-in, 25% predict |
| `beginner` | "New to Python" | AI-Native Junior | 30% write, 35% fill-in, 35% predict |

**Default:** `refresher` (the primary target audience)

**Onboarding Question:**
> "How would you describe your Python experience?"
> - I know Python but need to shake off the rust
> - I'm still building my Python skills
> - I'm new to Python

**Changeable:** Users can adjust in Settings anytime.

---

### 2. Exercise Types

#### Write (Existing)
User writes code from scratch based on a prompt.
- **Component:** `CodeInput`
- **Answer matching:** AST normalization + alternatives

#### Fill-in (Infrastructure exists, needs content)
User fills in blanks within a code template.
- **Component:** `FillInExercise` (already built)
- **Answer matching:** Exact string match (trimmed)

**YAML Structure:**
```yaml
slug: range-fill-basic
type: fill-in
template: "for i in ___(10):"
blank_position: 0
expected_answer: "range"
accepted_solutions: ["range"]
```

#### Predict-Output (NEW)
User predicts what code will output.
- **Component:** `PredictOutputExercise` (to be built)
- **Answer matching:** Normalized string match (see below)

**YAML Structure:**
```yaml
slug: multiply-predict
type: predict
code: |
  x = 5
  y = x * 2
  print(y)
expected_answer: "10"
accepted_solutions: []
```

**UI Layout:**
```
+-----------------------------+
|  x = 5                      |
|  y = x * 2                  |  <- Read-only code block
|  print(y)                   |
+-----------------------------+
       What will print?
+-----------------------------+
|  [User types: 10]           |  <- Single-line input
+-----------------------------+
```

**UI Hint:** Display "Enter the exact console output" below input to set expectations.

---

### Answer Normalization (Predict-Output)

Predict-output uses normalized matching to reduce false negatives:

| Rule | Example |
|------|---------|
| Trim leading/trailing whitespace | `" 10 "` → `"10"` |
| Remove trailing newlines | `"10\n"` → `"10"` |
| Case-sensitive (Python is case-sensitive) | `"True"` ≠ `"true"` |
| Exact match for numbers | `"10"` ≠ `"10.0"` |

**Content Guidelines:**
- Exercises MUST have clean, deterministic outputs
- Avoid: `random`, `time`, unordered dict iteration (pre-3.7 style)
- Prefer integer outputs over floats when possible
- For multi-line output, use `\n` in expected_answer

**Fill-in Answer Matching:** Exact string match (trimmed). Appropriate because fill-in answers are typically single keywords/identifiers.

---

### Exercise Content Field Mapping

| Field | Write | Fill-in | Predict |
|-------|-------|---------|---------|
| `prompt` | Required (instructions) | Required (instructions) | Optional (defaults to "What will print?") |
| `template` | Not used | Required (code with `___`) | Not used |
| `code` | Not used | Not used | Required (read-only code) |
| `expected_answer` | Required | Required | Required |
| `blank_position` | Not used | Required | Not used |

---

### 3. Session Selection Algorithm

**Current:** Type-agnostic selection by subconcept/level.

**New:** Respects user's experience level ratios with soft enforcement.

**New Function:** `selectExerciseWithTypeBalance`

```typescript
function selectExerciseWithTypeBalance(
  exercises: Exercise[],
  experienceLevel: ExperienceLevel,
  sessionHistory: ExerciseType[],
  // ...existing params
): Exercise | null
```

**Logic:**
1. Calculate current session type distribution
2. Determine which type is underrepresented based on user's ratios
3. Filter exercises to prefer underrepresented type
4. Fall back to any available exercise if preferred type unavailable
5. Apply existing anti-repeat pattern logic

**Soft Enforcement:** Ratios are targets, not hard rules. Graceful fallback when content unavailable.

**SRS Priority:** SRS review scheduling takes precedence over experience level ratios. If a subconcept is due for review, the user reviews it regardless of whether the available exercises match their preferred type mix. Ratios apply to exercise selection *within* a subconcept, not to *which* subconcepts are shown.

---

### 4. Content Scope

**Target:** First 3 concepts (14 subconcepts)

| Concept | Subconcepts | New Fill-in | New Predict | Total New |
|---------|-------------|-------------|-------------|-----------|
| Foundations | `variables`, `operators`, `expressions`, `io` | 8 | 8 | 16 |
| Strings | `basics`, `indexing`, `slicing`, `methods`, `fstrings` | 10 | 10 | 20 |
| Numbers-Booleans | `integers`, `floats`, `booleans`, `conversion`, `truthiness`, `comparisons` | 12 | 12 | 24 |
| **TOTAL** | 14 | 30 | 30 | **60** |

**Minimum per subconcept:** 2 exercises per type (6 total)

### Quality Gates

**Fill-in exercises must:**
- Require reasoning (variable scope, operator precedence, method choice)
- NOT be trivial single-token blanks with obvious cues
- Test the core of the subconcept

**Predict-output exercises must:**
- Include misconception traps where relevant
- Have deterministic, unambiguous outputs
- Test mental execution, not just syntax knowledge

---

### 5. Database Schema Changes

**New column on `profiles`:**
```sql
ALTER TABLE profiles
ADD COLUMN experience_level TEXT
DEFAULT 'refresher'
CHECK (experience_level IN ('refresher', 'learning', 'beginner'));
```

**New column on `exercises`:**
```sql
ALTER TABLE exercises
ADD COLUMN code TEXT;  -- For predict-output exercises
```

**TypeScript Types:**
```typescript
type ExperienceLevel = 'refresher' | 'learning' | 'beginner';

interface Exercise {
  // ... existing fields
  code?: string;  // For predict-output exercises
}

interface Profile {
  // ... existing fields
  experienceLevel: ExperienceLevel;
}
```

---

## Implementation Phases

### Phase 1: Infrastructure (Code)

1.1. **Database Migration**
- Add `experience_level` column to `profiles`
- Add `code` column to `exercises`

1.2. **TypeScript Types**
- Update `Exercise` interface with `code` field
- Add `ExperienceLevel` type
- Update `Profile` interface

1.3. **PredictOutputExercise Component**
- New component `src/components/exercise/PredictOutputExercise.tsx`
- Read-only code display + answer input
- Integrate with ExerciseCard routing

1.4. **ExerciseCard Updates**
- Add routing for `type: predict` -> `PredictOutputExercise`
- Add answer checking for predict (exact match)

1.5. **YAML Validation**
- Validate predict exercises have `code` field
- Validate fill-in exercises have `template` + `blank_position`

1.6. **JSON Schema Update**
- Update `exercises/schema.json` to require `code` when `type: predict`
- Update schema to require `template` + `blank_position` when `type: fill-in`
- Make `prompt` optional for predict type (defaults in UI)

### Phase 2: Session Logic (Code)

2.1. **Experience Level Selection**
- Onboarding flow after auth (new users)
- Settings page toggle
- Hook to access `experienceLevel` from profile
- **Existing user migration:** Show experience level prompt on next login if `experience_level` is NULL or default

2.2. **Type-Balanced Selection**
- New `selectExerciseWithTypeBalance` function
- Integrate with existing session logic
- Soft enforcement with graceful fallback

### Phase 3: Content Creation

3.1. **Foundations** - 16 new exercises (8 fill-in + 8 predict)
3.2. **Strings** - 20 new exercises (10 fill-in + 10 predict)
3.3. **Numbers-Booleans** - 24 new exercises (12 fill-in + 12 predict)

**Total: 60 new exercises**

### Phase 4: Testing & Polish

- Unit tests for new selection algorithm
- E2E tests for experience level flow
- Visual polish for predict-output component
- Analytics: Track success rates per exercise type for validation

---

## Success Criteria

1. **Technical:** All exercise types render and grade correctly
2. **Functional:** Experience level selection works end-to-end
3. **Content:** 60 new exercises pass quality gates
4. **UX:** Session type mix matches user's experience level (soft target)

---

## External Review Feedback

Design reviewed by Codex (GPT-5.2) and Gemini. Key feedback addressed:

### Addressed in This Design

| Feedback | Resolution |
|----------|------------|
| Predict answer matching too brittle | Added normalization spec (trim, trailing newlines) |
| SRS vs experience ratios unclear | Added SRS Priority statement |
| Schema validation not mentioned | Added Phase 1.6 for JSON schema updates |
| Existing user migration needed | Added to Phase 2.1 |
| Field mapping unclear | Added field mapping table |
| Analytics by type needed | Added to Phase 4 |

### Deferred (Future Consideration)

| Feedback | Why Defer |
|----------|-----------|
| Adaptive ratios based on performance | Ship fixed ratios first, iterate based on data |
| Type-weighted SRS quality inference | Over-engineering for MVP |
| Placement quiz instead of self-report | Adds friction; self-report sufficient for MVP |

---

## Related Documents

- `Debate-Results/2026-01-06-Phase3-Readiness-Multi-AI-Debate.md`
- `Debate-Results/2026-01-06-Exercise-Type-Dilution-Debate.md`
- `Architecture.md` - SRS system design
- `Database-Schema.md` - Full schema reference
