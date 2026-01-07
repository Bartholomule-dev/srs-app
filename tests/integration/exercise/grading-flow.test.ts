// tests/integration/exercise/grading-flow.test.ts
import { describe, it, expect } from 'vitest';
import { gradeAnswer, shouldShowCoaching } from '@/lib/exercise/grading';
import type { Exercise } from '@/lib/types';

describe('Two-pass grading integration', () => {
  const baseExercise: Partial<Exercise> = {
    id: 'test-id',
    slug: 'test-exercise',
    title: 'Test',
    hints: [],
    concept: 'strings',
    subconcept: 'slicing',
    level: 'practice',
    prereqs: [],
    pattern: 'output',
    objective: 'Test',
    difficulty: 1,
    language: 'python',
    category: 'strings',
    tags: [],
    timesPracticed: 0,
    avgSuccessRate: null,
    explanation: null,
    targets: null,
    template: null,
    blankPosition: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('Write exercise with target construct', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Use list comprehension to double numbers',
      expectedAnswer: '[x*2 for x in nums]',
      acceptedSolutions: ['[n*2 for n in nums]', '[2*x for x in nums]'],
      targetConstruct: {
        type: 'comprehension',
        feedback: 'Try using a list comprehension for a more Pythonic solution!',
      },
    } as Exercise;

    it('correct answer using comprehension gets no coaching', () => {
      const result = gradeAnswer('[x*2 for x in nums]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
      expect(shouldShowCoaching(result)).toBe(false);
    });

    it('alternative answer using comprehension gets no coaching', () => {
      const result = gradeAnswer('[n*2 for n in nums]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
      expect(result.matchedAlternative).toBe('[n*2 for n in nums]');
    });

    it('correct answer without comprehension gets coaching', () => {
      // Imagine the exercise accepted a loop-based solution too
      const exerciseWithLoop = {
        ...exercise,
        acceptedSolutions: [
          ...exercise.acceptedSolutions!,
          'result', // placeholder for loop result
        ],
      };

      const result = gradeAnswer('result', exerciseWithLoop);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe(
        'Try using a list comprehension for a more Pythonic solution!'
      );
      expect(shouldShowCoaching(result)).toBe(true);
    });

    it('incorrect answer gets no coaching', () => {
      const result = gradeAnswer('wrong answer', exercise);

      expect(result.isCorrect).toBe(false);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
      expect(shouldShowCoaching(result)).toBe(false);
    });
  });

  describe('Write exercise with slice target', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Extract characters 1-4 using slice notation',
      expectedAnswer: 's[1:4]',
      acceptedSolutions: ['text[1:4]', 'string[1:4]'],
      targetConstruct: {
        type: 'slice',
        feedback: 'Use slice notation like s[start:end] for cleaner code!',
      },
    } as Exercise;

    it('correct slice answer gets no coaching', () => {
      const result = gradeAnswer('s[1:4]', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
    });

    it('slice with step also counts as using slice construct', () => {
      const exerciseWithStep = {
        ...exercise,
        expectedAnswer: 's[::2]',
        acceptedSolutions: [],
      };

      const result = gradeAnswer('s[::2]', exerciseWithStep);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
    });
  });

  describe('Write exercise with f-string target', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Format the name using an f-string',
      expectedAnswer: 'f"Hello {name}"',
      acceptedSolutions: ["f'Hello {name}'"],
      targetConstruct: {
        type: 'f-string',
        feedback: 'F-strings (f"...") are the modern way to format strings!',
      },
    } as Exercise;

    it('f-string answer gets no coaching', () => {
      const result = gradeAnswer('f"Hello {name}"', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
      expect(result.coachingFeedback).toBeNull();
    });

    it('single-quoted f-string also recognized', () => {
      const result = gradeAnswer("f'Hello {name}'", exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
    });
  });

  describe('Write exercise with enumerate target', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Loop with index using enumerate',
      expectedAnswer: 'for i, x in enumerate(items):',
      acceptedSolutions: ['for idx, item in enumerate(items):'],
      targetConstruct: {
        type: 'enumerate',
        feedback: 'enumerate() gives you both index and value - much cleaner than range(len())!',
      },
    } as Exercise;

    it('enumerate usage gets no coaching', () => {
      const result = gradeAnswer('for i, x in enumerate(items):', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(true);
    });
  });

  describe('Fill-in exercise', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'fill-in',
      prompt: 'Complete the slice',
      template: 's[___:4]',
      expectedAnswer: '1',
      acceptedSolutions: [],
    } as Exercise;

    it('grades fill-in correctly', () => {
      const result = gradeAnswer('1', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
      expect(result.usedTargetConstruct).toBeNull();
    });

    it('normalizes fill-in whitespace', () => {
      const result = gradeAnswer('  1  ', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('fill-in with alternative answers', () => {
      const exerciseWithAlts = {
        ...exercise,
        expectedAnswer: 'True',
        acceptedSolutions: ['true', '1'],
      };

      expect(gradeAnswer('True', exerciseWithAlts).isCorrect).toBe(true);
      expect(gradeAnswer('true', exerciseWithAlts).isCorrect).toBe(true);
      expect(gradeAnswer('1', exerciseWithAlts).isCorrect).toBe(true);
      expect(gradeAnswer('False', exerciseWithAlts).isCorrect).toBe(false);
    });
  });

  describe('Predict exercise', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'predict',
      prompt: 'What does this print?',
      code: 'print("hello")',
      expectedAnswer: 'hello',
      acceptedSolutions: [],
    } as Exercise;

    it('grades predict correctly', () => {
      const result = gradeAnswer('hello', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.gradingMethod).toBe('string');
      expect(result.usedTargetConstruct).toBeNull();
    });

    it('handles trailing newlines in predict', () => {
      const result = gradeAnswer('hello\n\n', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('handles leading/trailing whitespace in predict', () => {
      const result = gradeAnswer('  hello  ', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('predict with multiline output', () => {
      const multilineExercise = {
        ...exercise,
        code: 'for i in range(3): print(i)',
        expectedAnswer: '0\n1\n2',
        acceptedSolutions: [],
      };

      const result = gradeAnswer('0\n1\n2', multilineExercise);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Exercise without target construct', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Print hello',
      expectedAnswer: 'print("hello")',
      acceptedSolutions: ["print('hello')"],
    } as Exercise;

    it('skips construct check entirely', () => {
      const result = gradeAnswer('print("hello")', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
      expect(shouldShowCoaching(result)).toBe(false);
    });

    it('incorrect answer also skips construct check', () => {
      const result = gradeAnswer('console.log("hello")', exercise);

      expect(result.isCorrect).toBe(false);
      expect(result.usedTargetConstruct).toBeNull();
      expect(result.coachingFeedback).toBeNull();
    });
  });

  describe('Target construct with default feedback', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Use a lambda',
      expectedAnswer: 'lambda x: x * 2',
      acceptedSolutions: ['result'], // allows non-lambda answer
      targetConstruct: {
        type: 'lambda',
        // no feedback specified - should use default
      },
    } as Exercise;

    it('uses default feedback when none specified', () => {
      const result = gradeAnswer('result', exercise);

      expect(result.isCorrect).toBe(true);
      expect(result.usedTargetConstruct).toBe(false);
      expect(result.coachingFeedback).toBe(
        'Great job! Consider trying the suggested approach next time.'
      );
    });
  });

  describe('Normalized answer comparison', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Write the expression',
      expectedAnswer: 's[1:4]',
      acceptedSolutions: [],
    } as Exercise;

    it('normalizes trailing whitespace', () => {
      const result = gradeAnswer('s[1:4]   ', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('normalizes leading whitespace', () => {
      const result = gradeAnswer('   s[1:4]', exercise);
      expect(result.isCorrect).toBe(true);
    });

    it('reports normalized values in result', () => {
      const result = gradeAnswer('s[1:4]', exercise);
      // The normalizer strips leading/trailing whitespace
      expect(result.normalizedUserAnswer).toContain('s[1');
      expect(result.normalizedExpectedAnswer).toContain('s[1');
    });

    it('handles exact matches', () => {
      const result = gradeAnswer('s[1:4]', exercise);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('GradingResult structure', () => {
    const exercise = {
      ...baseExercise,
      exerciseType: 'write',
      prompt: 'Test',
      expectedAnswer: 'answer',
      acceptedSolutions: [],
    } as Exercise;

    it('includes all required fields for correct answer', () => {
      const result = gradeAnswer('answer', exercise);

      expect(result).toHaveProperty('isCorrect', true);
      expect(result).toHaveProperty('usedTargetConstruct', null);
      expect(result).toHaveProperty('coachingFeedback', null);
      expect(result).toHaveProperty('gradingMethod', 'string');
      expect(result).toHaveProperty('normalizedUserAnswer');
      expect(result).toHaveProperty('normalizedExpectedAnswer');
      expect(result).toHaveProperty('matchedAlternative');
    });

    it('includes all required fields for incorrect answer', () => {
      const result = gradeAnswer('wrong', exercise);

      expect(result).toHaveProperty('isCorrect', false);
      expect(result).toHaveProperty('usedTargetConstruct', null);
      expect(result).toHaveProperty('coachingFeedback', null);
      expect(result).toHaveProperty('gradingMethod', 'string');
      expect(result).toHaveProperty('normalizedUserAnswer');
      expect(result).toHaveProperty('normalizedExpectedAnswer');
      expect(result).toHaveProperty('matchedAlternative');
    });
  });
});
