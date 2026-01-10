// src/lib/session/new-card-ordering.ts
// Dynamic new card limit based on review backlog

/**
 * Calculate how many new cards to show based on review backlog.
 *
 * Formula: max(0, 5 - floor(backlog / 5))
 *
 * This creates a sliding scale:
 * - backlog 0-4:   5 new cards (no pressure)
 * - backlog 5-9:   4 new cards
 * - backlog 10-14: 3 new cards
 * - backlog 15-19: 2 new cards
 * - backlog 20-24: 1 new card
 * - backlog 25+:   0 new cards (focus on reviews)
 *
 * The goal is to prevent backlog from growing out of control
 * while still introducing new material when possible.
 */
export function calculateNewCardLimit(reviewBacklog: number): number {
  // Handle negative backlog as 0
  const normalizedBacklog = Math.max(0, reviewBacklog);
  return Math.max(0, 5 - Math.floor(normalizedBacklog / 5));
}
