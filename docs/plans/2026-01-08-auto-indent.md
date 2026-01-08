# Auto-Indent for CodeEditor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Python-aware auto-indentation to CodeEditor on Shift+Enter, reducing friction for multi-line exercise answers without undermining learning.

**Architecture:** Extract indent logic to a pure utility function `getAutoIndent()`. Modify `handleKeyDown` in CodeEditor to intercept Shift+Enter, compute the new indented line, and update both value and cursor position. All logic is synchronous and testable.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, userEvent

---

## Task 1: Auto-Indent Utility Function

**Files:**
- Create: `src/lib/editor/auto-indent.ts`
- Test: `tests/unit/lib/editor/auto-indent.test.ts`

### Step 1.1: Write failing tests for getAutoIndent

Create the test file with comprehensive cases:

```typescript
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
      // Edge case: lambda x: x is complete, but "lambda x:" alone isn't
      // We add indent because line ends with colon
      expect(getAutoIndent('fn = lambda x:')).toBe('    ');
    });
  });

  describe('colon edge cases', () => {
    it('does NOT add indent for colon in string', () => {
      // This is tricky - but we use a simple heuristic:
      // only add indent if trimmed line ends with colon
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
      // "def foo(): # comment" - colon is not at end after trim
      // This is acceptable edge case - user can manually indent
      expect(getAutoIndent('def foo(): # comment')).toBe('');
    });
  });
});
```

### Step 1.2: Run tests to verify they fail

Run: `pnpm test tests/unit/lib/editor/auto-indent.test.ts`

Expected: FAIL with "Cannot find module '@/lib/editor/auto-indent'"

### Step 1.3: Create directory structure

```bash
mkdir -p src/lib/editor
```

### Step 1.4: Write minimal implementation

```typescript
// src/lib/editor/auto-indent.ts

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
```

### Step 1.5: Run tests to verify they pass

Run: `pnpm test tests/unit/lib/editor/auto-indent.test.ts`

Expected: All 24 tests PASS

### Step 1.6: Commit

```bash
git add src/lib/editor/auto-indent.ts tests/unit/lib/editor/auto-indent.test.ts
git commit -m "feat(editor): add getAutoIndent utility for Python-aware indentation"
```

---

## Task 2: Cursor Position Utility

**Files:**
- Modify: `src/lib/editor/auto-indent.ts`
- Modify: `tests/unit/lib/editor/auto-indent.test.ts`

### Step 2.1: Write failing tests for insertNewlineWithIndent

Add tests for the full text manipulation:

```typescript
// Add to tests/unit/lib/editor/auto-indent.test.ts

import { getAutoIndent, insertNewlineWithIndent } from '@/lib/editor/auto-indent';

describe('insertNewlineWithIndent', () => {
  describe('basic insertion', () => {
    it('inserts newline at cursor position', () => {
      const result = insertNewlineWithIndent('hello', 5);
      expect(result.value).toBe('hello\n');
      expect(result.cursorPosition).toBe(6);
    });

    it('inserts newline in middle of text', () => {
      const result = insertNewlineWithIndent('helloworld', 5);
      expect(result.value).toBe('hello\nworld');
      expect(result.cursorPosition).toBe(6);
    });

    it('inserts newline at start', () => {
      const result = insertNewlineWithIndent('hello', 0);
      expect(result.value).toBe('\nhello');
      expect(result.cursorPosition).toBe(1);
    });
  });

  describe('with indentation', () => {
    it('adds indent after colon', () => {
      const result = insertNewlineWithIndent('def foo():', 10);
      expect(result.value).toBe('def foo():\n    ');
      expect(result.cursorPosition).toBe(15); // after newline + 4 spaces
    });

    it('preserves existing indent', () => {
      const result = insertNewlineWithIndent('    print("hi")', 15);
      expect(result.value).toBe('    print("hi")\n    ');
      expect(result.cursorPosition).toBe(20);
    });

    it('preserves indent and adds more after colon', () => {
      const result = insertNewlineWithIndent('    if x > 0:', 13);
      expect(result.value).toBe('    if x > 0:\n        ');
      expect(result.cursorPosition).toBe(22); // 13 + 1 (newline) + 8 (spaces)
    });
  });

  describe('multiline text', () => {
    it('handles cursor on second line', () => {
      const text = 'line1\nline2';
      const result = insertNewlineWithIndent(text, 11); // end of line2
      expect(result.value).toBe('line1\nline2\n');
      expect(result.cursorPosition).toBe(12);
    });

    it('uses current line for indent calculation', () => {
      const text = 'def foo():\n    pass';
      const result = insertNewlineWithIndent(text, 19); // end of "    pass"
      expect(result.value).toBe('def foo():\n    pass\n    ');
      expect(result.cursorPosition).toBe(24);
    });

    it('handles insertion in middle of multiline', () => {
      const text = 'line1\nline2\nline3';
      const result = insertNewlineWithIndent(text, 11); // end of line2
      expect(result.value).toBe('line1\nline2\n\nline3');
      expect(result.cursorPosition).toBe(12);
    });

    it('uses correct line when cursor is mid-line', () => {
      const text = 'def foo():\n    x = 1';
      // Cursor at position 14, which is after "    " on line 2
      const result = insertNewlineWithIndent(text, 14);
      expect(result.value).toBe('def foo():\n    \n    x = 1');
      expect(result.cursorPosition).toBe(20); // after newline + 4 spaces
    });
  });
});
```

