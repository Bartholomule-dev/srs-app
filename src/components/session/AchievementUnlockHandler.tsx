'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useAchievements } from '@/lib/hooks/useAchievements';
import { getAchievement } from '@/lib/gamification/achievements';
import type { Achievement } from '@/lib/gamification/achievements';
import { AchievementToast } from '@/components/achievements/AchievementToast';
import { fireConfetti } from '@/lib/confetti';

export interface AchievementUnlockHandlerProps {
  /** User ID to check achievements for */
  userId: string;
  /** Callback when all achievement toasts have been shown */
  onComplete?: () => void;
}

/** Achievements that fire confetti (gold and platinum tier) */
const CONFETTI_ACHIEVEMENTS = new Set([
  'gold-standard',
  'platinum-club',
  'concept-master',
  'pythonista',
  'monthly-master',
  'thousand-strong',
]);

/** Default toast display duration in milliseconds */
const TOAST_DURATION = 5000;

/** Delay between dismissing one toast and showing the next */
const STAGGER_DELAY = 500;

interface CheckAchievementsResponse {
  newly_unlocked: string[];
  all_unlocked: string[];
}

/**
 * AchievementUnlockHandler - Checks for achievement unlocks and shows toasts
 *
 * Handles the achievement checking flow at session end:
 * 1. Calls check_achievements RPC on mount
 * 2. Gets newly_unlocked achievement slugs from response
 * 3. Queues toasts for each with staggered timing
 * 4. Fires confetti for major achievements (gold/platinum)
 * 5. Calls refetch on useAchievements to update dashboard
 * 6. Calls onComplete after all toasts are dismissed
 */
export function AchievementUnlockHandler({
  userId,
  onComplete,
}: AchievementUnlockHandlerProps) {
  const { refetch } = useAchievements();
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const hasCalledComplete = useRef(false);

  // Check achievements on mount
  useEffect(() => {
    let mounted = true;

    async function checkAchievements() {
      try {
        const { data, error } = await supabase.rpc('check_achievements', {
          p_user_id: userId,
        });

        if (!mounted) return;

        if (error) {
          console.error('Failed to check achievements:', error);
          // Still complete even on error
          setIsChecking(false);
          return;
        }

        const response = data as CheckAchievementsResponse;
        const newlyUnlocked = response?.newly_unlocked ?? [];

        if (newlyUnlocked.length > 0) {
          // Refresh achievements cache
          refetch();

          // Build queue of achievements to show
          const achievements: Achievement[] = [];
          for (const slug of newlyUnlocked) {
            const achievement = getAchievement(slug);
            if (achievement) {
              achievements.push(achievement);
            }
          }

          if (achievements.length > 0) {
            setToastQueue(achievements.slice(1)); // Rest go to queue
            setCurrentToast(achievements[0]); // First shows immediately

            // Fire confetti for major achievements
            if (CONFETTI_ACHIEVEMENTS.has(achievements[0].slug)) {
              fireConfetti();
            }
          }
        }

        setIsChecking(false);
      } catch (err) {
        console.error('Error checking achievements:', err);
        if (mounted) {
          setIsChecking(false);
        }
      }
    }

    checkAchievements();

    return () => {
      mounted = false;
    };
  }, [userId, refetch]);

  // Handle toast dismissal and queue advancement
  const handleDismiss = useCallback(() => {
    // If there are more toasts in queue, show next one after delay
    if (toastQueue.length > 0) {
      setCurrentToast(null);

      setTimeout(() => {
        const [nextToast, ...rest] = toastQueue;
        setToastQueue(rest);
        setCurrentToast(nextToast);

        // Fire confetti for major achievements
        if (CONFETTI_ACHIEVEMENTS.has(nextToast.slug)) {
          fireConfetti();
        }
      }, STAGGER_DELAY);
    } else {
      // No more toasts, clear current
      setCurrentToast(null);
    }
  }, [toastQueue]);

  // Call onComplete when done checking and no more toasts
  useEffect(() => {
    if (!isChecking && currentToast === null && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete?.();
    }
  }, [isChecking, currentToast, onComplete]);

  // Render nothing if no toast to show
  if (!currentToast) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <AchievementToast
        key={currentToast.slug}
        achievement={currentToast}
        onDismiss={handleDismiss}
        duration={TOAST_DURATION}
      />
    </AnimatePresence>
  );
}
