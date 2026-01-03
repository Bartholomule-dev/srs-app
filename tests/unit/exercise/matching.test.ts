// tests/unit/exercise/matching.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePython } from '@/lib/exercise';

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
