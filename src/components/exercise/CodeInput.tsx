'use client';

import { CodeEditor } from '@/components/ui/CodeEditor';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

/**
 * CodeInput - A thin wrapper around CodeEditor for exercise answer input.
 *
 * Provides the IDE-styled code editor with exercise-specific defaults:
 * - Line numbers enabled for better code visibility
 * - Auto-focus on mount
 * - Enter to submit, Shift+Enter for newline
 */
export function CodeInput({ value, onChange, onSubmit, disabled = false }: CodeInputProps) {
  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      disabled={disabled}
      showLineNumbers={true}
      autoFocus={true}
      minLines={3}
      placeholder="Type your answer... (Enter to submit, Shift+Enter for newline)"
      aria-label="Code answer input"
    />
  );
}
