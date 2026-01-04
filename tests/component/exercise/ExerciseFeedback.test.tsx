// tests/component/exercise/ExerciseFeedback.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseFeedback } from '@/components/exercise';

describe('ExerciseFeedback', () => {
  const correctProps = {
    isCorrect: true,
    userAnswer: 'print(x)',
    expectedAnswer: 'print(x)',
    nextReviewDays: 6,
    onContinue: vi.fn(),
  };

  const incorrectProps = {
    isCorrect: false,
    userAnswer: 'print x',
    expectedAnswer: 'print(x)',
    nextReviewDays: 1,
    onContinue: vi.fn(),
  };

  describe('correct answer', () => {
    it('shows correct banner', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('shows success alert', () => {
      render(<ExerciseFeedback {...correctProps} />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/correct/i);
    });

    it('shows user answer', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText('print(x)')).toBeInTheDocument();
    });

    it('does not show expected answer (already matches)', () => {
      render(<ExerciseFeedback {...correctProps} />);
      // Should only have one code block with print(x), not two
      const codeBlocks = screen.getAllByText('print(x)');
      expect(codeBlocks).toHaveLength(1);
    });

    it('shows next review info', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByText(/next review.*6 days/i)).toBeInTheDocument();
    });
  });

  describe('incorrect answer', () => {
    it('shows incorrect banner', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('shows error alert', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/incorrect/i);
    });

    it('shows both user answer and expected answer', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText('print x')).toBeInTheDocument();
      expect(screen.getByText('print(x)')).toBeInTheDocument();
    });

    it('labels both answers', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/your answer/i)).toBeInTheDocument();
      expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
    });

    it('shows next review info for incorrect', () => {
      render(<ExerciseFeedback {...incorrectProps} />);
      expect(screen.getByText(/next review.*1 day/i)).toBeInTheDocument();
    });
  });

  describe('continue button', () => {
    it('renders continue button', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('calls onContinue when clicked', () => {
      const handleContinue = vi.fn();
      render(<ExerciseFeedback {...correctProps} onContinue={handleContinue} />);

      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(handleContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('next review text', () => {
    it('uses singular "day" for 1 day', () => {
      render(<ExerciseFeedback {...incorrectProps} nextReviewDays={1} />);
      expect(screen.getByText(/1 day/i)).toBeInTheDocument();
      expect(screen.queryByText(/1 days/i)).not.toBeInTheDocument();
    });

    it('uses plural "days" for multiple days', () => {
      render(<ExerciseFeedback {...correctProps} nextReviewDays={6} />);
      expect(screen.getByText(/6 days/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has appropriate role for result banner', () => {
      render(<ExerciseFeedback {...correctProps} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
