'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// SVG Icons
function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2c0 4.5-3 7.5-3 11 0 2.5 1.5 4.5 3.5 5 2-.5 3.5-2.5 3.5-5 0-3.5-3-6.5-3-11z" />
      <path d="M12 13c0 2 1 3 2 3.5 1-.5 2-1.5 2-3.5 0-1.5-1-3-2-4-1 1-2 2.5-2 4z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M4 22h16" />
      <path d="M10 22V10.5a2 2 0 0 1 4 0V22" />
      <rect x="6" y="3" width="12" height="8" rx="1" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// Progress Ring component
interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      className={cn('transform -rotate-90', className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--bg-surface-3)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring with animation */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--accent-primary)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.6s ease-out',
        }}
      />
    </svg>
  );
}

export type StatsIconType = 'fire' | 'target' | 'trophy' | 'check' | 'chart';

export interface StatsCardProps {
  /** Label text displayed above the value */
  label: string;
  /** The stat value to display */
  value: number;
  /** Optional suffix (e.g., "%" for percentage) */
  suffix?: string;
  /** Icon identifier */
  icon?: StatsIconType;
  /** Optional trend value (positive or negative) */
  trend?: number;
  /** Show circular progress ring instead of icon (for accuracy stat) */
  showRing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const iconMap: Record<StatsIconType, React.ComponentType<{ className?: string }>> = {
  fire: FlameIcon,
  target: TargetIcon,
  trophy: TrophyIcon,
  check: CheckCircleIcon,
  chart: ChartIcon,
};

// Map icons to accent colors
const iconColorMap: Record<StatsIconType, string> = {
  fire: 'text-[var(--accent-warning)]',
  target: 'text-[var(--accent-primary)]',
  trophy: 'text-[var(--accent-success)]',
  check: 'text-[var(--accent-primary)]',
  chart: 'text-[var(--accent-primary)]',
};

export function StatsCard({
  label,
  value,
  suffix = '',
  icon,
  trend,
  showRing = false,
  className = '',
}: StatsCardProps) {
  const IconComponent = icon ? iconMap[icon] : null;
  const iconColor = icon ? iconColorMap[icon] : '';

  return (
    <Card interactive elevation={2} className={cn('min-h-[120px]', className)}>
      <CardContent className="p-5 h-full flex flex-col justify-between">
        {/* Top row: Icon/Ring and Label */}
        <div className="flex items-center justify-between mb-3">
          {/* Icon or Progress Ring */}
          {showRing ? (
            <div className="relative">
              <ProgressRing value={value} size={40} strokeWidth={3} />
            </div>
          ) : IconComponent ? (
            <div className="relative">
              {/* Subtle glow behind icon */}
              <div
                className={cn(
                  'absolute inset-0 blur-md opacity-30 rounded-full',
                  icon === 'fire' && 'bg-[var(--accent-warning)]',
                  icon === 'target' && 'bg-[var(--accent-primary)]',
                  icon === 'trophy' && 'bg-[var(--accent-success)]',
                  icon === 'check' && 'bg-[var(--accent-primary)]',
                  icon === 'chart' && 'bg-[var(--accent-primary)]'
                )}
              />
              <IconComponent className={cn('w-8 h-8 relative', iconColor)} />
            </div>
          ) : null}

          {/* Label */}
          <span className="text-sm text-[var(--text-secondary)] font-medium">
            {label}
          </span>
        </div>

        {/* Bottom row: Value and Trend */}
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold font-display text-[var(--text-primary)]">
            {value}
            {suffix && <span className="text-xl ml-0.5">{suffix}</span>}
          </span>

          {/* Trend indicator */}
          {trend !== undefined && trend !== 0 && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-sm font-medium',
                trend > 0 && 'text-[var(--accent-success)]',
                trend < 0 && 'text-[var(--accent-error)]'
              )}
            >
              <span>{trend > 0 ? '+' : ''}{trend}</span>
              <svg
                className={cn('w-4 h-4', trend < 0 && 'rotate-180')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
