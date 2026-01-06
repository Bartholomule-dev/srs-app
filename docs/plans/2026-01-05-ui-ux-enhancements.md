# UI/UX Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate the SRS-app frontend from "competent" to "unforgettable" by implementing typography refinements, spatial composition improvements, motion orchestration, enhanced backgrounds, theme consistency fixes, and header polish.

**Architecture:** This is a pure frontend enhancement affecting CSS, component styling, and animation patterns. No database or API changes required. All changes build on existing darwin-ui wrapper pattern and Tailwind CSS 4 theme system.

**Tech Stack:** React 19, Tailwind CSS 4, Framer Motion 12, @fontsource-variable fonts, darwin-ui wrappers

---

## Part A: Typography Enhancements (Priority 1)

### Task A1: Add Letter-Spacing CSS Variables

**Files:**
- Modify: `src/app/globals.css:4-50`

**Step 1: Add letter-spacing variables to theme**

Add these lines inside the `@theme inline { }` block after line 48:

```css
  /* Letter spacing */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
```

**Step 2: Verify CSS is valid**

Run: `pnpm build`
Expected: Build succeeds without CSS errors

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(typography): add letter-spacing CSS variables"
```

---

### Task A2: Apply Tighter Tracking to Display Headings

**Files:**
- Modify: `src/components/landing/Hero.tsx:59-60`
- Modify: `src/components/landing/Features.tsx:94`
- Modify: `src/components/landing/HowItWorks.tsx:91-92`
- Modify: `src/components/dashboard/Greeting.tsx:66`
- Modify: `src/components/session/SessionSummary.tsx:110`

**Step 1: Update Hero headline**

In `Hero.tsx`, change line 60 from:
```tsx
                          tracking-tight leading-[1.1]"
```
to:
```tsx
                          tracking-[-0.02em] leading-[1.1]"
```

**Step 2: Update Features headline**

In `Features.tsx`, change line 94 from:
```tsx
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why SyntaxSRS?</h2>
```
to:
```tsx
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 tracking-[-0.02em]">Why SyntaxSRS?</h2>
```

**Step 3: Update HowItWorks headline**

In `HowItWorks.tsx`, change lines 91-92 from:
```tsx
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
```
to:
```tsx
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 tracking-[-0.02em]">
```

**Step 4: Update Greeting headline**

In `Greeting.tsx`, change line 66 from:
```tsx
              className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2"
```
to:
```tsx
              className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-2 tracking-[-0.02em]"
```

**Step 5: Update SessionSummary headline**

In `SessionSummary.tsx`, change line 110 from:
```tsx
            <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">
```
to:
```tsx
            <h2 className="text-2xl font-bold font-display text-[var(--text-primary)] tracking-[-0.02em]">
```

**Step 6: Run tests**

Run: `pnpm test`
Expected: All tests pass (typography changes don't affect functionality)

**Step 7: Commit**

```bash
git add src/components/landing/Hero.tsx src/components/landing/Features.tsx src/components/landing/HowItWorks.tsx src/components/dashboard/Greeting.tsx src/components/session/SessionSummary.tsx
git commit -m "feat(typography): apply tighter letter-spacing to display headings"
```

---

### Task A3: Add Wider Tracking to Small Labels

**Files:**
- Modify: `src/components/dashboard/StatsCard.tsx:315-316`
- Modify: `src/components/session/SessionSummary.tsx:64`

**Step 1: Update StatsCard label**

In `StatsCard.tsx`, change line 315-316 from:
```tsx
            <span className="text-sm text-[var(--text-secondary)] font-medium">
              {label}
```
to:
```tsx
            <span className="text-sm text-[var(--text-secondary)] font-medium uppercase tracking-[0.05em]">
              {label}
```

**Step 2: Update SessionSummary stat labels**

In `SessionSummary.tsx`, change line 64 from:
```tsx
      <div className="text-xs opacity-80 mt-1">{label}</div>
```
to:
```tsx
      <div className="text-xs opacity-80 mt-1 uppercase tracking-[0.05em]">{label}</div>
