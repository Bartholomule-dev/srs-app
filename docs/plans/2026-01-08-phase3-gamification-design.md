# Phase 3: Gamification Design

> Hybrid Loop gamification system combining immediate session rewards with long-term mastery progression.

**Date:** 2026-01-08
**Status:** Approved (revised after multi-AI review)
**Multi-AI Input:** Codex + Gemini consulted for recommendations AND review

---

## Overview

### Target Personas
1. **Rusty Senior** - Experienced developers returning after heavy AI tool usage. Motivated by mastery.
2. **Habit Builder** - Users who need external motivation for daily practice. Motivated by streaks and goals.
3. **Completionist** - Users who want to unlock everything. Motivated by achievements and skill tree completion.

### Design Approach: Hybrid Loop
Two parallel systems provide both immediate dopamine (session points) and lasting satisfaction (mastery progression):

- **Quick feedback:** Points per session, streak multipliers, achievement unlocks
- **Long-term mastery:** Skill tree badges, contribution graph, concept completion

### Explicitly Deferred
- Leaderboards (daily/weekly/all-time/friends)
- Social features
- Premium/purchasable streak freezes
- Unlockable themes

---

## 1. Session Scoring

### Point Formula

```
Base Points = 10 per correct answer

Quality Bonus (based on FSRS rating):
  - Easy (Rating 4): +5 pts
  - Good (Rating 3): +3 pts
  - Hard (Rating 2): +1 pt
  - Again (Rating 1): 0 pts

Modifiers:
  - No hint used: +3 pts
  - First attempt (no retry): +2 pts
  - Speed bonus (mastered subconcepts only, stability ≥30 days): +1-5 pts based on response time

Streak Multiplier (applied to session total):
  - 7+ day streak: 1.1x
  - 14+ day streak: 1.15x
  - 30+ day streak: 1.2x

Daily Cap: 500 points (applied AFTER streak multiplier)
```

### Display
- Show points earned after each answer (small "+15" animation)
- Session summary shows total points earned
- Dashboard shows "Today's Points" and "Weekly Points"

### Anti-Gaming Measures
- Speed bonus ONLY available on mastered subconcepts (stability ≥30 days, raised from 7)
- Points capped at 500/day AFTER multiplier to prevent grinding
- Repeated wrong answers on same exercise don't earn points
- Points computed server-side via RPC (cannot be spoofed)

### Server-Side Computation
Points are calculated via Supabase RPC function `calculate_attempt_points()`:
- Client sends attempt data (exercise_id, is_correct, used_hint, response_time_ms, rating)
- Server computes points using authoritative streak/stability data
- Returns points_earned, which is stored in `exercise_attempts`

### Storage
- Add `points_earned` column to `exercise_attempts` table
- Daily/weekly totals computed via RPC `get_points_summary(start_date, end_date)`
- NO `total_points` on profiles (avoids dual source of truth)

---

## 2. Contribution Graph

### Design
GitHub-style grid showing practice consistency over time.

- Grid of squares representing the last 52 weeks (1 year)
- Each square = one day
- Color intensity based on practice activity:
  - Empty (no practice): `--bg-surface-1` (dark gray)
  - Light practice (1-5 cards): `--accent-primary` at 25% opacity
  - Moderate (6-15 cards): `--accent-primary` at 50% opacity
  - Good (16-30 cards): `--accent-primary` at 75% opacity
  - Strong (31+ cards): `--accent-primary` at 100% opacity

### Placement
- Dashboard section below the stats grid
- Collapsible/expandable (default expanded on desktop, collapsed on mobile)
- Hover tooltip shows: date, cards reviewed, accuracy that day

### Data Source (Server-Side RPC)
**Critical:** Do NOT compute client-side. Use Supabase RPC function:

```sql
-- get_contribution_history(start_date, end_date, user_timezone)
-- Returns: [{ date: '2026-01-01', count: 12, accuracy: 85 }, ...]
```

- Aggregation done in PostgreSQL (efficient for large datasets)
- Returns lightweight JSON array
- "Cards reviewed" = attempts where `is_correct IS NOT NULL` (excludes teaching cards)

### Component
- `ContributionGraph.tsx` in `src/components/stats/`
- Responsive: full year on desktop, 3 months on mobile
- Current streak highlighted with subtle glow on recent consecutive days
- Cache in React Query with 5-minute stale time

