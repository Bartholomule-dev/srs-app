// tests/component/exercise/ExerciseCard.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ExerciseCard } from '@/components/exercise';
import type { Exercise } from '@/lib/types';

describe('ExerciseCard', () => {
  const mockExercise: Exercise = {
    id: 'ex-1',
    slug: 'print-variable',
    language: 'Python',
    category: 'Variables',
    difficulty: 1,
    title: 'Print Variable',
    prompt: 'Print the value of variable `name`',
    expectedAnswer: 'print(name)',
    hints: ['Use the print() function'],
    explanation: null,
    tags: ['basics'],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('answering phase', () => {
    it('renders the exercise prompt', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByText('Print the value of variable `name`')).toBeInTheDocument();
    });

    it('renders the code input', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the hint button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /hint/i })).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('renders give up button', () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);
      expect(screen.getByRole('button', { name: /give up/i })).toBeInTheDocument();
    });
  });

  describe('hint interaction', () => {
    it('reveals hint when hint button clicked', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /hint/i }));
      });

      expect(screen.getByText('Use the print() function')).toBeInTheDocument();
    });
  });

  describe('submit flow', () => {
    it('transitions to feedback phase on submit', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      // Type correct answer
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
      });

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      // Should show feedback
      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('shows correct feedback for correct answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/correct/i);
    });

    it('shows incorrect feedback for wrong answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print name' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i);
    });

    it('Enter key submits the answer', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
      });

      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });
  });

  describe('give up flow', () => {
    it('transitions to feedback phase on give up', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('shows the correct answer when giving up', async () => {
      render(<ExerciseCard exercise={mockExercise} onComplete={() => {}} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      expect(screen.getByText('print(name)')).toBeInTheDocument();
    });
  });

  describe('onComplete callback', () => {
    it('calls onComplete with exerciseId and quality when continue clicked', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        vi.advanceTimersByTime(5000); // Fast answer
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 5); // Fast correct = quality 5
    });

    it('calls onComplete with quality 2 for give up', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /give up/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 2);
    });

    it('calls onComplete with quality 3 when hint used', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /hint/i }));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      expect(handleComplete).toHaveBeenCalledWith('ex-1', 3);
    });
  });

  describe('time tracking', () => {
    it('starts timer on first input', async () => {
      const handleComplete = vi.fn();
      render(<ExerciseCard exercise={mockExercise} onComplete={handleComplete} />);

      // First keypress starts timer
      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'p' } });
      });

      // Wait 20 seconds (slow threshold)
      await act(async () => {
        vi.advanceTimersByTime(20_000);
      });

      await act(async () => {
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'print(name)' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      // 20s is in the "hesitation" range (15-30s), quality 4
      expect(handleComplete).toHaveBeenCalledWith('ex-1', 4);
    });
  });

  describe('no hints available', () => {
    it('does not show hint button when no hints', () => {
      const exerciseNoHints = { ...mockExercise, hints: [] };
      render(<ExerciseCard exercise={exerciseNoHints} onComplete={() => {}} />);

      expect(screen.queryByRole('button', { name: /hint/i })).not.toBeInTheDocument();
    });
  });
});
