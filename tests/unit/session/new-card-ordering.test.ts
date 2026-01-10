// tests/unit/session/new-card-ordering.test.ts
import { describe, it, expect } from 'vitest';
import { calculateNewCardLimit } from '@/lib/session/new-card-ordering';

describe('calculateNewCardLimit', () => {
  it('returns 5 when backlog is 0', () => {
    expect(calculateNewCardLimit(0)).toBe(5);
  });

  it('returns 5 when backlog is 1-4', () => {
    expect(calculateNewCardLimit(1)).toBe(5);
    expect(calculateNewCardLimit(4)).toBe(5);
  });

  it('returns 4 when backlog is 5-9', () => {
    expect(calculateNewCardLimit(5)).toBe(4);
    expect(calculateNewCardLimit(9)).toBe(4);
  });

  it('returns 3 when backlog is 10-14', () => {
    expect(calculateNewCardLimit(10)).toBe(3);
    expect(calculateNewCardLimit(14)).toBe(3);
  });

  it('returns 2 when backlog is 15-19', () => {
    expect(calculateNewCardLimit(15)).toBe(2);
    expect(calculateNewCardLimit(19)).toBe(2);
  });

  it('returns 1 when backlog is 20-24', () => {
    expect(calculateNewCardLimit(20)).toBe(1);
    expect(calculateNewCardLimit(24)).toBe(1);
  });

  it('returns 0 when backlog is 25 or more', () => {
    expect(calculateNewCardLimit(25)).toBe(0);
    expect(calculateNewCardLimit(100)).toBe(0);
  });

  it('handles edge case of negative backlog (treats as 0)', () => {
    expect(calculateNewCardLimit(-1)).toBe(5);
  });
});
