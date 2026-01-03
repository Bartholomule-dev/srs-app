'use client';

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
      <div
        role="alert"
        className={`flex items-center gap-2 p-4 rounded-lg ${
          isCorrect
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}
      >
        <span className="text-xl" aria-hidden="true">
          {isCorrect ? '✓' : '✗'}
        </span>
        <span className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
      </div>

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
      <button
        type="button"
        onClick={onContinue}
        className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Continue →
      </button>
    </div>
  );
}
