'use client';

import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface HintButtonProps {
  hint: string;
  revealed: boolean;
  onReveal: () => void;
  disabled?: boolean;
}

export function HintButton({ hint, revealed, onReveal, disabled = false }: HintButtonProps) {
  if (!hint) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onReveal}
        disabled={disabled || revealed}
        aria-label={revealed ? 'Hint revealed' : 'Show hint'}
        className={revealed ? 'opacity-50' : ''}
      >
        <span aria-hidden="true">💡</span>
        <span>Hint</span>
      </Button>
      {!revealed && (
        <p className="text-xs text-[var(--text-tertiary)]">
          Using a hint affects your score
        </p>
      )}
      {revealed && (
        <Alert variant="warning" className="text-sm">
          {hint}
        </Alert>
      )}
    </div>
  );
}
