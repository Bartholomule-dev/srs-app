# UI/UX Redesign Plan

**Date:** 2026-01-03
**Status:** Approved
**Goal:** Transform the app from a dev test page into a complete, polished user experience.

---

## Summary of Decisions

| Aspect | Decision |
|--------|----------|
| Home page (unauth) | Landing page with hero, features, how-it-works, magic link form |
| Navigation structure | Dashboard-centric, minimal nav |
| Header (auth) | Logo + quick stats (streak, daily count) + user menu |
| Practice session | Immersive/focused - hide nav, show only progress + exit |
| Session completion | Summary with subtle celebration, stats, encouragement |

---

## Page Structure & Flow

```
Landing (/)          Dashboard (/dashboard)       Practice (/practice)
┌─────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│   Hero +    │      │ [Header with stats] │      │ [Progress only] │
│  Features   │ ──►  │                     │ ──►  │                 │
│     +       │login │   Stats Grid        │start │  Exercise Card  │
│  Auth Form  │      │   Practice CTA      │      │  (focused)      │
└─────────────┘      │   Card counts       │      │                 │
                     └─────────────────────┘      └────────┬────────┘
                              ▲                           │
                              │         complete          │
                              └───────── Summary ◄────────┘
```

**Navigation rules:**
- Unauthenticated: Can only see Landing page
- Authenticated on Landing: Auto-redirect to Dashboard
- Dashboard: Hub for all activity, header always visible
- Practice: Immersive mode, header hidden, just progress + exit
- Session complete: Summary screen, then back to Dashboard

---

## Component Designs

### 1. Landing Page (/)

```
┌─────────────────────────────────────────────────────────┐
│  [Logo: SyntaxSRS]                        [Sign In ▼]   │  ← Simple header
├─────────────────────────────────────────────────────────┤
│                                                         │
│           Keep Your Code Skills Sharp                   │  ← Headline
│     Practice syntax through spaced repetition.          │  ← Subheadline
│     Built for developers who use AI assistants.         │
│                                                         │
│     ┌─────────────────────────────────────┐             │
│     │  Email: [________________]          │             │  ← Magic link form
│     │  [    Send Magic Link    ]          │             │     (above fold)
│     └─────────────────────────────────────┘             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│   │   Spaced    │    │    Code     │    │   Track     │ │  ← 3 feature cards
│   │ Repetition  │    │   Syntax    │    │  Progress   │ │
│   │   Science   │    │   Focus     │    │ & Streaks   │ │
│   └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   How it works:                                         │
│   1. Get daily exercises based on your schedule         │  ← Simple 3-step
│   2. Type the code from memory                          │
│   3. Algorithm adjusts timing based on accuracy         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Content principles:**
- Headline speaks to the problem (AI makes you forget syntax)
- Form is prominent, above the fold
- Features are brief (icon + 2-3 words + one sentence)
- "How it works" demystifies SRS for newcomers
- No testimonials or heavy marketing for MVP

---

### 2. Header Component (Authenticated)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]  SyntaxSRS          🔥 5 day streak  │  12 today    [👤▼]│
└──────────────────────────────────────────────────────────────────┘
     ↑                              ↑              ↑            ↑
   Home link                   Streak badge    Daily count   User menu
   (→ dashboard)               (motivator)     (progress)    (sign out)
```

**Behavior:**
- Logo clicks → Dashboard
- Streak shows current streak with fire icon (0 = no icon, just "Start your streak!")
- Daily count shows cards reviewed today
- User menu: dropdown with email display + Sign Out

**Responsive (mobile):**
```
┌─────────────────────────────────┐
│  [Logo]           🔥5  📊12  [👤]│
└─────────────────────────────────┘
```
- Condense to icons only on small screens
- Stats become icon + number (tooltip on tap)

**Visibility rules:**
- Show on: Dashboard, any future pages (settings, profile, etc.)
- Hide on: Landing page (has its own simple header), Practice page (immersive mode)

---

### 3. Dashboard Page (/dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Header - as designed above]                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Good morning! Ready to practice?                              │  ← Greeting
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🎯 15 cards due  •  5 new cards available              │   │  ← Practice CTA
│   │                                                         │   │     (prominent)
│   │              [ Start Practice ]                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│   │   🔥 5      │  │   📊 82%    │  │   ✓ 127    │            │  ← Stats grid
│   │   Streak    │  │  Accuracy   │  │  Completed  │            │     (existing)
│   └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Today's Activity                                       │   │  ← Optional:
│   │  ████████████░░░░░░░░  12/20 reviewed                   │   │     daily progress
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
- **Cards due**: Show count + "Start Practice" button (primary action)
- **All caught up**: Celebratory message, "Learn new cards" secondary option
- **No exercises**: "Coming soon" or first-run onboarding message

