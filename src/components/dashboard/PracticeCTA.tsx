import Link from 'next/link';

interface PracticeCTAProps {
  dueCount: number;
  newCount: number;
}

export function PracticeCTA({ dueCount, newCount }: PracticeCTAProps) {
  if (dueCount === 0 && newCount === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          All caught up! No cards due right now.
        </p>
        <Link
          href="/practice"
          className="inline-block py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
        >
          Browse exercises
        </Link>
      </div>
    );
  }

  if (dueCount === 0) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
        <p className="text-green-700 dark:text-green-400 font-medium mb-4">
          All caught up! 🎉
        </p>
        <Link
          href="/practice"
          className="inline-block py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
        >
          Learn new cards
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        🎯 {dueCount} cards due • {newCount} new cards available
      </p>
      <Link
        href="/practice"
        className="inline-block py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg"
      >
        Start Practice
      </Link>
    </div>
  );
}