```

**Step 3: Run tests**

Run: `pnpm test -- --grep "StatsCard\|SessionSummary"`
Expected: Tests pass

**Step 4: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx src/components/session/SessionSummary.tsx
git commit -m "feat(typography): add wider tracking to small labels"
```

---

## Part B: Theme Consistency Fixes (Priority 5)

### Task B1: Fix ExerciseFeedback Theme Variables

**Files:**
- Modify: `src/components/exercise/ExerciseFeedback.tsx:34-52`

**Step 1: Replace hard-coded neutral colors with theme variables**

Replace lines 34-52 with:
```tsx
      {/* Answer Display */}
      <div className={isCorrect ? 'space-y-2' : 'grid grid-cols-2 gap-4'}>
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Your answer:</p>
          <pre className="p-3 rounded-md bg-[var(--bg-surface-2)] font-mono text-sm overflow-x-auto text-[var(--text-primary)]">
            {userAnswer || <span className="text-[var(--text-tertiary)] italic">(empty)</span>}
          </pre>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Correct answer:</p>
            <pre className="p-3 rounded-md bg-[var(--bg-surface-2)] font-mono text-sm overflow-x-auto text-[var(--text-primary)]">
              {expectedAnswer}
            </pre>
          </div>
        )}
      </div>

      {/* Next Review Info */}
      <p className="text-sm text-[var(--text-secondary)]">
        Next review: {nextReviewDays} {dayText}
      </p>
```

**Step 2: Run ExerciseFeedback tests**

Run: `pnpm test -- tests/component/exercise/ExerciseFeedback.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseFeedback.tsx
git commit -m "fix(theme): replace hard-coded neutral colors with CSS variables in ExerciseFeedback"
```

---

### Task B2: Fix ExercisePrompt Theme Variables

**Files:**
- Modify: `src/components/exercise/ExercisePrompt.tsx:10-15`

**Step 1: Replace hard-coded colors**

Replace lines 10-15 with:
```tsx
      <header className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4" role="banner">
        <span className="font-medium text-[var(--accent-primary)]">{language}</span>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
      </header>
      <p className="text-lg text-[var(--text-primary)]">{prompt}</p>
```

**Step 2: Run ExercisePrompt tests**

Run: `pnpm test -- tests/component/exercise/ExercisePrompt.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/exercise/ExercisePrompt.tsx
git commit -m "fix(theme): replace hard-coded colors with CSS variables in ExercisePrompt"
```

---

### Task B3: Fix HintButton Theme Variables

**Files:**
- Modify: `src/components/exercise/HintButton.tsx:32`

**Step 1: Replace hard-coded color**

Change line 32 from:
```tsx
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
```
to:
```tsx
        <p className="text-xs text-[var(--text-tertiary)]">
```

**Step 2: Run HintButton tests**

Run: `pnpm test -- tests/component/exercise/HintButton.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/exercise/HintButton.tsx
git commit -m "fix(theme): replace hard-coded colors with CSS variables in HintButton"
```

---

## Part C: Spatial Composition Improvements (Priority 2)

### Task C1: Create Asymmetric Features Bento Grid

**Files:**
- Modify: `src/components/landing/Features.tsx:100-146`

**Step 1: Update the bento grid layout**

Replace the grid container (lines 100-146) with:
```tsx
        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Hero Card - Spaced Repetition (spans 4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="md:col-span-4"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <features[0].icon className="w-12 h-12 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-2xl font-semibold mb-3">{features[0].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                  {features[0].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Card (spans 2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card
              elevation={2}
              className="h-full bg-gradient-to-br from-[var(--accent-primary)]/10 to-orange-500/10"
            >
              <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
                <p className="text-lg font-medium mb-4">Ready to start?</p>
                <Button glow onClick={scrollToAuthForm}>
                  Try Free
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Code Syntax Focus (spans 3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <features[1].icon className="w-10 h-10 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-xl font-semibold mb-3">{features[1].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {features[1].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Track Progress (spans 3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <features[2].icon className="w-10 h-10 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-xl font-semibold mb-3">{features[2].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {features[2].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
```

**Step 2: Run Features tests**

