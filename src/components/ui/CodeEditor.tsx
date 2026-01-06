'use client';

import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  type KeyboardEvent,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export interface CodeEditorProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Current value of the editor */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when Enter is pressed (without Shift) */
  onSubmit?: () => void;
  /** Show line numbers on the left side */
  showLineNumbers?: boolean;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
  /** Minimum number of visible lines */
  minLines?: number;
}

/**
 * CodeEditor - A code editor-styled input component that looks like a mini IDE.
 *
 * Features:
 * - Dark editor surface with focus glow effect
 * - Monospace font (JetBrains Mono)
 * - Optional line numbers
 * - Enter to submit, Shift+Enter for newline
 * - Accessible with aria-label support
 */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  function CodeEditor(
    {
      value,
      onChange,
      onSubmit,
      showLineNumbers = false,
      autoFocus = true,
      disabled = false,
      minLines = 3,
      className,
      'aria-label': ariaLabel = 'Code editor',
      ...props
    },
    ref
  ) {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref via forwarded ref
    useImperativeHandle(ref, () => internalRef.current!, []);

    useEffect(() => {
      if (autoFocus && internalRef.current) {
        internalRef.current.focus();
      }
    }, [autoFocus]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter to submit (without Shift), Shift+Enter for newline
      if (e.key === 'Enter' && !e.shiftKey && !disabled && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    // Calculate line count for line numbers display
    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, minLines);

    return (
      <div
        className={cn(
          'relative rounded-lg overflow-hidden',
          'bg-bg-surface-2 border border-transparent',
          'focus-within:border-accent-primary',
          'focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]',
          'transition-all duration-150',
          "before:absolute before:inset-0 before:bg-[url('/grid.svg')] before:opacity-50 before:pointer-events-none",
          className
        )}
      >
        {showLineNumbers && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-12',
              'flex flex-col items-end pr-3 pt-4',
              'text-text-tertiary font-mono text-sm select-none',
              'border-r border-border'
            )}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i + 1} className="leading-[1.6]">
                {i + 1}
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={internalRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'w-full min-h-[120px] resize-y',
            'bg-transparent text-text-primary',
            'font-mono text-[15px] leading-[1.6]',
            'p-4 outline-none',
            showLineNumbers && 'pl-14',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          {...props}
        />
      </div>
    );
  }
);
