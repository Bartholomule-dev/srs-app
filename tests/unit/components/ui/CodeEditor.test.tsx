// tests/unit/components/ui/CodeEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { CodeEditor } from '@/components/ui/CodeEditor';

describe('CodeEditor', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a textarea element', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default aria-label', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByLabelText('Code editor')).toBeInTheDocument();
    });

    it('renders with custom aria-label', () => {
      render(<CodeEditor {...defaultProps} aria-label="Custom code input" />);
      expect(screen.getByLabelText('Custom code input')).toBeInTheDocument();
    });

    it('displays the provided value', () => {
      render(<CodeEditor {...defaultProps} value="const x = 1;" />);
      expect(screen.getByRole('textbox')).toHaveValue('const x = 1;');
    });

    it('applies monospace font class', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveClass('font-mono');
    });

    it('applies custom className to container', () => {
      render(<CodeEditor {...defaultProps} className="custom-class" />);
      const container = screen.getByRole('textbox').parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('line numbers', () => {
    it('does not show line numbers by default', () => {
      render(<CodeEditor {...defaultProps} value="line1\nline2" />);
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('shows line numbers when showLineNumbers is true', () => {
      render(<CodeEditor {...defaultProps} showLineNumbers value="line1\nline2" />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows minimum 3 line numbers by default', () => {
      render(<CodeEditor {...defaultProps} showLineNumbers value="" />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('respects custom minLines prop', () => {
      render(<CodeEditor {...defaultProps} showLineNumbers minLines={5} value="" />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows more line numbers as content grows', () => {
      const multiLineValue = ['line1', 'line2', 'line3', 'line4', 'line5'].join('\n');
      render(
        <CodeEditor
          {...defaultProps}
          showLineNumbers
          value={multiLineValue}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('marks line numbers container as aria-hidden', () => {
      render(<CodeEditor {...defaultProps} showLineNumbers value="test" />);
      const lineNumbersContainer = screen.getByText('1').parentElement;
      expect(lineNumbersContainer).toHaveAttribute('aria-hidden', 'true');
    });

    it('adds left padding to textarea when line numbers are shown', () => {
      render(<CodeEditor {...defaultProps} showLineNumbers value="test" />);
      expect(screen.getByRole('textbox')).toHaveClass('pl-14');
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CodeEditor {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'x');

      expect(onChange).toHaveBeenCalledWith('x');
    });

    it('calls onChange with full value on each keystroke', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CodeEditor {...defaultProps} onChange={onChange} value="ab" />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'c');

      expect(onChange).toHaveBeenCalledWith('abc');
    });
  });

  describe('keyboard handling', () => {
    it('calls onSubmit when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CodeEditor {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Enter}');

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CodeEditor {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when disabled', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CodeEditor {...defaultProps} onSubmit={onSubmit} disabled />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when onSubmit prop is not provided', async () => {
      const user = userEvent.setup();
      // This should not throw
      render(<CodeEditor {...defaultProps} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.keyboard('{Enter}');

      // No error means the test passed
      expect(true).toBe(true);
    });
  });

  describe('autoFocus behavior', () => {
    it('auto-focuses by default', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('does not auto-focus when autoFocus is false', () => {
      render(<CodeEditor {...defaultProps} autoFocus={false} />);
      expect(screen.getByRole('textbox')).not.toHaveFocus();
    });
  });

  describe('disabled state', () => {
    it('applies disabled state to textarea', () => {
      render(<CodeEditor {...defaultProps} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<CodeEditor {...defaultProps} disabled />);
      expect(screen.getByRole('textbox')).toHaveClass('opacity-50');
      expect(screen.getByRole('textbox')).toHaveClass('cursor-not-allowed');
    });

    it('prevents text input when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CodeEditor {...defaultProps} onChange={onChange} disabled />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'test');

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to textarea element', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<CodeEditor {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });

    it('allows focusing via ref', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<CodeEditor {...defaultProps} ref={ref} autoFocus={false} />);

      ref.current?.focus();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('text input attributes', () => {
    it('disables spellcheck', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('spellcheck', 'false');
    });

    it('disables autocomplete', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'off');
    });

    it('disables autocorrect', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocorrect', 'off');
    });

    it('disables autocapitalize', () => {
      render(<CodeEditor {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocapitalize', 'off');
    });
  });

  describe('placeholder support', () => {
    it('renders with placeholder', () => {
      render(
        <CodeEditor {...defaultProps} placeholder="Type your code here..." />
      );
      expect(
        screen.getByPlaceholderText('Type your code here...')
      ).toBeInTheDocument();
    });
  });

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

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
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
});
