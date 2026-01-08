/**
 * Computes the indentation string for a new line based on the current line.
 *
 * Rules:
 * 1. Preserve the current line's leading whitespace
 * 2. Add 4 spaces if the trimmed line ends with a colon (Python block opener)
 *
 * @param currentLine - The line where the cursor is before pressing Enter
 * @returns The whitespace string to prepend to the new line
 */
export function getAutoIndent(currentLine: string): string {
  // Extract leading whitespace
  const leadingWhitespace = currentLine.match(/^(\s*)/)?.[1] ?? '';

  // Check if line ends with colon (after trimming trailing whitespace)
  const trimmedEnd = currentLine.trimEnd();
  const endsWithColon = trimmedEnd.endsWith(':');

  // Add 4 spaces if line ends with colon
  const extraIndent = endsWithColon ? '    ' : '';

  return leadingWhitespace + extraIndent;
}
