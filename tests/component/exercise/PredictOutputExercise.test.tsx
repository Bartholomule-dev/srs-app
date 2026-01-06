import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictOutputExercise } from '@/components/exercise/PredictOutputExercise';

describe('PredictOutputExercise', () => {
  const defaultProps = {
    code: 'x = 5\nprint(x * 2)',
    onSubmit: vi.fn(),
  };

  it('renders code in read-only block', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    expect(screen.getByText(/x = 5/)).toBeInTheDocument();
    expect(screen.getByText(/print\(x \* 2\)/)).toBeInTheDocument();
  });

  it('renders input field with placeholder', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(input).toBeInTheDocument();
  });

  it('displays "What will print?" label', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    expect(screen.getByText('What will print?')).toBeInTheDocument();
  });

  it('calls onSubmit when Enter is pressed', async () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '10{enter}');

    expect(onSubmit).toHaveBeenCalledWith('10');
  });

  it('does not submit empty answer', async () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    await userEvent.type(input, '{enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables input when disabled prop is true', () => {
    render(<PredictOutputExercise {...defaultProps} disabled />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(input).toBeDisabled();
  });

  it('focuses input on mount', () => {
    render(<PredictOutputExercise {...defaultProps} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(document.activeElement).toBe(input);
  });
});