Run: `pnpm test -- tests/component/landing/Features.test.tsx`
Expected: Tests pass (content hasn't changed, just layout)

**Step 3: Visual verification**

Run: `pnpm dev`
Navigate to: `http://localhost:3000`
Verify: Features section has asymmetric layout with hero card spanning more width

**Step 4: Commit**

```bash
git add src/components/landing/Features.tsx
git commit -m "feat(layout): create asymmetric bento grid for Features section"
```

---

### Task C2: Improve Dashboard QuickAction Layout

**Files:**
- Modify: `src/app/dashboard/page.tsx:194-217`

**Step 1: Create asymmetric quick actions grid**

Replace lines 194-217 with:
```tsx
          {/* Quick Actions - Asymmetric Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Daily Goal - spans 2 columns */}
            <div className="md:col-span-2">
              <QuickActionCard
                title="Daily Goal"
                description="Complete your practice to maintain your streak"
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                accentColor="var(--accent-success)"
                progress={dueCount > 0 ? 0 : 100}
              />
            </div>
            {/* Learning Path - spans 1 column */}
            <QuickActionCard
              title="Learning Path"
              description="218 Python exercises"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              accentColor="var(--accent-primary)"
            />
          </motion.div>
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(layout): create asymmetric quick actions grid on dashboard"
```

---

## Part D: Motion Orchestration (Priority 3)

### Task D1: Create Staggered Hero Animation

**Files:**
- Modify: `src/components/landing/Hero.tsx:39-117`

**Step 1: Add stagger delays to Hero content**

Replace the left column motion.div (lines 39-117) with properly staggered animations:

```tsx
          {/* Left column - 3/5 */}
          <div className="lg:col-span-3 space-y-6">
            {/* Badge - animates first */}
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full text-sm
                         bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]
                         border border-[var(--accent-primary)]/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.normal, delay: 0.1 }}
            >
              For developers who use AI assistants
            </motion.span>

            {/* Headline - animates second */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold
                          tracking-[-0.02em] leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.normal, delay: 0.2 }}
            >
              Keep Your{' '}
              <span
                className="bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                              bg-clip-text text-transparent"
              >
                Code Sharp
              </span>
            </motion.h1>

            {/* Subheadline - animates third */}
            <motion.p
              className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.normal, delay: 0.3 }}
            >
              Practice syntax through spaced repetition.
              <br />
              <span className="text-[var(--text-tertiary)]">5 minutes a day to stay fluent.</span>
            </motion.p>

            {/* CTA buttons or Auth Form - animates fourth */}
            <motion.div
              className="flex flex-wrap gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.normal, delay: 0.4 }}
            >
              <AnimatePresence mode="wait">
                {showAuthForm ? (
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm"
                  >
                    <AuthForm />
                    <button
                      onClick={() => setShowAuthForm(false)}
                      className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Back to options
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cta-buttons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap gap-4"
                  >
                    <Button glow size="lg" onClick={() => setShowAuthForm(true)}>
                      Start Free
                    </Button>
                    <Button variant="ghost" size="lg" onClick={scrollToFeatures}>
                      See how it works
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
```

**Step 2: Delay CodeMockup animation**

Change the CodeMockup motion.div (around line 120) delay from 0.3 to 0.5:
```tsx
          <motion.div
            className="lg:col-span-2 relative hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DURATION.page, delay: 0.5 }}
          >
```

**Step 3: Run Hero tests**

Run: `pnpm test -- tests/component/landing/Hero.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/landing/Hero.tsx
git commit -m "feat(motion): add staggered entrance animations to Hero section"
```

---

### Task D2: Add Progress Segment Fill Animation

**Files:**
- Modify: `src/components/session/SessionProgress.tsx:45-58`

**Step 1: Add motion import**

Add at top of file:
```tsx
import { motion } from 'framer-motion';
```

**Step 2: Replace segment rendering with animated version**

Replace lines 45-58 with:
```tsx
          segments.map(({ index, isCompleted, isCurrent }) => (
            <motion.div
              key={index}
              className={`
                h-2 flex-1 rounded-full overflow-hidden
                ${isCompleted || isCurrent
                  ? ''
                  : 'bg-[var(--bg-surface-3)]'
                }
              `}
              initial={false}
            >
              <motion.div
                className={`
                  h-full rounded-full
                  ${isCurrent
                    ? 'bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'
                    : 'bg-[var(--accent-primary)]'
                  }
                `}
                initial={{ width: '0%' }}
                animate={{
                  width: isCompleted || isCurrent ? '100%' : '0%',
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 1, 0.5, 1],
                }}
              />
            </motion.div>
          ))
```

**Step 3: Run SessionProgress tests**

Run: `pnpm test -- tests/component/session/SessionProgress.test.tsx`
Expected: Tests pass

**Step 4: Commit**

```bash
git add src/components/session/SessionProgress.tsx
git commit -m "feat(motion): add fill animation to progress bar segments"
```

---

### Task D3: Enhance Card Hover Glow Effect

**Files:**
- Modify: `src/components/ui/Card.tsx:41-46`

**Step 1: Enhance hover styles**

Replace lines 41-46 with:
```tsx
        interactive && [
          'cursor-pointer',
          'hover:-translate-y-0.5',
          'hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
          'hover:border-[var(--accent-primary)]/40',
          'active:scale-[0.99]',
        ],
```

**Step 2: Run Card tests**

Run: `pnpm test -- tests/unit/components/ui/Card.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "feat(motion): enhance card hover glow effect"
```

---

## Part E: Background & Texture Enhancements (Priority 4)

### Task E1: Increase Noise Texture Visibility

**Files:**
- Modify: `src/components/landing/Hero.tsx:34`
- Modify: `src/app/dashboard/page.tsx:44`

**Step 1: Update Hero noise opacity**

In `Hero.tsx`, change line 34 from:
```tsx
      <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none" />
```
to:
```tsx
      <div className="absolute inset-0 opacity-30 bg-[url('/noise.svg')] pointer-events-none mix-blend-overlay" />
```

**Step 2: Update Dashboard noise opacity**

In `dashboard/page.tsx`, change line 44 from:
```tsx
      <div className="fixed inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none -z-10" />
```
to:
```tsx
      <div className="fixed inset-0 opacity-30 bg-[url('/noise.svg')] pointer-events-none -z-10 mix-blend-overlay" />
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/landing/Hero.tsx src/app/dashboard/page.tsx
git commit -m "feat(background): increase noise texture visibility with mix-blend-overlay"
```

---

### Task E2: Add Grid Pattern to Code Backgrounds

**Files:**
- Create: `public/grid.svg`
- Modify: `src/components/ui/CodeEditor.tsx:85-92`

**Step 1: Create grid SVG pattern**

Create `public/grid.svg`:
```svg
<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
</svg>
```

**Step 2: Add grid pattern to CodeEditor**

In `CodeEditor.tsx`, update the outer div (lines 85-92) to:
```tsx
      <div
        className={cn(
          'relative rounded-lg overflow-hidden',
          'bg-bg-surface-2 border border-transparent',
          'focus-within:border-accent-primary',
          'focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]',
          'transition-all duration-150',
          "before:absolute before:inset-0 before:bg-[url('/grid.svg')] before:opacity-50 before:pointer-events-none",
          className
        )}
      >
```

**Step 3: Run CodeEditor tests**

Run: `pnpm test -- tests/unit/components/ui/CodeEditor.test.tsx`
Expected: Tests pass

**Step 4: Commit**

```bash
git add public/grid.svg src/components/ui/CodeEditor.tsx
git commit -m "feat(background): add subtle grid pattern to code editor"
```

---

### Task E3: Enhance Gradient Spotlight Intensity

**Files:**
- Modify: `src/components/landing/Hero.tsx:22-31`
- Modify: `src/app/dashboard/page.tsx:26-41`

**Step 1: Intensify Hero spotlights**

In `Hero.tsx`, replace lines 22-31 with:
```tsx
      {/* Spotlight effect from top-right */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[700px]
                      bg-[radial-gradient(circle,rgba(245,158,11,0.2)_0%,transparent_60%)]
                      animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      {/* Secondary glow from bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px]
                      bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,transparent_60%)]"
      />
```

**Step 2: Intensify Dashboard spotlights**

In `dashboard/page.tsx`, replace lines 26-41 with:
```tsx
      {/* Spotlight effect from top-right */}
      <div
        className="fixed top-0 right-0 w-[700px] h-[700px] -z-10
                      bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_60%)]"
      />

      {/* Secondary glow from bottom-left */}
      <div
        className="fixed bottom-0 left-0 w-[600px] h-[600px] -z-10
                      bg-[radial-gradient(circle,rgba(249,115,22,0.12)_0%,transparent_60%)]"
      />

      {/* Accent glow following user focus area */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] -z-10
                      bg-[radial-gradient(ellipse,rgba(34,197,94,0.08)_0%,transparent_60%)]"
      />
```

**Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/landing/Hero.tsx src/app/dashboard/page.tsx
git commit -m "feat(background): enhance gradient spotlight intensity"
```

---

## Part F: Header Improvements (Priority 6)

### Task F1: Add Gradient Logo to Dashboard Header

**Files:**
- Modify: `src/components/layout/Header.tsx:18-23`

**Step 1: Update logo styling**

Replace lines 18-23 with:
```tsx
        {/* Logo with gradient */}
        <Link
          href="/dashboard"
          className="text-xl font-display font-bold
                     bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                     bg-clip-text text-transparent
                     hover:opacity-80 transition-opacity"
        >
          SyntaxSRS
        </Link>
```

**Step 2: Run Header tests**

Run: `pnpm test -- tests/component/layout/Header.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat(header): add gradient logo treatment to dashboard header"
```

---

### Task F2: Create Animated Flame Icon

**Files:**
- Create: `src/components/ui/FlameIcon.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/ui/index.ts`

**Step 1: Create FlameIcon component**

Create `src/components/ui/FlameIcon.tsx`:
```tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FlameIconProps {
  className?: string;
  animate?: boolean;
}

export function FlameIcon({ className, animate = true }: FlameIconProps) {
  return (
    <motion.svg
      className={cn('w-5 h-5', className)}
      viewBox="0 0 24 24"
      fill="currentColor"
      animate={animate ? {
        scale: [1, 1.1, 1],
        opacity: [1, 0.8, 1],
      } : undefined}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <path d="M12 2c0 4.5-3 7.5-3 11 0 2.5 1.5 4.5 3.5 5 2-.5 3.5-2.5 3.5-5 0-3.5-3-6.5-3-11z" />
      <path
        d="M12 13c0 2 1 3 2 3.5 1-.5 2-1.5 2-3.5 0-1.5-1-3-2-4-1 1-2 2.5-2 4z"
        opacity={0.7}
      />
    </motion.svg>
  );
}
```

**Step 2: Export FlameIcon from UI index**

Add to `src/components/ui/index.ts`:
```tsx
export { FlameIcon } from './FlameIcon';
```

**Step 3: Update Header to use FlameIcon**

In `src/components/layout/Header.tsx`, add import:
```tsx
import { FlameIcon } from '@/components/ui';
```

Replace the streak emoji (lines 28-39) with:
```tsx
          {/* Streak */}
          <div className="flex items-center gap-1.5 text-sm">
            {streak > 0 ? (
              <>
                <FlameIcon className="text-[var(--accent-warning)]" />
                <span className="font-medium text-[var(--text-primary)]">
                  {streak}
                </span>
                <span className="text-[var(--text-secondary)]">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">
                Start your streak!
              </span>
            )}
          </div>
```

**Step 4: Run Header tests**

Run: `pnpm test -- tests/component/layout/Header.test.tsx`
Expected: Tests pass

**Step 5: Commit**

```bash
git add src/components/ui/FlameIcon.tsx src/components/ui/index.ts src/components/layout/Header.tsx
git commit -m "feat(header): add animated flame icon for streak indicator"
```

---

## Part G: Quick Wins

### Task G1: Add Hover Scale to Logo

**Files:**
- Modify: `src/components/layout/LandingHeader.tsx:23-30`

**Step 1: Add hover scale effect**

Replace lines 23-30 with:
```tsx
        <Link href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
          <span
            className="text-xl font-display font-bold
                          bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                          bg-clip-text text-transparent"
          >
            SyntaxSRS
          </span>
        </Link>
```

**Step 2: Run LandingHeader tests**

Run: `pnpm test -- tests/component/layout/LandingHeader.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/layout/LandingHeader.tsx
git commit -m "feat(ui): add hover scale effect to landing logo"
```

---

### Task G2: Add Transition Delay to Staggered Grid Items

**Files:**
- Modify: `src/components/landing/HowItWorks.tsx:114-143`

**Step 1: Increase stagger delay for more dramatic cascade**

In `HowItWorks.tsx`, change the transition delay in line 120 from:
```tsx
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
```
to:
```tsx
                transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
```

**Step 2: Run HowItWorks tests**

Run: `pnpm test -- tests/component/landing/HowItWorks.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/landing/HowItWorks.tsx
git commit -m "feat(motion): increase stagger delay for HowItWorks cascade effect"
```

---

### Task G3: Replace Checkmark Emoji with SVG Icon

**Files:**
- Modify: `src/components/exercise/ExerciseFeedback.tsx:27-30`

**Step 1: Replace emoji with styled SVG check/X marks**

Replace lines 27-30 with:
```tsx
        {isCorrect ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
```

**Step 2: Run ExerciseFeedback tests**

Run: `pnpm test -- tests/component/exercise/ExerciseFeedback.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseFeedback.tsx
git commit -m "feat(ui): replace checkmark emoji with SVG icons in ExerciseFeedback"
```

---

## Part H: Final Verification

### Task H1: Run Full Test Suite

**Step 1: Run all tests**

Run: `pnpm test`
Expected: All 429+ tests pass

**Step 2: Run linting**

Run: `pnpm lint`
Expected: No errors

**Step 3: Run type checking**

Run: `pnpm typecheck`
Expected: No errors

**Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

---

### Task H2: Visual QA

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Test landing page**

Navigate to: `http://localhost:3000`

Verify:
- [ ] Hero has staggered entrance animation (badge → headline → subheadline → CTA)
- [ ] Code mockup animates after text content
- [ ] Noise texture is visible
- [ ] Gradient spotlights are enhanced
- [ ] Features section has asymmetric bento layout
- [ ] HowItWorks has cascade effect
- [ ] Logo has hover scale effect

**Step 3: Test dashboard**

Login and navigate to: `http://localhost:3000/dashboard`

Verify:
- [ ] Header has gradient logo
- [ ] Flame icon animates when streak > 0
- [ ] Noise texture visible
- [ ] Quick actions have asymmetric layout
- [ ] Stats cards have enhanced glow on hover

**Step 4: Test practice session**

Navigate to: `http://localhost:3000/practice`

Verify:
- [ ] Progress bar segments have fill animation
- [ ] Code editor has grid pattern
- [ ] Exercise feedback uses theme variables (no neutral colors)
- [ ] SVG icons display instead of emoji

---

### Task H3: Create Summary Commit

**Step 1: Ensure working tree is clean**

Run: `git status`
Expected: All changes committed

**Step 2: Tag release (optional)**

```bash
git tag -a v1.1.0-ui-enhancements -m "UI/UX Enhancements: Typography, Motion, Layout, Theme"
```

---

## Summary

| Part | Tasks | Files Modified | Tests Added |
|------|-------|----------------|-------------|
| A: Typography | 3 | 7 | 0 |
| B: Theme Fixes | 3 | 3 | 0 |
| C: Spatial Layout | 2 | 2 | 0 |
| D: Motion | 3 | 3 | 0 |
| E: Backgrounds | 3 | 4 | 0 |
| F: Header | 2 | 4 | 0 |
| G: Quick Wins | 3 | 3 | 0 |
| H: Verification | 3 | 0 | 0 |
| **Total** | **22** | **26** | **0** |

All changes are styling/animation focused and don't affect business logic, so existing tests provide coverage.
