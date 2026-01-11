// src/lib/runtime/javascript-ast.ts
// JavaScript AST/token comparison using Acorn parser
import * as acorn from 'acorn';
import type { TokenCompareResult, AstCompareResult, AstCompareOptions } from './types';

/**
 * Token representation: [tokenLabel, tokenValue]
 * We use the value (not just type) to distinguish identifiers and numbers.
 */
type TokenTuple = [string, string];

/**
 * Extended token type that includes the value property.
 * Acorn's Token class has a value property at runtime but it's not in the type definition.
 */
interface AcornTokenWithValue extends acorn.Token {
  value?: string | number | RegExp | bigint;
}

/**
 * Tokenize JavaScript code using Acorn.
 * Returns array of [tokenLabel, tokenValue] pairs, or null on parse error.
 *
 * Note: Acorn's tokenizer doesn't validate complete syntax, so we also
 * attempt to parse to ensure the code is syntactically valid.
 */
export function tokenizeJavaScript(code: string): TokenTuple[] | null {
  try {
    // First validate that code parses successfully
    // Use sourceType: 'module' to support import/export syntax
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });

    // Then tokenize (also with sourceType: 'module' for consistency)
    const tokens: TokenTuple[] = [];
    const tokenizer = acorn.tokenizer(code, { ecmaVersion: 'latest', sourceType: 'module' });

    for (const token of tokenizer) {
      // Cast to our extended type that includes value
      const tokenWithValue = token as AcornTokenWithValue;
      // Store token label and its string value
      // Convert value to string for consistency
      const value =
        tokenWithValue.value !== undefined ? String(tokenWithValue.value) : token.type.label;
      tokens.push([token.type.label, value]);
    }

    return tokens;
  } catch {
    return null;
  }
}

/**
 * Compare token arrays for equality.
 * Compares both label and value for each token.
 */
function tokensMatch(a: TokenTuple[], b: TokenTuple[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((tok, i) => tok[0] === b[i][0] && tok[1] === b[i][1]);
}

/**
 * Compare two pieces of JavaScript code by tokens.
 * Ignores whitespace differences but catches structural differences.
 */
export function compareByTokens(
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[] = []
): TokenCompareResult {
  const userTokens = tokenizeJavaScript(userAnswer);
  const expectedTokens = tokenizeJavaScript(expectedAnswer);

  if (!userTokens || !expectedTokens) {
    return { match: false, matchedAlternative: null };
  }

  // Compare with expected
  if (tokensMatch(userTokens, expectedTokens)) {
    return { match: true, matchedAlternative: null };
  }

  // Check alternatives
  for (const alt of acceptedSolutions) {
    const altTokens = tokenizeJavaScript(alt);
    if (altTokens && tokensMatch(userTokens, altTokens)) {
      return { match: true, matchedAlternative: alt };
    }
  }

  return { match: false, matchedAlternative: null };
}

/**
 * Deep AST comparison ignoring position info.
 * Recursively compares AST nodes, skipping start/end/loc/range properties.
 */
function astMatch(a: unknown, b: unknown, _options: AstCompareOptions): boolean {
  // Primitive equality
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  // Skip properties that don't affect semantics:
  // - start, end, loc, range: position info
  // - raw: original source text (e.g., "a" vs 'a', 1 vs 1.0)
  const skip = new Set(['start', 'end', 'loc', 'range', 'raw']);

  const aKeys = Object.keys(aObj).filter((k) => !skip.has(k));
  const bKeys = Object.keys(bObj).filter((k) => !skip.has(k));

  if (aKeys.length !== bKeys.length) return false;

  // Sort keys for consistent comparison (handles different property order)
  aKeys.sort();
  bKeys.sort();

  // Check all keys match
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
  }

  // Recursively compare values
  return aKeys.every((key) => astMatch(aObj[key], bObj[key], _options));
}

/**
 * Parse JavaScript code into an AST.
 * Returns null if parsing fails.
 */
function parseJavaScript(code: string): acorn.Node | null {
  try {
    return acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module', // Support import/export
    });
  } catch {
    return null;
  }
}

/**
 * Compare two pieces of JavaScript code by AST.
 * Ignores whitespace, formatting, and position differences.
 * Focuses on semantic/structural equivalence.
 */
export function compareByAst(
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[] = [],
  options: AstCompareOptions = {}
): AstCompareResult {
  const userAst = parseJavaScript(userAnswer);
  const expectedAst = parseJavaScript(expectedAnswer);

  // If either fails to parse, infra is not available for comparison
  if (!userAst || !expectedAst) {
    return {
      match: false,
      matchedAlternative: null,
      infraAvailable: false,
      error: 'Parse error',
    };
  }

  // Compare ASTs
  if (astMatch(userAst, expectedAst, options)) {
    return { match: true, matchedAlternative: null, infraAvailable: true };
  }

  // Check alternatives
  for (const alt of acceptedSolutions) {
    const altAst = parseJavaScript(alt);
    if (altAst && astMatch(userAst, altAst, options)) {
      return { match: true, matchedAlternative: alt, infraAvailable: true };
    }
  }

  return { match: false, matchedAlternative: null, infraAvailable: true };
}