---

## 3. Streak System (with Grace)

### Core Mechanics
- Streak increments when user completes at least 1 graded exercise in a calendar day
- Calendar day determined by user's timezone (stored with each attempt)
- Streak resets to 0 after missing a day (unless protected by freeze)

### Timezone Handling
- Store `timezone_offset_minutes` with each `exercise_attempt`
- Server computes "activity day" using: `created_at AT TIME ZONE offset`
- Streak logic runs server-side via RPC `update_streak()`
- Handles DST transitions correctly by using offset at time of activity

### Streak Protection ("Freeze")
- Users earn 1 freeze per 7-day streak milestone (max 2 stored)
- If a day is missed and user has a freeze, it auto-applies
- Freeze usage shown in streak display: "🔥 14 days (1 freeze used)"
- Freezes don't stack infinitely - cap at 2 to maintain accountability

### Multi-Day Gap Handling
When user returns after multiple missed days:
- If `days_missed <= available_freezes`: consume freezes, preserve streak
- If `days_missed > available_freezes`: reset streak to 0, **keep unused freezes** (save for future)
- Example: 3 days missed with 2 freezes → streak resets, 2 freezes preserved

### Freeze Earning Rules
- Earned only once per 7-day milestone (not retroactive)
- `last_freeze_earned_at` prevents farming
- Milestones: 7, 14, 21, 28... (every 7 days)

### Display
- Dashboard: "🔥 14 day streak" with flame animation at milestones (7, 14, 30, 60, 100)
- Show freeze count: "(2 freezes available)"
- When freeze is used: subtle notification "Streak protected! 1 freeze remaining"

