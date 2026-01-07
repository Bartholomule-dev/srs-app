import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeachingCard } from '@/components/exercise/TeachingCard';
import { createMockExercise } from '@tests/fixtures/exercise';
import type { TeachingSessionCard } from '@/lib/session/types';

describe('TeachingCard', () => {
  const mockCard: TeachingSessionCard = {
    type: 'teaching',
    subconcept: 'for',
    teaching: {
      explanation: 'For loops iterate over sequences. Use `for item in sequence:` to process each element.',
      exampleSlug: 'for-loop-range-intro',
    },
    exampleExercise: createMockExercise({
      slug: 'for-loop-range-intro',
      expectedAnswer: 'for i in range(5):\n    print(i)',
    }),
  };

  it('displays the subconcept name in header', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    // The subconcept name appears in the header alongside LEARN label
    const header = screen.getByText(/LEARN/).parentElement;
    expect(header).toHaveTextContent('For Loops');
  });

  it('displays the explanation text', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/For loops iterate over sequences/)).toBeInTheDocument();
  });

  it('displays the example code', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/for i in range\(5\)/)).toBeInTheDocument();
  });

  it('calls onContinue when Got it button is clicked', () => {
    const onContinue = vi.fn();
    render(<TeachingCard card={mockCard} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole('button', { name: /got it/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onContinue when Enter key is pressed', () => {
    const onContinue = vi.fn();
    render(<TeachingCard card={mockCard} onContinue={onContinue} />);

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('has LEARN label in header', () => {
    render(<TeachingCard card={mockCard} onContinue={() => {}} />);

    expect(screen.getByText(/LEARN/)).toBeInTheDocument();
  });

  it('displays exampleCode when provided', () => {
    const card: TeachingSessionCard = {
      type: 'teaching',
      subconcept: 'io',
      teaching: {
        explanation: 'Use print() to display output.',
        exampleCode: 'print("Teaching example!")',
      },
      exampleExercise: createMockExercise({
        slug: 'print-string',
        expectedAnswer: 'print("Hello, World!")', // Different!
      }),
    };

    render(<TeachingCard card={card} onContinue={() => {}} />);

    // Should show exampleCode, NOT expectedAnswer
    expect(screen.getByText('print("Teaching example!")')).toBeInTheDocument();
    expect(screen.queryByText('print("Hello, World!")')).not.toBeInTheDocument();
  });

  it('falls back to expectedAnswer when exampleCode not provided', () => {
    const card: TeachingSessionCard = {
      type: 'teaching',
      subconcept: 'io',
      teaching: {
        explanation: 'Use print() to display output.',
        exampleSlug: 'print-string',
        // No exampleCode
      },
      exampleExercise: createMockExercise({
        slug: 'print-string',
        expectedAnswer: 'print("Hello, World!")',
      }),
    };

    render(<TeachingCard card={card} onContinue={() => {}} />);

    expect(screen.getByText('print("Hello, World!")')).toBeInTheDocument();
  });
});
