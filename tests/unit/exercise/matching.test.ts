// tests/unit/exercise/matching.test.ts
import { describe, it, expect } from 'vitest';
import { normalizePython, checkAnswer, checkAnswerWithAlternatives } from '@/lib/exercise';

describe('normalizePython', () => {
  it('returns empty string for empty input', () => {
    expect(normalizePython('')).toBe('');
  });

  it('normalizes CRLF to LF', () => {
    expect(normalizePython('a\r\nb')).toBe('a\nb');
  });

  it('converts tabs to 4 spaces', () => {
    expect(normalizePython('x\n\tprint(x)')).toBe('x\n    print(x)');
  });

  it('removes trailing spaces per line', () => {
    expect(normalizePython('print(x)   ')).toBe('print(x)');
    expect(normalizePython('a   \nb   ')).toBe('a\nb');
  });

  it('preserves leading spaces (indentation) within multi-line code', () => {
    expect(normalizePython('def foo():\n    print(x)')).toBe('def foo():\n    print(x)');
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
    expect(normalizePython('x\n\t\tprint(x)')).toBe('x\n        print(x)');
  });

  it('trims leading and trailing whitespace from entire answer', () => {
    expect(normalizePython('  print(x)  ')).toBe('print(x)');
    expect(normalizePython('\n\nprint(x)\n\n')).toBe('print(x)');
  });

  it('collapses multiple consecutive blank lines to single blank line', () => {
    const input = 'def foo():\n    pass\n\n\n\ndef bar():\n    pass';
    const expected = 'def foo():\n    pass\n\ndef bar():\n    pass';
    expect(normalizePython(input)).toBe(expected);
  });

  it('handles real-world multi-line with all normalizations', () => {
    const input = '  for i in range(5):\r\n\tprint(i)  \n\n';
    const expected = 'for i in range(5):\n    print(i)';
    expect(normalizePython(input)).toBe(expected);
  });

  it('normalizes comma spacing - adds space after comma', () => {
    expect(normalizePython('[1,2,3]')).toBe('[1, 2, 3]');
  });

  it('normalizes comma spacing - removes excessive spaces', () => {
    expect(normalizePython('[1,  2,   3]')).toBe('[1, 2, 3]');
  });

  it('normalizes comma spacing in dict literals', () => {
    expect(normalizePython('{a:1,b:2}')).toBe('{a: 1, b: 2}');
  });

  it('normalizes pre-colon spacing in dicts', () => {
    expect(normalizePython('{a :1}')).toBe('{a: 1}');
  });

  describe('string literal preservation', () => {
    it('preserves commas inside double-quoted strings', () => {
      expect(normalizePython('print("a,b,c")')).toBe('print("a,b,c")');
    });

    it('preserves commas inside single-quoted strings', () => {
      expect(normalizePython("print('a,b,c')")).toBe("print('a,b,c')");
    });

    it('preserves colons inside strings', () => {
      // The colon BETWEEN "key" and "value" is outside strings (dict colon),
      // so it correctly gets a space added. Only colons INSIDE strings are preserved.
      expect(normalizePython('d = {"key":"value"}')).toBe('d = {"key": "value"}');
    });

    it('preserves colons inside string content', () => {
      // Colon is INSIDE the string here
      expect(normalizePython('s = "time:12:30"')).toBe('s = "time:12:30"');
    });

    it('still normalizes commas in code outside strings', () => {
      expect(normalizePython('print("a,b"),print("c,d")')).toBe('print("a,b"), print("c,d")');
    });

    it('handles escaped quotes inside strings', () => {
      expect(normalizePython('print("he said \\"hi,there\\"")')).toBe('print("he said \\"hi,there\\"")');
    });

    it('handles mixed quotes', () => {
      expect(normalizePython("print('a,b') + print(\"c,d\")")).toBe("print('a,b') + print(\"c,d\")");
    });

    it('handles strings with colons (dict-like)', () => {
      expect(normalizePython('f"{time:02d}:{mins:02d}"')).toBe('f"{time:02d}:{mins:02d}"');
    });
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
      expect(result.normalizedUserAnswer).toBe('print(x)');
      expect(result.normalizedExpectedAnswer).toBe('print(x)');
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

    it('includes matchedAlternative as null', () => {
      const result = checkAnswer('print(x)', 'print(x)');
      expect(result.matchedAlternative).toBeNull();
    });
  });
});

describe('checkAnswerWithAlternatives', () => {
  it('matches against expected_answer', () => {
    const result = checkAnswerWithAlternatives(
      'print(x)',
      'print(x)',
      []
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBeNull();
  });

  it('matches against accepted_solutions', () => {
    const result = checkAnswerWithAlternatives(
      "person['name']",
      'person["name"]',
      ["person['name']"]
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBe("person['name']");
  });

  it('returns false when no match found', () => {
    const result = checkAnswerWithAlternatives(
      'wrong',
      'print(x)',
      ['also_wrong']
    );
    expect(result.isCorrect).toBe(false);
    expect(result.matchedAlternative).toBeNull();
  });

  it('applies normalization to alternatives', () => {
    const result = checkAnswerWithAlternatives(
      '[1,2,3]',
      '[1, 2, 3]',
      ['[1,  2,  3]']
    );
    expect(result.isCorrect).toBe(true);
  });

  it('prefers expected_answer over alternatives', () => {
    const result = checkAnswerWithAlternatives(
      'print(x)',
      'print(x)',
      ['print(x)']  // Same as expected
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBeNull();  // Should match expected, not alt
  });

  it('handles empty acceptedSolutions array', () => {
    const result = checkAnswerWithAlternatives(
      'print(x)',
      'print(y)',
      []
    );
    expect(result.isCorrect).toBe(false);
    expect(result.matchedAlternative).toBeNull();
  });

  it('matches first alternative when multiple could match', () => {
    const result = checkAnswerWithAlternatives(
      'x = 1',
      'y = 1',
      ['x = 1', 'x=1']  // Both normalize to same, but first should be returned
    );
    expect(result.isCorrect).toBe(true);
    expect(result.matchedAlternative).toBe('x = 1');
  });
});