### Storage
- `profiles.streak_freezes` (integer, default 0, max 2)
- `profiles.last_freeze_earned_at` (timestamp)
- `profiles.last_activity_date` (date, in user's timezone)
- `exercise_attempts.timezone_offset_minutes` (integer)

---

## 4. Skill Tree Badges

### Badge Tiers (per subconcept)
Based on FSRS stability (how long until the next review is due):

| Tier | Stability Threshold | Visual |
|------|---------------------|--------|
| Locked | Prerequisites not met | Gray, no icon |
| Available | Can start learning | Outline only, pulsing dot |
| Bronze | stability ≥ 1 day | Bronze ring/border |
| Silver | stability ≥ 7 days | Silver ring + small shine |
| Gold | stability ≥ 30 days | Gold ring + glow effect |
| Platinum | stability ≥ 90 days | Platinum + subtle animation |

### Concept-Level Badges
- Concept shows aggregate of its subconcepts
- "Mastered" when ALL subconcepts are Gold or higher
- Special visual treatment for fully mastered concepts (crown icon)

### Celebrations
- First Bronze: small confetti burst (`fireConfettiMini`)
- First Gold: larger celebration + toast "You've mastered {subconcept}!"
- Concept fully mastered: full `fireConfetti` + dedicated modal

### Implementation
- Extend existing `SubconceptNode` component with badge tier prop
- Badge tier computed from `subconcept_progress.stability`
- Framer Motion transitions when tier changes

---

## 5. Achievements System

### Habit Achievements

| Slug | Name | Requirement | Icon |
|------|------|-------------|------|
| `first-steps` | First Steps | Complete first graded exercise | 👣 |
| `week-warrior` | Week Warrior | 7-day streak | 🔥 |
| `fortnight-fighter` | Fortnight Fighter | 14-day streak | ⚔️ |
| `monthly-master` | Monthly Master | 30-day streak | 🏆 |
| `perfect-day` | Perfect Day | 100% first-attempt accuracy in a session (min 10 graded cards) | ⭐ |
| `early-bird` | Early Bird | Practice between 05:00-07:59 (local time) | 🌅 |
| `night-owl` | Night Owl | Practice between 00:00-04:59 (local time) | 🦉 |

**Note:** Early Bird and Night Owl are mutually exclusive time windows (no overlap).

### Mastery Achievements

| Slug | Name | Requirement | Icon |
|------|------|-------------|------|
| `bronze-age` | Bronze Age | First Bronze badge | 🥉 |
| `silver-lining` | Silver Lining | First Silver badge | 🥈 |
| `gold-standard` | Gold Standard | First Gold badge | 🥇 |
| `platinum-club` | Platinum Club | First Platinum badge | 💎 |
| `concept-master` | Concept Master | Master all subconcepts in any concept | 👑 |
| `pythonista` | Pythonista | Master ALL Python subconcepts (65 total) | 🐍 |

### Completionist Achievements

| Slug | Name | Requirement | Icon |
|------|------|-------------|------|
| `century` | Century | 100 graded exercises completed | 💯 |
| `half-k` | Half K | 500 graded exercises completed | 🎯 |
| `thousand-strong` | Thousand Strong | 1000 graded exercises completed | 🏅 |
| `explorer` | Explorer | Try all 3 exercise types (write, fill-in, predict) | 🧭 |
| `well-rounded` | Well Rounded | Complete exercises in all 11 concepts | 🌐 |

### Explicit Definitions
- **"Graded exercise"**: An attempt where `is_correct IS NOT NULL` (excludes teaching cards)
- **"First-attempt accuracy"**: `correct_first_try / total_graded_cards` (retries don't count)
- **"Completed"**: At least one correct attempt on that exercise
- **"Master"**: All subconcepts at Gold tier or higher (stability ≥ 30 days)

### Display
- Achievements page accessible from dashboard
- Locked achievements shown grayed with hidden requirements
- Toast notification when unlocked + small animation
- Recent achievements shown on dashboard

---

## 6. Database Schema

### New Tables

```sql
-- Achievement definitions (static, seeded)
CREATE TABLE achievement_definitions (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('habit', 'mastery', 'completionist')),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  -- Flexible requirements (e.g., {"streak": 7}, {"count": 100})
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User unlocked achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_slug TEXT NOT NULL REFERENCES achievement_definitions(slug),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_slug)
);

-- RLS Policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievement definitions are public read
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions FOR SELECT
  USING (true);
```

### Modified Tables

```sql
-- profiles: add streak freeze support
ALTER TABLE profiles ADD COLUMN streak_freezes INTEGER DEFAULT 0
  CHECK (streak_freezes >= 0 AND streak_freezes <= 2);
ALTER TABLE profiles ADD COLUMN last_freeze_earned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN last_activity_date DATE;

-- exercise_attempts: add points and timezone
ALTER TABLE exercise_attempts ADD COLUMN points_earned INTEGER DEFAULT 0
  CHECK (points_earned >= 0);
ALTER TABLE exercise_attempts ADD COLUMN timezone_offset_minutes INTEGER;
```

**Note:** No `total_points` on profiles. Compute from `exercise_attempts` via RPC to avoid dual source of truth.

### RPC Functions

```sql
-- Calculate points for an attempt (called on submit)
CREATE FUNCTION calculate_attempt_points(
  p_user_id UUID,
  p_is_correct BOOLEAN,
  p_rating INTEGER,
  p_used_hint BOOLEAN,
  p_is_first_attempt BOOLEAN,
  p_response_time_ms INTEGER,
  p_subconcept_stability FLOAT
) RETURNS INTEGER;

-- Get contribution graph data
CREATE FUNCTION get_contribution_history(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON;

-- Get points summary
CREATE FUNCTION get_points_summary(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS JSON;

-- Update streak (called after session)
CREATE FUNCTION update_streak(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS JSON;

-- Check and unlock achievements (idempotent)
CREATE FUNCTION check_achievements(
  p_user_id UUID
) RETURNS JSON;
```

---

## 7. Technical Architecture

### Event Flow (Server-Side)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Exercise Submit │────▶│ RPC: record      │────▶│ RPC: check      │
│ (practice page) │     │ attempt + points │     │ achievements    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ RPC: update      │     │ Return unlocks  │
                        │ streak           │     │ (toast in UI)   │
                        └──────────────────┘     └─────────────────┘
```

**Key principle:** All gamification logic runs server-side via Supabase RPC functions. Client cannot spoof points, streaks, or achievements.

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/gamification/points.ts` | Client-side display helpers (not calculation) |
| `src/lib/gamification/achievements.ts` | Achievement type definitions |
| `src/lib/gamification/streaks.ts` | Streak display helpers |
| `src/lib/hooks/useAchievements.ts` | Fetch user achievements, listen for unlocks |
| `src/lib/hooks/useContributionGraph.ts` | Fetch via RPC, transform for display |
| `src/lib/hooks/usePoints.ts` | Fetch points summary via RPC |
| `src/components/stats/ContributionGraph.tsx` | GitHub-style grid |
| `src/components/gamification/AchievementToast.tsx` | Unlock notification |
| `src/components/gamification/AchievementCard.tsx` | Display single achievement |
| `supabase/functions/gamification.sql` | All RPC functions |

### Achievement Check Strategy
- Run `check_achievements()` RPC after each session ends
- RPC is **idempotent** - safe to call multiple times, only unlocks once
- Can also run on dashboard load to "catch up" any missed unlocks
- Returns list of newly unlocked achievements for toast display

### Caching
- Achievements: cache in React Query, invalidate on session end
- Contribution graph: 5-minute stale time
- Points totals: recompute on dashboard load via RPC

---

## 8. Implementation Phases

### Phase 3.1: Foundation (Core Loop)
- Database migrations (new tables, modified columns, RPC functions)
- Points calculation RPC + integration with exercise submit
- Points display in session feedback + session summary
- Dashboard "Today's Points" stat card
- Streak RPC with freeze logic
- Freeze earning + auto-apply on missed day

### Phase 3.2: Visualization
- Contribution graph RPC function
- ContributionGraph component
- Dashboard integration (below stats grid)
- Skill tree badge tiers (Bronze/Silver/Gold/Platinum visuals)
- Badge tier celebrations (confetti on first Gold, etc.)

### Phase 3.3: Achievements
- Seed achievement definitions
- Achievement check RPC function
- Achievements page (grid of locked/unlocked)
- Achievement toast notifications
- Dashboard "Recent achievements" section

### Phase 3.4: Polish
- Animations and micro-interactions
- Mobile responsiveness for contribution graph
- Achievement sharing (optional - generate image?)
- Tune point values based on real usage
- Add "Repair Stats" admin function to recalculate if needed

---

## Multi-AI Review Summary

### Review Conducted: 2026-01-08

**Codex Assessment:** "Needs work" → Issues addressed
**Gemini Assessment:** "Approved with modifications" → Modifications applied

### Critical Issues Resolved

| Issue | Resolution |
|-------|------------|
| Client-side achievement evaluation (spoofable) | Moved to server-side Supabase RPC |
| Contribution graph performance | Created RPC function, not client-side |
| Timezone/streak day detection | Store timezone_offset with attempts |
| Points cap vs multiplier ambiguity | Cap applies AFTER multiplier (clarified) |

### Edge Cases Defined

| Edge Case | Decision |
|-----------|----------|
| Multi-day gap with insufficient freezes | Reset streak, preserve unused freezes |
| Early Bird + Night Owl overlap | Mutually exclusive windows (00:00-04:59 vs 05:00-07:59) |
| Perfect Day accuracy definition | First-attempt accuracy only |
| Speed bonus threshold | Raised to stability ≥30 days (was 7) |

### Schema Improvements Applied

- Added `metadata JSONB` to achievement_definitions for flexible requirements
- Added `CHECK` constraints on streak_freezes and points_earned
- Added `timezone_offset_minutes` to exercise_attempts
- Removed `total_points` from profiles (compute from attempts)
- Added `last_activity_date` to profiles for streak logic

---

## Multi-AI Recommendations Summary

### Codex Emphasized
- Progress visibility over raw points (mastery milestones)
- Streak forgiveness (grace days/tokens)
- Event-driven architecture for achievements
- Precomputed aggregates for performance
- **Server-side validation for integrity**

### Gemini Emphasized
- GitHub-style contribution graph (developers love it)
- "Flow state" protection (quiet notifications)
- Unlockable IDE themes as rewards (deferred)
- League-based leaderboards when ready (deferred)
- **RPC for contribution graph performance**

### Both Agreed On
- Points system as foundation
- Defer social/friends features
- Don't reward speed too heavily
- Decouple achievement logic from core SRS code
- **Server-side computation prevents gaming**

---

## Success Metrics

- **Retention:** 7-day retention rate increases
- **Session frequency:** Average sessions per week increases
- **Streak length:** Average streak length increases
- **Completion:** More users reach Gold badges
- **Engagement:** Time spent on dashboard increases (viewing progress)

---

## Related Documents

- `docs/plans/2026-01-05-phase2-curriculum-overhaul.md` - Curriculum system
- `docs/plans/2026-01-07-skill-tree-progress-design.md` - Skill tree visualization
- Obsidian `SRS-app/Features.md` - Full feature roadmap
