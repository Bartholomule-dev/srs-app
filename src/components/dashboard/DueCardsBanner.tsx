'use client';

interface DueCardsBannerProps {
  /** Number of cards due for review */
  dueCount: number;
  /** Number of new cards to learn */
  newCount: number;
  /** Callback to start practice session */
  onStartPractice: () => void;
  /** Whether data is still loading */
  loading?: boolean;
}

export function DueCardsBanner({
  dueCount,
  newCount,
  onStartPractice,
  loading = false,
}: DueCardsBannerProps) {
  const totalCards = dueCount + newCount;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Ready to Practice?</h2>
          <div className="flex gap-4 text-sm">
            <span>
              <strong>{dueCount}</strong> due
            </span>
            <span>
              <strong>{newCount}</strong> new
            </span>
            <span className="text-blue-100">({totalCards} cards total)</span>
          </div>
        </div>
        <button
          onClick={onStartPractice}
          disabled={loading}
          className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}
