import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PredictOutputExercise } from '@/components/exercise/PredictOutputExercise';

describe('PredictOutputExercise', () => {
  const defaultProps = {
    code: 'x = 5\nprint(x * 2)',
    value: '',
    onChange: vi.fn(),
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

  it('calls onSubmit with value when Enter is pressed', () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} value="10" onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('10');
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<PredictOutputExercise {...defaultProps} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    fireEvent.change(input, { target: { value: '10' } });

    expect(onChange).toHaveBeenCalledWith('10');
  });

  it('does not submit empty answer', () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} value="" onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit whitespace-only answer', () => {
    const onSubmit = vi.fn();
    render(<PredictOutputExercise {...defaultProps} value="   " onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    fireEvent.keyDown(input, { key: 'Enter' });

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

  it('displays value prop in input', () => {
    render(<PredictOutputExercise {...defaultProps} value="test answer" />);

    const input = screen.getByPlaceholderText('Enter the exact console output');
    expect(input).toHaveValue('test answer');
  });
});
