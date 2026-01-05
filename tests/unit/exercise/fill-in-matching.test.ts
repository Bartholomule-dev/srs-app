import { describe, it, expect } from 'vitest';
import { checkFillInAnswer } from '@/lib/exercise/matching';

describe('checkFillInAnswer', () => {
  it('matches exact answer', () => {
    const result = checkFillInAnswer('for', 'for');
    expect(result).toBe(true);
  });

  it('trims whitespace', () => {
    const result = checkFillInAnswer('  for  ', 'for');
    expect(result).toBe(true);
  });

  it('is case-sensitive for keywords', () => {
    const result = checkFillInAnswer('For', 'for');
    expect(result).toBe(false);
  });

  it('matches accepted alternatives', () => {
    const result = checkFillInAnswer('i', 'i', ['j', 'x', 'item']);
    expect(result).toBe(true);

    const result2 = checkFillInAnswer('item', 'i', ['j', 'x', 'item']);
    expect(result2).toBe(true);
  });

  it('rejects incorrect answer', () => {
    const result = checkFillInAnswer('while', 'for');
    expect(result).toBe(false);
  });
});
