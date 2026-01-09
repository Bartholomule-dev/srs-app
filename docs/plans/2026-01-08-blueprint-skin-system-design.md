# Blueprint + Skin System Design

> Domain-themed learning paths that add narrative structure without breaking SRS atomicity

**Date:** 2026-01-08
**Status:** Draft
**Scope:** Medium feature (~3-5 days)

---

## Problem

Current SRS sessions feel like disconnected drills. Users practice `list.append()` without understanding *why* or *when* they'd use it. This creates:

- Low engagement ("just another syntax quiz")
- Poor transfer to real coding
- Repetitive feel despite 500+ exercises

## Solution

Add a **presentation layer** that wraps atomic exercises in narrative context. Three-layer architecture:

| Layer | Purpose | FSRS Impact |
|-------|---------|-------------|
| **Exercise** | Atomic skill unit | Scheduled & graded |
| **Blueprint** | Ordered sequence ("build a thing") | None - metadata only |
| **Skin** | Domain theming (vars, context) | None - presentation only |

Same exercises, different stories. User experiences variety while FSRS sees unchanged atomic cards.

---

## Architecture

### Three-Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│  SKIN (variety)                                             │
│  "Task Manager" / "Shopping Cart" / "Playlist App"          │
│  Provides: variable names, example values, context text     │
├─────────────────────────────────────────────────────────────┤
│  BLUEPRINT (structure)                                      │
│  "Build a CLI Collection App" - 8 ordered beats             │
│  Provides: exercise sequence, beat titles                   │
├─────────────────────────────────────────────────────────────┤
│  EXERCISE (truth)                                           │
│  list-create-empty, list-append-dynamic, etc.               │
│  FSRS schedules and grades these independently              │
└─────────────────────────────────────────────────────────────┘
```

### Skin + Generator Integration

Skins provide themed seed data to existing generators:

```
Exercise → Generator + Skin.vars → Themed random values → Rendered prompt
```

**Example:** `list-append-dynamic` with different skins:

| Skin | Rendered Prompt |
|------|-----------------|
| Task Manager | `tasks.append("buy groceries")` |
| Shopping Cart | `cart.append("coffee")` |
| Playlist | `playlist.append("Bohemian Rhapsody")` |

Generators fall back to defaults if no skin is active. Existing exercises work unchanged.

### Session Presentation Logic

**Skin Selection (recency-based):**

```typescript
function selectSkin(exercise: Exercise, user: User): Skin | null {
  const compatibleSkins = getSkinsForExercise(exercise.slug);
  if (compatibleSkins.length === 0) return null;

  // Avoid skins seen in last 3 sessions
  const recentSkins = user.recentSkins.slice(-3);
  const freshSkins = compatibleSkins.filter(s => !recentSkins.includes(s.id));

  const pool = freshSkins.length > 0 ? freshSkins : compatibleSkins;
  return pickRandom(pool);
}
```

**Blueprint Grouping:**

When multiple exercises from the same blueprint are due:
1. Group them together in the session
2. Present in beat order (1 → 2 → 3)
3. Apply the same skin to all exercises in the group

**User Experience:**

```
┌─────────────────────────────────────┐
│ ✅ Task Manager · Beat 3 of 8       │
│ "Prevent duplicate tasks"           │
│─────────────────────────────────────│
│ Check if "buy groceries" is in tasks│
└─────────────────────────────────────┘
```

---

## Data Model

### File Structure

```
srs-app/
├── exercises/python/        # Existing - unchanged
│
└── paths/python/            # NEW
    ├── blueprints/
    │   └── collection-cli-app.yaml
    └── skins/
        ├── task-manager.yaml
        ├── shopping-cart.yaml
        ├── playlist-app.yaml
        ├── recipe-book.yaml
        └── game-inventory.yaml
```

### Blueprint Schema

```yaml
# paths/python/blueprints/collection-cli-app.yaml

id: collection-cli-app
title: "Build a CLI Collection App"
description: "Learn to store, display, and persist data"
difficulty: beginner
concepts: [collections, loops, modules-files]

beats:
  - beat: 1
    exercise: list-create-empty
    title: "Create storage"
  - beat: 2
    exercise: list-append-dynamic
    title: "Add entries"
  - beat: 3
    exercise: list-in-check
    title: "Prevent duplicates"
  - beat: 4
    exercise: dict-create-values
    title: "Store richer data"
  - beat: 5
    exercise: for-loop-list
    title: "Display items"
  - beat: 6
    exercise: enumerate-basic
    title: "Number items"
  - beat: 7
    exercise: list-comp-filter
    title: "Filter results"
  - beat: 8
    exercise: context-intro
    title: "Save to file"
