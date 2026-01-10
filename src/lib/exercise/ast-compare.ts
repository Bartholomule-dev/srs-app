// src/lib/exercise/ast-compare.ts
import type { PyodideInterface } from '@/lib/context/PyodideContext';

export interface AstCompareOptions {
  /** Parse mode: 'auto' tries exec then eval */
  mode?: 'auto' | 'exec' | 'eval';
  /** Alpha-rename local variables (function args, loop targets, comprehension vars) */
  renameLocals?: boolean;
  /** Normalize slices: [:3] → [0:3:1], [0:3] → [0:3:1] */
  normalizeSlices?: boolean;
  /** Strip docstrings from functions/classes/modules */
  ignoreDocstrings?: boolean;
}

export interface AstCompareResult {
  match: boolean;
  matchedAlternative: string | null;
  /** True if infra worked (Pyodide loaded, code parsed). False = fallback eligible */
  infraAvailable: boolean;
  error?: string;
}

const DEFAULT_OPTIONS: AstCompareOptions = {
  mode: 'auto',
  renameLocals: true,
  normalizeSlices: true,
  ignoreDocstrings: true,
};

const AST_NORMALIZER_CODE = `
import ast
import json

class Canonicalize(ast.NodeTransformer):
    """Normalize AST for comparison: alpha-rename locals, normalize slices."""

    def __init__(self, opts):
        self.opts = opts
        self.scopes = []  # Stack of {original_name: canonical_name}

    def _push_scope(self):
        self.scopes.append({})

    def _pop_scope(self):
        self.scopes.pop()

    def _bind_local(self, name):
        """Bind a local name to a canonical form (v0, v1, ...)"""
        if not self.opts.get("renameLocals", True):
            return name
        scope = self.scopes[-1]
        if name not in scope:
            scope[name] = f"_v{len(scope)}"
        return scope[name]

    def _lookup(self, name):
        """Look up a name in scope stack; return canonical or original"""
        for scope in reversed(self.scopes):
            if name in scope:
                return scope[name]
        return name  # Not a local - keep original (global/builtin)

    # === Scope-creating nodes ===

    def visit_FunctionDef(self, node):
        self._push_scope()
        # Bind parameters
        for arg in node.args.args:
            arg.arg = self._bind_local(arg.arg)
        for arg in node.args.posonlyargs:
            arg.arg = self._bind_local(arg.arg)
        for arg in node.args.kwonlyargs:
            arg.arg = self._bind_local(arg.arg)
        if node.args.vararg:
            node.args.vararg.arg = self._bind_local(node.args.vararg.arg)
        if node.args.kwarg:
            node.args.kwarg.arg = self._bind_local(node.args.kwarg.arg)
        # Visit body
        node.body = [self.visit(n) for n in node.body]
        self._pop_scope()
        return node

    def visit_Lambda(self, node):
        self._push_scope()
        for arg in node.args.args:
            arg.arg = self._bind_local(arg.arg)
        node.body = self.visit(node.body)
        self._pop_scope()
        return node

    def visit_comprehension(self, node):
        # Bind loop target
        node.target = self._visit_target(node.target)
        node.iter = self.visit(node.iter)
        node.ifs = [self.visit(i) for i in node.ifs]
        return node

    def _visit_target(self, target):
        """Bind assignment targets (for loop, comprehension, with, except)"""
        if isinstance(target, ast.Name):
            target.id = self._bind_local(target.id)
        elif isinstance(target, ast.Tuple):
            target.elts = [self._visit_target(e) for e in target.elts]
        return target

    def visit_For(self, node):
        node.target = self._visit_target(node.target)
        node.iter = self.visit(node.iter)
        node.body = [self.visit(n) for n in node.body]
        node.orelse = [self.visit(n) for n in node.orelse]
        return node

    # === Name lookup ===

    def visit_Name(self, node):
        node.id = self._lookup(node.id)
        return node

    # === Slice normalization ===

    def visit_Slice(self, node):
        if not self.opts.get("normalizeSlices", True):
            return self.generic_visit(node)

        # Normalize lower: 0 → None (canonical form is omitted)
        if isinstance(node.lower, ast.Constant) and node.lower.value == 0:
            node.lower = None
        elif node.lower:
            node.lower = self.visit(node.lower)

        # Visit upper
        if node.upper:
            node.upper = self.visit(node.upper)

        # Normalize step: 1 → None
        if isinstance(node.step, ast.Constant) and node.step.value == 1:
            node.step = None
        elif node.step:
            node.step = self.visit(node.step)

        return node

    # === Docstring removal ===

    def visit_Module(self, node):
        # Push module-level scope for top-level loops/comprehensions
        self._push_scope()
        if self.opts.get("ignoreDocstrings", True):
            node.body = self._strip_docstring(node.body)
        result = self.generic_visit(node)
        self._pop_scope()
        return result

    def _strip_docstring(self, body):
        if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) and isinstance(body[0].value.value, str):
            return body[1:]
        return body


def normalize_code(code, opts, mode="auto"):
    """Parse and normalize Python code. Returns canonical AST dump or None on failure."""
    try:
        # Try exec mode first (statements)
        tree = ast.parse(code, mode="exec")
    except SyntaxError:
        if mode == "auto":
            try:
                # Fall back to eval mode (expression only)
                tree = ast.parse(code, mode="eval")
            except SyntaxError:
                return None
        else:
            return None

    # Normalize
    normalizer = Canonicalize(opts)
    tree = normalizer.visit(tree)

    # Dump without location info
    return ast.dump(tree, include_attributes=False)
`;

