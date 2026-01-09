'use client';

import { useCallback } from 'react';
import { useToast } from '@/lib/context/ToastContext';
import { fireConfetti, fireConfettiMini } from '@/lib/confetti';
import {
  shouldCelebrateTierUp,
  getTierUpgradeMessage,
  type BadgeTier,
} from '@/lib/gamification/badges';

export interface UseBadgeCelebrationReturn {
  /**
   * Trigger celebration for a badge tier upgrade
   * @param oldTier - Previous badge tier
   * @param newTier - New badge tier
   * @param subconceptName - Optional name for the subconcept (for toast message)
   */
  celebrateTierUp: (oldTier: BadgeTier, newTier: BadgeTier, subconceptName?: string) => void;
}

/**
 * Hook for triggering badge tier celebrations with confetti and toast
 */
export function useBadgeCelebration(): UseBadgeCelebrationReturn {
  const { showToast } = useToast();

  const celebrateTierUp = useCallback(
    (oldTier: BadgeTier, newTier: BadgeTier, subconceptName?: string) => {
      const celebrationType = shouldCelebrateTierUp(oldTier, newTier);

      if (!celebrationType) {
        return;
      }

      // Fire appropriate confetti
      if (celebrationType === 'full') {
        // Full confetti for gold/platinum
        fireConfetti();
      } else {
        // Mini confetti for bronze/silver
        fireConfettiMini();
      }

      // Show toast notification
      const message = getTierUpgradeMessage(newTier, subconceptName);
      showToast({
        title: message.title,
        description: message.description,
        variant: 'success',
        duration: celebrationType === 'full' ? 7000 : 5000,
      });
    },
    [showToast]
  );

  return { celebrateTierUp };
}
