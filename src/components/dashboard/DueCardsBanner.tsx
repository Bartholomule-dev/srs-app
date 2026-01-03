'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg text-white border-0">
      <CardContent className="p-6">
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
          <Button
            onClick={onStartPractice}
            disabled={loading}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Start Practice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