**Changes from current:**
- Add time-based greeting ("Good morning/afternoon/evening")
- Make practice CTA more prominent (larger, colored button)
- Keep existing StatsGrid
- Add daily progress bar (optional, nice-to-have)

---

### 4. Practice Page (/practice) - Immersive Mode

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│      ████████████████░░░░░░░░░░  8 / 15           [End Session] │  ← Progress bar
│                                                                 │     + escape
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│      ┌─────────────────────────────────────────────────────┐    │
│      │                                                     │    │
│      │   Create a list with three fruits                   │    │  ← Prompt
│      │                                                     │    │
│      │   ┌─────────────────────────────────────────────┐   │    │
│      │   │                                             │   │    │  ← Code input
│      │   │   fruits = ["apple", "banana", "orange"]_   │   │    │     (monospace)
│      │   │                                             │   │    │
│      │   └─────────────────────────────────────────────┘   │    │
│      │                                                     │    │
│      │              [Check Answer]        [Hint]           │    │  ← Actions
│      │                                                     │    │
│      └─────────────────────────────────────────────────────┘    │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key design choices:**
- No header - fully immersive
- Progress bar at top (current/total + visual bar)
- "End Session" as subtle text link (not a button)
- Exercise card centered, generous whitespace
- Code input uses monospace font, feels like an editor
- Feedback appears inline after submission (correct/incorrect + expected)

**After answering:**
- Show feedback briefly (1-2 sec for correct, longer for incorrect)
- Auto-advance or "Next" button
- Keep progress bar updating

---

### 5. Session Summary (Celebration)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                          ✨                                     │  ← Subtle
│                     Session Complete!                           │     celebration
│                                                                 │
│      ┌─────────────────────────────────────────────────────┐    │
│      │                                                     │    │
│      │     ┌───────┐    ┌───────┐    ┌───────┐            │    │
│      │     │  15   │    │  87%  │    │  🔥 6  │            │    │  ← Session stats
│      │     │Reviewed│   │Accuracy│   │ Streak │            │    │
│      │     └───────┘    └───────┘    └───────┘            │    │
│      │                                                     │    │
│      │         +12 correct   •   -3 to review again        │    │  ← Detail line
│      │                                                     │    │
│      └─────────────────────────────────────────────────────┘    │
│                                                                 │
│                    [ Back to Dashboard ]                        │  ← Primary action
│                                                                 │
│              See you tomorrow! Next review: 8 cards             │  ← Encouragement
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Celebration elements (subtle, not over-the-top):**
- Simple emoji or icon (✨, 🎉) - not confetti explosion
- "Session Complete!" heading
- Streak update highlighted if it increased
- Encouraging closing message

**Special states:**
- **Perfect session (100%)**: Slightly more celebratory ("Perfect score!")
- **Streak milestone (7, 30, etc.)**: Call out the achievement
- **First session ever**: Welcome message

---

## Components to Create/Modify

### New Components
- `src/components/layout/Header.tsx` - Authenticated header with stats
- `src/components/layout/LandingHeader.tsx` - Simple header for landing page
- `src/components/landing/Hero.tsx` - Hero section with form
- `src/components/landing/Features.tsx` - Feature cards grid
- `src/components/landing/HowItWorks.tsx` - 3-step explanation
- `src/components/dashboard/Greeting.tsx` - Time-based greeting
- `src/components/dashboard/PracticeCTA.tsx` - Prominent practice button

### Modified Components
- `src/app/page.tsx` - Replace with landing page
- `src/app/layout.tsx` - Conditional header rendering
- `src/app/dashboard/page.tsx` - Add greeting, improve CTA
- `src/components/session/SessionSummary.tsx` - Add celebration elements
- `src/components/session/SessionProgress.tsx` - Style updates for immersive mode

---

## Implementation Notes

- Focus on structure and layout first, theming comes later (user has theme component to try)
- Use existing Tailwind classes for spacing/layout
- Keep components modular for future theming
- Mobile-first responsive design
- No new dependencies needed
