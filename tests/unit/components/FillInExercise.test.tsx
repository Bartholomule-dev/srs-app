import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FillInExercise } from '@/components/exercise/FillInExercise';

describe('FillInExercise', () => {
  const defaultProps = {
    template: 'for ___ in range(5):\n    print(i)',
    blankPosition: 0,
    onSubmit: vi.fn(),
    disabled: false,
  };

  it('renders template with blank highlighted', () => {
    render(<FillInExercise {...defaultProps} />);
    expect(screen.getByText(/for/)).toBeInTheDocument();
    expect(screen.getByText(/in range\(5\):/)).toBeInTheDocument();
  });

  it('shows input field for blank', () => {
    render(<FillInExercise {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('calls onSubmit with input value on Enter', () => {
    const onSubmit = vi.fn();
    render(<FillInExercise {...defaultProps} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'i' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('i');
  });

  it('disables input when disabled prop is true', () => {
    render(<FillInExercise {...defaultProps} disabled={true} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('auto-focuses input on mount', () => {
    render(<FillInExercise {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(document.activeElement).toBe(input);
  });

  describe('FillInExercise state reset', () => {
    it('should reset answer when template prop changes', () => {
      const onSubmit = vi.fn();

      const { rerender, getByRole } = render(
        <FillInExercise
          template="x = ___"
          blankPosition={0}
          onSubmit={onSubmit}
        />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'old answer' } });
      expect(input).toHaveValue('old answer');

      // Rerender with new template
      rerender(
        <FillInExercise
          template="y = ___"
          blankPosition={0}
          onSubmit={onSubmit}
        />
      );

      // Answer should be reset
      expect(getByRole('textbox')).toHaveValue('');
    });
  });
});
