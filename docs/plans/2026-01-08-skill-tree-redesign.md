# Skill Tree Visual Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the skill tree from a horizontal scrolling layout to a premium vertical "Neural Spine" design that eliminates scrolling and elevates visual polish.

**Architecture:** Replace the tier-based horizontal flex layout with a vertical timeline structure. Concepts become sections along a central spine, with subconcept nodes arranged in a 2-3 column grid within each section. Node styling upgraded with glass-morphism, gradient fills for mastered state, and animated dependency lines.

**Tech Stack:** React, Tailwind CSS 4, Framer Motion, CSS clip-path for hexagons

---

## Current State Analysis

**Files to modify:**
- `src/components/skill-tree/SkillTree.tsx` - Main container layout
- `src/components/skill-tree/SubconceptNode.tsx` - Node visual styling
- `src/components/skill-tree/DependencyLines.tsx` - Line rendering for vertical flow
- `src/components/skill-tree/ConceptCluster.tsx` - Cluster layout (unused, may remove)
- `tests/unit/components/skill-tree/SkillTree.test.tsx` - Update tests for new layout

**Current Layout:**
```
[Tier 1] → [Tier 2]      → [Tier 3]    → [Tier 4]     → ... (horizontal scroll)
Found.     Strings         Collections   Control-Flow
           Nums-Bools                    Functions
```

**New Layout:**
```
               ┌─────────────────────────────────────┐
               │       YOUR LEARNING PATH            │
               └─────────────────────────────────────┘
                            │
          ┌────────────────[●]────────────────┐
          │           Foundations (4/4)        │
          │    ⬡ ⬡ ⬡ ⬡  (nodes in grid)       │
          └────────────────────────────────────┘
                            │
    ┌─────────────[●]───────┴───────[●]─────────────┐
    │       Strings (2/5)           Nums (3/6)       │
    │   ⬡ ⬡ ⬡ ⬡ ⬡               ⬡ ⬡ ⬡ ⬡ ⬡ ⬡        │
    └────────────────────────────────────────────────┘
                            │
                           ...
```

---

## Task 1: Update Container Layout to Vertical

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx:156-210`
- Test: `tests/unit/components/skill-tree/SkillTree.test.tsx`

**Step 1: Read and understand the current layout structure**

The current structure uses `flex gap-8` for horizontal tier columns. We need to change to `flex-col gap-8` for vertical stacking, with tiers rendered as horizontal rows.

**Step 2: Update the main container classes**

Change from:
```tsx
<div className="overflow-x-auto overflow-y-hidden">
  <div className="relative min-w-max p-6">
    <div className="flex gap-8">
```

To:
```tsx
<div className="overflow-visible">
  <div className="relative p-6">
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
```

**Step 3: Update tier rendering from columns to rows**

Change from vertical columns per tier to horizontal rows:
```tsx
{Array.from(tierGroups.entries())
  .sort(([a], [b]) => a - b)
  .map(([tier, slugs]) => (
    <div key={tier} className="flex flex-wrap justify-center gap-6">
      {/* Clusters render horizontally within each tier row */}
    </div>
  ))}
```

**Step 4: Add the central spine line**

Add an absolute-positioned vertical line down the center:
```tsx
{/* Central spine - only visible on md+ screens */}
<div
  className="absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-[var(--border)] to-transparent -translate-x-1/2 hidden md:block"
  aria-hidden="true"
/>
```

**Step 5: Run tests to verify layout changes**

Run: `pnpm test tests/unit/components/skill-tree/SkillTree.test.tsx`
Expected: Some tests may fail (scrollable test) - we'll update those next.

**Step 6: Update the scrollable test**

The test checks for `overflow-x-auto` which we're removing. Update to check for vertical layout instead.

**Step 7: Commit**

```bash
git add src/components/skill-tree/SkillTree.tsx tests/unit/components/skill-tree/SkillTree.test.tsx
git commit -m "$(cat <<'EOF'
refactor(skill-tree): convert to vertical layout

Replace horizontal scrolling tier columns with vertical stacking.
Tiers now render as horizontal rows within a vertical flow.
Add central spine line for visual continuity.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Upgrade Node Styling with Glass-morphism

