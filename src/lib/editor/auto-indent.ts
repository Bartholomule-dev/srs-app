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

export interface InsertResult {
  /** The new text value after insertion */
  value: string;
  /** Where to place the cursor after insertion */
  cursorPosition: number;
}

/**
 * Inserts a newline with appropriate indentation at the cursor position.
 *
 * @param text - The current text content
 * @param cursorPosition - The current cursor position (selectionStart)
 * @returns The new text and cursor position
 */
export function insertNewlineWithIndent(
  text: string,
  cursorPosition: number
): InsertResult {
  const beforeCursor = text.slice(0, cursorPosition);
  const afterCursor = text.slice(cursorPosition);

  // Find the current line (from last newline to cursor)
  const lastNewline = beforeCursor.lastIndexOf('\n');
  const currentLine = lastNewline === -1
    ? beforeCursor
    : beforeCursor.slice(lastNewline + 1);

  // Get the indent for the new line
  const indent = getAutoIndent(currentLine);

  // Construct new value
  const newValue = beforeCursor + '\n' + indent + afterCursor;

  // New cursor position is after newline and indent
  const newCursorPosition = cursorPosition + 1 + indent.length;

  return {
    value: newValue,
    cursorPosition: newCursorPosition,
  };
}
