/**
 * Badge tier types and utilities
 */

/**
 * Badge tier for a subconcept
 */
export type BadgeTier = 'locked' | 'available' | 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Stability thresholds for badge tiers (in days)
 */
export const BADGE_THRESHOLDS = {
  bronze: 1,    // Any stability >= 1 day
  silver: 7,    // stability >= 7 days
  gold: 30,     // stability >= 30 days (mastered)
  platinum: 90, // stability >= 90 days (deep mastery)
} as const;

/**
 * Badge tier visual styles
 */
export const BADGE_STYLES: Record<BadgeTier, {
  ring: string;
  bg: string;
  icon: string;
  glow?: string;
}> = {
  locked: {
    ring: 'ring-bg-surface-2',
    bg: 'bg-bg-surface-2',
    icon: 'text-text-tertiary',
  },
  available: {
    ring: 'ring-accent-primary/30',
    bg: 'bg-bg-surface-1',
    icon: 'text-accent-primary',
  },
  bronze: {
    ring: 'ring-amber-600',
    bg: 'bg-amber-900/20',
    icon: 'text-amber-500',
  },
  silver: {
    ring: 'ring-slate-300',
    bg: 'bg-slate-600/20',
    icon: 'text-slate-300',
    glow: 'shadow-[0_0_8px_rgba(148,163,184,0.3)]',
  },
  gold: {
    ring: 'ring-yellow-400',
    bg: 'bg-yellow-700/20',
    icon: 'text-yellow-400',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.4)]',
  },
  platinum: {
    ring: 'ring-cyan-300',
    bg: 'bg-cyan-700/20',
    icon: 'text-cyan-300',
    glow: 'shadow-[0_0_16px_rgba(103,232,249,0.5)]',
  },
};

/**
 * Get badge tier based on stability and prerequisite status
 */
export function getBadgeTier(params: {
  stability: number;
  prereqsMet: boolean;
}): BadgeTier {
  const { stability, prereqsMet } = params;

  if (!prereqsMet) {
    return 'locked';
  }

  if (stability >= BADGE_THRESHOLDS.platinum) {
    return 'platinum';
  }
  if (stability >= BADGE_THRESHOLDS.gold) {
    return 'gold';
  }
  if (stability >= BADGE_THRESHOLDS.silver) {
    return 'silver';
  }
  if (stability >= BADGE_THRESHOLDS.bronze) {
    return 'bronze';
  }

  return 'available';
}

/**
 * Check if a tier upgrade should trigger celebration
 */
export function shouldCelebrateTierUp(
  oldTier: BadgeTier,
  newTier: BadgeTier
): 'mini' | 'full' | null {
  // Only celebrate when going UP in tier
  const tierOrder: BadgeTier[] = ['locked', 'available', 'bronze', 'silver', 'gold', 'platinum'];
  const oldIndex = tierOrder.indexOf(oldTier);
  const newIndex = tierOrder.indexOf(newTier);

  if (newIndex <= oldIndex) {
    return null;
  }

  // Full celebration for first Gold or Platinum
  if (newTier === 'gold' || newTier === 'platinum') {
    return 'full';
  }

  // Mini celebration for Bronze or Silver
  if (newTier === 'bronze' || newTier === 'silver') {
    return 'mini';
  }

  return null;
}

/**
 * Get display name for a badge tier
 */
export function getTierDisplayName(tier: BadgeTier): string {
  const names: Record<BadgeTier, string> = {
    locked: 'Locked',
    available: 'Available',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  };
  return names[tier];
}

/**
 * Get celebration message for a tier upgrade
 */
export function getTierUpgradeMessage(
  newTier: BadgeTier,
  subconceptName?: string
): { title: string; description: string } {
  const tierName = getTierDisplayName(newTier);
  const subject = subconceptName ?? 'skill';

  switch (newTier) {
    case 'bronze':
      return {
        title: `${tierName} Tier Unlocked!`,
        description: `You started learning ${subject}.`,
      };
    case 'silver':
      return {
        title: `${tierName} Tier Achieved!`,
        description: `Your ${subject} knowledge is growing.`,
      };
    case 'gold':
      return {
        title: `${tierName} Mastery!`,
        description: `You have mastered ${subject}!`,
      };
    case 'platinum':
      return {
        title: `${tierName} Excellence!`,
        description: `Deep mastery of ${subject} achieved!`,
      };
    default:
      return {
        title: 'Progress Made!',
        description: `Your ${subject} is improving.`,
      };
  }
}
