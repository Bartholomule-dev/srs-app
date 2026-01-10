// tests/unit/exercise/ast-compare.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  compareByAst,
  resetAstNormalizer,
} from '@/lib/exercise/ast-compare';
import { createMockPyodide } from '@tests/fixtures/pyodide';

describe('ast-compare', () => {
  beforeEach(() => {
    resetAstNormalizer();
  });

  /**
   * Helper to create a mock Pyodide that returns specified normalized AST strings.
   * First call is always the normalizer initialization (returns '').
   * Subsequent calls return the AST strings in order.
   */
  function createAstMockPyodide(responses: (string | null)[]) {
    let callIndex = 0;
    return createMockPyodide({
      runPythonFn: (code: string) => {
        // First call is the normalizer initialization - return empty
        if (code.includes('import ast')) {
          return '';
        }
        // Subsequent calls are normalize_code() calls
        const result = responses[callIndex++];
        return result ?? 'None';
      },
    });
  }

  describe('slice normalization', () => {
    it('treats items[:3] and items[0:3] as equivalent', async () => {
      // Both normalize to the same AST structure (0 → None in lower)
      const normalizedAst =
        "Module(body=[Expr(value=Subscript(value=Name(id='items', ctx=Load()), slice=Slice(lower=None, upper=Constant(value=3), step=None), ctx=Load()))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'items[:3]',
        'items[0:3]',
        []
      );

      expect(result.match).toBe(true);
      expect(result.infraAvailable).toBe(true);
    });

    it('treats items[0:3] and items[0:3:1] as equivalent', async () => {
      // Step 1 normalizes to None
      const normalizedAst =
        "Module(body=[Expr(value=Subscript(value=Name(id='items'), slice=Slice(lower=None, upper=Constant(value=3), step=None)))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'items[0:3]',
        'items[0:3:1]',
        []
      );

      expect(result.match).toBe(true);
    });

    it('treats items[::] and items[0:None:1] as equivalent', async () => {
      // Full slice normalization
      const normalizedAst =
        "Module(body=[Expr(value=Subscript(slice=Slice(lower=None, upper=None, step=None)))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(mockPyodide, 'items[::]', 'items[0:None:1]', []);

      expect(result.match).toBe(true);
    });

    it('distinguishes different slice bounds', async () => {
      const ast1 =
        "Module(body=[Expr(value=Subscript(slice=Slice(upper=Constant(value=3))))])";
      const ast2 =
        "Module(body=[Expr(value=Subscript(slice=Slice(upper=Constant(value=4))))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'items[:3]', 'items[:4]', []);

      expect(result.match).toBe(false);
    });

    it('distinguishes [:3] from [3:]', async () => {
      const ast1 =
        "Module(body=[Expr(value=Subscript(slice=Slice(lower=None, upper=Constant(value=3))))])";
      const ast2 =
        "Module(body=[Expr(value=Subscript(slice=Slice(lower=Constant(value=3), upper=None))))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'items[:3]', 'items[3:]', []);

      expect(result.match).toBe(false);
    });

    it('normalizes negative slice step 1 to None', async () => {
      // items[::1] and items[::] should normalize the same
      const normalizedAst =
        "Module(body=[Expr(value=Subscript(slice=Slice(step=None)))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(mockPyodide, 'items[::1]', 'items[::]', []);

      expect(result.match).toBe(true);
    });
  });

  describe('local variable renaming', () => {
    it('treats "for i in x" and "for j in x" as equivalent', async () => {
      // Both normalize to the same AST with _v0 as the loop variable
      const normalizedAst =
        "Module(body=[For(target=Name(id='_v0'), iter=Name(id='x'), body=[Pass()])])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'for i in x: pass',
        'for j in x: pass',
        []
      );

      expect(result.match).toBe(true);
    });

    it('does NOT rename globals/builtins', async () => {
      // print and range should NOT be renamed, only local i/j
      const normalizedAst =
        "Module(body=[For(target=Name(id='_v0'), iter=Call(func=Name(id='range')), body=[Expr(value=Call(func=Name(id='print')))])])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'for i in range(10): print(i)',
        'for j in range(10): print(j)',
        []
      );

      expect(result.match).toBe(true);
    });

    it('treats different function parameter names as equivalent', async () => {
      const normalizedAst =
        "Module(body=[FunctionDef(name='f', args=arguments(args=[arg(arg='_v0')]), body=[Return(value=Name(id='_v0'))])])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'def f(x): return x',
        'def f(y): return y',
        []
      );

      expect(result.match).toBe(true);
    });

    it('treats comprehension variables as local', async () => {
      const normalizedAst =
        "Module(body=[Expr(value=ListComp(elt=Name(id='_v0'), generators=[comprehension(target=Name(id='_v0'))]))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        '[x for x in items]',
        '[y for y in items]',
        []
      );

      expect(result.match).toBe(true);
    });

    it('handles nested loop variables correctly', async () => {
      // Inner loop gets _v1, outer gets _v0
      const normalizedAst =
        "Module(body=[For(target=Name(id='_v0'), iter=Name(id='outer'), body=[For(target=Name(id='_v1'), iter=Name(id='inner'))])])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'for i in outer:\n  for j in inner: pass',
        'for a in outer:\n  for b in inner: pass',
        []
      );

      expect(result.match).toBe(true);
    });

    it('handles tuple unpacking in loops', async () => {
      const normalizedAst =
        "Module(body=[For(target=Tuple(elts=[Name(id='_v0'), Name(id='_v1')]), iter=Name(id='items'))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'for k, v in items: pass',
        'for key, value in items: pass',
        []
      );

      expect(result.match).toBe(true);
    });

    it('handles lambda parameters', async () => {
      const normalizedAst =
        "Module(body=[Expr(value=Lambda(args=arguments(args=[arg(arg='_v0')]), body=BinOp(left=Name(id='_v0'))))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'lambda x: x + 1',
        'lambda n: n + 1',
        []
      );

      expect(result.match).toBe(true);
    });

    it('handles *args and **kwargs renaming', async () => {
      const normalizedAst =
        "Module(body=[FunctionDef(name='f', args=arguments(vararg=arg(arg='_v0'), kwarg=arg(arg='_v1')))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'def f(*args, **kwargs): pass',
        'def f(*a, **kw): pass',
        []
      );

      expect(result.match).toBe(true);
    });

    it('keeps function names unchanged (not local)', async () => {
      const ast1 = "Module(body=[FunctionDef(name='func_a')])";
      const ast2 = "Module(body=[FunctionDef(name='func_b')])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(
        mockPyodide,
        'def func_a(): pass',
        'def func_b(): pass',
        []
      );

      expect(result.match).toBe(false);
    });
  });

  describe('docstring handling', () => {
    it('ignores module-level docstrings by default', async () => {
      // With docstring stripped, both are equivalent
      const normalizedAst = "Module(body=[Expr(value=Constant(value=42))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        '"This is a docstring"\n42',
        '42',
        []
      );

      expect(result.match).toBe(true);
    });
  });

  describe('accepted alternatives', () => {
    it('matches against accepted alternatives when primary fails', async () => {
      const userAst = "Module(body=[Expr(value=BinOp(op=Add()))])";
      const expectedAst = "Module(body=[Expr(value=Different())])";
      const altAst = "Module(body=[Expr(value=BinOp(op=Add()))])"; // Same as user

      const mockPyodide = createAstMockPyodide([userAst, expectedAst, altAst]);

      const result = await compareByAst(
        mockPyodide,
        'x + y',
        'different_code',
        ['x + y']
      );

      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('x + y');
    });

    it('prefers primary answer over alternatives', async () => {
      const normalizedAst = "Module(body=[Expr(value=Name(id='x'))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(mockPyodide, 'x', 'x', ['x']);

      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBeNull(); // Primary matched, not alternative
    });

    it('returns matchedAlternative when alt matches but primary does not', async () => {
      const userAst = "Module(body=[Constant(value=1)])";
      const expectedAst = "Module(body=[Constant(value=2)])";
      const alt1Ast = "Module(body=[Constant(value=3)])";
      const alt2Ast = "Module(body=[Constant(value=1)])"; // Same as user

      const mockPyodide = createAstMockPyodide([userAst, expectedAst, alt1Ast, alt2Ast]);

      const result = await compareByAst(mockPyodide, '1', '2', ['3', '1']);

      expect(result.match).toBe(true);
      expect(result.matchedAlternative).toBe('1');
    });

    it('returns no match when neither primary nor alternatives match', async () => {
      const userAst = "Module(body=[Constant(value=1)])";
      const expectedAst = "Module(body=[Constant(value=2)])";
      const alt1Ast = "Module(body=[Constant(value=3)])";
      const alt2Ast = "Module(body=[Constant(value=4)])";

      const mockPyodide = createAstMockPyodide([userAst, expectedAst, alt1Ast, alt2Ast]);

      const result = await compareByAst(mockPyodide, '1', '2', ['3', '4']);

      expect(result.match).toBe(false);
      expect(result.matchedAlternative).toBeNull();
    });
  });

  describe('error handling', () => {
    it('returns infraAvailable: true when user code has syntax error', async () => {
      // User code fails to parse, returns null/None
      const mockPyodide = createAstMockPyodide([null]);

      const result = await compareByAst(
        mockPyodide,
        'invalid syntax {{{}}}',
        'valid_code',
        []
      );

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(true); // Infra worked, code just didn't parse
    });

    it('returns infraAvailable: false on Pyodide crash', async () => {
      const mockPyodide = createMockPyodide({
        error: new Error('Pyodide crashed'),
      });

      const result = await compareByAst(mockPyodide, 'code', 'expected', []);

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(false);
      expect(result.error).toBe('Pyodide crashed');
    });

    it('returns infraAvailable: false when normalize throws', async () => {
      const mockPyodide = createMockPyodide({
        runPythonFn: (code: string) => {
          if (code.includes('import ast')) return '';
          throw new Error('Python runtime error');
        },
      });

      const result = await compareByAst(mockPyodide, 'code', 'expected', []);

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(false);
      expect(result.error).toBe('Python runtime error');
    });

    it('handles expected answer syntax error gracefully', async () => {
      // User code parses, expected doesn't
      const userAst = "Module(body=[Constant(value=1)])";
      const mockPyodide = createAstMockPyodide([userAst, null]);

      const result = await compareByAst(mockPyodide, '1', 'invalid{{', []);

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(true);
    });

    it('handles alternative syntax error gracefully', async () => {
      // User parses, expected parses (different), alt fails
      const userAst = "Module(body=[Constant(value=1)])";
      const expectedAst = "Module(body=[Constant(value=2)])";
      const mockPyodide = createAstMockPyodide([userAst, expectedAst, null]);

      const result = await compareByAst(mockPyodide, '1', '2', ['invalid{{']);

      expect(result.match).toBe(false);
      expect(result.infraAvailable).toBe(true);
    });
  });

  describe('options', () => {
    it('respects renameLocals: false option', async () => {
      // With renaming disabled, different var names should produce different ASTs
      const ast1 = "Module(body=[For(target=Name(id='i'))])";
      const ast2 = "Module(body=[For(target=Name(id='j'))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(
        mockPyodide,
        'for i in x: pass',
        'for j in x: pass',
        [],
        { renameLocals: false }
      );

      expect(result.match).toBe(false);
    });

    it('respects normalizeSlices: false option', async () => {
      // With slice normalization disabled, [:3] and [0:3] differ
      const ast1 = "Module(body=[Subscript(slice=Slice(lower=None))])";
      const ast2 = "Module(body=[Subscript(slice=Slice(lower=Constant(value=0)))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(
        mockPyodide,
        'items[:3]',
        'items[0:3]',
        [],
        { normalizeSlices: false }
      );

      expect(result.match).toBe(false);
    });

    it('respects ignoreDocstrings: false option', async () => {
      // With docstring ignoring disabled, presence of docstring matters
      const ast1 =
        "Module(body=[Expr(value=Constant(value='docstring')), Expr(value=Constant(value=42))])";
      const ast2 = "Module(body=[Expr(value=Constant(value=42))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(
        mockPyodide,
        '"docstring"\n42',
        '42',
        [],
        { ignoreDocstrings: false }
      );

      expect(result.match).toBe(false);
    });

    it('uses default options when not specified', async () => {
      // Default: renameLocals=true, normalizeSlices=true, ignoreDocstrings=true
      const normalizedAst = "Module(body=[For(target=Name(id='_v0'))])";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(
        mockPyodide,
        'for i in x: pass',
        'for j in x: pass',
        []
        // No options - uses defaults
      );

      expect(result.match).toBe(true);
    });
  });

  describe('parse mode', () => {
    it('handles expression-only code in auto mode', async () => {
      // Expression that might need eval mode
      const normalizedAst = "Expression(body=BinOp(left=Constant(value=1)))";
      const mockPyodide = createAstMockPyodide([normalizedAst, normalizedAst]);

      const result = await compareByAst(mockPyodide, '1 + 2', '1 + 2', []);

      expect(result.match).toBe(true);
    });
  });

  describe('real-world equivalences', () => {
    it('treats list(x) and [*x] as different (not semantically equivalent)', async () => {
      // These are syntactically different even though semantically equivalent
      const ast1 = "Module(body=[Expr(value=Call(func=Name(id='list')))])";
      const ast2 = "Module(body=[Expr(value=List(elts=[Starred()]))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'list(x)', '[*x]', []);

      expect(result.match).toBe(false);
    });

    it('treats x == True and x is True as different', async () => {
      const ast1 = "Module(body=[Expr(value=Compare(ops=[Eq()]))])";
      const ast2 = "Module(body=[Expr(value=Compare(ops=[Is()]))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'x == True', 'x is True', []);

      expect(result.match).toBe(false);
    });

    it('treats dict() and {} as different', async () => {
      const ast1 = "Module(body=[Expr(value=Call(func=Name(id='dict')))])";
      const ast2 = "Module(body=[Expr(value=Dict(keys=[], values=[]))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'dict()', '{}', []);

      expect(result.match).toBe(false);
    });

    it('treats += and = ... + as different', async () => {
      // x += 1 vs x = x + 1 are syntactically different
      const ast1 = "Module(body=[AugAssign(op=Add())])";
      const ast2 = "Module(body=[Assign(targets=[Name()], value=BinOp(op=Add()))])";
      const mockPyodide = createAstMockPyodide([ast1, ast2]);

      const result = await compareByAst(mockPyodide, 'x += 1', 'x = x + 1', []);

      expect(result.match).toBe(false);
    });
  });

  describe('initialization caching', () => {
    it('only initializes normalizer once per session', async () => {
      let initCallCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: (code: string) => {
          if (code.includes('import ast')) {
            initCallCount++;
            return '';
          }
          return "Module(body=[])";
        },
      });

      // First call
      await compareByAst(mockPyodide, 'x', 'x', []);
      expect(initCallCount).toBe(1);

      // Second call - should not re-initialize
      await compareByAst(mockPyodide, 'y', 'y', []);
      expect(initCallCount).toBe(1);
    });

    it('reinitializes after reset', async () => {
      let initCallCount = 0;
      const mockPyodide = createMockPyodide({
        runPythonFn: (code: string) => {
          if (code.includes('import ast')) {
            initCallCount++;
            return '';
          }
          return "Module(body=[])";
        },
      });

      await compareByAst(mockPyodide, 'x', 'x', []);
      expect(initCallCount).toBe(1);

      resetAstNormalizer();

      await compareByAst(mockPyodide, 'x', 'x', []);
      expect(initCallCount).toBe(2);
    });
  });
});
