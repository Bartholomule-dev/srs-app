// tests/unit/skill-tree/types.test.ts
import { describe, it, expect } from 'vitest';
import {
  SubconceptState,
  SUBCONCEPT_STATES,
  isValidSubconceptState,
} from '@/lib/skill-tree/types';

describe('SubconceptState types', () => {
  it('defines all four states', () => {
    expect(SUBCONCEPT_STATES).toEqual(['locked', 'available', 'in-progress', 'mastered']);
  });

  it('validates valid states', () => {
    expect(isValidSubconceptState('locked')).toBe(true);
    expect(isValidSubconceptState('available')).toBe(true);
    expect(isValidSubconceptState('in-progress')).toBe(true);
    expect(isValidSubconceptState('mastered')).toBe(true);
  });

  it('rejects invalid states', () => {
    expect(isValidSubconceptState('unknown')).toBe(false);
    expect(isValidSubconceptState('')).toBe(false);
    expect(isValidSubconceptState(null)).toBe(false);
  });
});