### Step 2.2: Run tests to verify they fail

Run: `pnpm test tests/unit/lib/editor/auto-indent.test.ts`

Expected: FAIL with "insertNewlineWithIndent is not exported"

### Step 2.3: Implement insertNewlineWithIndent

Add to `src/lib/editor/auto-indent.ts`:

```typescript
// src/lib/editor/auto-indent.ts

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
```

### Step 2.4: Run tests to verify they pass

Run: `pnpm test tests/unit/lib/editor/auto-indent.test.ts`

Expected: All 36 tests PASS

### Step 2.5: Commit

```bash
git add src/lib/editor/auto-indent.ts tests/unit/lib/editor/auto-indent.test.ts
git commit -m "feat(editor): add insertNewlineWithIndent for cursor-aware indentation"
```

---

## Task 3: Integrate Auto-Indent into CodeEditor

**Files:**
- Modify: `src/components/ui/CodeEditor.tsx`
- Modify: `tests/unit/components/ui/CodeEditor.test.tsx`

### Step 3.1: Write failing tests for auto-indent behavior

Add new describe block to existing test file:

```typescript
// Add to tests/unit/components/ui/CodeEditor.test.tsx

describe('auto-indent on Shift+Enter', () => {
  it('preserves indentation when pressing Shift+Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="    print('hi')" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    // Move cursor to end of line
    await user.click(textarea);
    await user.keyboard('{End}');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    // Should have called onChange with newline + preserved indent
    expect(onChange).toHaveBeenCalledWith("    print('hi')\n    ");
  });

  it('adds extra indent after colon', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="def foo():" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.keyboard('{End}');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onChange).toHaveBeenCalledWith('def foo():\n    ');
  });

  it('handles nested indentation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="    if x:" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.keyboard('{End}');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onChange).toHaveBeenCalledWith('    if x:\n        ');
  });

  it('works when inserting in middle of text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="def foo():pass" onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    // Position cursor after the colon (position 10)
    textarea.setSelectionRange(10, 10);
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(onChange).toHaveBeenCalledWith('def foo():\n    pass');
  });

  it('does not auto-indent when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CodeEditor value="def foo():" onChange={onChange} disabled />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    // onChange should not be called when disabled
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

### Step 3.2: Run tests to verify they fail

Run: `pnpm test tests/unit/components/ui/CodeEditor.test.tsx`

Expected: FAIL - tests show newline without indent (current behavior)

### Step 3.3: Implement auto-indent in CodeEditor

Update `src/components/ui/CodeEditor.tsx`:

```typescript
'use client';

import {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { insertNewlineWithIndent } from '@/lib/editor/auto-indent';

export interface CodeEditorProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  /** Current value of the editor */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when Enter is pressed (without Shift) */
  onSubmit?: () => void;
  /** Show line numbers on the left side */
  showLineNumbers?: boolean;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
  /** Minimum number of visible lines */
  minLines?: number;
}

