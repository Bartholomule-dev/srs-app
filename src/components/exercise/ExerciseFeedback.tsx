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
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Your answer:</p>
          <pre className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-sm overflow-x-auto">
            {userAnswer || <span className="text-neutral-400 italic">(empty)</span>}
          </pre>
        </div>
        {!isCorrect && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Correct answer:</p>
            <pre className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 font-mono text-sm overflow-x-auto">
              {expectedAnswer}
            </pre>
          </div>
        )}
      </div>

      {/* Next Review Info */}
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
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
