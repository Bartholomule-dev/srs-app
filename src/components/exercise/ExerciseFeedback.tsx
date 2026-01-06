'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  userAnswer: string;
  expectedAnswer: string;
  nextReviewDays: number;
  onContinue: () => void;
}

export function ExerciseFeedback({
  isCorrect,
  userAnswer,
  expectedAnswer,
  nextReviewDays,
  onContinue,
}: ExerciseFeedbackProps) {
  const dayText = nextReviewDays === 1 ? 'day' : 'days';

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <Alert variant={isCorrect ? 'success' : 'error'}>
        <span className="text-xl" aria-hidden="true">
          {isCorrect ? '\u2713' : '\u2717'}
        </span>
        <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
      </Alert>

      {/* Answer Display */}
      <div className={isCorrect ? 'space-y-2' : 'grid grid-cols-2 gap-4'}>
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-1">Your answer:</p>
          <pre className="p-3 rounded-md bg-[var(--bg-surface-2)] font-mono text-sm overflow-x-auto text-[var(--text-primary)]">
            {userAnswer || <span className="text-[var(--text-tertiary)] italic">(empty)</span>}
          </pre>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Correct answer:</p>
            <pre className="p-3 rounded-md bg-[var(--bg-surface-2)] font-mono text-sm overflow-x-auto text-[var(--text-primary)]">
              {expectedAnswer}
            </pre>
          </div>
        )}
      </div>

      {/* Next Review Info */}
      <p className="text-sm text-[var(--text-secondary)]">
        Next review: {nextReviewDays} {dayText}
      </p>

      {/* Continue Button */}
      <Button
        type="button"
        variant="primary"
        onClick={onContinue}
        className="w-full"
      >
        Continue
      </Button>
    </div>
  );
}
