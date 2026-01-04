'use client';

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { Textarea } from '@/components/ui/Textarea';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CodeInput({ value, onChange, onSubmit, disabled = false }: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder="Type your answer... (Enter to submit, Shift+Enter for newline)"
      aria-label="Code answer input"
      monospace
      className="w-full min-h-[100px] resize-y"
    />
  );
}
