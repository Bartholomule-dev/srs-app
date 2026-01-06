'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TeachingSessionCard } from '@/lib/session/types';
import { getSubconceptDefinition } from '@/lib/curriculum';

interface TeachingCardProps {
  card: TeachingSessionCard;
  onContinue: () => void;
}

export function TeachingCard({ card, onContinue }: TeachingCardProps) {
  const subconcept = getSubconceptDefinition(card.subconcept);
  const displayName = subconcept?.name ?? card.subconcept;

  // Handle Enter key to advance (only when not focused on other inputs)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      const activeElement = document.activeElement;
      const isTypingInInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA';

      if (e.key === 'Enter' && !isTypingInInput) {
        onContinue();
      }
    },
    [onContinue]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Card className="overflow-hidden border-blue-500/20">
      {/* Blue indicator bar for teaching cards */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

      <CardContent className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              LEARN
            </span>
            <span className="text-[var(--text-tertiary)]">•</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
          </div>

          {/* Explanation */}
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {card.teaching.explanation}
          </p>

          {/* Example code block */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Example
            </span>
            <div className="rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border)] p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap text-[var(--text-primary)]">
                {card.exampleExercise.expectedAnswer}
              </pre>
            </div>
          </div>

          {/* Continue button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={onContinue}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Got it
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
