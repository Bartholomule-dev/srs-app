'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { ANIMATION_BUDGET } from '@/lib/motion';

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

// Animated counter component - simplified to basic state-based counting
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  variant?: 'hero' | 'supporting';
}

// Check if we're in a test environment
const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

function AnimatedCounter({ value, suffix = '', variant = 'supporting' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // In test environment, skip animation entirely
    if (isTestEnv) {
      setDisplayValue(value);
      return;
    }

    // Simple state-based counting animation
    const startValue = displayValue;
    const endValue = value;
    const duration = 300; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // In test environment, just show the value immediately
  const shownValue = isTestEnv ? value : displayValue;

  const textSizeClass = variant === 'hero' ? 'text-4xl' : 'text-2xl';
  const suffixSizeClass = variant === 'hero' ? 'text-2xl' : 'text-lg';

  return (
    <span className={cn(textSizeClass, 'font-bold font-display text-[var(--text-primary)]')}>
      {shownValue}
      {suffix && <span className={cn(suffixSizeClass, 'ml-0.5')}>{suffix}</span>}
    </span>
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
  /** Card variant: 'hero' for large display, 'supporting' for smaller display */
  variant?: 'hero' | 'supporting';
  /** Additional CSS classes */
  className?: string;
  /** Animation delay for staggered entrance */
  delay?: number;
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
  variant = 'supporting',
  className = '',
  delay = 0,
}: StatsCardProps) {
  const IconComponent = icon ? iconMap[icon] : null;
  const iconColor = icon ? iconColorMap[icon] : '';

  const isHero = variant === 'hero';
  const paddingClass = isHero ? 'p-6' : 'p-4';
  const minHeightClass = isHero ? 'min-h-[140px]' : 'min-h-[100px]';
  const iconSizeClass = isHero ? 'w-10 h-10' : 'w-6 h-6';
  const labelSizeClass = isHero ? 'text-base' : 'text-sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ANIMATION_BUDGET.stateChange, delay }}
    >
      <Card interactive elevation={2} className={cn(minHeightClass, 'overflow-hidden', className)}>
        <CardContent className={cn(paddingClass, 'h-full flex flex-col justify-between')}>
          {/* Top row: Icon and Label */}
          <div className="flex items-center justify-between mb-3">
            {/* Icon */}
            {IconComponent && (
              <IconComponent className={cn(iconSizeClass, iconColor)} />
            )}

            {/* Label */}
            <span className={cn(labelSizeClass, 'text-[var(--text-secondary)] font-medium uppercase tracking-[0.05em]')}>
              {label}
            </span>
          </div>

          {/* Bottom row: Value and Trend */}
          <div className="flex items-end justify-between">
            <AnimatedCounter value={value} suffix={suffix} variant={variant} />

            {/* Trend indicator */}
            {trend !== undefined && trend !== 0 && (
              <motion.div
                className={cn(
                  'flex items-center gap-0.5 text-sm font-medium',
                  trend > 0 && 'text-[var(--accent-success)]',
                  trend < 0 && 'text-[var(--accent-error)]'
                )}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...ANIMATION_BUDGET.stateChange, delay: delay + 0.1 }}
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
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
