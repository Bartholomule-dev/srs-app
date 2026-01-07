'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { CoachingFeedback } from './CoachingFeedback';

interface ExerciseFeedbackProps {
  isCorrect: boolean;
  userAnswer: string;
  expectedAnswer: string;
  nextReviewDays: number;
  onContinue: () => void;
  /** Optional coaching feedback for construct hints */
  coachingFeedback?: string | null;
}

export function ExerciseFeedback({
  isCorrect,
  userAnswer,
  expectedAnswer,
  nextReviewDays,
  onContinue,
  coachingFeedback,
}: ExerciseFeedbackProps) {
  const dayText = nextReviewDays === 1 ? 'day' : 'days';

  return (
    <div className="space-y-4">
      {/* Result Banner */}
      <Alert variant={isCorrect ? 'success' : 'error'}>
        {isCorrect ? (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
      </Alert>

      {/* Coaching feedback for correct answers that didn't use target construct */}
      {isCorrect && coachingFeedback && (
        <CoachingFeedback feedback={coachingFeedback} className="mt-3" />
      )}

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
            <pre className="p-3 rounded-md bg-[var(--bg-surface-2)] font-mono text-sm overflow-x-auto text-[var(--text-primary)]" data-testid="expected-answer">
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