/**
 * CodeEditor - A code editor-styled input component that looks like a mini IDE.
 *
 * Features:
 * - Dark editor surface with focus glow effect
 * - Monospace font (JetBrains Mono)
 * - Optional line numbers
 * - Enter to submit, Shift+Enter for newline with auto-indent
 * - Python-aware indentation (preserves indent, adds after colon)
 * - Accessible with aria-label support
 */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  function CodeEditor(
    {
      value,
      onChange,
      onSubmit,
      showLineNumbers = false,
      autoFocus = true,
      disabled = false,
      minLines = 3,
      className,
      'aria-label': ariaLabel = 'Code editor',
      ...props
    },
    ref
  ) {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref via forwarded ref
    useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement, []);

    useEffect(() => {
      if (autoFocus && internalRef.current) {
        internalRef.current.focus();
      }
    }, [autoFocus]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter to submit (without Shift), Shift+Enter for newline with indent
        if (e.key === 'Enter') {
          if (e.shiftKey) {
            // Shift+Enter: insert newline with auto-indent
            if (disabled) return;

            e.preventDefault();
            const textarea = e.currentTarget;
            const { selectionStart } = textarea;

            const result = insertNewlineWithIndent(value, selectionStart);
            onChange(result.value);

            // Set cursor position after React re-renders
            requestAnimationFrame(() => {
              textarea.setSelectionRange(result.cursorPosition, result.cursorPosition);
            });
          } else {
            // Enter without Shift: submit
            if (!disabled && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }
        }
      },
      [value, onChange, onSubmit, disabled]
    );

    // Calculate line count for line numbers display
    const lines = value.split('\n');
    const lineCount = Math.max(lines.length, minLines);

    return (
      <div
        className={cn(
          'relative rounded-lg overflow-hidden',
          'bg-bg-surface-2 border border-transparent',
          'focus-within:border-accent-primary',
          'focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]',
          'transition-all duration-150',
          "before:absolute before:inset-0 before:bg-[url('/grid.svg')] before:opacity-50 before:pointer-events-none",
          className
        )}
      >
        {showLineNumbers && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-12',
              'flex flex-col items-end pr-3 pt-4',
              'text-text-tertiary font-mono text-sm select-none',
              'border-r border-border'
            )}
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i + 1} className="leading-[1.6]">
                {i + 1}
              </span>
            ))}
          </div>
        )}
        <textarea
          ref={internalRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'w-full min-h-[120px] resize-y',
            'bg-transparent text-text-primary',
            'font-mono text-[15px] leading-[1.6]',
            'p-4 outline-none',
            showLineNumbers && 'pl-14',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          {...props}
        />
      </div>
    );
  }
);
```

### Step 3.4: Run tests to verify they pass

Run: `pnpm test tests/unit/components/ui/CodeEditor.test.tsx`

Expected: All tests PASS (including 5 new auto-indent tests)

### Step 3.5: Commit

```bash
git add src/components/ui/CodeEditor.tsx tests/unit/components/ui/CodeEditor.test.tsx
git commit -m "feat(CodeEditor): integrate Python-aware auto-indent on Shift+Enter"
```

---

## Task 4: Update CodeInput Tests

**Files:**
- Modify: `tests/component/exercise/CodeInput.test.tsx`

### Step 4.1: Add auto-indent tests to CodeInput

Since CodeInput wraps CodeEditor, verify the behavior passes through:

```typescript
// Add to tests/component/exercise/CodeInput.test.tsx

describe('auto-indent', () => {
  it('auto-indents on Shift+Enter', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<CodeInput value="def foo():" onChange={handleChange} onSubmit={() => {}} />);

    const textarea = screen.getByRole('textbox');
    await user.click(textarea);
    await user.keyboard('{End}');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(handleChange).toHaveBeenCalledWith('def foo():\n    ');
  });
});
```

### Step 4.2: Run tests to verify they pass

Run: `pnpm test tests/component/exercise/CodeInput.test.tsx`

Expected: All tests PASS

### Step 4.3: Commit

```bash
git add tests/component/exercise/CodeInput.test.tsx
git commit -m "test(CodeInput): add auto-indent passthrough test"
```

---

## Task 5: Run Full Test Suite and Verify

**Files:** None (verification only)

### Step 5.1: Run all tests

```bash
pnpm test
```

Expected: All 1368+ tests PASS

### Step 5.2: Run type check

```bash
pnpm typecheck
```

Expected: No errors

### Step 5.3: Run lint

```bash
pnpm lint
```

Expected: No errors

### Step 5.4: Manual verification (optional)

```bash
pnpm dev
```

Navigate to practice page, try:
1. Type `def foo():` then Shift+Enter → cursor should be indented 4 spaces
2. Type `    x = 1` then Shift+Enter → cursor should stay at 4 spaces indent
3. Type `    if y:` then Shift+Enter → cursor should be at 8 spaces indent

### Step 5.5: Final commit (if any fixes needed)

```bash
git add -A
git commit -m "chore: final cleanup for auto-indent feature"
```

---

## Summary

| Task | Description | Tests Added |
|------|-------------|-------------|
| 1 | `getAutoIndent` utility | 24 |
| 2 | `insertNewlineWithIndent` utility | 12 |
| 3 | CodeEditor integration | 5 |
| 4 | CodeInput passthrough test | 1 |
| 5 | Verification | 0 |
| **Total** | | **42** |

**Key Design Decisions:**
1. **Simple heuristic**: Only check if trimmed line ends with `:` - covers 95%+ of Python cases
2. **No dedent logic**: Keeps implementation simple; users can backspace
3. **requestAnimationFrame for cursor**: React's controlled input pattern requires async cursor positioning
4. **Pure utility functions**: All indent logic is in testable pure functions, component just orchestrates
