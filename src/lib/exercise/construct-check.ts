// src/lib/exercise/construct-check.ts
// Regex-based detection of Python constructs for two-pass grading.
// Pass 2 checks if users employ target constructs (slice, comprehension, etc.)

import type { ConstructType } from '@/lib/generators/types';
import type { ConstructCheckResult } from './types';

/**
 * Regex patterns for detecting Python constructs in code.
 * These patterns are designed to match idiomatic usage while avoiding
 * false positives from similar-looking syntax.
 */
/**
 * Strip string literals and comments from code to prevent false positive matches.
 * Replaces regular strings with empty quotes and removes comments entirely.
 * Preserves f-string prefixes and placeholders for f-string detection.
 */
function stripStringsAndComments(code: string): string {
  // First, preserve f-strings by replacing their content but keeping f"...{...}..."  structure
  // This allows f-string detection to still work
  let cleaned = code.replace(
    /f(["'])(?:[^"'\\]|\\.)*?\{[^}]*\}(?:[^"'\\]|\\.)*?\1/g,
    'f$1{x}$1'
  );
  // Replace regular string literals with empty strings (preserves structure)
  // But don't replace strings that start with f (already handled above)
  cleaned = cleaned.replace(
    /(?<!f)(["'])(?:[^"'\\]|\\.)*?\1/g,
    '""'
  );
  // Remove # comments (to end of line)
  cleaned = cleaned.replace(/#.*/g, '');
  return cleaned;
}

export const CONSTRUCT_PATTERNS: Record<ConstructType, RegExp> = {
  // Slice: matches [start:end] or [start:end:step] patterns
  // Must have at least one colon to distinguish from simple indexing
  slice: /\[[^\]]*:[^\]]*\]/,

  // List/Dict/Set comprehension: [expr for var in iterable] or {expr for var in iterable}
  // Excludes generator expressions (parentheses) - those use generator-expr pattern
  comprehension: /[\[{][^}\]]*\bfor\b[^}\]]+\bin\b[^}\]]+[\]}]/,

  // F-string: f"..." or f'...' with at least one {interpolation}
  // The regex requires the f prefix and at least one curly brace interpolation
  'f-string': /f["'][^"']*\{[^}]+\}[^"']*["']/,

  // Ternary: value_if_true if condition else value_if_false
  // Requires non-whitespace on both sides of 'if' and 'else'
  ternary: /\S+\s+if\s+.+\s+else\s+\S+/,

  // enumerate(): built-in function call with word boundary
  enumerate: /\benumerate\s*\(/,

  // zip(): built-in function call with word boundary
  zip: /\bzip\s*\(/,

  // lambda: anonymous function with word boundary and colon
  lambda: /\blambda\b[^:]*:/,

  // Generator expression: (expr for var in iterable) in parentheses
  // Distinguished from list comprehension by using parentheses
  'generator-expr': /\([^)]*\bfor\b[^)]+\bin\b[^)]+\)/,
};

/**
 * Check if code contains a specific Python construct.
 *
 * @param code - The user's code to analyze
 * @param constructType - The construct to check for
 * @returns Result indicating whether the construct was detected
 */
export function checkConstruct(
  code: string,
  constructType: ConstructType
): ConstructCheckResult {
  const pattern = CONSTRUCT_PATTERNS[constructType];

  // Handle unknown construct types gracefully
  if (!pattern) {
    return {
      detected: false,
      constructType: constructType,
    };
  }

  // Strip strings and comments before matching to avoid false positives
  const cleanCode = stripStringsAndComments(code);
  const detected = pattern.test(cleanCode);

  return {
    detected,
    constructType: constructType,
  };
}

/**
 * Check if code contains any of the specified constructs.
 * Returns on the first match found (order matters - first in array is checked first).
 *
 * @param code - The user's code to analyze
 * @param constructTypes - Array of constructs to check for
 * @returns Result with the first detected construct, or null if none found
 */
export function checkAnyConstruct(
  code: string,
  constructTypes: ConstructType[]
): ConstructCheckResult {
  for (const constructType of constructTypes) {
    const result = checkConstruct(code, constructType);
    if (result.detected) {
      return result;
    }
  }

  return {
    detected: false,
    constructType: null,
  };
}
