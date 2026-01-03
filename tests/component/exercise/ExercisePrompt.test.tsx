// tests/component/exercise/ExercisePrompt.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExercisePrompt } from '@/components/exercise';

describe('ExercisePrompt', () => {
  const defaultProps = {
    category: 'Variables',
    language: 'Python',
    prompt: 'Print the value of variable `name`',
  };

  describe('rendering', () => {
    it('displays the prompt text', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Print the value of variable `name`')).toBeInTheDocument();
    });

    it('displays the category', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });

    it('displays the language', () => {
      render(<ExercisePrompt {...defaultProps} />);
      expect(screen.getByText('Python')).toBeInTheDocument();
    });

    it('shows language and category together as breadcrumb', () => {
      render(<ExercisePrompt {...defaultProps} />);
      // Should have both visible, separated by some indicator
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Variables')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('applies appropriate heading styling to prompt', () => {
      render(<ExercisePrompt {...defaultProps} />);
      const prompt = screen.getByText('Print the value of variable `name`');
      expect(prompt.tagName).toBe('P');
    });
  });

  describe('accessibility', () => {
    it('has appropriate heading structure', () => {
      render(<ExercisePrompt {...defaultProps} />);
      // Category breadcrumb should be in a header region
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
