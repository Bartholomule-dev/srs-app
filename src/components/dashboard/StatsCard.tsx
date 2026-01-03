'use client';

import { Card, CardContent } from '@/components/ui/Card';

export interface StatsCardProps {
  /** Label text displayed above the value */
  label: string;
  /** The stat value to display */
  value: number;
  /** Optional suffix (e.g., "%" for percentage) */
  suffix?: string;
  /** Icon identifier: 'fire', 'target', 'trophy', 'check' */
  icon?: 'fire' | 'target' | 'trophy' | 'check';
  /** Additional CSS classes */
  className?: string;
}

const iconMap: Record<string, string> = {
  fire: '🔥',
  target: '🎯',
  trophy: '🏆',
  check: '✓',
};

export function StatsCard({
  label,
  value,
  suffix = '',
  icon,
  className = '',
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className="text-lg" aria-hidden="true">{iconMap[icon]}</span>}
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
          {suffix}
        </div>
      </CardContent>
    </Card>
  );
}
