# Multi-Language Support Design

> Adding JavaScript (and future languages) to the SRS-app platform

**Date:** 2026-01-11
**Status:** Approved

---

## Overview

This design adds multi-language support to allow users to practice code syntax in multiple programming languages (starting with JavaScript alongside Python). Each language has independent progress tracking, and users can switch between languages from the dashboard.

### Core Principles

- **Language as first-class dimension:** All content organized by language
- **Separate progress:** No cross-training; each language has independent SRS state
- **Parallel structure:** Exercises, paths, curriculum, and generators follow the same directory pattern per language

---

## Key Decisions

| Decision | Choice |
|----------|--------|
| Progress tracking | Separate per language |
| Subconcept identification | Language column on `subconcept_progress` table |
| Language switcher location | DueNowBand (dashboard), display badge in Header |
| Skill tree | Tabs to view either language's progress |
| Stats | Hybrid: global streak, per-language accuracy/totals |
| Content organization | Fully separate per language |
| Curriculum files | Separate JSON per language |
| New user default | Python (easy to switch) |
| Generators | Language-specific with shared utilities |

---

## Database Schema Changes

### Table: `subconcept_progress`

```sql
-- Add language column
ALTER TABLE subconcept_progress
  ADD COLUMN language TEXT NOT NULL DEFAULT 'python';

-- Update unique constraint to include language
ALTER TABLE subconcept_progress
  DROP CONSTRAINT subconcept_progress_user_id_subconcept_slug_key,
  ADD CONSTRAINT subconcept_progress_user_language_subconcept_key
    UNIQUE(user_id, language, subconcept_slug);

-- Index for efficient language-filtered queries
CREATE INDEX idx_subconcept_progress_language
  ON subconcept_progress(user_id, language);
```

### Tables with no changes needed

- **`exercise_attempts`**: Links to exercises via slug; exercises already have language column
- **`profiles`**: Already has `preferred_language TEXT DEFAULT 'python'`
- **`exercises`**: Already has `language TEXT NOT NULL`

---

## File & Folder Structure

### Content directories

```
exercises/
├── schema.json           # Shared validation schema
├── python/               # Existing - unchanged
│   ├── foundations.yaml
│   ├── collections.yaml
│   └── ...
└── javascript/           # New
    ├── foundations.yaml
    ├── arrays-objects.yaml
    └── ...

paths/
├── python/               # Existing - unchanged
│   ├── blueprints/
│   └── skins/
└── javascript/           # New
    ├── blueprints/
    └── skins/
```

### Source code directories

```
src/lib/
├── curriculum/
│   ├── python.json       # Existing - unchanged
│   ├── javascript.json   # New
│   ├── loader.ts         # Updated - takes language param
│   ├── types.ts          # Unchanged
│   └── index.ts          # Updated exports
│
├── generators/
│   ├── shared/           # New - common utilities
│   │   └── utils.ts      # Random names, seed logic
│   ├── python/           # Move existing generators here
│   │   ├── index.ts
│   │   ├── slice-bounds.ts
│   │   └── ...
│   └── javascript/       # New
│       ├── index.ts
│       ├── array-methods.ts
│       └── ...
│
├── paths/
│   ├── loader.ts         # Updated - takes language param
│   └── ...
```

---

## UI Components

### Header (`src/components/layout/Header.tsx`)

- Add language badge/icon next to user menu
- Display only, not clickable
- Shows active language with icon

### DueNowBand (`src/components/dashboard/DueNowBand.tsx`)

- Add language selector dropdown
- When user switches: update `profiles.preferred_language`
- Due count refreshes to show selected language's count

```
┌─────────────────────────────────────────────────────┐
│  [🐍 Python ▼]     12 cards due     [Start Practice]│
└─────────────────────────────────────────────────────┘
```

### SkillTree (`src/components/skill-tree/SkillTree.tsx`)

- Add tabs above the tree: `Python (12 due)` | `JavaScript (3 due)`
- Active language tab highlighted
- Viewing other language does NOT change practice language

### StatsGrid (`src/components/dashboard/StatsGrid.tsx`)

- Streak: global (unchanged)
- Accuracy: filtered by active language
- Total exercises: per-language or combined display

### Practice page

- No switcher - language locked at session start
- Header badge visible (display only)

---

## Hooks & Data Flow

### Hooks requiring `language` parameter

| Hook | Change |
|------|--------|
| `useConceptSRS` | Filter `subconcept_progress` by language |
| `useSkillTree` | Load curriculum for specified language |
| `useDueCount` | Count due subconcepts for language |
| `useStats` | Split into global + per-language |
| `useConceptSession` | Load exercises for language |

### New hook: `useActiveLanguage`

```typescript
function useActiveLanguage() {
  const { profile } = useProfile();
  return {
    language: profile?.preferredLanguage ?? 'python',
    setLanguage: async (lang: string) => {
      await updateProfile({ preferredLanguage: lang });
    }
  };
}
```

### Data flow: Dashboard load

```
1. useActiveLanguage() → 'python'
2. useDueCount('python') → 12
3. useSkillTree('python') → Python curriculum tree
4. useGlobalStats() → { streak: 5 }
5. useLanguageStats('python') → { accuracy: 85, total: 200 }
```

### Data flow: Language switch

```
1. User selects JavaScript in DueNowBand
2. setLanguage('javascript') → updates profile
3. All hooks re-query with new language
4. UI updates: due count, skill tree, stats
```

---

## Implementation Order

### Phase 1: Foundation (Schema + Loaders)

1. Migration: Add `language` column to `subconcept_progress`
2. Update curriculum loader to accept language parameter
3. Update paths loader to accept language parameter
4. Move generators to `python/` subfolder, create shared utils

### Phase 2: Hooks & Data Layer

5. Create `useActiveLanguage` hook
6. Update `useConceptSRS` with language filter
7. Update `useDueCount` with language filter
8. Update `useSkillTree` with language parameter
9. Split stats hooks (global streak, per-language accuracy)

### Phase 3: UI Components

10. Add language badge to Header
11. Add language switcher to DueNowBand
12. Add language tabs to SkillTree
13. Update StatsGrid for hybrid stats display

### Phase 4: JavaScript Content (separate effort)

14. Create `javascript.json` curriculum
15. Create JavaScript exercises in `exercises/javascript/`
16. Create JavaScript blueprints/skins in `paths/javascript/`
17. Create JavaScript generators in `generators/javascript/`

---

## Testing Considerations

- Unit tests for hooks with language parameter
- Integration tests for language switching flow
- E2E test: switch languages, verify due counts update
- E2E test: complete exercise in each language, verify separate progress
- Validate curriculum JSON schema for new languages

---

## Future Considerations

- TypeScript as separate language vs. JavaScript superset
- Language-specific grading strategies (AST parsing differs)
- Cross-language concept mapping (for "you know this in Python" hints)
- Language unlock/paywall tiers