```

### Skin Schema

```yaml
# paths/python/skins/task-manager.yaml

id: task-manager
title: "Task Manager"
icon: "✅"
blueprints: [collection-cli-app]

vars:
  list_name: tasks
  item_singular: task
  item_plural: tasks
  item_examples:
    - "buy groceries"
    - "call mom"
    - "email boss"
    - "finish report"
    - "schedule meeting"
  record_keys: ["title", "done", "priority"]

contexts:
  list-create-empty: "Every task manager needs somewhere to store tasks."
  list-append-dynamic: "Add a new task the user typed in."
  list-in-check: "Check if a task already exists before adding it."
  dict-create-values: "Tasks need more than just a name - add status too."
  for-loop-list: "Display all tasks so the user can see what's pending."
  enumerate-basic: "Number the tasks so users can reference them."
  context-intro: "Save tasks to a file so they persist between sessions."
```

### TypeScript Types

```typescript
interface Blueprint {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  beats: Beat[];
}

interface Beat {
  beat: number;
  exercise: string;  // exercise slug
  title: string;
}

interface Skin {
  id: string;
  title: string;
  icon: string;
  blueprints: string[];
  vars: Record<string, string | string[]>;
  contexts: Record<string, string>;
}

interface PathIndex {
  exerciseToBlueprints: Map<string, BlueprintRef[]>;
  blueprints: Map<string, Blueprint>;
  skins: Map<string, Skin>;
  exerciseToSkins: Map<string, string[]>;
}
```

### Database Change

```sql
ALTER TABLE profiles ADD COLUMN recent_skins text[] DEFAULT '{}';
```

---

## Implementation Components

| Component | Type | Description |
|-----------|------|-------------|
| `paths/` directory | New | YAML files for blueprints and skins |
| `lib/paths/types.ts` | New | TypeScript types |
| `lib/paths/loader.ts` | New | Parse YAML, build indexes |
| `lib/paths/selector.ts` | New | Skin selection with recency |
| `lib/generators/render.ts` | Modify | Accept optional skin context |
| `useConceptSession.ts` | Modify | Group blueprint exercises, apply skins |
| `ExerciseCard.tsx` | Modify | Show beat header |
| DB migration | New | Add `recent_skins` column |

### Key Code Changes

**Generator render pipeline:**
```typescript
// Before
function renderExercise(exercise: Exercise, seed: number): RenderedExercise

// After
function renderExercise(exercise: Exercise, seed: number, skin?: Skin): RenderedExercise
```

**Session hook - after fetching due exercises:**
```typescript
const skinnedCards = applyBlueprintGrouping(dueExercises, user);
// Returns: { exercise, skin, beat?, blueprintTitle? }[]
```

**Exercise card - conditional header:**
```tsx
{card.beat && (
  <div className="beat-header">
    {card.skin.icon} {card.blueprintTitle} · Beat {card.beat} of {card.totalBeats}
  </div>
)}
```

---

## MVP Scope

### Included

- 1 Blueprint: `collection-cli-app` (8 beats)
- 5 Skins: task-manager, shopping-cart, playlist-app, recipe-book, game-inventory
- Path loader with index generation
- Skin selector with recency logic
- Generator integration (pass skin vars)
- Session grouping for blueprint exercises
- UI header showing beat context
- DB column for recent_skins

### Not Included (Future)

- User skin preferences/favorites
- Multiple blueprints
- Explicit path enrollment
- Path progress tracking
- Dynamic blueprint assembly
- Skin-specific prompt overrides (using vars only)

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skin selection | Implicit (automatic) | Simpler UX, no enrollment flow |
| Blueprint size | Mini (5-8 exercises) | Focused narratives, easier to author |
| Generator integration | Skins seed generators | Preserves randomness + adds theming |
| State tracking | Recency only | Minimal DB changes, no progress tracking |
| Compatibility | Skin ↔ Blueprint | Explicit mapping in skin YAML |

---

## Success Criteria

1. Sessions feel more intentional ("I'm building something")
2. Same exercises feel fresh through skin rotation
3. FSRS scheduling unchanged (verified by tests)
4. No performance regression in session load
5. Skin rotation prevents repetition (verify with logs)

---

## Open Questions

1. Should we allow skin-specific prompt overrides beyond variable substitution?
2. How to handle exercises that don't fit any blueprint? (Current: show as "Quick Drill")
3. Should beat context be shown during review of old cards?

---

## References

- Debate: Story Mode vs Atomic Cards (2026-01-08)
- ChatGPT Blueprint + Skin proposal
- Existing generator system: `src/lib/generators/`
