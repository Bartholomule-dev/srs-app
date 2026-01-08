'use client';

import { useState, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ANIMATION_BUDGET } from '@/lib/motion';
import type { SkillTreeNode, SubconceptState } from '@/lib/skill-tree/types';
import {
  MASTERY_STABILITY_STANDARD,
  MASTERY_REPS,
  PROFICIENT_STABILITY,
} from '@/lib/skill-tree/types';

interface SubconceptNodeProps {
  node: SkillTreeNode;
  prereqNames?: Record<string, string>;
  className?: string;
}

const stateStyles: Record<SubconceptState, string> = {
  locked:
    'border border-[var(--text-tertiary)]/30 bg-[var(--bg-surface-2)]/30 ' +
    'opacity-40 cursor-not-allowed',
  available:
    'border-2 border-[var(--accent-primary)] bg-[var(--bg-surface-1)] ' +
    'hover:bg-[var(--bg-surface-2)]',
  'in-progress':
    'border-[3px] border-[var(--accent-primary)] bg-[var(--bg-surface-1)]',
  proficient:
    'border-2 border-emerald-500 bg-[var(--bg-surface-1)]',
  mastered:
    'border-2 border-emerald-500 bg-emerald-500/20',
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
      const reps = node.reps ?? 0;
      return {
        title,
        subtitle: `Stability: ${stability} days, ${reps}/${MASTERY_REPS} reviews`,
      };
    }
    case 'proficient': {
      const stability = node.stability?.toFixed(1) ?? '0';
      const reps = node.reps ?? 0;
      return {
        title,
        subtitle: `Proficient! ${stability} days stability, ${reps}/${MASTERY_REPS} reviews to master`,
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
          'w-12 h-12 rounded-full transition-all',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface-1)]',
          stateStyles[node.state],
          className
        )}
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
        transition={ANIMATION_BUDGET.hover}
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
              'shadow-lg',
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