**Files:**
- Modify: `src/components/skill-tree/SubconceptNode.tsx:15-20, 66-83`

**Step 1: Update stateStyles with premium styling**

Replace the current basic styling:
```tsx
const stateStyles: Record<SubconceptState, string> = {
  locked: 'opacity-30 border-[var(--text-tertiary)] bg-transparent cursor-not-allowed',
  available: 'border-[var(--accent-primary)] bg-transparent hover:scale-110',
  'in-progress': 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/50 hover:scale-110',
  mastered: 'border-[var(--accent-primary)] bg-[var(--accent-primary)] shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-110',
};
```

With premium glass-morphism styling:
```tsx
const stateStyles: Record<SubconceptState, string> = {
  locked:
    'opacity-40 border-[var(--text-tertiary)]/30 bg-[var(--bg-surface-2)]/30 cursor-not-allowed grayscale',
  available:
    'border-[var(--accent-primary)]/60 bg-[var(--bg-surface-1)]/50 backdrop-blur-sm ' +
    'shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] ' +
    'hover:border-[var(--accent-primary)]',
  'in-progress':
    'border-[var(--accent-primary)] bg-gradient-to-br from-[var(--accent-primary)]/30 to-[var(--accent-secondary)]/20 ' +
    'backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  mastered:
    'border-transparent bg-gradient-to-br from-amber-400 to-orange-500 ' +
    'shadow-[0_0_25px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]',
};
```

**Step 2: Add subtle pulse animation for available nodes**

Add to globals.css or use Tailwind's animate-pulse with custom duration. Better to use Framer Motion inline:

Update the motion.button to include a subtle glow animation for available state:
```tsx
<motion.button
  ref={nodeRef}
  className={cn(
    'w-12 h-12 rounded-full border-2 transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface-1)]',
    stateStyles[node.state],
    className
  )}
  animate={node.state === 'available' ? {
    boxShadow: [
      '0 0 15px rgba(245,158,11,0.15)',
      '0 0 20px rgba(245,158,11,0.3)',
      '0 0 15px rgba(245,158,11,0.15)',
    ],
  } : undefined}
  transition={node.state === 'available' ? {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  } : undefined}
  // ... rest of props
```

**Step 3: Run visual test in dev server**

Run: `pnpm dev`
Navigate to dashboard and verify node styling looks premium.

**Step 4: Commit**

```bash
git add src/components/skill-tree/SubconceptNode.tsx
git commit -m "$(cat <<'EOF'
style(skill-tree): upgrade nodes with glass-morphism

- Locked: muted grayscale with reduced opacity
- Available: glass effect with pulsing glow animation
- In-progress: gradient fill with backdrop blur
- Mastered: solid gradient with inner highlight and outer glow

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Update Cluster Layout for Horizontal Subconcept Grid

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx:220-250` (ClusterWithNodeRefs)

**Step 1: Change subconcept layout from vertical to grid**

Replace the vertical flex layout:
```tsx
<div className="flex flex-col gap-2">
  {cluster.subconcepts.map((subconcept) => (
```

With a responsive grid:
```tsx
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 justify-items-center">
  {cluster.subconcepts.map((subconcept) => (
```

**Step 2: Update cluster container styling**

Make clusters feel like cards:
```tsx
<div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface-1)]/30 border border-[var(--border)]/50 backdrop-blur-sm">
```

**Step 3: Verify cluster rendering**

Run: `pnpm dev`
Check that subconcepts now arrange horizontally in a grid within each concept.

**Step 4: Commit**

