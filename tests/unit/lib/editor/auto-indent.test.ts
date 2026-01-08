// tests/unit/lib/editor/auto-indent.test.ts
import { describe, it, expect } from 'vitest';
import { getAutoIndent } from '@/lib/editor/auto-indent';

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
