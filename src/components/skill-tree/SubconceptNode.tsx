'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SkillTreeNode, SubconceptState } from '@/lib/skill-tree/types';
import { MASTERY_THRESHOLD_DAYS } from '@/lib/skill-tree/types';

interface SubconceptNodeProps {
  node: SkillTreeNode;
  prereqNames?: Record<string, string>;
  className?: string;
}

const stateStyles: Record<SubconceptState, string> = {
  locked:
    'opacity-40 border-[var(--text-tertiary)]/30 bg-[var(--bg-surface-2)]/30 cursor-not-allowed grayscale',
  available:
    'border-[var(--accent-primary)]/60 bg-[var(--bg-surface-1)]/50 backdrop-blur-sm ' +
    'shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] ' +
    'hover:border-[var(--accent-primary)]',
  'in-progress':
    'border-[var(--accent-primary)] bg-gradient-to-br from-[var(--accent-primary)]/30 to-[var(--accent-secondary)]/20 ' +
    'backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  mastered:
    'border-transparent bg-gradient-to-br from-amber-400 to-orange-500 ' +
    'shadow-[0_0_25px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]',
};

function getTooltipContent(
  node: SkillTreeNode,
  prereqNames?: Record<string, string>
): { title: string; subtitle: string } {
  const title = node.name;

  switch (node.state) {
    case 'locked': {
      const names = node.prereqs
        .map((slug) => prereqNames?.[slug] ?? slug)
        .join(', ');
      return { title, subtitle: `Requires: ${names}` };
    }
    case 'available':
      return { title, subtitle: 'Ready to learn' };
    case 'in-progress': {
      const stability = node.stability?.toFixed(1) ?? '0';
      return {
        title,
        subtitle: `Stability: ${stability} days (${MASTERY_THRESHOLD_DAYS} days to master)`,
      };
    }
    case 'mastered': {
      return { title, subtitle: 'Mastered!' };
    }
  }
}

export function SubconceptNode({
  node,
  prereqNames,
  className,
}: SubconceptNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const reduceMotion = useReducedMotion();

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);
  const handleFocus = useCallback(() => setShowTooltip(true), []);
  const handleBlur = useCallback(() => setShowTooltip(false), []);

  const { title, subtitle } = getTooltipContent(node, prereqNames);

  return (
    <div className="relative w-12 h-12 rounded-full">
      <motion.button
        ref={nodeRef}
        type="button"
        className={cn(
          'w-12 h-12 rounded-full border-2 transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface-1)]',
          stateStyles[node.state],
          className
        )}
        animate={
          node.state === 'available' && !reduceMotion
            ? {
                boxShadow: [
                  '0 0 15px rgba(245,158,11,0.15)',
                  '0 0 20px rgba(245,158,11,0.3)',
                  '0 0 15px rgba(245,158,11,0.15)',
                ],
              }
            : undefined
        }
        transition={
          node.state === 'available' && !reduceMotion
            ? {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={node.name}
        aria-describedby={showTooltip ? tooltipId : undefined}
        aria-disabled={node.state === 'locked'}
        tabIndex={node.state === 'locked' ? -1 : 0}
        whileHover={node.state !== 'locked' && !reduceMotion ? { scale: 1.1 } : undefined}
        whileTap={node.state !== 'locked' && !reduceMotion ? { scale: 0.95 } : undefined}
      />

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2',
              'px-3 py-2 rounded-lg',
              'bg-[var(--bg-surface-3)] border border-[var(--border)]',
              'shadow-lg backdrop-blur-sm',
              'whitespace-nowrap pointer-events-none'
            )}
          >
            <div className="font-medium text-sm text-[var(--text-primary)]">
              {title}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{subtitle}</div>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[var(--bg-surface-3)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
