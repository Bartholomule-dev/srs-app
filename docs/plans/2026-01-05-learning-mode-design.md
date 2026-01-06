# Learning Mode Design

> Teaching cards that introduce concepts before practice

**Status:** Approved
**Created:** 2026-01-05

---

## Overview

Learning Mode introduces **teaching cards** that appear once per subconcept, the first time a user encounters it. The teaching card shows a brief explanation + example code, then is immediately followed by a practice card testing that subconcept (with a different example).

### Goals

- Provide scaffolding for learners encountering new concepts
- Maintain fast, friction-free experience for experienced users
- Integrate seamlessly with existing SRS-based practice flow

### Non-Goals

- Comprehensive tutorials or courses
- Video/interactive content
- Replacing the hint system

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| When to show | Per-subconcept unlock (first encounter) | Teaching matters most at first exposure; experienced devs only see it once |
| Skip mechanism | "Got it" button + Enter key | <1 second to skip for those who don't need it |
| Teaching example | Different from practice | Tests understanding, not copy-paste memory |
| Content source | Hybrid: short explanation + auto-select intro exercise | Reuses existing content; 40 short explanations is manageable |
| UI format | Full card replacement with blue styling | Clear mental model; works on mobile; distinct from practice |
| On failure | One and done (teaching shows once ever) | Respects users; hints handle struggles; SRS shortens intervals |
| Progress bar | Teaching cards count as segments (blue color) | Honest representation; visual distinction reinforces the model |
| Existing users | Grandfathered in | Respects existing progress; no jarring "back to tutorial" moments |
| Data location | `python.json` curriculum file | Single source of truth; type-safe; easy to extend |

---

## Data Model

### Extend `python.json` Curriculum

```json
{
  "concepts": [...],
  "subconcepts": {
    "for": {
      "name": "For Loops",
      "concept": "control-flow",
      "prereqs": ["foundations"],
      "teaching": {
        "explanation": "For loops iterate over sequences. Use `for item in sequence:` to process each element.",
        "exampleSlug": "for-loop-range-intro"
      }
    },
    "enumerate": {
      "name": "Enumerate",
      "concept": "control-flow",
      "prereqs": ["for"],
      "teaching": {
        "explanation": "enumerate() gives you both index and value when looping. Use `for i, item in enumerate(seq):` to track position.",
        "exampleSlug": "enumerate-intro"
      }
    }
  }
}
```

### TypeScript Types

```typescript
// src/lib/curriculum/types.ts

interface SubconceptTeaching {
  explanation: string;      // 2-3 sentences, max 200 chars
  exampleSlug: string;      // References existing intro-level exercise
}

interface SubconceptDefinition {
  name: string;
  concept: string;
  prereqs: string[];
  teaching: SubconceptTeaching;
}
```

### Tracking "Has Seen Teaching"

No new database column needed:
- If `subconcept_progress` row exists for user+subconcept → already learned
- No row for subconcept → show teaching first

---

## Session Flow

### Session Building Changes

In `useConceptSession`, when building session cards:

```typescript
// Current flow:
// 1. Get due subconcepts → select exercises → build cards

// New flow:
// 1. Get due subconcepts (have progress rows)
// 2. Get NEW subconcepts (no progress row, prereqs satisfied)
// 3. For each NEW subconcept:
//    a. Create TeachingCard (from curriculum teaching data)
//    b. Create PracticeCard (select non-example exercise)
//    c. Insert as consecutive pair
// 4. Interleave with due review cards (existing logic)
```

### Card Types

```typescript
type SessionCard =
  | { type: 'teaching'; subconcept: string; teaching: SubconceptTeaching; exampleExercise: Exercise }
  | { type: 'practice'; exercise: Exercise; isNew: boolean }
  | { type: 'review'; exercise: Exercise };
```

### Ordering Strategy

Teaching+practice pairs are inserted using existing interleave logic:
- Every 3 review cards → 1 teaching+practice pair (if available)
- Teaching card always immediately precedes its practice card
- Never split the pair across session boundaries

### Example Session

