// src/lib/exercise/token-compare.ts
import type { PyodideInterface } from '@/lib/context/PyodideContext';

const TOKENIZE_CODE = `
import tokenize
import io
import json

def tokenize_code(code):
    try:
        tokens = tokenize.generate_tokens(io.StringIO(code).readline)
        result = [
            (t.type, t.string) for t in tokens
            if t.type not in (
                tokenize.COMMENT, tokenize.NL,
                tokenize.NEWLINE, tokenize.ENCODING,
                tokenize.ENDMARKER
            )
        ]
        return json.dumps(result)
    except tokenize.TokenizeError:
        return None
`;

let tokenizeInitialized = false;

export async function initTokenizer(pyodide: PyodideInterface): Promise<void> {
  if (tokenizeInitialized) return;
  pyodide.runPython(TOKENIZE_CODE);
  tokenizeInitialized = true;
}

export async function tokenizeCode(
  pyodide: PyodideInterface,
  code: string
): Promise<[number, string][] | null> {
  try {
    await initTokenizer(pyodide);
    const result = pyodide.runPython(`tokenize_code(${JSON.stringify(code)})`);
    if (typeof result !== 'string' || !result) return null;
    return JSON.parse(result) as [number, string][];
  } catch {
    return null;
  }
}

export interface TokenCompareResult {
  match: boolean;
  matchedAlternative: string | null;
}

export async function compareByTokens(
  pyodide: PyodideInterface,
  userAnswer: string,
  expectedAnswer: string,
  acceptedSolutions: string[] = []
): Promise<TokenCompareResult> {
  const userTokens = await tokenizeCode(pyodide, userAnswer);
  if (!userTokens) return { match: false, matchedAlternative: null };

  const userTokensJson = JSON.stringify(userTokens);

  // Check expected answer
  const expectedTokens = await tokenizeCode(pyodide, expectedAnswer);
  if (expectedTokens && userTokensJson === JSON.stringify(expectedTokens)) {
    return { match: true, matchedAlternative: null };
  }

  // Check alternatives
  for (const alt of acceptedSolutions) {
    const altTokens = await tokenizeCode(pyodide, alt);
    if (altTokens && userTokensJson === JSON.stringify(altTokens)) {
      return { match: true, matchedAlternative: alt };
    }
  }

  return { match: false, matchedAlternative: null };
}

/**
 * Reset tokenizer initialization state. Useful for testing.
 */
export function resetTokenizer(): void {
  tokenizeInitialized = false;
}
