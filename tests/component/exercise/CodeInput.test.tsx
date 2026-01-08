// tests/component/exercise/CodeInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeInput } from '@/components/exercise';

describe('CodeInput', () => {
  describe('rendering', () => {
    it('renders a textarea', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays the current value', () => {
      render(<CodeInput value="print(x)" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('print(x)');
    });

    it('shows placeholder text', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByPlaceholderText(/type your answer/i)).toBeInTheDocument();
    });

    it('auto-focuses on mount', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('applies monospace font styling', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveClass('font-mono');
    });
  });

  describe('onChange', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<CodeInput value="" onChange={handleChange} onSubmit={() => {}} />);

      await user.type(screen.getByRole('textbox'), 'a');
      expect(handleChange).toHaveBeenCalledWith('a');
    });
  });

  describe('onSubmit', () => {
    it('calls onSubmit when Enter is pressed', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not call onSubmit on Shift+Enter (allows newline)', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', shiftKey: true });
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit on other keys', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' });
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

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

  describe('disabled state', () => {
    it('can be disabled', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('does not call onSubmit when disabled', () => {
      const handleSubmit = vi.fn();
      render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} disabled />);

      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has appropriate aria-label', () => {
      render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Code answer input');
    });
  });
});