```
[Review]  enumerate basics      ← due card
[Review]  list slicing          ← due card
[Review]  string formatting     ← due card
[TEACH]   zip() explanation     ← new subconcept intro (blue)
[Practice] zip() exercise       ← practice (different example)
[Review]  dict comprehension    ← due card
```

---

## UI Components

### TeachingCard Component

New component at `src/components/exercise/TeachingCard.tsx`:

```
┌─────────────────────────────────────────┐
│  📘  LEARN: For Loops                   │  ← Blue header, distinct from practice
├─────────────────────────────────────────┤
│                                         │
│  For loops iterate over sequences.      │  ← Explanation text (2-3 sentences)
│  Use `for item in sequence:` to         │
│  process each element.                  │
│                                         │
├─────────────────────────────────────────┤
│  Example:                               │
│  ┌─────────────────────────────────┐    │
│  │ for i in range(5):              │    │  ← Code block (read-only)
│  │     print(i)                    │    │     Uses existing CodeEditor styling
│  └─────────────────────────────────┘    │
│                                         │
│           [ Got it → ]                  │  ← Primary button, Enter key works
│                                         │
└─────────────────────────────────────────┘
```

### Visual Distinction

- **Background:** Subtle blue tint (`bg-blue-950/30`) vs normal card
- **Header icon:** 📘 or book icon (not the practice pencil)
- **Border:** Blue accent (`border-blue-500/20`)
- **No input fields** - purely informational

### Progress Bar Update

`SessionProgress.tsx` changes:
- Teaching segments: Blue fill (`bg-blue-500`)
- Practice/review segments: Green fill (existing)
- Current segment still gets glow effect

---

## Implementation Tasks

### Phase 1: Data & Types
1. Extend `src/lib/curriculum/types.ts` with `SubconceptTeaching` interface
2. Update `python.json` schema to include `teaching` object per subconcept
3. Write teaching content for all ~42 subconcepts (explanation + exampleSlug)

### Phase 2: Session Logic
4. Update `useConceptSRS` to identify "new" subconcepts (no progress row)
5. Create `buildTeachingCard()` helper that fetches teaching data + example exercise
6. Update `useConceptSession` to insert teaching+practice pairs
7. Ensure pairs stay together during interleaving

### Phase 3: UI Components
8. Create `TeachingCard.tsx` component
9. Update `ExerciseCard.tsx` to handle card type routing
10. Update `SessionProgress.tsx` for blue teaching segments

### Phase 4: Integration
11. Wire up Enter key / button to advance from teaching card
12. Ensure teaching card completion advances `currentIndex` (no SRS update needed)
13. Practice card after teaching follows normal SRS flow

### Out of Scope (Future)
- "Review basics" dashboard button
- Re-show teaching on repeated failures
- Teaching card analytics/tracking

---

## Success Criteria

- [ ] New users see teaching card before first practice of each subconcept
- [ ] Teaching cards are skippable in <1 second
- [ ] Example in teaching differs from practice exercise
- [ ] Progress bar visually distinguishes learn vs practice
- [ ] Existing users don't see teaching for already-practiced subconcepts
- [ ] Session pairs never split (teaching always precedes its practice)

---

## Content Requirements

Each subconcept needs:

| Field | Requirements |
|-------|--------------|
| `explanation` | 2-3 sentences, max 200 chars, explains the "what" and "when to use" |
| `exampleSlug` | Must reference an existing `intro` level exercise for that subconcept |

### Example Teaching Content

```yaml
for:
  explanation: "For loops iterate over sequences. Use `for item in sequence:` to process each element one at a time."
  exampleSlug: "for-loop-range-intro"

enumerate:
  explanation: "enumerate() gives you both index and value when looping. Use `for i, item in enumerate(seq):` to track position."
  exampleSlug: "enumerate-intro"

zip:
  explanation: "zip() pairs elements from multiple sequences together. Use `for a, b in zip(seq1, seq2):` to iterate in parallel."
  exampleSlug: "zip-intro"

list-comprehension:
  explanation: "List comprehensions create lists in one line. Use `[expr for item in seq]` instead of a for loop with append."
  exampleSlug: "list-comprehension-intro"
```
