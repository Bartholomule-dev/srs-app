/**
 * Converts a Date to UTC date string in YYYY-MM-DD format.
 * Used for streak calculations and date comparisons.
 */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}
