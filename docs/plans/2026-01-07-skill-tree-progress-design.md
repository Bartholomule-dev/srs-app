# Skill Tree Progress Visualization

## Overview

A visual skill tree on the dashboard showing all 54 subconcepts as connected nodes, organized by their 10 parent concepts. Users see their progress through the curriculum as nodes transition from locked → available → in-progress → mastered.

**Primary goals:**
1. **Discovery** - Show users what content exists and what they can learn
2. **Progress motivation** - Provide a sense of accomplishment and completion

## Visual Design

### Layout

Horizontal skill tree flowing left-to-right with ~7 tiers based on the curriculum DAG:

```
Tier 1    Tier 2              Tier 3        Tier 4                Tier 5          Tier 6              Tier 7
─────────────────────────────────────────────────────────────────────────────────────────────────────────────
[Found.] → [Strings]        → [Collections] → [Control-Flow]    → [Comprehen.] → [Error-Handling] → [Modules-Files]
         → [Nums-Bools]                     → [Functions]                       → [OOP]
```

Within each concept cluster, subconcepts are arranged vertically with internal dependency lines (e.g., `variables` → `operators` → `expressions` within Foundations).

### Container

- Full-width section on dashboard, below stats grid
- ~300-400px tall
- Horizontally scrollable with scroll indicators
- Dark background (`var(--bg-surface-1)`) with backdrop blur
- Rounded corners matching existing card aesthetic

### Node Design

- **Size:** 48px diameter circles
- **Concept labels:** Above each cluster, Space Grotesk font
- **Subconcept names:** Shown on hover via tooltip
- **Progress badge:** Small "4/6" indicator on each concept cluster

### Dependency Lines

- Thin curved bezier paths connecting prerequisite nodes
- Dimmed for locked paths, amber for unlocked
- SVG overlay with `pointer-events: none`

## Node States

Four visual states based on FSRS mastery:

| State | Condition | Visual |
|-------|-----------|--------|
| **Locked** | Prerequisites not mastered | Gray, 30% opacity, muted border |
| **Available** | Prerequisites met, no attempts | Amber outline, transparent fill |
| **In Progress** | Has attempts, stability < 7 days | Amber 50% fill, progress ring |
| **Mastered** | Stability ≥ 7 days | Solid amber fill, subtle glow |

### Mastery Threshold

- **Threshold:** FSRS stability ≥ 7 days
- This means the algorithm predicts retention for at least one week
- Displayed on hover: "Mastered - next review in X days"

### State Computation

```typescript
function getSubconceptState(
  slug: string,
  progress: Map<string, SubconceptProgress>,
  curriculum: Curriculum
): SubconceptState {
  const prereqs = curriculum.subconcepts[slug].prereqs;

  // Check if all prerequisites are mastered
  const prereqsMastered = prereqs.every(p => {
    const pProgress = progress.get(p);
    return pProgress && pProgress.stability >= 7;
  });

  if (!prereqsMastered) return 'locked';

  const myProgress = progress.get(slug);
  if (!myProgress) return 'available';
  if (myProgress.stability >= 7) return 'mastered';
  return 'in-progress';
}
```

## Interactions

### Hover Behavior

**On subconcept node:**
- Tooltip with subconcept name and state details
- Node scales to 1.1x with smooth transition
- Connected dependency lines highlight

**Tooltip content by state:**
- Locked: "Requires: [prereq names]"
- Available: "Ready to learn"
- In Progress: "Stability: X days (7 days to master)"
- Mastered: "Next review in X days"

**On concept cluster:**
- Shows concept description
- Progress summary: "4 of 6 subconcepts mastered"

### Click Behavior

None for v1 (discovery/motivation focus). Future: link to filtered practice.

### Accessibility

- Tab through nodes in logical order
- Focus ring visible on keyboard navigation
- Tooltip info available on focus

### Mobile

- Tap shows tooltip (tap elsewhere to dismiss)
- Horizontal scroll with momentum
- Touch-friendly 48px tap targets

## Data Architecture

### Data Sources

1. **Curriculum graph** - `src/lib/curriculum/python.json` (static)
2. **User progress** - `subconcept_progress` table (Supabase)

### New Hook: `useSkillTree()`

```typescript
interface UseSkillTreeResult {
  concepts: Concept[];
  subconcepts: Record<string, Subconcept>;
  progress: Map<string, SubconceptProgress>;
  getState: (slug: string) => SubconceptState;
  loading: boolean;
  error: Error | null;
}

function useSkillTree(): UseSkillTreeResult {
  // 1. Load curriculum (static import)
  // 2. Fetch all subconcept_progress for user
  // 3. Compute states for each subconcept
  // 4. Return combined data
}
```

### Query

```sql
SELECT * FROM subconcept_progress WHERE user_id = $1
```

Single query returning max 54 rows. State computation is O(n) client-side.

## Component Structure

```
src/components/skill-tree/
├── SkillTree.tsx           // Main component, hook integration
├── ConceptCluster.tsx      // Concept grouping with label + badge
├── SubconceptNode.tsx      // Individual node with state styling
├── DependencyLines.tsx     // SVG line rendering
├── SkillTreeTooltip.tsx    // Hover tooltip component
└── types.ts                // Shared types
```

### Component Hierarchy

```tsx
<SkillTree>
  <SkillTreeContainer>        {/* Scroll container, background */}
    <DependencyLines />       {/* SVG overlay for all lines */}
    {concepts.map(concept => (
      <ConceptCluster>
        <ClusterLabel />      {/* "Foundations" */}
        <ClusterProgress />   {/* "4/6" badge */}
        {concept.subconcepts.map(sub => (
          <SubconceptNode />
        ))}
      </ConceptCluster>
    ))}
  </SkillTreeContainer>
</SkillTree>
```

### Rendering Approach

- **CSS Grid** for concept cluster positioning (7 columns, 2 rows)
- **Flexbox** within clusters for subconcept arrangement
- **SVG overlay** for dependency lines (absolute positioned)
- **Framer Motion** for animations
- **useLayoutEffect** to measure node positions for line drawing

## Styling

### Colors (CSS Variables)

| State | Border | Fill | Additional |
|-------|--------|------|------------|
| Locked | `var(--text-tertiary)` | transparent | 30% opacity |
| Available | `var(--accent-primary)` | transparent | - |
| In Progress | `var(--accent-primary)` | 50% opacity | progress ring |
| Mastered | `var(--accent-primary)` | solid | glow shadow |

### Node CSS

```css
.subconcept-node {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid;
  transition: all 0.2s ease;
}

.subconcept-node--mastered {
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
}
```

### Typography

- Concept labels: `font-display` (Space Grotesk), `text-sm`, `font-semibold`
- Tooltips: `font-body` (DM Sans), `text-xs`

### Animations (Framer Motion)

- **Load:** Staggered fade-in, nodes appear left-to-right
- **Hover:** Scale 1.1x with glow pulse
- **Lines:** Path draw-in animation on initial load

## Dashboard Integration

Add below the existing stats grid:

```tsx
// src/app/dashboard/page.tsx

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: 0.25 }}
>
  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
    Your Learning Path
  </h2>
  <SkillTree />
</motion.div>
```

## Future Enhancements

- Click-to-practice: Filter session to specific subconcept
- Language selector: Show different skill trees per language
- Achievement badges: Special indicators for milestones
- Time-based decay visualization: Show nodes "fading" as reviews become due

## Testing Strategy

- Unit tests for state computation logic
- Component tests for node rendering in each state
- Integration test for hook data fetching
- Visual regression tests for layout consistency
