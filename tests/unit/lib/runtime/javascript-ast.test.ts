// tests/unit/lib/runtime/javascript-ast.test.ts
import { describe, it, expect } from 'vitest';
import {
  tokenizeJavaScript,
  compareByTokens,
  compareByAst,
} from '@/lib/runtime/javascript-ast';

describe('JavaScript tokenization', () => {
  it('should tokenize simple expression', () => {
    const tokens = tokenizeJavaScript('const x = 1');
    expect(tokens).toBeDefined();
    expect(tokens!.length).toBeGreaterThan(0);
    // Should have tokens like: const, x, =, 1
  });

  it('should tokenize function declaration', () => {
    const tokens = tokenizeJavaScript('function add(a, b) { return a + b; }');
    expect(tokens).toBeDefined();
    expect(tokens!.length).toBeGreaterThan(0);
  });

  it('should tokenize arrow function', () => {
    const tokens = tokenizeJavaScript('const add = (a, b) => a + b');
    expect(tokens).toBeDefined();
    expect(tokens!.length).toBeGreaterThan(0);
  });

  it('should return null for invalid syntax', () => {
    const tokens = tokenizeJavaScript('function {');
    expect(tokens).toBeNull();
  });

  it('should return null for incomplete expression', () => {
    const tokens = tokenizeJavaScript('const x =');
    expect(tokens).toBeNull();
  });
});

describe('JavaScript token comparison', () => {
  it('should match equivalent code with different whitespace', () => {
    const result = compareByTokens('const x=1', 'const x = 1');
    expect(result.match).toBe(true);
  });

  it('should not match different variable names', () => {
    const result = compareByTokens('const x = 1', 'const y = 1');
    expect(result.match).toBe(false);
  });

  it('should not match different values', () => {
    const result = compareByTokens('const x = 1', 'const x = 2');
    expect(result.match).toBe(false);
  });

  it('should match accepted alternative', () => {
    const result = compareByTokens('let x = 1', 'const x = 1', ['let x = 1']);
    expect(result.match).toBe(true);
    expect(result.matchedAlternative).toBe('let x = 1');
  });

  it('should return no match for invalid user code', () => {
    const result = compareByTokens('const {', 'const x = 1');
    expect(result.match).toBe(false);
  });

  it('should return no match for invalid expected code', () => {
    const result = compareByTokens('const x = 1', 'const {');
    expect(result.match).toBe(false);
  });

  it('should match function declarations with same tokens', () => {
    // Note: Semicolons matter for token comparison
    const result = compareByTokens(
      'function add(a,b){return a+b;}',
      'function add(a, b) { return a + b; }'
    );
    expect(result.match).toBe(true);
  });

  it('should not match when semicolons differ (tokens are literal)', () => {
    // Token comparison is literal - semicolons count
    // AST comparison would match these (see AST tests)
    const result = compareByTokens(
      'function add(a,b){return a+b}',
      'function add(a, b) { return a + b; }'
    );
    expect(result.match).toBe(false);
  });

  it('should not match when alternative list is empty and code differs', () => {
    const result = compareByTokens('let x = 1', 'const x = 1', []);
    expect(result.match).toBe(false);
  });
});

describe('JavaScript AST comparison', () => {
  it('should match semantically equivalent code', () => {
    const result = compareByAst('const x = 1;', 'const x = 1');
    expect(result.match).toBe(true);
    expect(result.infraAvailable).toBe(true);
  });

  it('should match regardless of whitespace', () => {
    const result = compareByAst('const x=1', 'const  x  =  1');
    expect(result.match).toBe(true);
  });

  it('should not match different variable names', () => {
    const result = compareByAst('const x = 1', 'const y = 1');
    expect(result.match).toBe(false);
  });

  it('should not match different values', () => {
    const result = compareByAst('const x = 1', 'const x = 2');
    expect(result.match).toBe(false);
  });

  it('should return infraAvailable false for invalid user syntax', () => {
    const result = compareByAst('function {', 'const x = 1');
    expect(result.infraAvailable).toBe(false);
  });

  it('should return infraAvailable false for invalid expected syntax', () => {
    const result = compareByAst('const x = 1', 'function {');
    expect(result.infraAvailable).toBe(false);
  });

  it('should match accepted alternative', () => {
    const result = compareByAst('let x = 1', 'const x = 1', ['let x = 1']);
    expect(result.match).toBe(true);
    expect(result.matchedAlternative).toBe('let x = 1');
  });

  it('should match arrow functions with different formatting', () => {
    const result = compareByAst(
      'const add = (a, b) => a + b',
      'const add = (a, b) => a + b;'
    );
    expect(result.match).toBe(true);
  });

  it('should match function declarations with different formatting', () => {
    const result = compareByAst(
      'function add(a, b) { return a + b }',
      'function add(a, b) { return a + b; }'
    );
    expect(result.match).toBe(true);
  });

  it('should not match structurally different code', () => {
    const result = compareByAst(
      'const add = (a, b) => a + b',
      'function add(a, b) { return a + b }'
    );
    expect(result.match).toBe(false);
  });

  it('should match array literals with different spacing', () => {
    const result = compareByAst('[1,2,3]', '[1, 2, 3]');
    expect(result.match).toBe(true);
  });

  it('should match object literals with different formatting', () => {
    // Object literals need parens or assignment to disambiguate from blocks
    const result = compareByAst('({a:1,b:2})', '({ a: 1, b: 2 })');
    expect(result.match).toBe(true);
  });

  it('should match object assignment with different formatting', () => {
    const result = compareByAst('const obj = {a:1,b:2}', 'const obj = { a: 1, b: 2 }');
    expect(result.match).toBe(true);
  });

  it('should handle template literals', () => {
    const result = compareByAst('`hello ${name}`', '`hello ${name}`');
    expect(result.match).toBe(true);
  });

  it('should not match if alternative also does not match', () => {
    const result = compareByAst('const z = 1', 'const x = 1', ['const y = 1']);
    expect(result.match).toBe(false);
    expect(result.matchedAlternative).toBeNull();
  });
});
