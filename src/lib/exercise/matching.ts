// src/lib/exercise/matching.ts

/**
 * Normalizes Python code for comparison:
 * - Converts CRLF to LF
 * - Converts tabs to 4 spaces
 * - Removes trailing whitespace per line
 */
export function normalizePython(code: string): string {
  if (!code) return '';

  return code
    .replace(/\r\n/g, '\n')      // CRLF → LF
    .replace(/\t/g, '    ')      // Tabs → 4 spaces
    .replace(/ +$/gm, '');       // Remove trailing spaces per line
}
