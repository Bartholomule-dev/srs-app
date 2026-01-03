'use client';

import { useState, useCallback } from 'react';
import type { SessionCard, SessionStats } from '@/lib/session';
import type { Quality } from '@/lib/types';
import type { AppError } from '@/lib/errors';

export interface UseSessionReturn {
  /** Combined due + new cards queue (with full Exercise data) */
  cards: SessionCard[];
  /** Position in queue (0-based) */
  currentIndex: number;
  /** Card at currentIndex (null if complete/empty) */
  currentCard: SessionCard | null;
  /** True when currentIndex >= cards.length */
  isComplete: boolean;
  /** Session statistics */
  stats: SessionStats;
  /** True while fetching exercises/progress */
  loading: boolean;
  /** Fetch error if any */
  error: AppError | null;
  /** Record answer + advance to next card */
  recordResult: (quality: Quality) => Promise<void>;
  /** Mark session complete early */
  endSession: () => void;
  /** Retry failed fetch */
  retry: () => void;
}

function createInitialStats(): SessionStats {
  return {
    total: 0,
    completed: 0,
    correct: 0,
    incorrect: 0,
    startTime: new Date(),
    endTime: undefined,
  };
}

export function useSession(): UseSessionReturn {
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(createInitialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const currentCard = cards[currentIndex] ?? null;
  const isComplete = currentIndex >= cards.length && cards.length > 0;

  const recordResult = useCallback(async (_quality: Quality) => {
    // To be implemented in Task 5
  }, []);

  const endSession = useCallback(() => {
    // To be implemented in Task 6
  }, []);

  const retry = useCallback(() => {
    // To be implemented in Task 4
  }, []);

  return {
    cards,
    currentIndex,
    currentCard,
    isComplete,
    stats,
    loading,
    error,
    recordResult,
    endSession,
    retry,
  };
}
