'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { SkillTreeNode, SubconceptState } from '@/lib/skill-tree/types';
import { MASTERY_THRESHOLD_DAYS } from '@/lib/skill-tree/types';

interface SubconceptNodeProps {
  node: SkillTreeNode;
  prereqNames?: Record<string, string>;
  className?: string;
}

const stateStyles: Record<SubconceptState, string> = {
  locked: 'opacity-30 border-[var(--text-tertiary)] bg-transparent cursor-not-allowed',
  available: 'border-[var(--accent-primary)] bg-transparent hover:scale-110',
  'in-progress': 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/50 hover:scale-110',
  mastered: 'border-[var(--accent-primary)] bg-[var(--accent-primary)] shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-110',
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

  const handleMouseEnter = useCallback(() => setShowTooltip(true), []);
  const handleMouseLeave = useCallback(() => setShowTooltip(false), []);
  const handleFocus = useCallback(() => setShowTooltip(true), []);
  const handleBlur = useCallback(() => setShowTooltip(false), []);

  const { title, subtitle } = getTooltipContent(node, prereqNames);

  return (
    <div className="relative w-12 h-12 rounded-full">
      <motion.button
        ref={nodeRef}
        className={cn(
          'w-12 h-12 rounded-full border-2 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface-1)]',
          stateStyles[node.state],
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={node.name}
        tabIndex={0}
        whileHover={node.state !== 'locked' ? { scale: 1.1 } : undefined}
        whileTap={node.state !== 'locked' ? { scale: 0.95 } : undefined}
      />

      <AnimatePresence>
        {showTooltip && (
          <motion.div
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
