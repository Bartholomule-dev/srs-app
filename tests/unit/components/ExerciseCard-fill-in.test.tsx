import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import type { Exercise } from '@/lib/types';

describe('ExerciseCard fill-in support', () => {
  const baseExercise: Partial<Exercise> = {
    id: '1',
    slug: 'for-loop-fill',
    title: 'For Loop Fill-In',
    prompt: 'Complete the for loop header',
    expectedAnswer: 'for',
    acceptedSolutions: [],
    hints: ['What keyword starts a loop?'],
    language: 'python',
    category: 'loops',
    difficulty: 1,
    explanation: null,
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    concept: 'control-flow',
    subconcept: 'for',
    level: 'intro',
    prereqs: [],
    pattern: 'iteration',
  };

  const fillInExercise: Exercise = {
    ...baseExercise,
    exerciseType: 'fill-in',
    template: '___ i in range(5):\n    print(i)',
    blankPosition: 0,
  } as Exercise;

  const writeExercise: Exercise = {
    ...baseExercise,
    exerciseType: 'write',
    template: null,
    blankPosition: null,
  } as Exercise;

  it('renders FillInExercise for fill-in type', () => {
    render(
      <ExerciseCard
        exercise={fillInExercise}
        onComplete={vi.fn()}
      />
    );

    // Should show template code (part of the fill-in template)
    expect(screen.getByText(/in range\(5\):/)).toBeInTheDocument();
    // Should have the fill-in input with placeholder
    expect(screen.getByPlaceholderText('___')).toBeInTheDocument();
  });

  it('renders CodeInput for write type', () => {
    render(
      <ExerciseCard
        exercise={writeExercise}
        onComplete={vi.fn()}
      />
    );

    // CodeInput has a textarea, FillInExercise has an input[type=text]
    // We look for the textarea which is specific to CodeInput
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('treats exercises without exerciseType as write type (backward compatibility)', () => {
    // Exercise without exerciseType field should default to write
    const legacyExercise = {
      ...baseExercise,
      // explicitly don't include exerciseType, template, blankPosition
    } as unknown as Exercise;

    render(
      <ExerciseCard
        exercise={legacyExercise}
        onComplete={vi.fn()}
      />
    );

    // Should render CodeInput (textarea) for legacy exercises
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('renders fill-in exercise with correct aria-label', () => {
    render(
      <ExerciseCard
        exercise={fillInExercise}
        onComplete={vi.fn()}
      />
    );

    // FillInExercise input has aria-label="Fill in the blank"
    expect(screen.getByLabelText('Fill in the blank')).toBeInTheDocument();
  });
});
