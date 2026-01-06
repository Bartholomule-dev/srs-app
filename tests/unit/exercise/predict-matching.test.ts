import { describe, it, expect } from 'vitest';
import { checkPredictAnswer } from '@/lib/exercise/matching';

describe('checkPredictAnswer', () => {
  it('returns true for exact match', () => {
    expect(checkPredictAnswer('10', '10')).toBe(true);
  });

  it('trims whitespace from user answer', () => {
    expect(checkPredictAnswer('  10  ', '10')).toBe(true);
  });

  it('trims trailing newlines', () => {
    expect(checkPredictAnswer('10\n', '10')).toBe(true);
    expect(checkPredictAnswer('10\n\n', '10')).toBe(true);
  });

  it('preserves case sensitivity (Python is case-sensitive)', () => {
    expect(checkPredictAnswer('True', 'True')).toBe(true);
    expect(checkPredictAnswer('true', 'True')).toBe(false);
    expect(checkPredictAnswer('TRUE', 'True')).toBe(false);
  });

  it('returns false for different values', () => {
    expect(checkPredictAnswer('10', '20')).toBe(false);
    expect(checkPredictAnswer('10', '10.0')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(checkPredictAnswer('', '')).toBe(true);
    expect(checkPredictAnswer('  ', '')).toBe(true);
    expect(checkPredictAnswer('', 'something')).toBe(false);
  });

  it('handles multi-line output', () => {
    expect(checkPredictAnswer('hello\nworld', 'hello\nworld')).toBe(true);
    expect(checkPredictAnswer('hello\nworld\n', 'hello\nworld')).toBe(true);
  });

  it('checks accepted alternatives', () => {
    expect(checkPredictAnswer('10', '10', ['ten', '10'])).toBe(true);
    expect(checkPredictAnswer('ten', '10', ['ten', '10'])).toBe(true);
    expect(checkPredictAnswer('TEN', '10', ['ten', '10'])).toBe(false);
  });
});
