/**
 * Achievement definitions and types
 */

export type AchievementCategory = 'habit' | 'mastery' | 'completionist';

export interface Achievement {
  slug: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  hidden?: boolean;
  requirement?: {
    type: 'streak' | 'count' | 'tier' | 'time' | 'variety';
    value: number;
    target?: string;
  };
}

export interface UserAchievement {
  achievementSlug: string;
  unlockedAt: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  // === Habit Achievements (7) ===
  'first-steps': {
    slug: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first graded exercise',
    category: 'habit',
    icon: '👣',
    requirement: { type: 'count', value: 1 },
  },
  'week-warrior': {
    slug: 'week-warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    category: 'habit',
    icon: '🔥',
    requirement: { type: 'streak', value: 7 },
  },
  'fortnight-fighter': {
    slug: 'fortnight-fighter',
    name: 'Fortnight Fighter',
    description: 'Achieve a 14-day streak',
    category: 'habit',
    icon: '⚔️',
    requirement: { type: 'streak', value: 14 },
  },
  'monthly-master': {
    slug: 'monthly-master',
    name: 'Monthly Master',
    description: 'Achieve a 30-day streak',
    category: 'habit',
    icon: '🏆',
    requirement: { type: 'streak', value: 30 },
  },
  'perfect-day': {
    slug: 'perfect-day',
    name: 'Perfect Day',
    description: '100% first-attempt accuracy in a session (min 10 cards)',
    category: 'habit',
    icon: '⭐',
    requirement: { type: 'count', value: 10, target: 'perfect-session' },
  },
  'early-bird': {
    slug: 'early-bird',
    name: 'Early Bird',
    description: 'Practice between 5:00 AM and 7:59 AM',
    category: 'habit',
    icon: '🌅',
    requirement: { type: 'time', value: 5, target: '05:00-07:59' },
  },
  'night-owl': {
    slug: 'night-owl',
    name: 'Night Owl',
    description: 'Practice between 12:00 AM and 4:59 AM',
    category: 'habit',
    icon: '🦉',
    requirement: { type: 'time', value: 0, target: '00:00-04:59' },
  },

  // === Mastery Achievements (6) ===
  'bronze-age': {
    slug: 'bronze-age',
    name: 'Bronze Age',
    description: 'Earn your first Bronze badge',
    category: 'mastery',
    icon: '🥉',
    requirement: { type: 'tier', value: 1, target: 'bronze' },
  },
  'silver-lining': {
    slug: 'silver-lining',
    name: 'Silver Lining',
    description: 'Earn your first Silver badge',
    category: 'mastery',
    icon: '🥈',
    requirement: { type: 'tier', value: 1, target: 'silver' },
  },
  'gold-standard': {
    slug: 'gold-standard',
    name: 'Gold Standard',
    description: 'Earn your first Gold badge',
    category: 'mastery',
    icon: '🥇',
    requirement: { type: 'tier', value: 1, target: 'gold' },
  },
  'platinum-club': {
    slug: 'platinum-club',
    name: 'Platinum Club',
    description: 'Earn your first Platinum badge',
    category: 'mastery',
    icon: '💎',
    requirement: { type: 'tier', value: 1, target: 'platinum' },
  },
  'concept-master': {
    slug: 'concept-master',
    name: 'Concept Master',
    description: 'Master all subconcepts in any concept',
    category: 'mastery',
    icon: '👑',
    requirement: { type: 'tier', value: 1, target: 'concept-gold' },
  },
  'pythonista': {
    slug: 'pythonista',
    name: 'Pythonista',
    description: 'Master all 65 Python subconcepts',
    category: 'mastery',
    icon: '🐍',
    requirement: { type: 'tier', value: 65, target: 'gold' },
  },

  // === Completionist Achievements (5) ===
  'century': {
    slug: 'century',
    name: 'Century',
    description: 'Complete 100 graded exercises',
    category: 'completionist',
    icon: '💯',
    requirement: { type: 'count', value: 100 },
  },
  'half-k': {
    slug: 'half-k',
    name: 'Half K',
    description: 'Complete 500 graded exercises',
    category: 'completionist',
    icon: '🎯',
    requirement: { type: 'count', value: 500 },
  },
  'thousand-strong': {
    slug: 'thousand-strong',
    name: 'Thousand Strong',
    description: 'Complete 1000 graded exercises',
    category: 'completionist',
    icon: '🏅',
    requirement: { type: 'count', value: 1000 },
  },
  'explorer': {
    slug: 'explorer',
    name: 'Explorer',
    description: 'Try all 3 exercise types (write, fill-in, predict)',
    category: 'completionist',
    icon: '🧭',
    requirement: { type: 'variety', value: 3, target: 'exercise-types' },
  },
  'well-rounded': {
    slug: 'well-rounded',
    name: 'Well Rounded',
    description: 'Complete exercises in all 11 concepts',
    category: 'completionist',
    icon: '🌐',
    requirement: { type: 'variety', value: 11, target: 'concepts' },
  },
};

export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

export function getAllAchievementSlugs(): string[] {
  return Object.keys(ACHIEVEMENTS);
}

export function getAchievement(slug: string): Achievement | undefined {
  return ACHIEVEMENTS[slug];
}
