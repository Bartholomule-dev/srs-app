// tests/unit/exercise/matching.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePython, checkAnswer } from '@/lib/exercise';

describe('normalizePython', () => {
  it('returns empty string for empty input', () => {
    expect(normalizePython('')).toBe('');
  });

  it('normalizes CRLF to LF', () => {
    expect(normalizePython('a\r\nb')).toBe('a\nb');
  });

  it('converts tabs to 4 spaces', () => {
    expect(normalizePython('\tprint(x)')).toBe('    print(x)');
  });

  it('removes trailing spaces per line', () => {
    expect(normalizePython('print(x)   ')).toBe('print(x)');
    expect(normalizePython('a   \nb   ')).toBe('a\nb');
  });

  it('preserves leading spaces (indentation)', () => {
    expect(normalizePython('    print(x)')).toBe('    print(x)');
  });

  it('preserves internal spaces', () => {
    expect(normalizePython('x = 1')).toBe('x = 1');
  });

  it('handles complex multi-line code', () => {
    const input = 'def foo():\r\n\treturn 1   ';
    const expected = 'def foo():\n    return 1';
    expect(normalizePython(input)).toBe(expected);
  });

  it('normalizes multiple consecutive tabs', () => {
    expect(normalizePython('\t\tprint(x)')).toBe('        print(x)');
  });
});

describe('checkAnswer', () => {
  describe('exact match', () => {
    it('returns correct for identical answers', () => {
      const result = checkAnswer('print(x)', 'print(x)');
      expect(result.isCorrect).toBe(true);
      expect(result.usedAstMatch).toBe(false);
    });

    it('returns incorrect for different answers', () => {
      const result = checkAnswer('print x', 'print(x)');
      expect(result.isCorrect).toBe(false);
    });

    it('is case-sensitive', () => {
      const result = checkAnswer('Print(x)', 'print(x)');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('normalized match', () => {
    it('matches after CRLF normalization', () => {
      const result = checkAnswer('a\r\nb', 'a\nb');
      expect(result.isCorrect).toBe(true);
      expect(result.usedAstMatch).toBe(false);
    });

    it('matches after tab normalization', () => {
      const result = checkAnswer('\tprint(x)', '    print(x)');
      expect(result.isCorrect).toBe(true);
    });

    it('matches after trailing space removal', () => {
      const result = checkAnswer('print(x)   ', 'print(x)');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('result properties', () => {
    it('includes normalized versions of both answers', () => {
      const result = checkAnswer('\tprint(x)  ', '    print(x)');
      expect(result.normalizedUserAnswer).toBe('    print(x)');
      expect(result.normalizedExpectedAnswer).toBe('    print(x)');
    });

    it('includes normalized versions even when incorrect', () => {
      const result = checkAnswer('wrong', 'print(x)');
      expect(result.normalizedUserAnswer).toBe('wrong');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
    });
  });

  describe('edge cases', () => {
    it('handles empty user answer', () => {
      const result = checkAnswer('', 'print(x)');
      expect(result.isCorrect).toBe(false);
      expect(result.normalizedUserAnswer).toBe('');
    });

    it('handles multi-line code', () => {
      const user = 'def foo():\n    return 1';
      const expected = 'def foo():\n    return 1';
      const result = checkAnswer(user, expected);
      expect(result.isCorrect).toBe(true);
    });

    it('handles whitespace-only differences in multi-line', () => {
      const user = 'def foo():\r\n\treturn 1   ';
      const expected = 'def foo():\n    return 1';
      const result = checkAnswer(user, expected);
      expect(result.isCorrect).toBe(true);
    });
  });
});