let astNormalizerInitialized = false;

async function initAstNormalizer(pyodide: PyodideInterface): Promise<void> {
  if (astNormalizerInitialized) return;
  pyodide.runPython(AST_NORMALIZER_CODE);
  astNormalizerInitialized = true;
}

async function normalizeAst(
  pyodide: PyodideInterface,
  code: string,
  options: AstCompareOptions
): Promise<string | null> {
  // Build Python dict literal with Python booleans (True/False, not true/false)
  const renameLocals = options.renameLocals ?? true;
  const normalizeSlices = options.normalizeSlices ?? true;
  const ignoreDocstrings = options.ignoreDocstrings ?? true;
  const mode = options.mode ?? 'auto';

  // Use Python boolean literals directly
  const optsPython = `{"renameLocals": ${renameLocals ? 'True' : 'False'}, "normalizeSlices": ${normalizeSlices ? 'True' : 'False'}, "ignoreDocstrings": ${ignoreDocstrings ? 'True' : 'False'}}`;

  const result = pyodide.runPython(
    `normalize_code(${JSON.stringify(code)}, ${optsPython}, ${JSON.stringify(mode)})`
  );

  return result === 'None' || result === null ? null : String(result);
}

/**
 * Compare user answer to expected answer(s) via AST normalization.
 * Uses Pyodide to parse Python code and normalize AST structure.
 */
export async function compareByAst(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[],
  options: AstCompareOptions = {}
): Promise<AstCompareResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Initialize normalizer in Pyodide (cached after first call)
    await initAstNormalizer(pyodide);

    // Normalize user answer
    const userNorm = await normalizeAst(pyodide, userAnswer, opts);
    if (userNorm === null) {
      // Parse failed - user code is syntactically invalid
      return { match: false, matchedAlternative: null, infraAvailable: true };
    }

    // Compare against expected answer
    const expectedNorm = await normalizeAst(pyodide, expectedAnswer, opts);
    if (expectedNorm !== null && userNorm === expectedNorm) {
      return { match: true, matchedAlternative: null, infraAvailable: true };
    }

    // Compare against alternatives
    for (const alt of acceptedSolutions) {
      const altNorm = await normalizeAst(pyodide, alt, opts);
      if (altNorm !== null && userNorm === altNorm) {
        return { match: true, matchedAlternative: alt, infraAvailable: true };
      }
    }

    return { match: false, matchedAlternative: null, infraAvailable: true };
  } catch (error) {
    // Pyodide/infra error - eligible for fallback
    return {
      match: false,
      matchedAlternative: null,
      infraAvailable: false,
      error: error instanceof Error ? error.message : 'AST comparison failed',
    };
  }
}

/**
 * Reset internal state - for testing only
 */
export function resetAstNormalizer(): void {
  astNormalizerInitialized = false;
}

// Export for testing
export { initAstNormalizer as _initAstNormalizer };
