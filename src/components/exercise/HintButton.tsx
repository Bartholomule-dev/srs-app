'use client';

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
      <button
        type="button"
        onClick={onReveal}
        disabled={disabled || revealed}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border transition-colors ${
          revealed
            ? 'opacity-50 cursor-not-allowed border-neutral-300 dark:border-neutral-700 text-neutral-500'
            : 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
        }`}
        aria-label={revealed ? 'Hint revealed' : 'Show hint'}
      >
        <span aria-hidden="true">💡</span>
        <span>Hint</span>
      </button>
      {!revealed && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Using a hint affects your score
        </p>
      )}
      {revealed && (
        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          {hint}
        </div>
      )}
    </div>
  );
}
