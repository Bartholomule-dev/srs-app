'use client';

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

/** Represents a part of the parsed template */
interface TemplatePart {
  type: 'text' | 'blank';
  content: string;
  index?: number; // Index for blank parts (0-indexed)
}

/**
 * Parse a template string and identify ___ blanks.
 * Returns an array of template parts with text and blank segments.
 */
function parseTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  const blankPattern = /___/g;
  let lastIndex = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blankPattern.exec(template)) !== null) {
    // Add text before the blank
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: template.slice(lastIndex, match.index),
      });
    }

    // Add the blank
    parts.push({
      type: 'blank',
      content: '___',
      index: blankIndex++,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last blank
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      content: template.slice(lastIndex),
    });
  }

  return parts;
}

export interface FillInExerciseProps {
  /** Template string with ___ blanks */
  template: string;
  /** Which blank is active for input (0-indexed) */
  blankPosition: number;
  /** Current answer value (controlled) */
  value: string;
  /** Callback when answer changes */
  onChange: (value: string) => void;
  /** Callback when user submits their answer (on Enter) */
  onSubmit: (value: string) => void;
  /** Disable the input */
  disabled?: boolean;
  /** Optional CSS classes for the container */
  className?: string;
}

/**
 * FillInExercise - A code template component with inline input for blanks.
 *
 * Displays a code template with ___ placeholders. The active blank (specified
 * by blankPosition) shows an inline input field. Other blanks show as
 * highlighted placeholders.
 *
 * Features:
 * - Parses template to identify blanks
 * - Inline input at active blank position
 * - Enter key to submit
 * - Auto-focus on mount
 * - Monospace font for code display
 */
export function FillInExercise({
  template,
  blankPosition,
  value,
  onChange,
  onSubmit,
  disabled = false,
  className,
}: FillInExerciseProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      onSubmit(value);
    }
  };

  const parts = parseTemplate(template);

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden',
        'bg-bg-surface-2 border border-transparent',
        'focus-within:border-accent-primary',
        'focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]',
        'transition-all duration-150',
        className
      )}
    >
      <pre
        className={cn(
          'p-4',
          'font-mono text-[15px] leading-[1.6]',
          'text-text-primary',
          'whitespace-pre-wrap'
        )}
      >
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx}>{part.content}</span>;
          }

          // Blank part
          if (part.index === blankPosition) {
            // Active blank - show input
            return (
              <input
                key={idx}
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={cn(
                  'inline-block min-w-[3ch] px-1',
                  'bg-bg-surface-3 border border-accent-primary rounded',
                  'font-mono text-[15px] leading-[1.4]',
                  'text-text-primary',
                  'outline-none',
                  'placeholder:text-text-tertiary',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                placeholder="___"
                aria-label="Fill in the blank"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            );
          }

          // Inactive blank - show placeholder
          return (
            <span
              key={idx}
              className={cn(
                'inline-block px-1',
                'text-text-tertiary',
                'border-b border-dashed border-text-tertiary'
              )}
            >
              ___
            </span>
          );
        })}
      </pre>
    </div>
  );
}