```bash
git add src/components/skill-tree/SkillTree.tsx
git commit -m "$(cat <<'EOF'
style(skill-tree): arrange subconcepts in horizontal grid

Subconcept nodes now display in a responsive grid (3-5 columns)
within each concept cluster card. Reduces vertical space usage.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update Dependency Lines for Vertical Flow

**Files:**
- Modify: `src/components/skill-tree/DependencyLines.tsx:26-29`

**Step 1: Update bezier path calculation for vertical flow**

The current bezier uses vertical midpoint which already works reasonably. However, for the new layout we need to handle lines that may flow more horizontally within tiers.

Update the bezierPath function:
```tsx
function bezierPath(from: Position, to: Position): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // For vertical flow (lines going down), use vertical control points
  // For horizontal flow (lines within a tier), use horizontal control points
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical dominant - curve with horizontal variation
    const midY = (from.y + to.y) / 2;
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
  } else {
    // Horizontal dominant - curve with vertical variation
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  }
}
```

**Step 2: Add animated gradient stroke for unlocked lines**

Update the path rendering to use gradient for mastered connections:
```tsx
{/* Add gradient definition */}
<defs>
  <linearGradient id="line-gradient-unlocked" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
    <stop offset="50%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
    <stop offset="100%" stopColor="var(--accent-secondary)" stopOpacity="0.4" />
  </linearGradient>
</defs>

<motion.path
  key={`${line.from}-${line.to}`}
  d={bezierPath(line.fromPos, line.toPos)}
  fill="none"
  stroke={line.isUnlocked ? 'url(#line-gradient-unlocked)' : 'var(--text-tertiary)'}
  strokeWidth={line.isUnlocked ? 2.5 : 1.5}
  strokeOpacity={line.isUnlocked ? 1 : 0.15}
  // ... rest
```

**Step 3: Run tests**

Run: `pnpm test tests/unit/components/skill-tree/`
Ensure no test failures.

**Step 4: Commit**

```bash
git add src/components/skill-tree/DependencyLines.tsx
git commit -m "$(cat <<'EOF'
style(skill-tree): enhance dependency lines

- Smart bezier curves adapt to line direction (vertical vs horizontal)
- Gradient stroke for unlocked connections
- Thicker, more visible lines for mastered paths

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add Hexagon Shape Option (Optional Enhancement)

**Files:**
- Modify: `src/components/skill-tree/SubconceptNode.tsx`

**Step 1: Create hexagon variant**

This is an OPTIONAL enhancement. The current circular nodes work well. If desired, add a hexagon option:

```tsx
// Add at top of file
const HEXAGON_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
const USE_HEXAGONS = false; // Feature flag - set to true to enable

// In component
<motion.button
  // ...
  style={USE_HEXAGONS ? { clipPath: HEXAGON_CLIP } : undefined}
  className={cn(
    USE_HEXAGONS ? 'w-14 h-16' : 'w-12 h-12 rounded-full',
    // ... rest
  )}
```

**Note:** I recommend keeping circles for v1. Hexagons add visual complexity that may feel out of place with the minimalist aesthetic. Circles with glass-morphism are more premium.

**Step 2: Skip or implement based on preference**

If skipping hexagons, commit the previous work and proceed to Task 6.

---

## Task 6: Add Loading Skeleton for Vertical Layout

**Files:**
- Modify: `src/components/skill-tree/SkillTree.tsx:109-134`

**Step 1: Update loading skeleton to match vertical layout**

Replace horizontal skeleton with vertical:
```tsx
if (loading) {
  return (
    <div
      data-testid="skill-tree-loading"
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6',
        className
      )}
    >
      <div className="animate-pulse flex flex-col gap-8 max-w-4xl mx-auto">
        {[1, 2, 3].map((tier) => (
          <div key={tier} className="flex flex-wrap justify-center gap-6">
            {[1, 2].map((cluster) => (
              <div key={cluster} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-[var(--bg-surface-2)]/30">
                <div className="h-4 w-24 bg-[var(--bg-surface-3)] rounded" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((node) => (
                    <div
                      key={node}
                      className="w-10 h-10 rounded-full bg-[var(--bg-surface-3)]"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Run tests**

Run: `pnpm test tests/unit/components/skill-tree/SkillTree.test.tsx`

**Step 3: Commit**

```bash
git add src/components/skill-tree/SkillTree.tsx
git commit -m "$(cat <<'EOF'
style(skill-tree): update loading skeleton for vertical layout

Match skeleton structure to new vertical tier layout with
horizontal cluster rows.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update Test Assertions

**Files:**
- Modify: `tests/unit/components/skill-tree/SkillTree.test.tsx:138-155`

**Step 1: Update scrollable test**

