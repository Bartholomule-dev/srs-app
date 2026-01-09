'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ContributionDay } from '@/lib/gamification/contribution';
import { CONTRIBUTION_COLORS } from '@/lib/gamification/contribution';

interface ContributionGraphProps {
  days: ContributionDay[];
  loading: boolean;
  /** Collapse on mobile (show only on md+) */
  collapsedMobile?: boolean;
  className?: string;
}

const WEEKS = 52;
const DAYS_PER_WEEK = 7;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/**
 * Generate array of all dates for the past 52 weeks
 */
function generateDateGrid(): string[][] {
  const grid: string[][] = [];
  const today = new Date();

  // Go back to start of 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS * DAYS_PER_WEEK - 1));

  // Align to start of week (Sunday)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  for (let week = 0; week < WEEKS; week++) {
    const weekDates: string[] = [];
    for (let day = 0; day < DAYS_PER_WEEK; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + week * 7 + day);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    grid.push(weekDates);
  }

  return grid;
}

/**
 * Get month labels for the graph header
 */
function getMonthLabels(dateGrid: string[][]): { month: string; week: number }[] {
  const labels: { month: string; week: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < dateGrid.length; week++) {
    const date = new Date(dateGrid[week][0]);
    const month = date.getMonth();
    if (month !== lastMonth) {
      labels.push({ month: MONTHS[month], week });
      lastMonth = month;
    }
  }

  return labels;
}

export function ContributionGraph({
  days,
  loading,
  collapsedMobile = true,
  className,
}: ContributionGraphProps) {
  // Create lookup map for day data
  const dayMap = useMemo(() => {
    const map = new Map<string, ContributionDay>();
    for (const day of days) {
      map.set(day.date, day);
    }
    return map;
  }, [days]);

  const dateGrid = useMemo(() => generateDateGrid(), []);
  const monthLabels = useMemo(() => getMonthLabels(dateGrid), [dateGrid]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-[100px] w-full" />
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className={cn('rounded-lg border border-border-subtle bg-bg-surface-1 p-6 text-center', className)}>
        <p className="text-text-secondary">Start practicing to see your contribution graph!</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'space-y-2',
        collapsedMobile && 'hidden md:block',
        className
      )}
      data-contribution-graph
    >
      {/* Month labels */}
      <div className="flex text-xs text-text-tertiary pl-7">
        {monthLabels.map(({ month, week }, i) => (
          <span
            key={`${month}-${i}`}
            className="flex-shrink-0"
            style={{ marginLeft: i === 0 ? 0 : `${(week - (monthLabels[i - 1]?.week ?? 0)) * 12 - 20}px` }}
          >
            {month}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day of week labels */}
        <div className="flex flex-col gap-[3px] text-xs text-text-tertiary pr-1">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[10px] leading-[10px]">
              {label}
            </div>
          ))}
        </div>

        {/* Contribution grid */}
        <div className="flex gap-[3px]">
          {dateGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((date) => {
                const dayData = dayMap.get(date);
                const level = dayData?.level ?? 'none';

                return (
                  <Tooltip key={date}>
                    <TooltipTrigger asChild>
                      <div
                        data-contribution-day={date}
                        className={cn(
                          'w-[10px] h-[10px] rounded-sm cursor-default',
                          CONTRIBUTION_COLORS[level]
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={4}>
                      {dayData ? (
                        <div className="text-xs">
                          <div className="font-medium">{date}</div>
                          <div>{dayData.count} cards reviewed</div>
                          {dayData.accuracy !== null && (
                            <div>{dayData.accuracy}% accuracy</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs">
                          <div className="font-medium">{date}</div>
                          <div>No activity</div>
                        </div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary justify-end">
        <span>Less</span>
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.none)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.light)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.moderate)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.good)} />
        <div className={cn('w-[10px] h-[10px] rounded-sm', CONTRIBUTION_COLORS.strong)} />
        <span>More</span>
      </div>
    </div>
  );
}
