// tests/unit/exercise/construct-check.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkConstruct,
  checkAnyConstruct,
  CONSTRUCT_PATTERNS,
} from '@/lib/exercise/construct-check';
import type { ConstructType } from '@/lib/generators/types';

describe('construct-check', () => {
  describe('CONSTRUCT_PATTERNS', () => {
    it('should define patterns for all construct types', () => {
      const expectedConstructs: ConstructType[] = [
        'slice',
        'comprehension',
        'f-string',
        'ternary',
        'enumerate',
        'zip',
        'lambda',
        'generator-expr',
      ];

      for (const construct of expectedConstructs) {
        expect(CONSTRUCT_PATTERNS[construct]).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('checkConstruct', () => {
    describe('slice construct', () => {
      it('should detect basic slice s[1:4]', () => {
        const result = checkConstruct('s[1:4]', 'slice');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('slice');
      });

      it('should detect slice with start only s[1:]', () => {
        const result = checkConstruct('s[1:]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect slice with end only s[:4]', () => {
        const result = checkConstruct('s[:4]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect slice with step s[::2]', () => {
        const result = checkConstruct('s[::2]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect slice with all parts s[1:4:2]', () => {
        const result = checkConstruct('s[1:4:2]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect negative slice s[-3:-1]', () => {
        const result = checkConstruct('s[-3:-1]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect reverse slice s[::-1]', () => {
        const result = checkConstruct('s[::-1]', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect slice in larger expression', () => {
        const result = checkConstruct('result = items[2:5] + other', 'slice');
        expect(result.detected).toBe(true);
      });

      it('should NOT detect simple index s[0]', () => {
        const result = checkConstruct('s[0]', 'slice');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect negative index s[-1]', () => {
        const result = checkConstruct('s[-1]', 'slice');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect dict access d["key"]', () => {
        const result = checkConstruct('d["key"]', 'slice');
        expect(result.detected).toBe(false);
      });
    });

    describe('comprehension construct', () => {
      it('should detect list comprehension [x for x in items]', () => {
        const result = checkConstruct('[x for x in items]', 'comprehension');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('comprehension');
      });

      it('should detect list comprehension with condition', () => {
        const result = checkConstruct(
          '[x for x in items if x > 0]',
          'comprehension'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect list comprehension with expression', () => {
        const result = checkConstruct(
          '[x * 2 for x in range(10)]',
          'comprehension'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect dict comprehension {k: v for k, v in items}', () => {
        const result = checkConstruct(
          '{k: v for k, v in items}',
          'comprehension'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect set comprehension {x for x in items}', () => {
        const result = checkConstruct('{x for x in items}', 'comprehension');
        expect(result.detected).toBe(true);
      });

      it('should detect nested comprehension', () => {
        const result = checkConstruct(
          '[x for row in matrix for x in row]',
          'comprehension'
        );
        expect(result.detected).toBe(true);
      });

      it('should NOT detect regular for loop', () => {
        const result = checkConstruct('for x in items: print(x)', 'comprehension');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect generator expression', () => {
        const result = checkConstruct('(x for x in items)', 'comprehension');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect empty list []', () => {
        const result = checkConstruct('[]', 'comprehension');
        expect(result.detected).toBe(false);
      });
    });

    describe('f-string construct', () => {
      it('should detect basic f-string f"Hello {name}"', () => {
        const result = checkConstruct('f"Hello {name}"', 'f-string');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('f-string');
      });

      it('should detect f-string with single quotes', () => {
        const result = checkConstruct("f'Hello {name}'", 'f-string');
        expect(result.detected).toBe(true);
      });

      it('should detect f-string with expression', () => {
        const result = checkConstruct('f"Sum: {a + b}"', 'f-string');
        expect(result.detected).toBe(true);
      });

      it('should detect f-string with format spec', () => {
        const result = checkConstruct('f"Value: {x:.2f}"', 'f-string');
        expect(result.detected).toBe(true);
      });

      it('should detect f-string with multiple interpolations', () => {
        const result = checkConstruct('f"{first} {last}"', 'f-string');
        expect(result.detected).toBe(true);
      });

      it('should NOT detect regular string "Hello {name}"', () => {
        const result = checkConstruct('"Hello {name}"', 'f-string');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect .format() call', () => {
        const result = checkConstruct('"Hello {}".format(name)', 'f-string');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect string without interpolation f"Hello"', () => {
        const result = checkConstruct('f"Hello"', 'f-string');
        expect(result.detected).toBe(false);
      });
    });

    describe('ternary construct', () => {
      it('should detect basic ternary x if cond else y', () => {
        const result = checkConstruct('x if cond else y', 'ternary');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('ternary');
      });

      it('should detect ternary with expressions', () => {
        const result = checkConstruct('a + 1 if x > 0 else b - 1', 'ternary');
        expect(result.detected).toBe(true);
      });

      it('should detect ternary in assignment', () => {
        const result = checkConstruct('result = "yes" if flag else "no"', 'ternary');
        expect(result.detected).toBe(true);
      });

      it('should detect ternary with function calls', () => {
        const result = checkConstruct('max(a) if items else 0', 'ternary');
        expect(result.detected).toBe(true);
      });

      it('should NOT detect regular if statement', () => {
        const result = checkConstruct('if cond: x', 'ternary');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect if-else block', () => {
        const result = checkConstruct('if cond:\n  x\nelse:\n  y', 'ternary');
        expect(result.detected).toBe(false);
      });
    });

    describe('enumerate construct', () => {
      it('should detect enumerate(items)', () => {
        const result = checkConstruct('enumerate(items)', 'enumerate');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('enumerate');
      });

      it('should detect enumerate with start', () => {
        const result = checkConstruct('enumerate(items, start=1)', 'enumerate');
        expect(result.detected).toBe(true);
      });

      it('should detect enumerate in for loop', () => {
        const result = checkConstruct(
          'for i, x in enumerate(items):',
          'enumerate'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect enumerate in list comprehension', () => {
        const result = checkConstruct(
          '[f"{i}: {x}" for i, x in enumerate(items)]',
          'enumerate'
        );
        expect(result.detected).toBe(true);
      });

      it('should NOT detect word containing enumerate', () => {
        const result = checkConstruct('reenumerate_items()', 'enumerate');
        expect(result.detected).toBe(false);
      });
    });

    describe('zip construct', () => {
      it('should detect zip(a, b)', () => {
        const result = checkConstruct('zip(a, b)', 'zip');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('zip');
      });

      it('should detect zip with multiple iterables', () => {
        const result = checkConstruct('zip(a, b, c)', 'zip');
        expect(result.detected).toBe(true);
      });

      it('should detect zip in for loop', () => {
        const result = checkConstruct('for x, y in zip(a, b):', 'zip');
        expect(result.detected).toBe(true);
      });

      it('should detect list(zip(...))', () => {
        const result = checkConstruct('list(zip(names, values))', 'zip');
        expect(result.detected).toBe(true);
      });

      it('should NOT detect zipfile or similar', () => {
        const result = checkConstruct('zipfile.open()', 'zip');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect unzip function', () => {
        const result = checkConstruct('unzip(data)', 'zip');
        expect(result.detected).toBe(false);
      });
    });

    describe('lambda construct', () => {
      it('should detect lambda x: x*2', () => {
        const result = checkConstruct('lambda x: x*2', 'lambda');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('lambda');
      });

      it('should detect lambda with multiple params', () => {
        const result = checkConstruct('lambda x, y: x + y', 'lambda');
        expect(result.detected).toBe(true);
      });

      it('should detect lambda with no params', () => {
        const result = checkConstruct('lambda: 42', 'lambda');
        expect(result.detected).toBe(true);
      });

      it('should detect lambda in sorted key', () => {
        const result = checkConstruct(
          'sorted(items, key=lambda x: x.name)',
          'lambda'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect lambda in map', () => {
        const result = checkConstruct('map(lambda x: x**2, numbers)', 'lambda');
        expect(result.detected).toBe(true);
      });

      it('should NOT detect word containing lambda', () => {
        // Unlikely but testing edge case
        const result = checkConstruct('mylambda = 5', 'lambda');
        expect(result.detected).toBe(false);
      });
    });

    describe('generator-expr construct', () => {
      it('should detect (x for x in items)', () => {
        const result = checkConstruct('(x for x in items)', 'generator-expr');
        expect(result.detected).toBe(true);
        expect(result.constructType).toBe('generator-expr');
      });

      it('should detect generator with condition', () => {
        const result = checkConstruct(
          '(x for x in items if x > 0)',
          'generator-expr'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect generator with expression', () => {
        const result = checkConstruct(
          '(x * 2 for x in range(10))',
          'generator-expr'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect generator in sum()', () => {
        const result = checkConstruct(
          'sum(x for x in items)',
          'generator-expr'
        );
        expect(result.detected).toBe(true);
      });

      it('should detect generator in any()', () => {
        const result = checkConstruct(
          'any(x > 0 for x in items)',
          'generator-expr'
        );
        expect(result.detected).toBe(true);
      });

      it('should NOT detect list comprehension', () => {
        const result = checkConstruct('[x for x in items]', 'generator-expr');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect tuple literal', () => {
        const result = checkConstruct('(1, 2, 3)', 'generator-expr');
        expect(result.detected).toBe(false);
      });

      it('should NOT detect parenthesized expression', () => {
        const result = checkConstruct('(a + b)', 'generator-expr');
        expect(result.detected).toBe(false);
      });
    });

    describe('unknown construct type', () => {
      it('should return detected=false for unknown construct', () => {
        const result = checkConstruct(
          'some code',
          'unknown-construct' as ConstructType
        );
        expect(result.detected).toBe(false);
        expect(result.constructType).toBe('unknown-construct');
      });
    });

    describe('multiline code', () => {
      it('should detect slice in multiline code', () => {
        const code = `
items = [1, 2, 3, 4, 5]
result = items[1:4]
print(result)
`;
        const result = checkConstruct(code, 'slice');
        expect(result.detected).toBe(true);
      });

      it('should detect comprehension in multiline code', () => {
        const code = `
numbers = range(10)
squares = [x**2 for x in numbers]
`;
        const result = checkConstruct(code, 'comprehension');
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('string/comment stripping', () => {
    describe('should NOT detect constructs inside strings', () => {
      it('ignores comprehension in double-quoted string', () => {
        const result = checkConstruct('"[x for x in items]"', 'comprehension');
        expect(result.detected).toBe(false);
      });

      it('ignores comprehension in single-quoted string', () => {
        const result = checkConstruct("'[x for x in items]'", 'comprehension');
        expect(result.detected).toBe(false);
      });

      it('ignores slice in string', () => {
        const result = checkConstruct('"items[1:4]"', 'slice');
        expect(result.detected).toBe(false);
      });

      it('ignores f-string pattern in regular string', () => {
        const result = checkConstruct('"f\\"{name}\\"', 'f-string');
        expect(result.detected).toBe(false);
      });
    });

    describe('should NOT detect constructs inside comments', () => {
      it('ignores comprehension in comment', () => {
        const result = checkConstruct('# [x for x in items]', 'comprehension');
        expect(result.detected).toBe(false);
      });

      it('ignores slice in comment', () => {
        const result = checkConstruct('# items[1:4] is a slice', 'slice');
        expect(result.detected).toBe(false);
      });

      it('ignores construct after code', () => {
        const result = checkConstruct('x = 1  # [x for x in items]', 'comprehension');
        expect(result.detected).toBe(false);
      });
    });

    describe('should still detect constructs in actual code', () => {
      it('detects comprehension in code with strings nearby', () => {
        const result = checkConstruct('result = [x for x in items]; print("done")', 'comprehension');
        expect(result.detected).toBe(true);
      });

      it('detects slice in code with comments nearby', () => {
        const code = `# Get a slice
result = items[1:4]`;
        const result = checkConstruct(code, 'slice');
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('checkAnyConstruct', () => {
    it('should return true if any construct is detected', () => {
      const code = 'result = [x for x in items]';
      const result = checkAnyConstruct(code, ['slice', 'comprehension']);
      expect(result.detected).toBe(true);
      expect(result.constructType).toBe('comprehension');
    });

    it('should return first matching construct', () => {
      const code = 'result = items[1:4]';
      const result = checkAnyConstruct(code, ['slice', 'comprehension']);
      expect(result.detected).toBe(true);
      expect(result.constructType).toBe('slice');
    });

    it('should return false if no construct is detected', () => {
      const code = 'result = items[0]';
      const result = checkAnyConstruct(code, ['slice', 'comprehension']);
      expect(result.detected).toBe(false);
      expect(result.constructType).toBeNull();
    });

    it('should handle empty construct types array', () => {
      const code = 'result = items[1:4]';
      const result = checkAnyConstruct(code, []);
      expect(result.detected).toBe(false);
      expect(result.constructType).toBeNull();
    });

    it('should detect multiple constructs in code (returns first)', () => {
      const code = 'result = [x[1:] for x in items]'; // has both slice and comprehension
      const result = checkAnyConstruct(code, ['slice', 'comprehension']);
      expect(result.detected).toBe(true);
      // Returns first in the array that matches
      expect(result.constructType).toBe('slice');
    });
  });
});
