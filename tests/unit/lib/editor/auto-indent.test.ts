// tests/unit/lib/editor/auto-indent.test.ts
import { describe, it, expect } from 'vitest';
import { getAutoIndent, insertNewlineWithIndent } from '@/lib/editor/auto-indent';

describe('getAutoIndent', () => {
  describe('preserving current indentation', () => {
    it('returns empty string for line with no indentation', () => {
      expect(getAutoIndent('print("hello")')).toBe('');
    });

    it('returns same spaces for indented line', () => {
      expect(getAutoIndent('    print("hello")')).toBe('    ');
    });

    it('returns same tabs for tab-indented line', () => {
      expect(getAutoIndent('\tprint("hello")')).toBe('\t');
    });

    it('preserves mixed indent (spaces then tabs)', () => {
      expect(getAutoIndent('  \tprint("hello")')).toBe('  \t');
    });

    it('handles empty line', () => {
      expect(getAutoIndent('')).toBe('');
    });

    it('handles whitespace-only line', () => {
      expect(getAutoIndent('    ')).toBe('    ');
    });
  });

  describe('adding indent after colon', () => {
    it('adds 4 spaces after def statement', () => {
      expect(getAutoIndent('def greet(name):')).toBe('    ');
    });

    it('adds 4 spaces after indented def', () => {
      expect(getAutoIndent('    def inner():')).toBe('        ');
    });

    it('adds 4 spaces after if statement', () => {
      expect(getAutoIndent('if x > 0:')).toBe('    ');
    });

    it('adds 4 spaces after for loop', () => {
      expect(getAutoIndent('for i in range(10):')).toBe('    ');
    });

    it('adds 4 spaces after while loop', () => {
      expect(getAutoIndent('while True:')).toBe('    ');
    });

    it('adds 4 spaces after class definition', () => {
      expect(getAutoIndent('class MyClass:')).toBe('    ');
    });

    it('adds 4 spaces after try block', () => {
      expect(getAutoIndent('try:')).toBe('    ');
    });

    it('adds 4 spaces after except block', () => {
      expect(getAutoIndent('except ValueError:')).toBe('    ');
    });

    it('adds 4 spaces after else', () => {
      expect(getAutoIndent('else:')).toBe('    ');
    });

    it('adds 4 spaces after elif', () => {
      expect(getAutoIndent('elif x < 0:')).toBe('    ');
    });

    it('adds 4 spaces after finally', () => {
      expect(getAutoIndent('finally:')).toBe('    ');
    });

    it('adds 4 spaces after with statement', () => {
      expect(getAutoIndent('with open("file") as f:')).toBe('    ');
    });

    it('adds 4 spaces after lambda with colon at end', () => {
      expect(getAutoIndent('fn = lambda x:')).toBe('    ');
    });
  });

  describe('colon edge cases', () => {
    it('does NOT add indent for colon in string', () => {
      expect(getAutoIndent('print("hello:")')).toBe('');
    });

    it('does NOT add indent for colon in dict', () => {
      expect(getAutoIndent('x = {"key": "value"}')).toBe('');
    });

    it('does NOT add indent for slice', () => {
      expect(getAutoIndent('x = lst[1:3]')).toBe('');
    });

    it('handles trailing whitespace before colon check', () => {
      expect(getAutoIndent('def greet():  ')).toBe('    ');
    });

    it('handles colon with comment', () => {
      expect(getAutoIndent('def foo(): # comment')).toBe('');
    });
  });
});

describe('insertNewlineWithIndent', () => {
  describe('basic insertion', () => {
    it('inserts newline at cursor position', () => {
      const result = insertNewlineWithIndent('hello', 5);
      expect(result.value).toBe('hello\n');
      expect(result.cursorPosition).toBe(6);
    });

    it('inserts newline in middle of text', () => {
      const result = insertNewlineWithIndent('helloworld', 5);
      expect(result.value).toBe('hello\nworld');
      expect(result.cursorPosition).toBe(6);
    });

    it('inserts newline at start', () => {
      const result = insertNewlineWithIndent('hello', 0);
      expect(result.value).toBe('\nhello');
      expect(result.cursorPosition).toBe(1);
    });
  });

  describe('with indentation', () => {
    it('adds indent after colon', () => {
      const result = insertNewlineWithIndent('def foo():', 10);
      expect(result.value).toBe('def foo():\n    ');
      expect(result.cursorPosition).toBe(15); // after newline + 4 spaces
    });

    it('preserves existing indent', () => {
      const result = insertNewlineWithIndent('    print("hi")', 15);
      expect(result.value).toBe('    print("hi")\n    ');
      expect(result.cursorPosition).toBe(20);
    });

    it('preserves indent and adds more after colon', () => {
      const result = insertNewlineWithIndent('    if x > 0:', 13);
      expect(result.value).toBe('    if x > 0:\n        ');
      expect(result.cursorPosition).toBe(22); // 13 + 1 (newline) + 8 (spaces)
    });
  });

  describe('multiline text', () => {
    it('handles cursor on second line', () => {
      const text = 'line1\nline2';
      const result = insertNewlineWithIndent(text, 11); // end of line2
      expect(result.value).toBe('line1\nline2\n');
      expect(result.cursorPosition).toBe(12);
    });

    it('uses current line for indent calculation', () => {
      const text = 'def foo():\n    pass';
      const result = insertNewlineWithIndent(text, 19); // end of "    pass"
      expect(result.value).toBe('def foo():\n    pass\n    ');
      expect(result.cursorPosition).toBe(24);
    });

    it('handles insertion in middle of multiline', () => {
      const text = 'line1\nline2\nline3';
      const result = insertNewlineWithIndent(text, 11); // end of line2
      expect(result.value).toBe('line1\nline2\n\nline3');
      expect(result.cursorPosition).toBe(12);
    });

    it('uses correct line when cursor is mid-line', () => {
      const text = 'def foo():\n    x = 1';
      // Cursor at position 15, which is after "    " on line 2
      const result = insertNewlineWithIndent(text, 15);
      expect(result.value).toBe('def foo():\n    \n    x = 1');
      expect(result.cursorPosition).toBe(20); // after newline + 4 spaces
    });
  });
});