The test currently checks for `overflow-x-auto`. Update to verify vertical layout:
```tsx
it('uses vertical layout without horizontal scroll', () => {
  vi.mocked(useSkillTree).mockReturnValue({
    data: {
      clusters: [],
      totalMastered: 0,
      totalSubconcepts: 0,
    },
    loading: false,
    error: null,
    getState: () => 'available',
    refetch: vi.fn(),
  });

  const { container } = render(<SkillTree />, { wrapper });

  // Should NOT have horizontal scroll
  const scrollContainer = container.querySelector('[data-testid="skill-tree-scroll"]');
  expect(scrollContainer).not.toHaveClass('overflow-x-auto');

  // Should have vertical flex layout
  const treeContainer = container.querySelector('[data-testid="skill-tree-container"]');
  expect(treeContainer).toBeInTheDocument();
});
```

**Step 2: Add test for vertical layout structure**

```tsx
it('renders tiers vertically with horizontal clusters', () => {
  vi.mocked(useSkillTree).mockReturnValue({
    data: {
      clusters: [
        { slug: 'foundations', name: 'Foundations', description: '', tier: 1, subconcepts: [], masteredCount: 0, totalCount: 4 },
        { slug: 'strings', name: 'Strings', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 5 },
        { slug: 'numbers', name: 'Numbers', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 6 },
      ],
      totalMastered: 0,
      totalSubconcepts: 15,
    },
    loading: false,
    error: null,
    getState: () => 'available',
    refetch: vi.fn(),
  });

  render(<SkillTree />, { wrapper });

  // All three concept names should be visible
  expect(screen.getByText('Foundations')).toBeInTheDocument();
  expect(screen.getByText('Strings')).toBeInTheDocument();
  expect(screen.getByText('Numbers')).toBeInTheDocument();
});
```

**Step 3: Run all tests**

Run: `pnpm test tests/unit/components/skill-tree/`

**Step 4: Commit**

```bash
git add tests/unit/components/skill-tree/SkillTree.test.tsx
git commit -m "$(cat <<'EOF'
test(skill-tree): update tests for vertical layout

- Remove horizontal scroll assertion
- Add vertical layout structure test
- Verify tier grouping renders correctly

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Final Visual Polish and QA

**Files:**
- Potentially modify any of the above based on visual QA

**Step 1: Run dev server and QA**

Run: `pnpm dev`
Navigate to `/dashboard`

**Visual Checklist:**
- [ ] No horizontal scrollbar
- [ ] Tiers stack vertically
- [ ] Concepts within same tier are side-by-side
- [ ] Subconcept nodes are in a grid within clusters
- [ ] Central spine visible on desktop
- [ ] Locked nodes are muted/grayscale
- [ ] Available nodes have subtle pulse
- [ ] Mastered nodes have gradient fill and glow
- [ ] Dependency lines render correctly
- [ ] Hover tooltips work
- [ ] Mobile responsive (stacks well on small screens)

**Step 2: Fix any visual issues**

Address any issues found during QA.

**Step 3: Run full test suite**

Run: `pnpm test && pnpm typecheck && pnpm lint`

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
style(skill-tree): final polish for Neural Spine design

Complete skill tree visual redesign:
- Vertical timeline layout (no horizontal scroll)
- Glass-morphism node styling
- Gradient-filled mastered nodes
- Animated pulse for available nodes
- Enhanced dependency line gradients
- Responsive grid for subconcepts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

This plan transforms the skill tree from a horizontal scrolling layout to a vertical "Neural Spine" design. Key improvements:

1. **No horizontal scroll** - Fits naturally in dashboard column
2. **Better space usage** - Tiers stack vertically, nodes spread horizontally
3. **Premium visual polish** - Glass-morphism, gradients, animated glows
4. **Responsive design** - Works on mobile and desktop

The plan prioritizes cohesion with the existing "IDE-Inspired Premium" aesthetic using the project's CSS variables rather than introducing new design paradigms that might feel out of place.

**Files Changed:**
- `src/components/skill-tree/SkillTree.tsx` - Layout restructure
- `src/components/skill-tree/SubconceptNode.tsx` - Premium node styling
- `src/components/skill-tree/DependencyLines.tsx` - Smart bezier + gradients
- `tests/unit/components/skill-tree/SkillTree.test.tsx` - Updated assertions
