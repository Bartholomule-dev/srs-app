'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

interface PracticeCTAProps {
  dueCount: number;
  newCount: number;
}

export function PracticeCTA({ dueCount, newCount }: PracticeCTAProps) {
  if (dueCount === 0 && newCount === 0) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            All caught up! No cards due right now.
          </p>
          <Link
            href="/practice"
            className="inline-block py-2 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
          >
            Browse exercises
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (dueCount === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-6 text-center">
          <p className="text-green-700 dark:text-green-400 font-medium mb-4">
            All caught up! 🎉
          </p>
          <Link
            href="/practice"
            className="inline-block py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
          >
            Learn new cards
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/20">
      <CardContent className="p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          🎯 {dueCount} cards due • {newCount} new cards available
        </p>
        <Link
          href="/practice"
          className="inline-block py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg"
        >
          Start Practice
        </Link>
      </CardContent>
    </Card>
  );
}
