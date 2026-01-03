'use client';

type EmptyStateVariant = 'all-caught-up' | 'mastered-all';

interface EmptyStateProps {
  /** Which empty state to show */
  variant: EmptyStateVariant;
  /** Number of new cards available (for all-caught-up variant) */
  newCardsAvailable?: number;
  /** Callback to start learning new cards */
  onLearnNew?: () => void;
}

export function EmptyState({
  variant,
  newCardsAvailable = 0,
  onLearnNew,
}: EmptyStateProps) {
  if (variant === 'all-caught-up') {
    return (
      <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
          All Caught Up!
        </h2>
        <p className="text-green-600 dark:text-green-400 mb-4">
          You&apos;ve reviewed all your due cards. Great work!
        </p>
        {newCardsAvailable > 0 && onLearnNew && (
          <button
            onClick={onLearnNew}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Learn {newCardsAvailable} New Cards
          </button>
        )}
      </div>
    );
  }

  // mastered-all variant
  return (
    <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
      <div className="text-4xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
        You&apos;ve Mastered Everything!
      </h2>
      <p className="text-yellow-600 dark:text-yellow-400">
        Amazing! Come back tomorrow for your next review.
      </p>
    </div>
  );
}
