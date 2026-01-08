# Phase 3: Gamification Design

> Hybrid Loop gamification system combining immediate session rewards with long-term mastery progression.

**Date:** 2026-01-08
**Status:** Approved
**Multi-AI Input:** Codex + Gemini consulted for recommendations

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
  - Speed bonus (mastered subconcepts only): +1-5 pts based on response time

Streak Multiplier (applied to session total):
  - 7+ day streak: 1.1x
  - 14+ day streak: 1.15x
  - 30+ day streak: 1.2x
```

### Display
- Show points earned after each answer (small "+15" animation)
- Session summary shows total points earned
- Dashboard shows "Today's Points" and "Weekly Points"

### Anti-Gaming Measures
- Speed bonus ONLY available on mastered subconcepts (stability ≥7 days)
- Points capped at ~500/day to prevent grinding
- Repeated wrong answers on same exercise don't earn points

### Storage
- Add `points_earned` column to `exercise_attempts` table
- Compute daily/weekly totals via queries (no separate table needed initially)

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

### Data Source
- Query `exercise_attempts` grouped by date
- Computed client-side from existing data (no new tables)
- Cache in React Query with 5-minute stale time

### Component
- `ContributionGraph.tsx` in `src/components/stats/`
- Responsive: full year on desktop, 3 months on mobile
- Current streak highlighted with subtle glow on recent consecutive days

---

## 3. Streak System (with Grace)

### Core Mechanics
- Streak increments when user completes at least 1 exercise in a calendar day (user's local timezone)
- Streak resets to 0 after missing a day (unless protected by freeze)

### Streak Protection ("Freeze")
- Users earn 1 freeze per 7-day streak (max 2 stored)
- If a day is missed and user has a freeze, it auto-applies
- Freeze usage shown in streak display: "🔥 14 days (1 freeze used)"
- Freezes don't stack infinitely - cap at 2 to maintain accountability

### Freeze Earning Rules
- Earned only once per 7-day milestone (not retroactive)
- `last_freeze_earned_at` prevents farming

### Display
- Dashboard: "🔥 14 day streak" with flame animation at milestones (7, 14, 30, 60, 100)
- Show freeze count: "(2 freezes available)"
- When freeze is used: subtle notification "Streak protected! 1 freeze remaining"

### Storage
- `profiles.streak_freezes` (integer, default 0, max 2)
- `profiles.last_freeze_earned_at` (timestamp)

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
| `first-steps` | First Steps | Complete first exercise | 👣 |
| `week-warrior` | Week Warrior | 7-day streak | 🔥 |
| `fortnight-fighter` | Fortnight Fighter | 14-day streak | ⚔️ |
| `monthly-master` | Monthly Master | 30-day streak | 🏆 |
| `perfect-day` | Perfect Day | 100% accuracy in a session (min 10 cards) | ⭐ |
| `early-bird` | Early Bird | Practice before 6am (local time) | 🌅 |
| `night-owl` | Night Owl | Practice after midnight (local time) | 🦉 |

### Mastery Achievements

| Slug | Name | Requirement | Icon |
|------|------|-------------|------|
| `bronze-age` | Bronze Age | First Bronze badge | 🥉 |
| `silver-lining` | Silver Lining | First Silver badge | 🥈 |
| `gold-standard` | Gold Standard | First Gold badge | 🥇 |
| `platinum-club` | Platinum Club | First Platinum badge | 💎 |
| `concept-master` | Concept Master | Master all subconcepts in any concept | 👑 |
| `pythonista` | Pythonista | Master ALL Python subconcepts | 🐍 |

### Completionist Achievements

| Slug | Name | Requirement | Icon |
|------|------|-------------|------|
| `century` | Century | 100 exercises completed | 💯 |
| `half-k` | Half K | 500 exercises completed | 🎯 |
| `thousand-strong` | Thousand Strong | 1000 exercises completed | 🏅 |
| `explorer` | Explorer | Try all 3 exercise types | 🧭 |
| `well-rounded` | Well Rounded | Complete exercises in all 11 concepts | 🌐 |

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
  category TEXT NOT NULL,  -- 'habit', 'mastery', 'completionist'
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
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
-- profiles: add streak freeze support and total points
ALTER TABLE profiles ADD COLUMN streak_freezes INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_freeze_earned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN total_points INTEGER DEFAULT 0;

-- exercise_attempts: add points earned
ALTER TABLE exercise_attempts ADD COLUMN points_earned INTEGER DEFAULT 0;
```

---

## 7. Technical Architecture

### Event Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Exercise Submit │────▶│ Record Attempt   │────▶│ Check Achieve-  │
│ (practice page) │     │ (points_earned)  │     │ ments (async)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Unlock if met   │
                                                 │ (insert + toast)│
                                                 └─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/gamification/points.ts` | `calculatePoints()` formula |
| `src/lib/gamification/achievements.ts` | Achievement rules + `checkAchievements()` |
| `src/lib/gamification/streaks.ts` | Streak logic + freeze handling |
| `src/lib/hooks/useAchievements.ts` | Fetch user achievements, listen for unlocks |
| `src/lib/hooks/useContributionGraph.ts` | Fetch + transform daily activity data |
| `src/components/stats/ContributionGraph.tsx` | GitHub-style grid |
| `src/components/gamification/AchievementToast.tsx` | Unlock notification |
| `src/components/gamification/AchievementCard.tsx` | Display single achievement |

### Achievement Check Strategy
- Run `checkAchievements()` after each session ends (not per-answer)
- Pass context: `{ streak, totalExercises, sessionAccuracy, timeOfDay, badgeTiers, conceptsCompleted }`
- Check all rules, unlock any newly satisfied
- Non-blocking: don't slow down the session flow

### Caching
- Achievements: cache in React Query, invalidate on unlock
- Contribution graph: 5-minute stale time
- Points totals: recompute on dashboard load

---

## 8. Implementation Phases

### Phase 3.1: Foundation (Core Loop)
- Points system (`calculatePoints`, add to exercise attempts)
- Points display in session feedback + session summary
- Dashboard "Today's Points" stat card
- Update streak logic with freeze tokens
- Freeze earning + auto-apply on missed day

### Phase 3.2: Visualization
- Contribution graph component
- Dashboard integration (below stats grid)
- Skill tree badge tiers (Bronze/Silver/Gold/Platinum visuals)
- Badge tier celebrations (confetti on first Gold, etc.)

### Phase 3.3: Achievements
- Database tables + seed achievement definitions
- Achievement engine (`checkAchievements`)
- Achievements page (grid of locked/unlocked)
- Achievement toast notifications
- Dashboard "Recent achievements" section

### Phase 3.4: Polish
- Animations and micro-interactions
- Mobile responsiveness for contribution graph
- Achievement sharing (optional - generate image?)
- Tune point values based on real usage

---

## Multi-AI Recommendations Summary

### Codex Emphasized
- Progress visibility over raw points (mastery milestones)
- Streak forgiveness (grace days/tokens)
- Event-driven architecture for achievements
- Precomputed aggregates for performance

### Gemini Emphasized
- GitHub-style contribution graph (developers love it)
- "Flow state" protection (quiet notifications)
- Unlockable IDE themes as rewards (deferred)
- League-based leaderboards when ready (deferred)

### Both Agreed On
- Points system as foundation
- Defer social/friends features
- Don't reward speed too heavily
- Decouple achievement logic from core SRS code

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
