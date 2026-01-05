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
      <Card className="bg-[var(--bg-surface-2)]">
        <CardContent className="p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            All caught up! No cards due right now.
          </p>
          <Link
            href="/practice"
            className="inline-block py-2 px-6 bg-[var(--bg-surface-3)] hover:bg-[var(--bg-surface-3)]/80 text-white font-medium rounded-lg"
          >
            Browse exercises
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (dueCount === 0) {
    return (
      <Card className="bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20">
        <CardContent className="p-6 text-center">
          <p className="text-[var(--accent-success)] font-medium mb-4">
            All caught up!
          </p>
          <Link
            href="/practice"
            className="inline-block py-3 px-8 bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 text-white font-medium rounded-lg"
          >
            Learn new cards
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
      <CardContent className="p-6">
        <p className="text-[var(--text-secondary)] mb-4">
          {dueCount} cards due - {newCount} new cards available
        </p>
        <Link
          href="/practice"
          className="inline-block py-3 px-8 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white font-semibold rounded-lg text-lg"
        >
          Start Practice
        </Link>
      </CardContent>
    </Card>
  );
}
